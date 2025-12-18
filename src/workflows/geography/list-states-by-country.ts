import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { GEOGRAPHY_MODULE } from "../../modules/geography"
import GeographyModuleService from "../../modules/geography/service"

type ListStatesByCountryInput = {
  countryIso: string
  limit?: number
  offset?: number
  search?: string
}

export const getCountryForStatesStep = createStep(
  "get-country-for-states-step",
  async (input: { countryIso: string }, { container }) => {
    const regionModuleService = container.resolve(Modules.REGION)
    
    const isoUpper = input.countryIso.toUpperCase()
    const field = input.countryIso.length === 2 ? 'iso_2' : 'iso_3'
    
    const countries = await regionModuleService.listCountries({
      [field]: isoUpper
    })
    
    if (!countries || countries.length === 0) {
      throw new Error("Country not found")
    }
    
    return new StepResponse(countries[0])
  }
)

const listStatesStep = createStep(
  "list-states-step",
  async (
    input: { 
      country: any
      limit?: number
      offset?: number
      search?: string
    }, 
    { container }
  ) => {
    const geographyModuleService: GeographyModuleService = container.resolve(GEOGRAPHY_MODULE)
    
    const result = await geographyModuleService.listStatesByCountry(
      input.country.display_name || input.country.name, 
      {
        limit: input.limit,
        offset: input.offset,
        search: input.search
      }
    )
    
    return new StepResponse({
      ...result,
      country: {
        iso_2: input.country.iso_2,
        iso_3: input.country.iso_3,
        name: input.country.name,
        display_name: input.country.display_name
      }
    })
  }
)

export const listStatesByCountryWorkflow = createWorkflow(
  "list-states-by-country",
  (input: ListStatesByCountryInput) => {
    const country = getCountryForStatesStep({ countryIso: input.countryIso })
    
    const result = listStatesStep({
      country,
      limit: input.limit,
      offset: input.offset,
      search: input.search
    })
    
    return new WorkflowResponse(result)
  }
)