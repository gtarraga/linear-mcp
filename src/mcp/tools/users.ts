import { z } from "zod";
import { type Tool, tool } from "~/mcp/utils";

const UserSchema = z.object({
  id: z.string(),
  active: z.boolean().nullish(),
  avatarUrl: z.string().nullish(),
  createdIssueCount: z.number().nullish(),
  displayName: z.string().nullish(),
  email: z.string().nullish(),
  guest: z.boolean().nullish(),
  timezone: z.string().nullish(),
});

export const USER_TOOLS: Tool[] = [
  tool({
    name: "whoami",
    description: "Get the current user's details",
    execute: async (client) => {
      const user = await client.viewer;
      return {
        content: [{ type: "text", text: JSON.stringify(UserSchema.parse(user)) }],
      };
    },
  }),
  tool({
    name: "get_user_by_id",
    description: "Get a user by their ID",
    params: { id: z.string() },
    execute: async (client, args) => {
      const user = await client.user(args.id);
      return { content: [{ type: "text", text: JSON.stringify(user) }] };
    },
  }),
  tool({
    name: "list_users",
    description: "List all users",
    execute: async (client) => {
      const users = await client.users();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(z.array(UserSchema).parse(users.nodes)),
          },
        ],
      };
    },
  }),
];
