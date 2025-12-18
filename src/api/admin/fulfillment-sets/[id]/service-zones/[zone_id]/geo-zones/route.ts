import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { HttpStatusCode } from '@/helpers/http.constants';
import { handleResponse } from '@/utils/response.util';
import { listGeozonesWorkflow } from '@/workflows/fulfillment/list-geozones.workflow';
import { createGeozoneWorkflow } from '@/workflows/fulfillment/create-geozones.workflow';
import { deleteGeozonesWorkflow } from '@/workflows/fulfillment/delete-geozones.workflow';
import { CreateGeoZoneDTO } from '@medusajs/framework/types';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: fulfillmentSetId, zone_id: serviceZoneId } = req.params;
  const { result } = await listGeozonesWorkflow(req.scope).run({
    input: { fulfillmentSetId, serviceZoneId },
  });
  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<{
    data: Omit<CreateGeoZoneDTO, 'service_zone_id'>[];
  }>,
  res: MedusaResponse
) => {
  const { id: fulfillmentSetId, zone_id: serviceZoneId } = req.params;
  const { result } = await createGeozoneWorkflow(req.scope).run({
    input: { fulfillmentSetId, serviceZoneId, data: req.body.data },
  });
  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest<{ geozoneIds: string[] }>,
  res: MedusaResponse
) => {
  const { id: fulfillmentSetId, zone_id: serviceZoneId } = req.params;
  const { result } = await deleteGeozonesWorkflow(req.scope).run({
    input: { fulfillmentSetId, serviceZoneId, geozoneIds: req.body.geozoneIds },
  });
  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
