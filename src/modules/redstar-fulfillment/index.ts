import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import RedstarFulfillmentService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [RedstarFulfillmentService],
});
