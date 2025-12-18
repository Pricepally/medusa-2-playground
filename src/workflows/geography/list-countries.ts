import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils";

type ListCountriesInput = {
  limit?: number
  offset?: number
  search?: string
  iso2?: string
}

const listCountriesStep = createStep(
  'list-countries-step',
  async (input: ListCountriesInput, { container }) => {
    const regionModuleService = container.resolve(Modules.REGION);

    const { limit = 50, offset = 0, search, iso2 } = input

    const where: any = {}

    if(search){
      where.name = {$ilike: `%${search}%`}
    }
    if(iso2){
      where.iso_2 = iso2.toUpperCase()
    }

    const [countries, count] = await regionModuleService.listAndCountCountries(
      where,
      {
        skip: offset,
        take: limit,
        order: { name: 'ASC'}
      }
    )

    return new StepResponse({
      countries,
      count,
      limit,
      offset
    })
  }
)

export const listCountriesWorkflow = createWorkflow(
  "list-countries",
  (input: ListCountriesInput) => {
    const result = listCountriesStep(input)
    return new WorkflowResponse(result)
  }
)