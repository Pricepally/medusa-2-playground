import { GEOGRAPHY_MODULE } from '@/modules/geography';
import GeographyModuleService from '@/modules/geography/service';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import { envConfig } from '@/helpers/env.helpers';

export const fetchCitiesByStateStep = createStep(
  'fetch-cities-by-state-step',
  async (
    input: { countryDisplayName: string; stateDisplayName: string },
    { container }
  ) => {
    const geographyModuleService: GeographyModuleService =
      container.resolve(GEOGRAPHY_MODULE);
    const cacheModuleService = container.resolve(Modules.CACHE);

    // Create cache key
    const cacheKey = `geography:cities:country:${input.countryDisplayName}:state:${input.stateDisplayName}`;

    // Try to get from cache first
    const cachedData = await cacheModuleService.get(cacheKey);
    if (cachedData) {
      return new StepResponse(cachedData);
    }

    const result = await geographyModuleService.fetchCitiesByState(
      input.countryDisplayName,
      input.stateDisplayName
    );

    const response = { result };

    // Cache the result
    await cacheModuleService.set(
      cacheKey,
      response,
      envConfig.CACHE_DEFAULT_TTL
    );

    return new StepResponse(response);
  }
);
