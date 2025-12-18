import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { handleResponse } from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';
import {
  geolocateCoordinatesWorkflow,
  IGeolocateCoords,
} from '@/workflows/geography/geolocate-coordinates.workflow';
import { geolcationCoordinatesSchema } from '@/modules/geography/validator';

export const POST = async (
  req: AuthenticatedMedusaRequest<IGeolocateCoords>,
  res: MedusaResponse
) => {
  const validatedData = geolcationCoordinatesSchema.parse(req.body);

  const { result } = await geolocateCoordinatesWorkflow(req.scope).run({
    input: validatedData,
  });

  return handleResponse(res, {
    status_code: HttpStatusCode.OK,
    ...result,
  });
};
