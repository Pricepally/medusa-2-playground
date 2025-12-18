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
 * Export Fulfillment Provider
 *
 * This provider handles international export fulfillment operations,
 * including customs documentation and international shipping.
 */
export default class ExportFulfillmentProviderService implements IFulfillmentProvider {
  static identifier = "export-fulfillment-provider";

  /**
   * Return a unique identifier to retrieve the fulfillment plugin provider
   */
  getIdentifier(): string {
    return ExportFulfillmentProviderService.identifier;
  }

  /**
   * Return the available fulfillment options for the given data.
   * These are the shipping methods available for this provider.
   */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "export-standard",
        is_return: false,
      },
      {
        id: "export-express",
        is_return: false,
      },
      {
        id: "export-economy",
        is_return: false,
      },
      {
        id: "export-return",
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

    // Validate international shipping requirements
    if (!context.shipping_address?.country_code) {
      throw new Error("Country code is required for export fulfillment");
    }

    // Add customs validation for export shipments
    const validatedData = {
      ...data,
      validated: true,
      customs_required: true,
      country_code: context.shipping_address.country_code,
    };

    return validatedData;
  }

  /**
   * Validate the given option.
   * This is called when creating or updating a shipping option.
   */
  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Validate that the option data is correct
    const validOptions = [
      "export-standard",
      "export-express",
      "export-economy",
      "export-return",
    ];

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
    // Implement custom pricing logic based on destination country and weight
    let calculatedAmount = 0;

    // Example pricing based on service level
    switch (optionData.id) {
      case "export-economy":
        calculatedAmount = 1500; // $15.00
        break;
      case "export-standard":
        calculatedAmount = 2500; // $25.00
        break;
      case "export-express":
        calculatedAmount = 5000; // $50.00
        break;
      default:
        calculatedAmount = 2500;
    }

    // You can add logic here to calculate based on:
    // - Destination country (context.shipping_address?.country_code)
    // - Package weight (context.cart?.items or order items)
    // - Customs duties and taxes

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
    // Create export fulfillment with customs documentation
    const fulfillmentData: Record<string, unknown> = {
      fulfillment_id: fulfillment.id || `export-${Date.now()}`,
      status: "pending_customs",
      created_at: new Date().toISOString(),
      customs_declaration_required: true,
      ...data,
    };

    // Generate tracking information with international tracking
    const trackingNumber = `EXPORT-${Date.now()}`;
    const trackingUrl = `https://tracking.export-service.com/track/${trackingNumber}`;

    return {
      data: fulfillmentData,
      labels: [
        {
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          label_url: `https://labels.export-service.com/label/${trackingNumber}`,
        },
      ],
    };
  }

  /**
   * Cancel the given fulfillment.
   * This is called when a fulfillment needs to be cancelled.
   */
  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    // Implement cancellation logic including customs cancellation
    return {
      ...fulfillment,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      customs_cancelled: true,
    };
  }

  /**
   * Get the documents for the given fulfillment data.
   * This can return packing slips, shipping labels, customs forms, etc.
   */
  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<any> {
    // Return customs and shipping documents
    return {
      documents: [
        {
          type: "commercial_invoice",
          url: `https://docs.export-service.com/invoice/${data.fulfillment_id}`,
        },
        {
          type: "customs_declaration",
          url: `https://docs.export-service.com/customs/${data.fulfillment_id}`,
        },
      ],
    };
  }

  /**
   * Create a return for the given data.
   * This is called when processing a return.
   */
  async createReturnFulfillment(
    fromData: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    const returnTrackingNumber = `EXPORT-RETURN-${Date.now()}`;

    return {
      data: {
        return_id: `export-return-${Date.now()}`,
        status: "pending",
        created_at: new Date().toISOString(),
        customs_return: true,
        ...fromData,
      },
      labels: [
        {
          tracking_number: returnTrackingNumber,
          tracking_url: `https://tracking.export-service.com/track/${returnTrackingNumber}`,
          label_url: `https://labels.export-service.com/return/${returnTrackingNumber}`,
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
      documents: [
        {
          type: documentType,
          url: `https://docs.export-service.com/${documentType}/${fulfillmentData.fulfillment_id}`,
        },
      ],
    };
  }

  /**
   * Get the documents for the given return data.
   */
  async getReturnDocuments(data: Record<string, unknown>): Promise<any> {
    return {
      documents: [
        {
          type: "return_label",
          url: `https://docs.export-service.com/return/${data.return_id}`,
        },
      ],
    };
  }

  /**
   * Get the documents for the given shipment data.
   */
  async getShipmentDocuments(data: Record<string, unknown>): Promise<any> {
    return {
      documents: [
        {
          type: "shipping_label",
          url: `https://docs.export-service.com/shipment/${data.fulfillment_id}`,
        },
        {
          type: "customs_form",
          url: `https://docs.export-service.com/customs/${data.fulfillment_id}`,
        },
      ],
    };
  }
}
