import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { IFulfillmentModuleService } from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';

type ListAllGeozonesInput = {
  filters?: {
    fulfillmentSetId?: string;
    serviceZoneId?: string;
    country_code?: string;
    province_code?: string;
    city?: string;
    postal_expression?: Record<string, any>;
  };
  config?: {
    skip?: number;
    take?: number;
    order?: Record<string, 'ASC' | 'DESC'>;
    relations?: string[];
  };
};

export const listAllGeozonesStep = createStep(
  'list-all-geozones-step',
  async (input: ListAllGeozonesInput, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const { filters = {}, config = {} } = input;

    // Build the query filters
    const queryFilters: any = {};

    if (filters.serviceZoneId) {
      queryFilters.service_zone_id = filters.serviceZoneId;
    }

    if (filters.country_code) {
      queryFilters.country_code = filters.country_code;
    }

    if (filters.province_code) {
      queryFilters.province_code = filters.province_code;
    }

    if (filters.city) {
      queryFilters.city = filters.city;
    }

    if (filters.postal_expression) {
      queryFilters.postal_expression = filters.postal_expression;
    }

    // Default relations to include service zone and fulfillment set information
    const relations = config.relations || ['service_zone', 'service_zone.fulfillment_set'];

    // Fetch geozones with pagination
    const [geozones, count] = await fulfillmentModuleService.listAndCountGeoZones(
      queryFilters,
      {
        ...config,
        relations,
      }
    );

    // If filtering by fulfillment set, we need to filter after fetching
    // since geozone doesn't have direct relation to fulfillment set
    let filteredGeozones = geozones;
    let filteredCount = count;

    if (filters.fulfillmentSetId && geozones.length > 0) {
      filteredGeozones = geozones.filter(
        (gz: any) => gz.service_zone?.fulfillment_set_id === filters.fulfillmentSetId
      );
      filteredCount = filteredGeozones.length;
    }

    return new StepResponse({
      geozones: filteredGeozones,
      count: filteredCount,
    });
  }
);
