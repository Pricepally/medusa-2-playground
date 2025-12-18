import { validateAndTransformQuery, defineMiddlewares } from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/fulfillment-sets",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/fulfillment-sets/:id/service-zones",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
        }),
      ],
    },
  ],
});