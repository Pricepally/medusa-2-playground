import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Select, Badge, toast, Table } from "@medusajs/ui"
import { MapPin, Plus, Trash, PencilSquare } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { GeozoneFormModal } from "./components/geozone-form-modal"

// Location type enum
enum LocationType {
  COUNTRY = "country",
  PROVINCE = "province",
  CITY = "city",
  ZIP = "zip",
}

// Types
type Geozone = {
  id: string
  type: LocationType
  country_code: string
  province_code?: string
  city?: string
  postal_expression?: any
  metadata?: any
  service_zone: {
    id: string
    name: string
    fulfillment_set_id: string
    fulfillment_set: {
      id: string
      name: string
    }
  }
  created_at: string
  updated_at: string
}

type FulfillmentSet = {
  id: string
  name: string
}

type ServiceZone = {
  id: string
  name: string
  fulfillment_set_id: string
}

const GeozonesPage = () => {
  const [geozones, setGeozones] = useState<Geozone[]>([])
  const [filteredGeozones, setFilteredGeozones] = useState<Geozone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFulfillmentSet, setSelectedFulfillmentSet] = useState<string>("")
  const [selectedServiceZone, setSelectedServiceZone] = useState<string>("")

  // Filter options
  const [fulfillmentSets, setFulfillmentSets] = useState<FulfillmentSet[]>([])
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([])
  const [allServiceZones, setAllServiceZones] = useState<ServiceZone[]>([])

  // Fetch geozones
  useEffect(() => {
    fetchGeozones()
    fetchFulfillmentSets()
  }, [currentPage, pageSize, selectedFulfillmentSet, selectedServiceZone])

  // Filter geozones based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGeozones(geozones)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = geozones.filter(gz => {
      const countryMatch = gz.country_code?.toLowerCase().includes(query)
      const provinceMatch = gz.province_code?.toLowerCase().includes(query)
      const cityMatch = gz.city?.toLowerCase().includes(query)
      const serviceZoneMatch = gz.service_zone?.name?.toLowerCase().includes(query)
      const fulfillmentSetMatch = gz.service_zone?.fulfillment_set?.name?.toLowerCase().includes(query)

      return countryMatch || provinceMatch || cityMatch || serviceZoneMatch || fulfillmentSetMatch
    })

    setFilteredGeozones(filtered)
  }, [searchQuery, geozones])

  // Update available service zones when fulfillment set filter changes
  useEffect(() => {
    if (selectedFulfillmentSet) {
      const filtered = allServiceZones.filter(
        sz => sz.fulfillment_set_id === selectedFulfillmentSet
      )
      setServiceZones(filtered)
      setSelectedServiceZone("") // Reset service zone selection
    } else {
      setServiceZones(allServiceZones)
    }
  }, [selectedFulfillmentSet, allServiceZones])

  const fetchGeozones = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      })

      if (selectedFulfillmentSet) {
        params.append("fulfillment_set_id", selectedFulfillmentSet)
      }

      if (selectedServiceZone) {
        params.append("service_zone_id", selectedServiceZone)
      }

      const response = await fetch(`/admin/geozones?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch geozones")
      }

      const result = await response.json()
      setGeozones(result.geozones || [])
      setTotalCount(result.count || 0)
    } catch (error) {
      console.error("Error fetching geozones:", error)
      toast.error("Failed to load geozones")
      setGeozones([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFulfillmentSets = async () => {
    try {
      const response = await fetch("/admin/fulfillment-sets?fields=id,name,service_zones", {
        credentials: "include",
      })
      const result = await response.json()
      const setsData = Array.isArray(result.data?.fulfillment_sets)
        ? result.data.fulfillment_sets
        : []

      setFulfillmentSets(setsData)

      // Extract all service zones from fulfillment sets
      const allZones: ServiceZone[] = []
      setsData.forEach((set: any) => {
        if (set.service_zones) {
          set.service_zones.forEach((zone: any) => {
            allZones.push({
              id: zone.id,
              name: zone.name,
              fulfillment_set_id: set.id,
            })
          })
        }
      })
      setAllServiceZones(allZones)
      setServiceZones(allZones)
    } catch (error) {
      console.error("Error fetching fulfillment sets:", error)
      toast.error("Failed to load fulfillment sets")
    }
  }

  const handleDeleteGeozone = async (geozone: Geozone) => {
    if (!confirm(`Are you sure you want to delete this geozone?`)) {
      return
    }

    try {
      const response = await fetch(
        `/admin/fulfillment-sets/${geozone.service_zone.fulfillment_set_id}/service-zones/${geozone.service_zone.id}/geo-zones`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ geozoneIds: [geozone.id] }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete geozone")
      }

      toast.success("Geozone deleted successfully")
      fetchGeozones()
    } catch (error) {
      console.error("Error deleting geozone:", error)
      toast.error("Failed to delete geozone")
    }
  }

  const getLocationDisplay = (geozone: Geozone) => {
    const parts: string[] = []

    if (geozone.city) {
      parts.push(geozone.city)
    }

    if (geozone.province_code) {
      parts.push(geozone.province_code)
    }

    parts.push(geozone.country_code)

    if (geozone.postal_expression) {
      if (typeof geozone.postal_expression === 'string') {
        parts.push(`(${geozone.postal_expression})`)
      } else if (geozone.postal_expression.pattern) {
        parts.push(`(${geozone.postal_expression.pattern})`)
      }
    }

    return parts.join(", ")
  }

  const getLocationTypeBadge = (type: LocationType) => {
    const colorMap = {
      [LocationType.COUNTRY]: "blue",
      [LocationType.PROVINCE]: "green",
      [LocationType.CITY]: "orange",
      [LocationType.ZIP]: "purple",
    }

    return (
      <Badge color={colorMap[type] as any}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const clearFilters = () => {
    setSelectedFulfillmentSet("")
    setSelectedServiceZone("")
    setSearchQuery("")
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-y-2">
      {/* Header */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Geozones</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage geographic zones for your service zones
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2" />
            Create Geozone
          </Button>
        </div>
      </Container>

      {/* Filters */}
      <Container className="p-0">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by country, province, city, or zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Fulfillment Set Filter */}
            <div>
              <Select
                value={selectedFulfillmentSet || undefined}
                onValueChange={(value) => {
                  setSelectedFulfillmentSet(value || "")
                  setCurrentPage(1)
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All Fulfillment Sets" />
                </Select.Trigger>
                <Select.Content>
                  {fulfillmentSets.map((set) => (
                    <Select.Item key={set.id} value={set.id}>
                      {set.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              {selectedFulfillmentSet && (
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => {
                    setSelectedFulfillmentSet("")
                    setCurrentPage(1)
                  }}
                  className="mt-1"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Service Zone Filter */}
            <div>
              <Select
                value={selectedServiceZone || undefined}
                onValueChange={(value) => {
                  setSelectedServiceZone(value || "")
                  setCurrentPage(1)
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder="All Service Zones" />
                </Select.Trigger>
                <Select.Content>
                  {serviceZones.map((zone) => (
                    <Select.Item key={zone.id} value={zone.id}>
                      {zone.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              {selectedServiceZone && (
                <Button
                  variant="transparent"
                  size="small"
                  onClick={() => {
                    setSelectedServiceZone("")
                    setCurrentPage(1)
                  }}
                  className="mt-1"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {(selectedFulfillmentSet || selectedServiceZone || searchQuery) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-ui-fg-subtle">Active filters:</span>
              {selectedFulfillmentSet && (
                <Badge color="blue">
                  {fulfillmentSets.find(s => s.id === selectedFulfillmentSet)?.name}
                </Badge>
              )}
              {selectedServiceZone && (
                <Badge color="green">
                  {serviceZones.find(z => z.id === selectedServiceZone)?.name}
                </Badge>
              )}
              {searchQuery && (
                <Badge color="orange">
                  Search: "{searchQuery}"
                </Badge>
              )}
              <Button
                variant="transparent"
                size="small"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </Container>

      {/* Table */}
      <Container className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Service Zone</Table.HeaderCell>
                <Table.HeaderCell>Fulfillment Set</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <td colSpan={6} className="text-center py-8 text-ui-fg-subtle">
                    Loading geozones...
                  </td>
                </Table.Row>
              ) : filteredGeozones.length === 0 ? (
                <Table.Row>
                  <td colSpan={6} className="text-center py-8 text-ui-fg-subtle">
                    {searchQuery || selectedFulfillmentSet || selectedServiceZone
                      ? "No geozones found matching your filters"
                      : "No geozones created yet. Click 'Create Geozone' to add one."}
                  </td>
                </Table.Row>
              ) : (
                filteredGeozones.map((geozone) => (
                  <Table.Row key={geozone.id}>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getLocationDisplay(geozone)}</span>
                        {geozone.metadata?.country_name && (
                          <span className="text-xs text-ui-fg-subtle">
                            {geozone.metadata.country_name}
                          </span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{getLocationTypeBadge(geozone.type)}</Table.Cell>
                    <Table.Cell>{geozone.service_zone?.name || "-"}</Table.Cell>
                    <Table.Cell>
                      {geozone.service_zone?.fulfillment_set?.name || "-"}
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(geozone.created_at).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => handleDeleteGeozone(geozone)}
                        >
                          <Trash className="text-ui-fg-error" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-ui-border-base">
            <div className="text-sm text-ui-fg-subtle">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} geozones
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "secondary"}
                      size="small"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Modal */}
      <GeozoneFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchGeozones}
      />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Geozones",
  icon: MapPin,
})

export default GeozonesPage
