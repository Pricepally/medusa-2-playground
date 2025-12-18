import { FocusModal, Select, Input, Button, Label, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"

// Define the location type enum
enum LocationType {
  COUNTRY = "country",
  PROVINCE = "province",
  CITY = "city",
  ZIP = "zip",
}

// Define the geozone form data structure
type GeozoneFormData = {
  country: string
  state: string
  city: string
  locationType: LocationType
  zipCode: string
  fulfillmentSetId: string
  serviceZoneId: string
  newServiceZoneName: string
  metadata: string
  postalExpression: string
}

// Country option type
type CountryOption = {
  iso_2: string
  name: string
}

// State/Province option type
type StateOption = {
  name: string
}

// City option type
type CityOption = {
  name: string
}

// FulfillmentSet type
type FulfillmentSet = {
  id: string
  name: string
  service_zones?: ServiceZone[]
}

// ServiceZone type
type ServiceZone = {
  id: string
  name: string
  fulfillment_set_id: string
}

type GeozoneFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editData?: any // For future edit functionality
}

export const GeozoneFormModal = ({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: GeozoneFormModalProps) => {
  const [formData, setFormData] = useState<GeozoneFormData>({
    country: "",
    state: "",
    city: "",
    locationType: LocationType.COUNTRY,
    zipCode: "",
    fulfillmentSetId: "",
    serviceZoneId: "",
    newServiceZoneName: "",
    metadata: "",
    postalExpression: "",
  })

  const [countries, setCountries] = useState<CountryOption[]>([])
  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [fulfillmentSets, setFulfillmentSets] = useState<FulfillmentSet[]>([])
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([])

  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [isLoadingFulfillmentSets, setIsLoadingFulfillmentSets] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch countries and fulfillment sets when modal opens
  useEffect(() => {
    if (open) {
      fetchCountries()
      fetchFulfillmentSets()
    }
  }, [open])

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country)
      setFormData(prev => ({ ...prev, state: "", city: "" }))
      setCities([])
    } else {
      setStates([])
      setCities([])
    }
  }, [formData.country])

  // Update service zones when fulfillment set changes
  useEffect(() => {
    if (formData.fulfillmentSetId) {
      const selectedSet = fulfillmentSets.find(fs => fs.id === formData.fulfillmentSetId)
      setServiceZones(selectedSet?.service_zones || [])
      setFormData(prev => ({ ...prev, serviceZoneId: "" }))
    } else {
      setServiceZones([])
    }
  }, [formData.fulfillmentSetId, fulfillmentSets])

  const fetchCountries = async () => {
    setIsLoadingCountries(true)
    try {
      const response = await fetch("/admin/geography/countries?limit=250", {
        credentials: "include",
      })
      const result = await response.json()
      const countriesData = Array.isArray(result.data?.countries)
        ? result.data.countries
        : []
      setCountries(countriesData)
    } catch (error) {
      console.error("Error fetching countries:", error)
      toast.error("Failed to load countries")
      setCountries([])
    } finally {
      setIsLoadingCountries(false)
    }
  }

  const fetchStates = async (countryIso: string) => {
    setIsLoadingStates(true)
    try {
      const response = await fetch(`/admin/geography/countries/${countryIso}/states`, {
        credentials: "include",
      })
      const result = await response.json()
      const statesData = Array.isArray(result.data) ? result.data : []
      setStates(statesData)
    } catch (error) {
      console.error("Error fetching states:", error)
      toast.error("Failed to load states/provinces")
      setStates([])
    } finally {
      setIsLoadingStates(false)
    }
  }

  const fetchFulfillmentSets = async () => {
    setIsLoadingFulfillmentSets(true)
    try {
      const response = await fetch("/admin/fulfillment-sets?fields=id,name,service_zones", {
        credentials: "include",
      })
      const result = await response.json()
      const setsData = Array.isArray(result.data?.fulfillment_sets)
        ? result.data.fulfillment_sets
        : []
      setFulfillmentSets(setsData)
    } catch (error) {
      console.error("Error fetching fulfillment sets:", error)
      toast.error("Failed to load fulfillment sets")
      setFulfillmentSets([])
    } finally {
      setIsLoadingFulfillmentSets(false)
    }
  }

  const fetchCities = async (countryIso: string, stateName: string) => {
    setIsLoadingCities(true)
    try {
      const response = await fetch(`/admin/geography/countries/${countryIso}/states`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ state: stateName }),
      })
      const result = await response.json()
      const citiesData = Array.isArray(result.data) ? result.data : []
      setCities(citiesData)
    } catch (error) {
      console.error("Error fetching cities:", error)
      toast.error("Failed to load cities")
      setCities([])
    } finally {
      setIsLoadingCities(false)
    }
  }

  const handleStateChange = (stateName: string) => {
    setFormData(prev => ({ ...prev, state: stateName, city: "" }))
    if (stateName && formData.country) {
      fetchCities(formData.country, stateName)
    } else {
      setCities([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate fulfillment set and service zone selection
    if (!formData.fulfillmentSetId) {
      toast.error("Please select a fulfillment set")
      return
    }

    if (!formData.serviceZoneId && !formData.newServiceZoneName.trim()) {
      toast.error("Please select an existing service zone or enter a name for a new one")
      return
    }

    if (formData.serviceZoneId && formData.newServiceZoneName.trim()) {
      toast.error("Please either select an existing service zone OR enter a new service zone name, not both")
      return
    }

    // Validate form based on location type
    if (!formData.country) {
      toast.error("Please select a country")
      return
    }

    if (formData.locationType === LocationType.PROVINCE && !formData.state) {
      toast.error("Please select a state/province")
      return
    }

    if (formData.locationType === LocationType.CITY && (!formData.state || !formData.city)) {
      toast.error("Please select a state/province and city")
      return
    }

    if (formData.locationType === LocationType.ZIP && !formData.zipCode) {
      toast.error("Please enter a zip code")
      return
    }

    setIsSubmitting(true)

    try {
      let serviceZoneId = formData.serviceZoneId

      // Create a new service zone if needed
      if (!serviceZoneId && formData.newServiceZoneName.trim()) {
        const createServiceZoneResponse = await fetch(
          `/admin/fulfillment-sets/${formData.fulfillmentSetId}/service-zones`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              name: formData.newServiceZoneName.trim(),
            }),
          }
        )

        if (!createServiceZoneResponse.ok) {
          const errorData = await createServiceZoneResponse.json()
          throw new Error(errorData.message || "Failed to create service zone")
        }

        const serviceZoneResult = await createServiceZoneResponse.json()
        serviceZoneId = serviceZoneResult.data?.service_zone?.id

        if (!serviceZoneId) {
          throw new Error("Failed to get service zone ID after creation")
        }

        toast.success(`Service zone "${formData.newServiceZoneName}" created successfully`)
      }

      // Build the geozone data based on location type
      const geozoneData: any = {
        type: formData.locationType,
        country_code: formData.country,
      }

      // Parse and merge metadata
      let metadataObj: any = {}

      const country = countries.find(c => c.iso_2 === formData.country)
      if (country) {
        metadataObj.country_name = country.name
      }

      if (formData.locationType === LocationType.PROVINCE && formData.state) {
        geozoneData.province_code = formData.state
        metadataObj.state_name = formData.state
      }

      if (formData.locationType === LocationType.CITY && formData.city) {
        geozoneData.city = formData.city
        metadataObj.city = formData.city
        metadataObj.state_name = formData.state
      }

      if (formData.locationType === LocationType.ZIP && formData.zipCode) {
        geozoneData.postal_expression = formData.zipCode
      }

      // Parse custom metadata if provided
      if (formData.metadata.trim()) {
        try {
          const customMetadata = JSON.parse(formData.metadata)
          metadataObj = { ...metadataObj, ...customMetadata }
        } catch (error) {
          toast.error("Invalid JSON in metadata field")
          setIsSubmitting(false)
          return
        }
      }

      geozoneData.metadata = metadataObj

      // Parse postal expression if provided
      if (formData.postalExpression.trim()) {
        try {
          const postalExpressionObj = JSON.parse(formData.postalExpression)
          geozoneData.postal_expression = postalExpressionObj
        } catch (error) {
          toast.error("Invalid JSON in postal expression field")
          setIsSubmitting(false)
          return
        }
      }

      // Submit the geozone to the API
      const response = await fetch(
        `/admin/fulfillment-sets/${formData.fulfillmentSetId}/service-zones/${serviceZoneId}/geo-zones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ data: [geozoneData] }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create geozone")
      }

      toast.success("Geozone created successfully")

      // Reset form
      setFormData({
        country: "",
        state: "",
        city: "",
        locationType: LocationType.COUNTRY,
        zipCode: "",
        fulfillmentSetId: "",
        serviceZoneId: "",
        newServiceZoneName: "",
        metadata: "",
        postalExpression: "",
      })
      setStates([])
      setCities([])

      // Close modal and trigger success callback
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating geozone:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create geozone")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex flex-col items-center justify-center text-center w-full">
            <h1 className="text-xl font-semibold">Create Geozone</h1>
            <p className="text-sm text-ui-fg-subtle mt-1 max-w-2xl">
              Define a geographic zone for a service zone by selecting the location type and relevant geographic data.
            </p>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto px-6 py-6">
          <form id="geozone-form" onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-3xl mx-auto">
            {/* Fulfillment Set Select */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fulfillmentSet" className="text-sm font-medium">
                Fulfillment Set <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.fulfillmentSetId}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, fulfillmentSetId: value }))
                }
                disabled={isLoadingFulfillmentSets}
              >
                <Select.Trigger id="fulfillmentSet">
                  <Select.Value placeholder={isLoadingFulfillmentSets ? "Loading..." : "Select a fulfillment set"} />
                </Select.Trigger>
                <Select.Content>
                  {fulfillmentSets.map((set) => (
                    <Select.Item key={set.id} value={set.id}>
                      {set.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {/* Service Zone Select */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="serviceZone" className="text-sm font-medium">
                Service Zone (Existing)
              </Label>
              <Select
                value={formData.serviceZoneId}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, serviceZoneId: value, newServiceZoneName: "" }))
                }
                disabled={!formData.fulfillmentSetId || formData.newServiceZoneName.trim() !== ""}
              >
                <Select.Trigger id="serviceZone">
                  <Select.Value
                    placeholder={
                      !formData.fulfillmentSetId
                        ? "Select a fulfillment set first"
                        : formData.newServiceZoneName.trim() !== ""
                        ? "Clear new service zone name to select existing"
                        : serviceZones.length === 0
                        ? "No service zones available - create new below"
                        : "Select a service zone"
                    }
                  />
                </Select.Trigger>
                <Select.Content>
                  {serviceZones.map((zone) => (
                    <Select.Item key={zone.id} value={zone.id}>
                      {zone.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {/* New Service Zone Name Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="newServiceZoneName" className="text-sm font-medium">
                Or Create New Service Zone
              </Label>
              <Input
                id="newServiceZoneName"
                type="text"
                placeholder="Enter new service zone name"
                value={formData.newServiceZoneName}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    newServiceZoneName: e.target.value,
                    serviceZoneId: e.target.value.trim() !== "" ? "" : prev.serviceZoneId
                  }))
                }
                disabled={!formData.fulfillmentSetId || formData.serviceZoneId !== ""}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-ui-border-base" />

            {/* Location Type Select */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="locationType" className="text-sm font-medium">
                Location Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.locationType}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, locationType: value as LocationType }))
                }
              >
                <Select.Trigger id="locationType">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={LocationType.COUNTRY}>Country</Select.Item>
                  <Select.Item value={LocationType.PROVINCE}>State/Province</Select.Item>
                  <Select.Item value={LocationType.CITY}>City</Select.Item>
                  <Select.Item value={LocationType.ZIP}>Zip Code</Select.Item>
                </Select.Content>
              </Select>
            </div>

            {/* Country Select */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, country: value }))
                }
                disabled={isLoadingCountries}
              >
                <Select.Trigger id="country">
                  <Select.Value placeholder={isLoadingCountries ? "Loading..." : "Select a country"} />
                </Select.Trigger>
                <Select.Content>
                  {countries.map((country) => (
                    <Select.Item key={country.iso_2} value={country.iso_2}>
                      {country.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {/* State/Province Select */}
            {(formData.locationType === LocationType.PROVINCE ||
              formData.locationType === LocationType.CITY ||
              formData.locationType === LocationType.ZIP) && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State/Province <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={handleStateChange}
                  disabled={!formData.country || isLoadingStates}
                >
                  <Select.Trigger id="state">
                    <Select.Value
                      placeholder={
                        !formData.country
                          ? "Select a country first"
                          : isLoadingStates
                          ? "Loading..."
                          : "Select a state/province"
                      }
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {states.map((state) => (
                      <Select.Item key={state.name} value={state.name}>
                        {state.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            )}

            {/* City Select */}
            {formData.locationType === LocationType.CITY && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, city: value }))
                  }
                  disabled={!formData.state || isLoadingCities}
                >
                  <Select.Trigger id="city">
                    <Select.Value
                      placeholder={
                        !formData.state
                          ? "Select a state/province first"
                          : isLoadingCities
                          ? "Loading..."
                          : "Select a city"
                      }
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {cities.map((city) => (
                      <Select.Item key={city.name} value={city.name}>
                        {city.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            )}

            {/* Zip Code Input */}
            {formData.locationType === LocationType.ZIP && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="zipCode" className="text-sm font-medium">
                  Zip Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Enter zip code (e.g., 12345 or 12*)"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, zipCode: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-ui-border-base" />

            {/* Custom Metadata Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="metadata" className="text-sm font-medium">
                Custom Metadata (Optional)
              </Label>
              <Input
                id="metadata"
                type="text"
                placeholder='{"key": "value"}'
                value={formData.metadata}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, metadata: e.target.value }))
                }
              />
              <p className="text-xs text-ui-fg-subtle">
                Additional metadata as JSON.
              </p>
            </div>

            {/* Postal Expression Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="postalExpression" className="text-sm font-medium">
                Postal Expression (Optional)
              </Label>
              <Input
                id="postalExpression"
                type="text"
                placeholder='{"pattern": "^[0-9]{5}$"}'
                value={formData.postalExpression}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, postalExpression: e.target.value }))
                }
              />
              <p className="text-xs text-ui-fg-subtle">
                JSON object with postal code validation rules.
              </p>
            </div>
          </form>
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="geozone-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Geozone"}
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
