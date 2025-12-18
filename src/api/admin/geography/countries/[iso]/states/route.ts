import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';
import { listStatesByCountryWorkflow } from '@/workflows/geography/list-states-by-country.workflow';
import { listCitiesByStateWorkflow } from '@/workflows/geography/list-cities-by-state.workflow';

type TStateCitiesReq = { state: string };

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { iso } = req.params;
  const { result } = await listStatesByCountryWorkflow(req.scope).run({
    input: { countryIso: iso },
  });
  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<TStateCitiesReq>,
  res: MedusaResponse
) => {
  const { iso } = req.params;
  const { state } = req.body;
  const { result } = await listCitiesByStateWorkflow(req.scope).run({
    input: { iso2: iso, stateName: state },
  });
  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
