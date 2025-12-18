import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { listAllGeozonesWorkflow } from '@/workflows/fulfillment/list-all-geozones.workflow';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const {
      fulfillment_set_id,
      service_zone_id,
      country_code,
      province_code,
      city,
      limit = 10,
      offset = 0,
      order,
    } = req.query;

    const filters: any = {};

    if (fulfillment_set_id) {
      filters.fulfillmentSetId = fulfillment_set_id as string;
    }

    if (service_zone_id) {
      filters.serviceZoneId = service_zone_id as string;
    }

    if (country_code) {
      filters.country_code = country_code as string;
    }

    if (province_code) {
      filters.province_code = province_code as string;
    }

    if (city) {
      filters.city = city as string;
    }

    const config: any = {
      skip: Number(offset),
      take: Number(limit),
      relations: ['service_zone', 'service_zone.fulfillment_set'],
    };

    if (order) {
      config.order = typeof order === 'string' ? JSON.parse(order) : order;
    }

    const { result } = await listAllGeozonesWorkflow(req.scope).run({
      input: {
        filters,
        config,
      },
    });

    res.status(200).json({
      geozones: result.data.geozones,
      count: result.data.count,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching geozones:', error);
    res.status(500).json({
      message: 'Failed to fetch geozones',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
