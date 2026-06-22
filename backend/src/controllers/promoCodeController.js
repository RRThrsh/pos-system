const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const codes = await client.query(ref("promoCodes:list"))
  res.json(codes)
}

exports.getByCode = async (req, res) => {
  const code = await client.query(ref("promoCodes:getByCode"), { code: req.params.code })
  if (!code) return res.status(404).json({ message: "Promo code not found" })
  res.json(code)
}

exports.create = async (req, res) => {
  const { code, discountType, discountValue, minPurchase, maxUses, expiresAt } = req.body
  if (!code || !discountType || !discountValue) return res.status(400).json({ message: "Code, discount type, and discount value are required" })
  const id = await client.mutation(ref("promoCodes:create"), { code: code.toUpperCase(), discountType, discountValue: Number(discountValue), minPurchase: minPurchase ? Number(minPurchase) : undefined, maxUses: maxUses ? Number(maxUses) : undefined, expiresAt, createdBy: req.user.id })
  await audit.log("create_promo_code", req, { details: `Created promo code ${code}`, itemName: code })
  res.status(201).json({ id })
}

exports.toggleActive = async (req, res) => {
  const { isActive } = req.body
  const updated = await client.mutation(ref("promoCodes:toggleActive"), { id: req.params.id, isActive })
  await audit.log("toggle_promo_code", req, { details: `Promo ${updated.code} ${isActive ? 'activated' : 'deactivated'}`, itemName: updated.code })
  res.json(updated)
}

exports.validate = async (req, res) => {
  const { code, subtotal } = req.body
  if (!code) return res.status(400).json({ message: "Code is required" })
  const promo = await client.query(ref("promoCodes:getByCode"), { code: code.toUpperCase() })
  if (!promo) return res.status(404).json({ message: "Promo code not found" })
  if (!promo.isActive) return res.status(400).json({ message: "Promo code is inactive" })
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ message: "Promo code has expired" })
  if (promo.maxUses && promo.useCount >= promo.maxUses) return res.status(400).json({ message: "Promo code usage limit reached" })
  if (subtotal && promo.minPurchase && Number(subtotal) < promo.minPurchase) return res.status(400).json({ message: `Minimum purchase of ₱${promo.minPurchase} required` })
  const discount = promo.discountType === "percentage" ? Number(subtotal || 0) * (promo.discountValue / 100) : promo.discountValue
  res.json({ valid: true, promo, discount })
}

exports.remove = async (req, res) => {
  await client.mutation(ref("promoCodes:remove"), { id: req.params.id })
  await audit.log("delete_promo_code", req, { details: `Deleted promo code ${req.params.id}` })
  res.json({ message: "Promo code deleted" })
}
