import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { IFulfillmentModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

export const deleteGeozonesStep = createStep(
  'delete-geozones-step',
  async (input: string[], { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    await fulfillmentModuleService.deleteGeoZones(input);
    return new StepResponse(true);
  }
);
