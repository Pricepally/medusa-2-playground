import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import {
  getCountryByIsoStep,
  GetCountryByIsoInput,
} from '@/workflows/geography/list-geography-steps/get-country-by-iso.step';

export const getCountryByIsoWorkflow = createWorkflow(
  'get-country-by-iso-workflow',
  function (input: GetCountryByIsoInput) {
    const country = getCountryByIsoStep(input);
    return new WorkflowResponse({
      data: { country },
      message: 'Fetched country by ISO',
    });
  }
);
