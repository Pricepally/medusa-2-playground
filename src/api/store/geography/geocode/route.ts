import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GEOGRAPHY_MODULE } from "../../../../modules/geography"

type GeolocationCoordinates = {
  latitude: string
  longitude: string
}

export const POST = async (
  req: MedusaRequest<GeolocationCoordinates>,
  res: MedusaResponse
) => {
  const geographicService = req.scope.resolve(GEOGRAPHY_MODULE)
  const { latitude, longitude } = req.body

  if (!latitude || !longitude) {
    return res.status(400).json({ 
      error: "Missing required parameters",
      message: "Both latitude and longitude are required" 
    })
  }

  try {
    const result = await geographicService.reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    )

    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      error: "Geocoding failed",
      message: error.message 
    })
  }
}