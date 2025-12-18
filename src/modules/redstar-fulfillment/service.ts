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
import {
  getRedstarCountryZone,
  getRedstarWeightZonePrice,
  redstarZoneCountryData,
} from "../../helpers/redstar-fulfillment.helpers";

/**
 * RedStar Fulfillment Provider
 *
 * This provider integrates with RedStar Express or similar courier services
 * for domestic and regional shipping operations.
 */
export default class RedstarFulfillmentService implements IFulfillmentProvider {
  static identifier = "redstar-fulfillment";

  /**
   * Return a unique identifier to retrieve the fulfillment plugin provider
   */
  getIdentifier(): string {
    return RedstarFulfillmentService.identifier;
  }

  /**
   * ===============================================
   * SHIPPING OPTION RULES - Simple Example
   * ===============================================
   * This method checks if a shipping option is eligible
   * based on weight, zone, and other criteria.
   */
  private isOptionEligible(
    optionId: string,
    weight: number,
    zone: number
  ): { eligible: boolean; reason?: string } {
    // RULE 1: Same-day delivery restrictions
    if (optionId === "redstar-same-day") {
      // Only available for packages under 5kg (5000g)
      if (weight > 5000) {
        return {
          eligible: false,
          reason: "Same-day delivery is only available for packages under 5kg"
        };
      }
      // Only available in Zone 1 and Zone 2 (UK and West Africa)
      if (zone > 2) {
        return {
          eligible: false,
          reason: "Same-day delivery is only available in Zone 1 and Zone 2"
        };
      }
    }

    // RULE 2: Next-day delivery restrictions
    if (optionId === "redstar-next-day") {
      // Only available for packages under 10kg (10000g)
      if (weight > 10000) {
        return {
          eligible: false,
          reason: "Next-day delivery is only available for packages under 10kg"
        };
      }
    }

    // RULE 3: Economy shipping minimum weight
    if (optionId === "redstar-economy") {
      // Only available for packages over 1kg (1000g)
      if (weight < 1000) {
        return {
          eligible: false,
          reason: "Economy shipping is only available for packages over 1kg"
        };
      }
    }

    // RULE 4: Standard shipping - always available (no restrictions)

    return { eligible: true };
  }

  /**
   * Return the available fulfillment options for the given data.
   * These are the shipping methods available for this provider.
   */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "redstar-same-day",
        is_return: false,
      },
      {
        id: "redstar-next-day",
        is_return: false,
      },
      {
        id: "redstar-standard",
        is_return: false,
      },
      {
        id: "redstar-economy",
        is_return: false,
      },
      {
        id: "redstar-return",
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

    // Validate shipping address
    if (!context.shipping_address) {
      throw new Error("Shipping address is required for RedStar fulfillment");
    }

    // Validate postal code for same-day delivery
    if (optionData.id === "redstar-same-day") {
      if (!context.shipping_address.postal_code) {
        throw new Error("Postal code is required for same-day delivery");
      }
      // Add logic to check if postal code is in same-day delivery zone
    }

    return {
      ...data,
      validated: true,
      shipping_address: context.shipping_address,
    };
  }

  /**
   * Validate the given option.
   * This is called when creating or updating a shipping option.
   */
  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Validate that the option data is correct
    const validOptions = [
      "redstar-same-day",
      "redstar-next-day",
      "redstar-standard",
      "redstar-economy",
      "redstar-return",
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
    // Get shipping address from context
    const shippingAddress = context.shipping_address;
    if (!shippingAddress?.country_code) {
      throw new Error("Shipping address with country code is required for price calculation");
    }

    // Calculate total weight from cart items (in grams)
    const totalWeight = context.items?.reduce((total, item) => {
      const itemWeight = Number((item as any).variant?.weight) || 0;
      const quantity = Number(item.quantity) || 1;
      return total + (itemWeight * quantity);
    }, 0) || 0;

    if (totalWeight === 0) {
      throw new Error("Total weight must be greater than 0 for price calculation");
    }

    // Get the zone for the destination country
    let zone: number;
    let zoneIndex: number;

    try {
      zone = getRedstarCountryZone(shippingAddress.country_code);
      const countryData = redstarZoneCountryData.find(
        (country) => country.iso2 === shippingAddress.country_code
      );

      if (!countryData) {
        throw new Error(`Country ${shippingAddress.country_code} not supported for RedStar fulfillment`);
      }

      zoneIndex = countryData.zoneIndex;
    } catch (error) {
      throw new Error(`Failed to get zone for country ${shippingAddress.country_code}: ${error.message}`);
    }

    // ===============================================
    // CHECK SHIPPING OPTION RULES
    // ===============================================
    // Validate if the selected option is eligible based on rules
    const eligibilityCheck = this.isOptionEligible(
      optionData.id as string,
      totalWeight,
      zone
    );

    if (!eligibilityCheck.eligible) {
      throw new Error(eligibilityCheck.reason || "This shipping option is not available");
    }

    // Get base price from weight and zone
    let basePrice: number;

    try {
      basePrice = getRedstarWeightZonePrice(totalWeight, zoneIndex);
    } catch (error) {
      throw new Error(`Failed to calculate price for weight ${totalWeight}g and zone ${zone}: ${error.message}`);
    }

    // Apply service level multipliers
    let calculatedAmount = basePrice;

    switch (optionData.id) {
      case "redstar-same-day":
        calculatedAmount = basePrice * 1.5; // 50% premium for same-day
        break;
      case "redstar-next-day":
        calculatedAmount = basePrice * 1.25; // 25% premium for next-day
        break;
      case "redstar-standard":
        calculatedAmount = basePrice; // Base price for standard
        break;
      case "redstar-economy":
        calculatedAmount = basePrice * 0.85; // 15% discount for economy
        break;
      default:
        calculatedAmount = basePrice;
    }

    // Round to 2 decimal places (convert from kobo to naira and back)
    calculatedAmount = Math.round(calculatedAmount);

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
    // Create fulfillment with RedStar service
    const fulfillmentData: Record<string, unknown> = {
      fulfillment_id: fulfillment.id || `redstar-${Date.now()}`,
      status: "pending_pickup",
      created_at: new Date().toISOString(),
      courier: "RedStar Express",
      ...data,
    };

    // Generate RedStar tracking information
    const trackingNumber = `RS${Date.now()}`;
    const trackingUrl = `https://redstarexpress.com/track/${trackingNumber}`;

    return {
      data: fulfillmentData,
      labels: [
        {
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          label_url: `https://redstarexpress.com/label/${trackingNumber}`,
        },
      ],
    };
  }

  /**
   * Cancel the given fulfillment.
   * This is called when a fulfillment needs to be cancelled.
   */
  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    // Implement cancellation logic with RedStar service
    // In a real implementation, you would call RedStar's API to cancel the shipment
    return {
      ...fulfillment,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_confirmed: true,
    };
  }

  /**
   * Get the documents for the given fulfillment data.
   * This can return packing slips, shipping labels, etc.
   */
  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<any> {
    // Return RedStar shipping documents
    return {
      documents: [
        {
          type: "shipping_label",
          url: `https://redstarexpress.com/documents/label/${data.fulfillment_id}`,
        },
        {
          type: "waybill",
          url: `https://redstarexpress.com/documents/waybill/${data.fulfillment_id}`,
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
    const returnTrackingNumber = `RS-RET-${Date.now()}`;

    return {
      data: {
        return_id: `redstar-return-${Date.now()}`,
        status: "pending_pickup",
        created_at: new Date().toISOString(),
        courier: "RedStar Express",
        return_type: true,
        ...fromData,
      },
      labels: [
        {
          tracking_number: returnTrackingNumber,
          tracking_url: `https://redstarexpress.com/track/${returnTrackingNumber}`,
          label_url: `https://redstarexpress.com/return-label/${returnTrackingNumber}`,
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
          url: `https://redstarexpress.com/documents/${documentType}/${fulfillmentData.fulfillment_id}`,
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
          url: `https://redstarexpress.com/documents/return/${data.return_id}`,
        },
        {
          type: "return_waybill",
          url: `https://redstarexpress.com/documents/return-waybill/${data.return_id}`,
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
          url: `https://redstarexpress.com/documents/shipment/${data.fulfillment_id}`,
        },
        {
          type: "delivery_manifest",
          url: `https://redstarexpress.com/documents/manifest/${data.fulfillment_id}`,
        },
      ],
    };
  }
}
