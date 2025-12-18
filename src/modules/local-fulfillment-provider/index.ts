import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import LocalFulfillmentProviderService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [LocalFulfillmentProviderService],
});
