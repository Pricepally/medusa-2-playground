import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';
import { listFulfillmentSetsWorkflow } from '@/workflows/fulfillment/list-fulfillment-sets.workflow';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await listFulfillmentSetsWorkflow(req.scope).run({
    input: {
      config: { ...req.queryConfig },
    },
  });

  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
