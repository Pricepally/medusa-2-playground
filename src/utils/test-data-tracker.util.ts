import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { Modules } from '@medusajs/framework/utils';

export interface ITestDataRecord {
  type: string;
  id: string;
  module?: string;
  metadata?: Record<string, any>;
}

export class TestDataTracker {
  private createdRecords: ITestDataRecord[] = [];
  private container: any;

  constructor(container: any) {
    this.container = container;
  }

  /**
   * Track a created record for cleanup
   */
  track(
    type: string,
    id: string,
    module?: string,
    metadata?: Record<string, any>
  ): void {
    this.createdRecords.push({
      type,
      id,
      module,
      metadata,
    });
  }

  /**
   * Clear tracking data (useful for between tests)
   */
  clearTracking(): void {
    this.createdRecords = [];
  }

  /**
   * Clean up all tracked test data
   */
  async cleanup(): Promise<void> {
    const logger = this.container.resolve(ContainerRegistrationKeys.LOGGER);

    if (this.createdRecords.length === 0) {
      logger.info('No test data to clean up');
      return;
    }

    logger.info(`Cleaning up ${this.createdRecords.length} test records...`);

    // Clean up in reverse order to handle dependencies
    const cleanupPromises = this.createdRecords
      .slice()
      .reverse()
      .map(async (record) => {
        try {
          await this.deleteRecord(record);
          logger.debug(`Cleaned up ${record.type} with id: ${record.id}`);
        } catch (error) {
          logger.warn(
            `Failed to clean up ${record.type} with id: ${record.id}:`,
            error
          );
        }
      });

    await Promise.allSettled(cleanupPromises);

    // Clear the tracking data after cleanup
    this.clearTracking();

    logger.info('Test data cleanup completed');
  }

  /**
   * Delete a specific record based on its type and module
   */
  private async deleteRecord(record: ITestDataRecord): Promise<void> {
    const { type, id } = record;

    switch (type) {
      case 'api_key':
        await this.deleteApiKey(id);
        break;
      case 'sales_channel':
        await this.deleteSalesChannel(id);
        break;
      default:
        // For other types, we rely on database cleanup
        break;
    }
  }

  /**
   * Delete API key
   */
  private async deleteApiKey(id: string): Promise<void> {
    const apiKeyModuleService = this.container.resolve(Modules.API_KEY);
    await apiKeyModuleService.deleteApiKeys([id]);
  }

  /**
   * Delete sales channel
   */
  private async deleteSalesChannel(id: string): Promise<void> {
    const salesChannelModuleService = this.container.resolve(
      Modules.SALES_CHANNEL
    );
    await salesChannelModuleService.deleteSalesChannels([id]);
  }

  /**
   * Create a test API key and track it
   */
  async createAndTrackApiKey(title: string = 'Test API Key'): Promise<any> {
    const { createApiKeysWorkflow } = await import(
      '@medusajs/medusa/core-flows'
    );

    const { result: apiKeyResult } = await createApiKeysWorkflow(
      this.container
    ).run({
      input: {
        api_keys: [
          {
            title,
            type: 'publishable',
            created_by: '',
          },
        ],
      },
    });

    const apiKey = apiKeyResult[0];
    this.track('api_key', apiKey.id);

    return apiKey;
  }

  /**
   * Create a test sales channel and track it
   */
  async createAndTrackSalesChannel(
    name: string = 'Test Sales Channel'
  ): Promise<any> {
    const { createSalesChannelsWorkflow } = await import(
      '@medusajs/medusa/core-flows'
    );

    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      this.container
    ).run({
      input: {
        salesChannelsData: [
          {
            name,
          },
        ],
      },
    });

    const salesChannel = salesChannelResult[0];
    this.track('sales_channel', salesChannel.id);

    return salesChannel;
  }
}

/**
 * Global test data tracker instance
 */
let globalTestDataTracker: TestDataTracker | null = null;

/**
 * Get or create the global test data tracker
 */
export function getTestDataTracker(container?: any): TestDataTracker {
  if (!globalTestDataTracker && container) {
    globalTestDataTracker = new TestDataTracker(container);
  }

  if (!globalTestDataTracker) {
    throw new Error(
      'TestDataTracker not initialized. Call getTestDataTracker(container) first.'
    );
  }

  return globalTestDataTracker;
}

/**
 * Reset the global test data tracker
 */
export function resetTestDataTracker(): void {
  globalTestDataTracker = null;
}
