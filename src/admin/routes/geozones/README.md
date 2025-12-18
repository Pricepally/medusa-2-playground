# Service Zone Geozone Management

This custom page provides a user-friendly interface for managing geozones within service zones in the Medusa Admin dashboard.

## Location

The page is accessible as a **custom route** in the Medusa Admin sidebar at `/geozones`.

## Features

- Select Fulfillment Set and Service Zone (or create a new service zone)
- Choose location type: Country, Province/State, City, or Zip Code
- Dynamic cascading dropdowns for Country -> State/Province -> City
- Automatic form validation based on selected location type
- Optional custom metadata (JSON format)
- Optional postal expression for advanced zip code patterns (JSON format)
- Creates geozones via the existing API endpoints
- Creates service zones on-the-fly if needed

## Usage

1. Navigate to **Geozones** from the sidebar in the Medusa Admin
2. Fill in the form:
   - Select a **Fulfillment Set**
   - Either:
     - Select an existing **Service Zone** from the dropdown, OR
     - Enter a name for a new **Service Zone** to create it
   - Choose a **Location Type** (Country, Province, City, or Zip)
   - Select the **Country** from the dropdown
   - If Province/City/Zip type is selected, additional fields will appear
   - For Zip type, enter the zip code pattern (supports wildcards like `12*`)
   - (Optional) Add custom **Metadata** as JSON (e.g., `{"key": "value"}`)
   - (Optional) Add **Postal Expression** as JSON (e.g., `{"pattern": "^[0-9]{5}$"}`)
3. Click "Add Geozone" to create the geozone (and service zone if needed)

## API Integration

The widget integrates with the following API endpoints:

- `GET /admin/geography/countries` - Fetches all countries
- `GET /admin/geography/countries/:iso/states` - Fetches states/provinces for a country
- `POST /admin/geography/countries/:iso/states` - Fetches cities for a state
- `GET /admin/fulfillment-sets` - Fetches fulfillment sets with their service zones
- `POST /admin/fulfillment-sets/:id/service-zones` - Creates a new service zone
- `POST /admin/fulfillment-sets/:id/service-zones/:zone_id/geo-zones` - Creates a geozone

## Location Types

### Country
Only requires country selection. The geozone will apply to the entire country.

### Province/State
Requires country and state/province selection. The geozone will apply to the entire state/province.

### City
Requires country, state/province, and city selection. The geozone will apply to the specific city.

### Zip Code
Requires country and zip code input. Supports patterns with wildcards (e.g., `123*` for all zip codes starting with 123).

## Technical Details

- Built with React and TypeScript
- Uses Medusa UI components for consistent styling
- Implements proper form validation and error handling
- Uses the Medusa Admin SDK for route configuration
- Integrates with existing geography and fulfillment workflows
- Custom route accessible at `/geozones` in the admin dashboard
