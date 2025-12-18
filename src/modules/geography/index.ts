import GeographyModuleService from '@/modules/geography/service';
import { Module } from '@medusajs/framework/utils';

export const GEOGRAPHY_MODULE = 'geography';

export default Module(GEOGRAPHY_MODULE, {
  service: GeographyModuleService,
});
