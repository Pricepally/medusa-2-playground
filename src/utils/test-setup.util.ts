import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import {
  TestDataTracker,
  getTestDataTracker,
  resetTestDataTracker,
} from '@/utils/test-data-tracker.util';

export interface ITestSuiteConfig {
  testSuite: (params: any) => void;
  env?: Record<string, any>;
  inApp?: boolean;
}

/**
 * Enhanced test runner that manages test data cleanup
 */
export function createTestRunner(config: ITestSuiteConfig) {
  return medusaIntegrationTestRunner({
    inApp: config.inApp ?? true,
    env: config.env ?? {},
    testSuite: ({ api, getContainer }) => {
      let testDataTracker: TestDataTracker;

      beforeAll(async () => {
        // Initialize the test data tracker
        testDataTracker = getTestDataTracker(getContainer());
      });

      afterEach(async () => {
        // Clean up test data after each test
        if (testDataTracker) await testDataTracker.cleanup();
      });

      afterAll(async () => {
        // Reset the tracker for next test suite
        resetTestDataTracker();
      });

      // Run the actual test suite
      config.testSuite({
        api,
        getContainer,
      });
    },
  });
}

/**
 * Create a test API key and return it with the token
 */
export async function createTestApiKey(
  container: any,
  title: string = 'Test API Key'
): Promise<{ id: string; token: string }> {
  const testDataTracker = getTestDataTracker(container);
  const apiKey = await testDataTracker.createAndTrackApiKey(title);
  return {
    id: apiKey.id,
    token: apiKey.token,
  };
}

/**
 * Create a test sales channel
 */
export async function createTestSalesChannel(
  container: any,
  name: string = 'Test Sales Channel'
): Promise<any> {
  const testDataTracker = getTestDataTracker(container);
  return await testDataTracker.createAndTrackSalesChannel(name);
}
