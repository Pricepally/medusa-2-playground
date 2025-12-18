import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import {
  getFulfillmentSetsByIdsStep,
  ListFulfillmentSetServiceZonesInput,
  listFulfillmentSetServiceZonesStep,
} from '@/workflows/fulfillment/list-fulfillment-sets-steps/list-service-zones.step';
import { logger } from '@/utils/custom-logger';

export const getFulfillmentSetServiceZonesWorkflow = createWorkflow(
  'get-fulfillment-set-service-zones-workflow',
  function (input: ListFulfillmentSetServiceZonesInput) {
    logger.log('Starting get-fulfillment-set-service-zones workflow', {
      input,
    });
    // Check to ensure fulfillment set exists
    getFulfillmentSetsByIdsStep({ ids: [input.fulfillmentSetId] });

    const result = listFulfillmentSetServiceZonesStep(input);
    logger.log('Completed get-fulfillment-set-service-zones workflow', {
      result,
    });
    return new WorkflowResponse({
      data: result,
      message: 'Service zones retrieved',
    });
  }
);
