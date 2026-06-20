const { ConvexHttpClient } = require("convex/browser")
const { makeFunctionReference } = require("convex/server")

const CONVEX_URL = process.env.CONVEX_URL
if (!CONVEX_URL) {
  console.warn("CONVEX_URL not set. Convex client will not work.")
}

const client = new ConvexHttpClient(CONVEX_URL)

function ref(path) {
  return makeFunctionReference(path)
}

module.exports = { client, ref }
