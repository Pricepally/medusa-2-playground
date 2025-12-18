import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCountryByIsoWorkflow } from "../../../../../workflows/geography"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { iso } = req.params

  try {
    const { result: country } = await getCountryByIsoWorkflow(req.scope).run({
      input: { iso }
    })
    
    if (!country) {
      return res.status(404).json({ error: "Country not found" })
    }

    res.json({ country })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch country",
      message: error.message 
    })
  }
}