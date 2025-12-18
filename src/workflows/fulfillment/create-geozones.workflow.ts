import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { CreateGeoZoneDTO } from '@medusajs/framework/types';
import { checkFulfillmentSetExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-fulfillment-set-exists.step';
import { checkServiceZoneExistsStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-servicezone-exists.step';
import { checkServiceZoneBelongsToFulfillmentSetStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/check-service-zone-belongs-to-fulfillment-set.step';
import { createGeozonesStep } from '@/workflows/fulfillment/list-fulfillment-sets-steps/create-geozones.step';

export const createGeozoneWorkflow = createWorkflow(
  'create-geozones-workflow',
  function (input: {
    fulfillmentSetId: string;
    serviceZoneId: string;
    data: Omit<CreateGeoZoneDTO, 'service_zone_id'>[];
  }) {
    checkFulfillmentSetExistsStep({ fulfillmentSetId: input.fulfillmentSetId });
    const serviceZone = checkServiceZoneExistsStep({
      serviceZoneId: input.serviceZoneId,
    });
    checkServiceZoneBelongsToFulfillmentSetStep({
      fulfillmentSetId: input.fulfillmentSetId,
      serviceZone,
    });
    const geozones = createGeozonesStep({
      serviceZoneId: input.serviceZoneId,
      data: input.data,
    });
    return new WorkflowResponse({
      data: { geozones },
      message: 'Service Zone Geozones created',
    });
  }
);
