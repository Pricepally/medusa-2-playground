import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from '@medusajs/framework/workflows-sdk';
import { checkFulfillmentSetExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-fulfillment-set-exists.step';
import { checkServiceZoneExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-servicezone-exists.step';
import { checkServiceZoneBelongsToFulfillmentSetStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-service-zone-belongs-to-fulfillment-set.step';
import { listServiceZoneGeozonesStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/list-geozones.step';
import { deleteGeozonesStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/delete-geozones.step';

export const deleteGeozonesWorkflow = createWorkflow(
  'delete-geozones-workflow',
  function (input: {
    fulfillmentSetId: string;
    serviceZoneId: string;
    geozoneIds: string[];
  }) {
    checkFulfillmentSetExistsStep({ fulfillmentSetId: input.fulfillmentSetId });
    const serviceZone = checkServiceZoneExistsStep({
      serviceZoneId: input.serviceZoneId,
    });
    checkServiceZoneBelongsToFulfillmentSetStep({
      fulfillmentSetId: input.fulfillmentSetId,
      serviceZone,
    });
    const geozones = listServiceZoneGeozonesStep(input.serviceZoneId);
    const ids = transform({ geozones, inputIds: input.geozoneIds }, (data) => {
      const geoZoneRef: { [key: string]: any } = {};
      const resultIds: string[] = [];
      data.geozones.forEach((gz) => {
        geoZoneRef[gz.id] = gz.id;
      });
      data.inputIds.forEach((id) => {
        if (geoZoneRef[id]) {
          resultIds.push(id);
        }
      });
      return resultIds;
    });
    deleteGeozonesStep(ids);
    return new WorkflowResponse({
      data: { ids },
      message: 'Service Zone Geozones deleted',
    });
  }
);
