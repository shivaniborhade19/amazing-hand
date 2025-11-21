const rawEnv = {
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_BASE_URL,
  TENANT_ID: import.meta.env.VITE_TENANT_ID,
  TENANT_NAME: import.meta.env.VITE_TENANT_NAME,
};

export function requireEnv(name: keyof typeof rawEnv) {
  const value = rawEnv[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  AUTH_BASE_URL: requireEnv("AUTH_BASE_URL"),
  TENANT_ID: requireEnv("TENANT_ID"),
  TENANT_NAME: requireEnv("TENANT_NAME"),
};
