import { z } from "zod";
import { DateComparatorSchema, IdComparatorSchema, StringComparatorSchema, NumberComparatorSchema, type Tool, tool } from "~/mcp/utils";

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  state: z.string().nullish(),
  slugId: z.string(),
  startDate: z.string().nullish(),
  targetDate: z.string().nullish(),
  leadId: z.string().nullish(),
  memberIds: z.array(z.string()),
  teamIds: z.array(z.string()),
  color: z.string().optional(),
  // Add other relevant fields as needed, e.g., url, color, icon
});

const ProjectMutationSchema = z.object({
  name: z.string().describe("The name of the project."),
  description: z.string().optional().describe("Optional description for the project."),
  state: z.string().optional().describe('The state of the project (e.g., "planned", "started", "paused", "completed", "canceled").'),
  leadId: z.string().optional().describe("Optional ID of the user who leads the project. Use list_users if needed."),
  memberIds: z.array(z.string()).optional().describe("Optional list of user IDs to assign as members."),
  teamIds: z.array(z.string()).describe("List of team IDs required to associate with the project. Use list_teams if needed."),
  startDate: z.string().optional().describe("Optional start date in YYYY-MM-DD format."),
  targetDate: z.string().optional().describe("Optional target completion date in YYYY-MM-DD format."),
  color: z.string().optional().describe('Optional project color in hex format (e.g., "#6e6sbd").'),
  // Add other creatable/updatable fields like icon, slugId if needed
});

export const PROJECT_TOOLS: Tool[] = [
  tool({
    name: "get_project_by_id",
    description: "Get a single project by its unique ID.",
    params: { id: z.string().describe("The UUID of the project to retrieve.") },
    execute: async (client, args) => {
      const project = await client.project(args.id);
      // TODO: Add project relations/children/etc. if needed
      return { content: [{ type: "text", text: JSON.stringify(ProjectSchema.parse(project)) }] };
    },
  }),
  tool({
    name: "list_projects",
    description: "List all accessible projects, with optional filters.",
    params: {
      name: StringComparatorSchema.optional().describe("Filter projects by their name."),
      state: StringComparatorSchema.optional().describe(
        'Filter projects by their state (e.g., "planned", "started", "paused", "completed", "canceled").',
      ),
      startDate: DateComparatorSchema.optional().describe("Filter projects by their start date."),
      targetDate: DateComparatorSchema.optional().describe("Filter projects by their target date."),
      leadId: IdComparatorSchema.optional().describe("Filter projects by the ID of their lead user. Use list_users if needed."),
      memberId: IdComparatorSchema.optional().describe("Filter projects by the ID of a member user. Use list_users if needed."),
      teamId: IdComparatorSchema.optional().describe("Filter projects by an associated team ID. Use list_teams if needed."),
      // Note: Add more filters as needed based on Linear API capabilities (e.g., creatorId, id, slugId)
    },
    execute: async (client, args) => {
      // Construct the filter object carefully
      const filter: Record<string, any> = {};
      if (args.name) filter.name = args.name;
      if (args.state) filter.state = args.state;
      if (args.startDate) filter.startDate = args.startDate;
      if (args.targetDate) filter.targetDate = args.targetDate;
      if (args.leadId) filter.leadId = args.leadId;
      // Assuming the API uses 'members' or similar for filtering by memberId
      if (args.memberId) filter.members = { id: args.memberId }; // Adjust key based on SDK/API
      // Assuming the API uses 'teams' or similar for filtering by teamId
      if (args.teamId) filter.teams = { id: args.teamId }; // Adjust key based on SDK/API

      const projects = await client.projects({ filter });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(z.array(ProjectSchema).parse(projects.nodes)),
          },
        ],
      };
    },
  }),
  tool({
    name: "search_projects",
    description: "Search projects using a query string against name, description, and identifier.",
    params: { query: z.string().describe("The search query string.") },
    execute: async (client, args) => {
      // Assuming SDK has a searchProjects method similar to searchIssues
      const projects = await client.searchProjects(args.query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(z.array(ProjectSchema).parse(projects.nodes)),
          },
        ],
      };
    },
  }),
  tool({
    name: "create_project",
    description: "Create a new project.",
    params: ProjectMutationSchema.describe("Parameters for the new project.").shape,
    execute: async (client, args) => {
      const result = await client.createProject(args);
      const project = await result.project; // Access the created project
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ProjectSchema.parse(project)), // Parse the returned project
          },
        ],
      };
    },
  }),
  tool({
    name: "update_project",
    description: "Update an existing project by its ID.",
    params: ProjectMutationSchema.partial()
      .extend({ id: z.string().describe("The UUID of the project to update.") })
      .describe("Project ID and the fields to update.").shape,
    execute: async (client, args) => {
      const { id, ...updateData } = args;
      const result = await client.updateProject(id, updateData);
      // Check for success, Linear API often returns a payload with a success boolean
      // const success = result.success
      const updatedProject = await client.project(id); // Re-fetch to confirm update
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ProjectSchema.parse(updatedProject)),
          },
        ],
      };
    },
  }),
];
