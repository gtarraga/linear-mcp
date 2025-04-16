import { env } from "cloudflare:workers";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { MCPProps, MCPState } from "~/types";

import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { LinearClient } from "@linear/sdk";
import { listUserGrants, revokeGrant } from "~/auth/auth-utils";
import { ISSUE_TOOLS } from "./tools/issue";
import { TEAM_TOOLS } from "./tools/team";
import { USER_TOOLS } from "./tools/users";
import { WORKFLOW_TOOLS } from "./tools/workflows";
import { PROJECT_TOOLS } from "./tools/project";

const TOOLS = [...USER_TOOLS, ...TEAM_TOOLS, ...ISSUE_TOOLS, ...WORKFLOW_TOOLS, ...PROJECT_TOOLS];

export class LinearMCP extends McpAgent<CloudflareEnv & { OAUTH_PROVIDER: OAuthHelpers }, MCPState, MCPProps> {
  server = new McpServer({ name: "Linear MCP", version: "1.0.0" });

  async init() {
    for (const tool of TOOLS) {
      this.server.tool(tool.name, tool.description, tool.params, async (args: unknown) => {
        const { accessToken } = this.props;
        if (!accessToken) {
          return {
            content: [{ type: "text", text: "No access token found" }],
          };
        }

        const client = new LinearClient({ accessToken });
        try {
          const result = await tool.execute(client, args);
          return result;
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e}` }] };
        }
      });
    }

    this.server.tool("logout", "Logout of Linear", {}, async () => {
      const { userId } = this.props;
      if (!userId) {
        return {
          content: [{ type: "text", text: "Error: Could not find user information." }],
        };
      }

      try {
        // Find grants associated with the user
        const grants = await listUserGrants(userId);

        if (!grants.items || grants.items.length === 0) {
          return {
            content: [{ type: "text", text: "No active grants found to revoke." }],
          };
        }

        // Revoke each grant found for the user
        let revokedCount = 0;
        for (const grant of grants.items) {
          await revokeGrant(grant.id, userId);
          revokedCount++;
        }

        return {
          content: [
            {
              type: "text",
              text: `Logged out successfully. Revoked ${revokedCount} grant(s).`,
            },
          ],
        };
      } catch (error) {
        console.error("Logout error:", error);
        let errorMessage = "An unknown error occurred during logout.";
        if (error instanceof Error) {
          errorMessage = `Error during logout: ${error.message}`;
        }
        return {
          content: [{ type: "text", text: errorMessage }],
        };
      }
    });
  }
}
