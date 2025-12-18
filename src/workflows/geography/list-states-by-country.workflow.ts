import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { getCountryByIsoStep } from '@/workflows/geography/list-geography-steps/get-country-by-iso.step';
import { fetchStatesByCountryStep } from '@/workflows/geography/list-geography-steps/fetch-states-by-country.step';

type ListStatesByCountryInput = {
  countryIso: string;
};

export const listStatesByCountryWorkflow = createWorkflow(
  'list-states-by-country-workflow',
  function (workflowInput: ListStatesByCountryInput) {
    const country = getCountryByIsoStep({ iso: workflowInput.countryIso });

    const result = fetchStatesByCountryStep({
      countryDisplayName: country.display_name,
    });

    return new WorkflowResponse({
      data: result,
      message: 'States fetched successfully',
    });
  }
);
