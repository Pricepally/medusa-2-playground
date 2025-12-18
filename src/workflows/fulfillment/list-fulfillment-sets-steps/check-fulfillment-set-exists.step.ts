import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { IFulfillmentModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createNotFoundError } from '@/utils/error-handler.util';

export const checkFulfillmentSetExistsStep = createStep(
  'check-fulfillment-set-exists-step',
  async (
    input: { fulfillmentSetId: string; relations?: string[] },
    { container }
  ) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const fulfillmentSet =
      await fulfillmentModuleService.retrieveFulfillmentSet(
        input.fulfillmentSetId
      );
    if (!fulfillmentSet) {
      throw createNotFoundError(
        `Fulfillment set with id ${input.fulfillmentSetId} not found`
      );
    }
    return new StepResponse(fulfillmentSet);
  }
);
