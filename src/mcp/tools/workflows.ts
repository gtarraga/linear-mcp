import { z } from "zod";
import { type Tool, tool } from "~/mcp/utils";
import { IdComparatorSchema } from "~/mcp/utils";

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  type: z.string(),
  description: z.string().optional(),
});

export const WORKFLOW_TOOLS: Tool[] = [
  tool({
    name: "list_workflows",
    description: "List all workflows, useful when you need a stateId",

    params: {
      teamId: IdComparatorSchema.describe("You should only get workflows relevant to the team you are working on"),
    },
    execute: async (client, args) => {
      const workflows = await client.workflowStates({
        filter: { team: { id: args.teamId } },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(workflows.nodes) }],
      };
    },
  }),
];
