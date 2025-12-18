import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';
import type { IFulfillmentModuleService } from '@medusajs/framework/types';

export type ListFulfillmentSetsInput = {
  filters?: Record<string, any>;
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

export const listFulfillmentSetsStep = createStep(
  'list-fulfillment-sets-step',
  async (input: ListFulfillmentSetsInput, { container }) => {
    const fulfillmentModuleService: IFulfillmentModuleService =
      container.resolve(Modules.FULFILLMENT);

    if (input.config?.fields?.includes('service_zones')) {
      input.config.relations = ['service_zones'];
    }

    const [fulfillmentSets, count] =
      await fulfillmentModuleService.listAndCountFulfillmentSets(
        input.filters,
        { ...input.config, relations: input.config?.relations ?? [] }
      );

    return new StepResponse({
      fulfillment_sets: fulfillmentSets,
      count,
      limit: input.config?.pagination?.take,
      offset: input.config?.pagination?.skip,
    });
  }
);
