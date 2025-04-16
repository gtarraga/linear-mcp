import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export type HonoEnv = {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  Variables: {};
  Bindings: CloudflareEnv & { OAUTH_PROVIDER: OAuthHelpers };
};

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type MCPState = {};

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type MCPProps = {
  email: string;
  userId: string;
  accessToken: string;
};
