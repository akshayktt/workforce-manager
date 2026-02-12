// Server configuration
export const config = {
  development: {
    port: 4000,
    databaseUrl: "postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
    sessionSecret: "workforce-secret-dev",
    allowedOrigins: [
      "http://localhost:8081",
      "http://localhost:4000",
      "http://localhost:3000", 
      "http://localhost:19006",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:8081"
    ]
  },
  production: {
    port: parseInt(process.env.PORT || "5000", 10),
    databaseUrl: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
    sessionSecret: process.env.SESSION_SECRET || "workforce-secret-prod-change-me",
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || []
  }
};

export function getConfig() {
  const env = process.env.NODE_ENV || "development";
  return config[env as keyof typeof config] || config.development;
}