const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const categories = await client.query(ref("categories:list"))
  res.json(categories)
}

exports.create = async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: "Category name is required." })

  try {
    const id = await client.mutation(ref("categories:create"), { name })
    const category = await client.query(ref("categories:list")).then((cats) => cats.find((c) => c._id === id))
    res.status(201).json(category)
  } catch (error) {
    if (error.message === "Category already exists") {
      return res.status(400).json({ message: "Category already exists." })
    }
    throw error
  }
}

exports.update = async (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ message: "Category name is required." })

  try {
    const updated = await client.mutation(ref("categories:update"), { id: req.params.id, name })
    res.json(updated)
  } catch (error) {
    if (error.message === "Category not found") {
      return res.status(404).json({ message: "Category not found." })
    }
    if (error.message === "Category already exists") {
      return res.status(400).json({ message: "Category already exists." })
    }
    throw error
  }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("categories:remove"), { id: req.params.id })
    res.json({ message: "Category deleted." })
  } catch (error) {
    if (error.message === "Category not found") {
      return res.status(404).json({ message: "Category not found." })
    }
    throw error
  }
}
