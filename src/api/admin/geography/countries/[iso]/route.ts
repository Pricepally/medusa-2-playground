import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';
import { getCountryByIsoWorkflow } from '@/workflows/geography/get-country-by-iso.workflow';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { iso } = req.params;

  const { result } = await getCountryByIsoWorkflow(req.scope).run({
    input: {
      iso,
    },
  });

  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
