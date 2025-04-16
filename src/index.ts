import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { LinearMCP } from "./mcp/server";
import { SCOPES, authRoute } from "./auth/auth";

const app = new Hono().route("/auth", authRoute);

export { LinearMCP };

export default {
  async fetch(request, env, ctx) {
    const handler = new OAuthProvider({
      apiRoute: ["/sse", "/auth/logout"],
      // @ts-expect-error - Types are wrong
      apiHandler: LinearMCP.mount("/sse"),
      // @ts-expect-error - Types are wrong
      defaultHandler: app,
      authorizeEndpoint: "/auth/authorize",
      callbackEndpoint: "/auth/callback",
      clientRegistrationEndpoint: "/auth/register",
      tokenEndpoint: "/auth/token",
      scopesSupported: SCOPES,
    });

    const response = await handler.fetch(request, env, ctx);

    return response;
  },
} satisfies ExportedHandler<CloudflareEnv>;
