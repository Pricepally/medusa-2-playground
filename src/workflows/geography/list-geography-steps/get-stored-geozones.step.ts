import {
  FilterableGeoZoneProps,
  FindConfig,
  GeoZoneDTO,
  IFulfillmentModuleService,
} from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';

export const getStoredGeozonesStep = createStep(
  'get-stored-geozones-step',
  async (
    input: { filters: FilterableGeoZoneProps; config?: FindConfig<GeoZoneDTO> },
    { container }
  ) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const geoZones = await fulfillmentModuleService.listGeoZones(
      {
        ...input.filters,
      },
      {
        ...input.config,
      }
    );
    return new StepResponse({ geoZones });
  }
);
