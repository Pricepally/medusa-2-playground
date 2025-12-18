import { GEOGRAPHY_MODULE } from '@/modules/geography';
import GeographyModuleService from '@/modules/geography/service';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import { envConfig } from '@/helpers/env.helpers';

export const geolocateCoordinatesStep = createStep(
  'geolocate-coordinates-step',
  async (input: { lat: number; lon: number }, { container }) => {
    const geographyModuleService: GeographyModuleService =
      container.resolve(GEOGRAPHY_MODULE);
    const cacheModuleService = container.resolve(Modules.CACHE);

    // Create cache key
    const cacheKey = `geography:geocode:lat:${input.lat}:lon:${input.lon}`;

    // Try to get from cache first
    const cachedData = await cacheModuleService.get(cacheKey);
    if (cachedData) {
      return new StepResponse(cachedData);
    }

    const addressData = await geographyModuleService.reverseGeocode(
      input.lat,
      input.lon
    );

    // Cache the result
    await cacheModuleService.set(
      cacheKey,
      addressData,
      envConfig.CACHE_DEFAULT_TTL
    );

    return new StepResponse(addressData);
  }
);
