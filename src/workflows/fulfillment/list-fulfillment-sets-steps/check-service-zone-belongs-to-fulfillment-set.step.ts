import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { ServiceZoneDTO } from '@medusajs/framework/types';
import { createInvalidArgumentError } from '@/utils/error-handler.util';

export const checkServiceZoneBelongsToFulfillmentSetStep = createStep(
  'check-service-zone-belongs-to-fulfillment-set-step',
  async (input: { fulfillmentSetId: string; serviceZone: ServiceZoneDTO }) => {
    if (input.serviceZone.fulfillment_set_id !== input.fulfillmentSetId) {
      throw createInvalidArgumentError(
        `Service Zone does not belong to fulfillment set`
      );
    }
    return new StepResponse(true);
  }
);
