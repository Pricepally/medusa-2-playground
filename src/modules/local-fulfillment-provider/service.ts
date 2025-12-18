import {
  IFulfillmentProvider,
  FulfillmentOption,
  ValidateFulfillmentDataContext,
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  CalculateShippingOptionPriceContext,
  CalculateShippingOptionPriceDTO,
  CreateShippingOptionDTO,
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  FulfillmentDTO,
} from "@medusajs/types";

/**
 * Local Fulfillment Provider
 *
 * This provider handles local fulfillment operations such as local pickup
 * or delivery within a specific geographic area.
 */
export default class LocalFulfillmentProviderService implements IFulfillmentProvider {
  static identifier = "local-fulfillment-provider";

  /**
   * Return a unique identifier to retrieve the fulfillment plugin provider
   */
  getIdentifier(): string {
    return LocalFulfillmentProviderService.identifier;
  }

  /**
   * Return the available fulfillment options for the given data.
   * These are the shipping methods available for this provider.
   */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "local-pickup",
        is_return: false,
      },
      {
        id: "local-delivery",
        is_return: false,
      },
      {
        id: "local-return",
        is_return: true,
      },
    ];
  }

  /**
   * Validate the given fulfillment data.
   * This is called when a shipping option is selected during checkout.
   */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<any> {
    // Validate that required data is present
    if (!data) {
      throw new Error("Fulfillment data is required");
    }

    // For local pickup, we might want to validate pickup location
    if (optionData.id === "local-pickup") {
      // Add custom validation logic here
      return {
        ...data,
        validated: true,
      };
    }

    // For local delivery, validate delivery address is within service area
    if (optionData.id === "local-delivery") {
      // Add custom validation logic here
      return {
        ...data,
        validated: true,
      };
    }

    return data;
  }

  /**
   * Validate the given option.
   * This is called when creating or updating a shipping option.
   */
  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Validate that the option data is correct
    const validOptions = ["local-pickup", "local-delivery", "local-return"];

    if (data.id && typeof data.id === "string") {
      return validOptions.includes(data.id);
    }

    return true;
  }

  /**
   * Check if the provider can calculate the fulfillment price.
   * Return true if the provider can calculate prices dynamically.
   */
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    // This provider can calculate prices for all its options
    return true;
  }

  /**
   * Calculate the price for the given fulfillment option.
   * This is called when displaying shipping options to customers.
   */
  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    // Implement custom pricing logic here
    let calculatedAmount = 0;

    // Example: Free pickup, charged delivery based on distance
    if (optionData.id === "local-pickup") {
      calculatedAmount = 0;
    } else if (optionData.id === "local-delivery") {
      // Calculate delivery cost (example: flat rate or distance-based)
      calculatedAmount = 500; // 5.00 in cents
    }

    return {
      calculated_amount: calculatedAmount,
      is_calculated_price_tax_inclusive: false,
    };
  }

  /**
   * Create a fulfillment for the given data.
   * This is called when an order is fulfilled.
   */
  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    // Create fulfillment in your system or third-party service
    const fulfillmentData: Record<string, unknown> = {
      fulfillment_id: fulfillment.id || `local-${Date.now()}`,
      status: "pending",
      created_at: new Date().toISOString(),
      ...data,
    };

    // Generate tracking information
    const trackingNumber = `LOCAL-${Date.now()}`;
    const trackingUrl = `https://yoursite.com/track/${trackingNumber}`;

    return {
      data: fulfillmentData,
      labels: [
        {
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          label_url: `https://yoursite.com/label/${trackingNumber}`,
        },
      ],
    };
  }

  /**
   * Cancel the given fulfillment.
   * This is called when a fulfillment needs to be cancelled.
   */
  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    // Implement cancellation logic
    return {
      ...fulfillment,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    };
  }

  /**
   * Get the documents for the given fulfillment data.
   * This can return packing slips, shipping labels, etc.
   */
  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<any> {
    // Return relevant documents
    return {
      documents: [],
      message: "No documents available for local fulfillment",
    };
  }

  /**
   * Create a return for the given data.
   * This is called when processing a return.
   */
  async createReturnFulfillment(
    fromData: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    const returnTrackingNumber = `RETURN-${Date.now()}`;

    return {
      data: {
        return_id: `return-${Date.now()}`,
        status: "pending",
        created_at: new Date().toISOString(),
        ...fromData,
      },
      labels: [
        {
          tracking_number: returnTrackingNumber,
          tracking_url: `https://yoursite.com/track/${returnTrackingNumber}`,
          label_url: `https://yoursite.com/label/${returnTrackingNumber}`,
        },
      ],
    };
  }

  /**
   * Get the documents for the given return data.
   */
  async retrieveDocuments(
    fulfillmentData: Record<string, unknown>,
    documentType: string
  ): Promise<any> {
    return {
      documents: [],
      type: documentType,
    };
  }

  /**
   * Get the documents for the given return data.
   */
  async getReturnDocuments(data: Record<string, unknown>): Promise<any> {
    return {
      documents: [],
      message: "No return documents available",
    };
  }

  /**
   * Get the documents for the given shipment data.
   */
  async getShipmentDocuments(data: Record<string, unknown>): Promise<any> {
    return {
      documents: [],
      message: "No shipment documents available",
    };
  }
}
