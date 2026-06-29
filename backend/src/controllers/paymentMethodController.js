const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const methods = await client.query(ref("paymentMethods:list"))
  const safe = methods.map((m) => ({
    ...m,
    apiKey: m.apiKey ? "sk_••••••••" + m.apiKey.slice(-4) : undefined,
    publicKey: m.publicKey || undefined,
  }))
  res.json(safe)
}

exports.create = async (req, res) => {
  const { name, description, isActive, icon, fields, provider, apiKey, publicKey, mode, qrCode } = req.body
  if (!name) return res.status(400).json({ message: "Payment method name is required." })

  try {
    const id = await client.mutation(ref("paymentMethods:create"), { name, description, isActive: isActive !== false, icon, fields, provider, apiKey, publicKey, mode: mode || "sandbox", qrCode })
    const method = await client.query(ref("paymentMethods:list")).then((m) => m.find((x) => x._id === id))
    await audit.log("create_payment_method", req, { details: `Created payment method: ${name}`, itemName: name })
    res.status(201).json(method)
  } catch (error) {
    if (error.message === "Payment method already exists") {
      return res.status(400).json({ message: "Payment method already exists." })
    }
    throw error
  }
}

exports.update = async (req, res) => {
  const { name, description, isActive, icon, fields, provider, apiKey, publicKey, mode, qrCode } = req.body
  if (!name) return res.status(400).json({ message: "Payment method name is required." })

  try {
    const updated = await client.mutation(ref("paymentMethods:update"), { id: req.params.id, name, description, isActive: isActive !== false, icon, fields, provider, apiKey, publicKey, mode, qrCode })
    await audit.log("update_payment_method", req, { details: `Updated payment method: ${name}` })
    res.json(updated)
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({ message: "Payment method not found." })
    }
    if (error.message === "Payment method already exists") {
      return res.status(400).json({ message: "Payment method already exists." })
    }
    throw error
  }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("paymentMethods:remove"), { id: req.params.id })
    await audit.log("delete_payment_method", req, { details: `Deleted payment method ${req.params.id}` })
    res.json({ message: "Payment method deleted." })
  } catch (error) {
    if (error.message === "Payment method not found") {
      return res.status(404).json({ message: "Payment method not found." })
    }
    throw error
  }
}
