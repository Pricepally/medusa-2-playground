import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { logger } from '@/utils/custom-logger';
import {
  ListFulfillmentSetsInput,
  listFulfillmentSetsStep,
} from '@/workflows/fulfillment/list-fulfillment-sets-steps/list-fulfillment-sets.step';

export const listFulfillmentSetsWorkflow = createWorkflow(
  'list-fulfillment-sets-workflow',
  function (input: ListFulfillmentSetsInput) {
    logger.log('Starting list-fulfillment-sets workflow', { input });
    const result = listFulfillmentSetsStep(input);

    logger.log('Completed list-fulfillment-sets workflow', { result });
    return new WorkflowResponse({
      data: result,
      message: 'Fulfillment sets retrieved',
    });
  }
);
