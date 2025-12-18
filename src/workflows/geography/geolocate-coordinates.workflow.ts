import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { geolocateCoordinatesStep } from '@/workflows/geography/list-geography-steps/geolocate-coordinates.step';

export type IGeolocateCoords = {
  lat: number;
  lon: number;
};

export const geolocateCoordinatesWorkflow = createWorkflow(
  'geolocate-coordinates-workflow',
  function (input: IGeolocateCoords) {
    const address = geolocateCoordinatesStep({
      lat: input.lat,
      lon: input.lon,
    });

    return new WorkflowResponse({
      data: { address },
      message: 'Geolocation fetched successfully',
    });
  }
);
