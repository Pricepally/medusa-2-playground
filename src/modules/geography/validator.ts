import { z } from 'zod';

export const geolcationCoordinatesSchema = z.object({
  lat: z.number({
    required_error: 'Latitude (lat) is required',
    invalid_type_error: 'Latitude (lat) must be a number',
  }),
  lon: z.number({
    required_error: 'Longitude (lon) is required',
    invalid_type_error: 'Longitude (lon) must be a number',
  }),
});
