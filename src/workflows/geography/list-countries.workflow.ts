import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import {
  listCountriesStep,
  IListCountriesInput,
} from '@/workflows/geography/list-geography-steps/list-countries.step';

export const listCountriesWorkflow = createWorkflow(
  'list-countries-workflow',
  function (input: IListCountriesInput) {
    const result = listCountriesStep(input);
    return new WorkflowResponse({
      data: { ...result },
      message: 'Countries fetched successfully',
    });
  }
);
