import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/geography",
      key: "geography"
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/local-fulfillment-provider",
            id: "local-fulfillment"
          },
          {
            resolve: "./src/modules/export-fulfillment-provider",
            id: "export-fulfillment"
          },
          {
            resolve: "./src/modules/redstar-fulfillment",
            id: "redstar"
          },
          {
            resolve: "./src/modules/shipstation",
            id: "shipstation",
            options: {
              api_key: process.env.SHIPSTATION_API_KEY
            }
          }
        ]
      }
    }
  ]
})
