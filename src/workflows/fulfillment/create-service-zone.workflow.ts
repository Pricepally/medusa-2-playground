import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import type { IFulfillmentModuleService } from '@medusajs/framework/types';

type CreateServiceZoneInput = {
  fulfillmentSetId: string;
  name: string;
};

const createServiceZoneStep = createStep(
  'create-service-zone-step',
  async (input: CreateServiceZoneInput, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const serviceZone = await fulfillmentModuleService.createServiceZones({
      name: input.name,
      fulfillment_set_id: input.fulfillmentSetId,
    });

    return new StepResponse(serviceZone);
  }
);

export const createServiceZoneWorkflow = createWorkflow(
  'create-service-zone-workflow',
  function (input: CreateServiceZoneInput) {
    const serviceZone = createServiceZoneStep(input);

    return new WorkflowResponse({
      data: { service_zone: serviceZone },
      message: 'Service zone created successfully',
    });
  }
);
