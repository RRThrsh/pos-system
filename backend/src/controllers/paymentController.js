const { client, ref } = require("../convex")

exports.createPaymentIntent = async (req, res) => {
  const { methodId, amount, currency = "php" } = req.body
  if (!methodId || !amount) return res.status(400).json({ message: "methodId and amount are required." })

  try {
    const method = await client.query(ref("paymentMethods:list")).then((methods) => methods.find((m) => m._id === methodId))
    if (!method) return res.status(404).json({ message: "Payment method not found." })
    if (!method.apiKey) return res.status(400).json({ message: "No API key configured for this payment method." })

    if (method.provider === "stripe") {
      const Stripe = require("stripe")
      const stripe = Stripe(method.apiKey)
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { paymentMethodId: methodId, paymentMethodName: method.name },
      })
      return res.json({ clientSecret: intent.client_secret, id: intent.id, amount: intent.amount, currency: intent.currency })
    }

    if (method.provider === "paymongo") {
      const response = await fetch("https://api.paymongo.com/v1/payment_intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(method.apiKey + ":").toString("base64")}` },
        body: JSON.stringify({
          data: { attributes: { amount: Math.round(amount * 100), currency: "PHP", payment_method_allowed: ["card", "gcash", "paymaya"] } },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error")
      return res.json({
        id: data.data.id,
        clientSecret: data.data.attributes.client_secret,
        nextAction: data.data.attributes.next_action,
        amount: data.data.attributes.amount,
      })
    }

    if (method.provider === "hitpay") {
      const baseUrl = method.mode === "live" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com"
      const response = await fetch(`${baseUrl}/v1/payment-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BUSINESS-API-KEY": method.apiKey,
        },
        body: JSON.stringify({
          amount: Number(amount).toFixed(2),
          currency: currency.toUpperCase(),
          reference_number: `POS-${Date.now()}`,
          redirect_url: `${req.protocol}://${req.get("host")}/api/payments/hitpay-callback`,
          webhook: `${req.protocol}://${req.get("host")}/api/payments/hitpay-webhook`,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || "HitPay error")
      return res.json({
        id: data.id,
        status: data.status,
        url: data.url,
        reference_number: data.reference_number,
      })
    }

    return res.status(400).json({ message: `Unsupported payment provider: ${method.provider || "none"}` })
  } catch (error) {
    console.error("Payment intent error:", error)
    res.status(500).json({ message: error.message || "Failed to create payment intent." })
  }
}

exports.processPayment = async (req, res) => {
  const { methodId, amount, currency = "php", cardDetails } = req.body
  if (!methodId || !amount) return res.status(400).json({ message: "methodId and amount are required." })

  try {
    const method = await client.query(ref("paymentMethods:list")).then((methods) => methods.find((m) => m._id === methodId))
    if (!method) return res.status(404).json({ message: "Payment method not found." })
    if (!method.apiKey) return res.status(400).json({ message: "No API key configured for this payment method." })

    if (method.provider === "stripe") {
      const Stripe = require("stripe")
      const stripe = Stripe(method.apiKey)

      let paymentMethodId
      if (cardDetails) {
        const pm = await stripe.paymentMethods.create({
          type: "card",
          card: {
            number: cardDetails.number.replace(/\s/g, ""),
            exp_month: parseInt(cardDetails.expiry.split("/")[0], 10),
            exp_year: parseInt(cardDetails.expiry.split("/")[1], 10),
            cvc: cardDetails.cvc,
          },
          billing_details: { name: cardDetails.name || "POS Customer" },
        })
        paymentMethodId = pm.id
      }

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: !!paymentMethodId,
        off_session: !!paymentMethodId,
        metadata: { paymentMethodId: methodId, paymentMethodName: method.name },
      })

      return res.json({
        id: intent.id,
        status: intent.status,
        clientSecret: intent.client_secret,
        amount: intent.amount,
      })
    }

    if (method.provider === "paymongo") {
      const response = await fetch("https://api.paymongo.com/v1/payment_intents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(method.apiKey + ":").toString("base64")}` },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(amount * 100),
              currency: "PHP",
              payment_method_allowed: ["card", "gcash", "paymaya"],
              description: "POS Payment",
            },
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error")
      return res.json({
        id: data.data.id,
        status: data.data.attributes.status,
        nextAction: data.data.attributes.next_action,
        checkoutUrl: data.data.attributes.checkout_url,
      })
    }

    if (method.provider === "hitpay") {
      const baseUrl = method.mode === "live" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com"
      const response = await fetch(`${baseUrl}/v1/payment-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BUSINESS-API-KEY": method.apiKey,
        },
        body: JSON.stringify({
          amount: Number(amount).toFixed(2),
          currency: currency.toUpperCase(),
          reference_number: `POS-${Date.now()}`,
          redirect_url: `${req.protocol}://${req.get("host")}/api/payments/hitpay-callback`,
          webhook: `${req.protocol}://${req.get("host")}/api/payments/hitpay-webhook`,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || "HitPay error")
      return res.json({
        id: data.id,
        status: data.status,
        url: data.url,
        reference_number: data.reference_number,
      })
    }

    return res.status(400).json({ message: `Unsupported provider: ${method.provider}` })
  } catch (error) {
    console.error("Payment processing error:", error)
    res.status(500).json({ message: error.message || "Payment processing failed." })
  }
}

exports.confirmPayment = async (req, res) => {
  const { methodId, paymentIntentId } = req.body
  if (!methodId || !paymentIntentId) return res.status(400).json({ message: "methodId and paymentIntentId are required." })

  try {
    const method = await client.query(ref("paymentMethods:list")).then((methods) => methods.find((m) => m._id === methodId))
    if (!method) return res.status(404).json({ message: "Payment method not found." })
    if (!method.apiKey) return res.status(400).json({ message: "No API key configured." })

    if (method.provider === "stripe") {
      const Stripe = require("stripe")
      const stripe = Stripe(method.apiKey)
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return res.json({ id: intent.id, status: intent.status, amount: intent.amount })
    }

    if (method.provider === "paymongo") {
      const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
        headers: { Authorization: `Basic ${Buffer.from(method.apiKey + ":").toString("base64")}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error")
      return res.json({ id: data.data.id, status: data.data.attributes.status })
    }

    if (method.provider === "hitpay") {
      const baseUrl = method.mode === "live" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com"
      const response = await fetch(`${baseUrl}/v1/payment-requests/${paymentIntentId}`, {
        headers: { "X-BUSINESS-API-KEY": method.apiKey },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || "HitPay error")
      return res.json({ id: data.id, status: data.status })
    }

    return res.status(400).json({ message: `Unsupported provider: ${method.provider}` })
  } catch (error) {
    console.error("Payment confirm error:", error)
    res.status(500).json({ message: error.message || "Failed to confirm payment." })
  }
}

exports.checkPaymentStatus = async (req, res) => {
  const { paymentIntentId, saleId, methodId } = req.body
  if (!paymentIntentId || !saleId) return res.status(400).json({ message: "paymentIntentId and saleId are required." })

  try {
    const method = methodId
      ? await client.query(ref("paymentMethods:list")).then((methods) => methods.find((m) => m._id === methodId))
      : null
    const apiKey = method?.apiKey || process.env.STRIPE_SECRET_KEY
    if (!apiKey) return res.status(400).json({ message: "No API key available to check payment status." })

    let status
    if (method?.provider === "paymongo") {
      const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
        headers: { Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error")
      status = data.data.attributes.status
    } else if (method?.provider === "hitpay") {
      const baseUrl = method.mode === "live" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com"
      const response = await fetch(`${baseUrl}/v1/payment-requests/${paymentIntentId}`, {
        headers: { "X-BUSINESS-API-KEY": apiKey },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || "HitPay error")
      status = data.status
    } else {
      const Stripe = require("stripe")
      const stripe = Stripe(apiKey)
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
      status = intent.status
    }

    await client.mutation(ref("sales:updatePaymentStatus"), { id: saleId, paymentStatus: status })
    res.json({ paymentIntentId, status })
  } catch (error) {
    console.error("Check payment status error:", error)
    res.status(500).json({ message: error.message || "Failed to check payment status." })
  }
}

exports.refundPayment = async (req, res) => {
  const { paymentIntentId, methodId, amount } = req.body
  if (!paymentIntentId) return res.status(400).json({ message: "paymentIntentId is required." })

  try {
    const method = methodId
      ? await client.query(ref("paymentMethods:list")).then((methods) => methods.find((m) => m._id === methodId))
      : null
    const apiKey = method?.apiKey || process.env.STRIPE_SECRET_KEY
    if (!apiKey) return res.status(400).json({ message: "No API key available to process refund." })

    if (method?.provider === "paymongo") {
      const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        },
        body: amount ? JSON.stringify({ data: { attributes: { amount: Math.round(amount * 100) } } }) : undefined,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo refund error")
      return res.json({ id: data.data.id, status: data.data.attributes.status })
    }

    if (method?.provider === "hitpay") {
      const baseUrl = method.mode === "live" ? "https://api.hit-pay.com" : "https://api.sandbox.hit-pay.com"
      const response = await fetch(`${baseUrl}/v1/payment-requests/${paymentIntentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BUSINESS-API-KEY": apiKey,
        },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || "HitPay refund error")
      return res.json({ id: data.id, status: data.status })
    }

    const Stripe = require("stripe")
    const stripe = Stripe(apiKey)
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    })
    res.json({ id: refund.id, status: refund.status, paymentIntent: refund.payment_intent })
  } catch (error) {
    console.error("Refund error:", error)
    res.status(500).json({ message: error.message || "Refund failed." })
  }
}

exports.hitpayCallback = async (req, res) => {
  const { payment_id, status, reference_number } = req.query
  console.log(`HitPay callback: payment=${payment_id}, status=${status}, ref=${reference_number}`)
  res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/cashier?payment=${payment_id}&status=${status}`)
}

exports.hitpayWebhook = async (req, res) => {
  const { payment_id, status, reference_number } = req.body
  console.log(`HitPay webhook: payment=${payment_id}, status=${status}, ref=${reference_number}`)
  res.json({ received: true })
}
