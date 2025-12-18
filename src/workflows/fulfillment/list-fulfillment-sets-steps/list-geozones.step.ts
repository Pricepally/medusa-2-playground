import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { IFulfillmentModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

export const listServiceZoneGeozonesStep = createStep(
  'list-geozones-step',
  async (serviceZoneId: string, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const serviceZone = await fulfillmentModuleService.retrieveServiceZone(
      serviceZoneId,
      { relations: ['geo_zones'] }
    );
    return new StepResponse(serviceZone.geo_zones);
  }
);
