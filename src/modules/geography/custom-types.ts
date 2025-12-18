import { GeoZoneType } from '@medusajs/framework/types';

export type ICityGeozoneMetadata = {
  name: string;
  city: string;
  state_name: string;
  type: GeoZoneType;
  country_name: string;
};

export type IStateGeozoneMetadata = {
  name: string;
  state_name: string;
  type: GeoZoneType;
  state_code: string;
  country_name: string;
  country_iso2?: string | null;
  country_iso3?: string | null;
};

export type IGeolocationResult = {
  formatted_address: string;
  address_components: {
    city: string;
    state: string;
    country: string;
    country_code: string;
    postal_code: string;
    street: string;
    house_number: string;
    suburb: string;
    county: string;
  };
  latitude: number;
  longitude: number;
  raw: Record<string, any>;
};
