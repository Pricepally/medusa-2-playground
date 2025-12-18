import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { checkFulfillmentSetExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-fulfillment-set-exists.step';
import { checkServiceZoneExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-servicezone-exists.step';
import { checkServiceZoneBelongsToFulfillmentSetStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-service-zone-belongs-to-fulfillment-set.step';
import { listServiceZoneGeozonesStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/list-geozones.step';

export const listGeozonesWorkflow = createWorkflow(
  'list-geozones-workflow',
  function (input: { fulfillmentSetId: string; serviceZoneId: string }) {
    checkFulfillmentSetExistsStep({ fulfillmentSetId: input.fulfillmentSetId });
    const serviceZone = checkServiceZoneExistsStep({
      serviceZoneId: input.serviceZoneId,
    });
    checkServiceZoneBelongsToFulfillmentSetStep({
      fulfillmentSetId: input.fulfillmentSetId,
      serviceZone,
    });
    const geozones = listServiceZoneGeozonesStep(input.serviceZoneId);
    return new WorkflowResponse({
      data: { geozones },
      message: 'Service Zone Geozones retrieved',
    });
  }
);
