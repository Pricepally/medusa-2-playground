import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import ExportFulfillmentProviderService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ExportFulfillmentProviderService],
});
