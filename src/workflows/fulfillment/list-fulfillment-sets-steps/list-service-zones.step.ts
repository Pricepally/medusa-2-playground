import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import type { IFulfillmentModuleService } from '@medusajs/framework/types';
import { createNotFoundError } from '@/utils/error-handler.util';

export type ListFulfillmentSetServiceZonesInput = {
  fulfillmentSetId: string;
  config?: {
    relations?: string[];
    fields: string[];
    pagination: {
      order?: Record<string, string> | undefined;
      skip: number;
      take?: number;
    };
    withDeleted?: boolean;
  };
};

export const getFulfillmentSetsByIdsStep = createStep(
  'get-fulfillment-sets-by-ids-step',
  async (input: { ids: string[] }, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
      id: input.ids,
    });

    if (!fulfillmentSets || fulfillmentSets.length === 0) {
      throw createNotFoundError(
        `Fulfillment set with id ${input.ids} not found`
      );
    }

    return new StepResponse({
      fulfillment_sets: fulfillmentSets,
    });
  }
);

export const listFulfillmentSetServiceZonesStep = createStep(
  'list-fulfillment-set-service-zones-step',
  async (input: ListFulfillmentSetServiceZonesInput, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    if (input.config?.fields) {
      input.config.relations = [];
      input.config.fields.forEach((field) => {
        if (
          field === 'shipping_options' ||
          field === 'fulfillment_set' ||
          field === 'geo_zones'
        ) {
          input.config?.relations?.push(field);
        }
      });
    }

    const [service_zones, count] =
      await fulfillmentModuleService.listAndCountServiceZones(
        { fulfillment_set: { id: input.fulfillmentSetId } },
        input.config
      );

    return new StepResponse({
      service_zones,
      count,
      limit: input.config?.pagination?.take,
      offset: input.config?.pagination?.skip,
    });
  }
);
