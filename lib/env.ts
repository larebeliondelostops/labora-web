function requirePublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Labora",
  appUrl: withoutTrailingSlash(
    requirePublicEnv("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
  ),
  apiUrl: withoutTrailingSlash(
    requirePublicEnv("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
  ),
  googleLoginEnabled: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN !== "false",
  environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",
};
