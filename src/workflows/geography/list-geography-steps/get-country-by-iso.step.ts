import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import { createNotFoundError } from '@/utils/error-handler.util';

export type GetCountryByIsoInput = {
  iso: string;
};

export const getCountryByIsoStep = createStep(
  'get-country-by-iso-step',
  async (input: GetCountryByIsoInput, { container }) => {
    const regionModuleService = container.resolve(Modules.REGION);

    const { iso } = input;
    // const isoUpper = iso.toUpperCase()

    // Determine if it's ISO2 (2 chars) or ISO3 (3 chars)
    const field = iso.length === 2 ? 'iso_2' : 'iso_3';

    const countries = await regionModuleService.listCountries(
      {
        [field]: iso,
      },
      { relations: ['region'] }
    );

    if (!countries || !countries.length) {
      throw createNotFoundError(`Country with ISO code ${iso} not found`);
    }

    return new StepResponse(countries[0]);
  }
);
