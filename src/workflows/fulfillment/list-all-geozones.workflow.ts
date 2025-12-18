import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { listAllGeozonesStep } from './list-fulfillment-sets-steps/list-all-geozones.step';

type ListAllGeozonesInput = {
  filters?: {
    fulfillmentSetId?: string;
    serviceZoneId?: string;
    country_code?: string;
    province_code?: string;
    city?: string;
    postal_expression?: Record<string, any>;
  };
  config?: {
    skip?: number;
    take?: number;
    order?: Record<string, 'ASC' | 'DESC'>;
    relations?: string[];
  };
};

export const listAllGeozonesWorkflow = createWorkflow(
  'list-all-geozones-workflow',
  function (input: ListAllGeozonesInput) {
    const result = listAllGeozonesStep(input);
    return new WorkflowResponse({
      data: result,
      message: 'All geozones retrieved successfully',
    });
  }
);
