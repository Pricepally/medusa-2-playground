import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import { envConfig } from '@/helpers/env.helpers';

export type IListCountriesInput = {
  limit?: number;
  offset?: number;
  search?: string;
  iso2?: string;
};

export const listCountriesStep = createStep(
  'list-countries-step',
  async (input: IListCountriesInput, { container }) => {
    const regionModuleService = container.resolve(Modules.REGION);
    const cacheModuleService = container.resolve(Modules.CACHE);

    const { limit = 50, offset = 0, search, iso2 } = input;

    // Create cache key based on input parameters
    const cacheKey = `geography:countries:${JSON.stringify({ limit, offset, search, iso2 })}`;

    // Try to get from cache first
    const cachedData = await cacheModuleService.get(cacheKey);
    if (cachedData) {
      return new StepResponse(cachedData);
    }

    const where: any = {};

    if (search) {
      where.name = { $ilike: `%${search}%` };
    }
    if (iso2) {
      where.iso_2 = iso2.toUpperCase();
    }

    const [countries, count] = await regionModuleService.listAndCountCountries(
      where,
      {
        skip: offset,
        take: limit,
        order: { name: 'ASC' },
      }
    );

    const result = {
      countries,
      count,
      limit,
      offset,
    };

    // Cache the result
    await cacheModuleService.set(cacheKey, result, envConfig.CACHE_DEFAULT_TTL);

    return new StepResponse(result);
  }
);
