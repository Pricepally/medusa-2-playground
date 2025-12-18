import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { GEOGRAPHY_MODULE } from "../../modules/geography"
import GeographyModuleService from "../../modules/geography/service"
import { getCountryForStatesStep } from "./list-states-by-country"

type ListCitiesByStateInput = {
  countryIso: string
  stateName: string
  limit?: number
  offset?: number
  search?: string
}

const listCitiesByStateStep = createStep(
  "list-cities-by-state-step",
  async (
    input: {
      country: any
      stateName: string
      limit?: number
      offset?: number
      search?: string
    },
    { container }
  ) => {
    const geographyModuleService: GeographyModuleService = container.resolve(GEOGRAPHY_MODULE);
    
    const result = await geographyModuleService.listCitiesByState(
      input.country.display_name || input.country.name,
      input.stateName,
      {
        limit: input.limit,
        offset: input.offset,
        search: input.search
      }
    )
    
    return new StepResponse({
      ...result,
      state: {
        name: input.stateName,
        country_name: input.country.display_name || input.country.name
      },
      country: {
        iso_2: input.country.iso_2,
        iso_3: input.country.iso_3,
        name: input.country.name
      }
    })
  }
)

export const listCitiesByStateWorkflow = createWorkflow(
  "list-cities-by-state",
  (input: ListCitiesByStateInput) => {
    const country = getCountryForStatesStep({ countryIso: input.countryIso })
    
    const result = listCitiesByStateStep({
      country,
      stateName: input.stateName,
      limit: input.limit,
      offset: input.offset,
      search: input.search
    })
    
    return new WorkflowResponse(result)
  }
)