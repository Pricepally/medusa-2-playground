import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils";

type GetCountryByIsoInput = {
  iso: string
}

const getCountryByIsoStep = createStep(
  "get-country-by-iso-step",
  async (input: GetCountryByIsoInput, { container }) => {
    const regionModuleService = container.resolve(Modules.REGION)
    
    const { iso } = input
    // const isoUpper = iso.toUpperCase()
    
    // Determine if it's ISO2 (2 chars) or ISO3 (3 chars)
    const field = iso.length === 2 ? 'iso_2' : 'iso_3'
    
    const countries = await regionModuleService.listCountries({
      [field]: iso,
    },
    { relations: ['region']}
  )
    
    return new StepResponse(countries[0] || null)
  }
)

export const getCountryByIsoWorkflow = createWorkflow(
  "get-country-by-iso",
  (input: GetCountryByIsoInput) => {
    const country = getCountryByIsoStep(input)
    return new WorkflowResponse(country)
  }
)