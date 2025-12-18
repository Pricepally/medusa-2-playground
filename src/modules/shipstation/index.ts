import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import ShipStationProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ShipStationProviderService],
})
