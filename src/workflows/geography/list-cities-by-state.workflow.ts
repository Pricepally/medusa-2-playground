import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { getCountryByIsoStep } from '@/workflows/geography/list-geography-steps/get-country-by-iso.step';
import { fetchCitiesByStateStep } from '@/workflows/geography/list-geography-steps/fetch-cities-by-state.step';
import { getStoredGeozonesStep } from '@/workflows/geography/list-geography-steps/get-stored-geozones.step';
import { mergeCitiesStep } from '@/workflows/geography/list-geography-steps/merge-cities.step';

type IListCitiesByStateInput = {
  iso2: string;
  stateName: string;
  limit?: number;
  offset?: number;
  search?: string;
};

export const listCitiesByStateWorkflow = createWorkflow(
  'list-cities-by-state-workflow',
  function (input: IListCitiesByStateInput) {
    const country = getCountryByIsoStep({ iso: input.iso2 });

    const stateCities = fetchCitiesByStateStep({
      stateDisplayName: input.stateName,
      countryDisplayName: country.display_name,
    });

    const storedCities = getStoredGeozonesStep({
      filters: {
        type: 'city',
        country_code: input.iso2,
        province_code: input.stateName,
      },
    });

    const result = mergeCitiesStep({
      stateCities,
      storedCities,
    });

    return new WorkflowResponse({
      data: result,
      message: 'Cities fetched successfully',
    });
  }
);
