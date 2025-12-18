import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { IFulfillmentModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createNotFoundError } from '@/utils/error-handler.util';

export const checkServiceZoneExistsStep = createStep(
  'check-service-zone-exists-step',
  async (input: { serviceZoneId: string }, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const serviceZone = await fulfillmentModuleService.retrieveServiceZone(
      input.serviceZoneId
    );
    if (!serviceZone) {
      throw createNotFoundError(
        `Fulfillment set with id ${input.serviceZoneId} not found`
      );
    }
    return new StepResponse(serviceZone);
  }
);
