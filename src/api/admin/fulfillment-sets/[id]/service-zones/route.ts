import { getFulfillmentSetServiceZonesWorkflow } from '@/workflows/fulfillment/list-service-zones.workflow';
import { createServiceZoneWorkflow } from '@/workflows/fulfillment/create-service-zone.workflow';
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await getFulfillmentSetServiceZonesWorkflow(req.scope).run(
    {
      input: {
        fulfillmentSetId: req.params.id,
        config: { ...req.queryConfig },
      },
    }
  );

  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<{ name: string }>,
  res: MedusaResponse
) => {
  const { id: fulfillmentSetId } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return handleResponse(res, {
      status_code: HttpStatusCode.BAD_REQUEST,
      message: 'Service zone name is required',
    });
  }

  const { result } = await createServiceZoneWorkflow(req.scope).run({
    input: {
      fulfillmentSetId,
      name: name.trim(),
    },
  });

  return handleResponse(res, {
    status_code: HttpStatusCode.CREATED,
    ...result,
  });
};
