import dotenv from "dotenv";
dotenv.config();

const REQUIRED_ENV_VARS = ["JWT_SECRET", "DATABASE_URL"] as const;

const OPTIONAL_ENV_VARS: Record<string, string> = {
  PORT: "5000",
  NODE_ENV: "development",
};

function validateEnv(): void {
  const missing: string[] = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key],
  );

  if (missing.length > 0) {
    console.error(
      `[ENV] Missing required environment variable(s): ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  // Apply defaults for optional vars that are not set
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[ENV] Environment validated successfully.");
  }
}

validateEnv();

// Typed, guaranteed-non-null env values for use across the app
export const env = {
  PORT: Number(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
};
