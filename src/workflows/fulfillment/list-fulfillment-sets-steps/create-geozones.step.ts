import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import {
  CreateGeoZoneDTO,
  IFulfillmentModuleService,
} from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

export const createGeozonesStep = createStep(
  'create-geozones-step',
  async (
    input: {
      data: Omit<CreateGeoZoneDTO, 'service_zone_id'>[];
      serviceZoneId: string;
    },
    { container }
  ) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const geozones = await fulfillmentModuleService.createGeoZones(
      input.data.map((d) => ({
        ...d,
        service_zone_id: input.serviceZoneId,
      })) as CreateGeoZoneDTO[]
    );
    return new StepResponse(geozones);
  }
);
