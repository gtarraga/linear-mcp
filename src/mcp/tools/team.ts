import { z } from "zod";
import { IdComparatorSchema, type Tool, tool } from "~/mcp/utils";

const TeamSchema = z.object({
  id: z.string(),
  key: z.string().nullish(),
  name: z.string().nullish(),
  issueCount: z.number().nullish(),
  private: z.boolean().nullish(),
});

export const TEAM_TOOLS: Tool[] = [
  tool({
    name: "get_team_by_id",
    description: "Get a team by its ID",
    params: { id: z.string() },
    execute: async (client, args) => {
      const team = await client.team(args.id);
      return { content: [{ type: "text", text: JSON.stringify(team) }] };
    },
  }),
  tool({
    name: "list_teams",
    description: "List all teams",
    params: {
      filter: z
        .object({
          id: IdComparatorSchema.optional().describe("Search by team ID"),
        })
        .optional()
        .describe("Only use this if you need to filter the teams"),
    },
    execute: async (client, args) => {
      const teams = await client.teams({ filter: args.filter });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(z.array(TeamSchema).parse(teams.nodes)),
          },
        ],
      };
    },
  }),
];
