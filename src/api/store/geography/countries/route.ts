import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listCountriesWorkflow } from "../../../../workflows/geography"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { limit, offset, search, iso2 } = req.query

  try {
    const { result } = await listCountriesWorkflow(req.scope).run({
      input: {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        search: search as string,
        iso2: iso2 as string,
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch countries",
      message: error.message 
    })
  }
}