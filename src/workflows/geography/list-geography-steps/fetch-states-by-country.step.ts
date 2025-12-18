import { GEOGRAPHY_MODULE } from '@/modules/geography';
import GeographyModuleService from '@/modules/geography/service';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import { envConfig } from '@/helpers/env.helpers';

export const fetchStatesByCountryStep = createStep(
  'fetch-states-by-country-step',
  async (input: { countryDisplayName: string }, { container }) => {
    const geographyModuleService: GeographyModuleService =
      container.resolve(GEOGRAPHY_MODULE);
    const cacheModuleService = container.resolve(Modules.CACHE);

    // Create cache key
    const cacheKey = `geography:states:country:${input.countryDisplayName}`;

    // Try to get from cache first
    const cachedData = await cacheModuleService.get(cacheKey);
    if (cachedData) {
      return new StepResponse(cachedData);
    }

    const result = await geographyModuleService.fetchStatesByCountry(
      input.countryDisplayName
    );

    // Cache the result
    await cacheModuleService.set(cacheKey, result, envConfig.CACHE_DEFAULT_TTL);

    return new StepResponse(result);
  }
);
