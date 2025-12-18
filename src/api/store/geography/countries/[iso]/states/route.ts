import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listStatesByCountryWorkflow } from "../../../../../../workflows/geography"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { iso } = req.params
  const { limit, offset, search } = req.query

  try {
    const { result } = await listStatesByCountryWorkflow(req.scope).run({
      input: {
        countryIso: iso,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
      }
    })

    res.json(result)
  } catch (error) {
    if (error.message === "Country not found") {
      return res.status(404).json({ error: "Country not found" })
    }
    
    res.status(500).json({ 
      error: "Failed to fetch states",
      message: error.message 
    })
  }
}