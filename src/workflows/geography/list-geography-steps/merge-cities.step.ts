import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';

export const mergeCitiesStep = createStep(
  'merge-cities-step',
  async (input: { stateCities: any; storedCities: any }) => {
    // Extract the actual array from the step response
    const stateCitiesArray = Array.isArray(input.stateCities?.result)
      ? input.stateCities.result
      : [];
    const storedCitiesArray = Array.isArray(input.storedCities?.geoZones)
      ? input.storedCities.geoZones
      : [];

    const cities: string[] = [...stateCitiesArray, ...storedCitiesArray]
      .map((c) => c.city || '')
      .filter((c) => !!c);

    return new StepResponse({ cities, count: cities.length });
  }
);
