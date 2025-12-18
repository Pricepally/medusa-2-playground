import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';
import { listCountriesWorkflow } from '@/workflows/geography/list-countries.workflow';

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await listCountriesWorkflow(req.scope).run({
    input: {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      search: req.query.search ? String(req.query.search) : undefined,
      iso2: req.query.iso2 ? String(req.query.iso2) : undefined,
    },
  });

  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
