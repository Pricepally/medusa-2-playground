import { envConfig } from '@/helpers/env.helpers';
import { createUnexpectedStateError } from '@/utils/error-handler.util';
import { logger } from '@medusajs/framework';
import { GeoZoneType } from '@medusajs/framework/utils';
import {
  IStateGeozoneMetadata,
  ICityGeozoneMetadata,
  IGeolocationResult,
} from '@/modules/geography/custom-types';

/* global fetch */

class GeographyModuleService {
  private readonly COUNTRIES_API = envConfig.COUNTRY_API_BASE_URL;

  async fetchStatesByCountry(
    countryName: string
  ): Promise<IStateGeozoneMetadata[]> {
    try {
      const response = await fetch(`${this.COUNTRIES_API}/countries/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: countryName }),
      });

      if (!response.ok) {
        throw createUnexpectedStateError(
          'Failed to fetch states from external API'
        );
      }

      const data = await response.json();
      logger.log(data);
      let states = data.data?.states || [];

      return states.map((state: any) => ({
        name: state.name,
        state_name: state.name,
        type: GeoZoneType.PROVINCE,
        state_code: state.state_code,
        country_name: countryName,
        country_iso2: data.data?.iso2 || null,
        country_iso3: data.data?.iso3 || null,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch states: ${error.message}`);
    }
  }

  async fetchCitiesByState(
    countryName: string,
    stateName: string
  ): Promise<ICityGeozoneMetadata[]> {
    try {
      const response = await fetch(
        `${this.COUNTRIES_API}/countries/state/cities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ state: stateName, country: countryName }),
        }
      );

      if (!response.ok) {
        throw createUnexpectedStateError(
          'Failed to fetch cities from external API'
        );
      }

      const data = await response.json();
      let cities = data.data || [];

      return cities.map((city: string) => ({
        name: city,
        city: city,
        state_name: stateName,
        type: GeoZoneType.CITY,
        country_name: countryName,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<IGeolocationResult> {
    try {
      // Using Nominatim (OpenStreetMap) - free and no API key required
      const response = await fetch(
        `${envConfig.NOMINATIM_API_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MedusaJS-GeographicModule/1.0',
          },
        }
      );

      console.log({ response });

      // if (!response.ok) {
      //   throw new Error('Geocoding service unavailable');
      // }

      const data = await response.json();

      return {
        formatted_address: data.display_name,
        address_components: {
          city:
            data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state,
          country: data.address?.country,
          country_code: data.address?.country_code?.toUpperCase(),
          postal_code: data.address?.postcode,
          street: data.address?.road,
          house_number: data.address?.house_number,
          suburb: data.address?.suburb,
          county: data.address?.county,
        },
        latitude: data.lat,
        longitude: data.lon,
        raw: data,
      };
    } catch (error) {
      console.log(error);
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }
}

export default GeographyModuleService;
