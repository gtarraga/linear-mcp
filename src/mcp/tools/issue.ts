import { z } from 'zod'
import { DateComparatorSchema, IdComparatorSchema, StringComparatorSchema, NumberComparatorSchema, type Tool, tool } from '~/mcp/utils'

const IssueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  labelIds: z.array(z.string()).nullish(),
  number: z.number().nullish(),
  priority: z.number().nullish(),
  priorityLabel: z.string().nullish(),
  slaType: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  branchName: z.string().nullish(),
  url: z.string().nullish(),
  _projectMilestone: z.object({ id: z.string() }).nullish().describe('The project milestone of the issue'),
  _creator: z.object({ id: z.string() }).nullish().describe('The creator of the issue'),
  _cycle: z.object({ id: z.string() }).nullish().describe('The cycle of the issue'),
  _parent: z.object({ id: z.string() }).nullish().describe('The parent of the issue'),
  _state: z.object({ id: z.string() }).nullish().describe('The workflowID of the issue'),
  _team: z.object({ id: z.string() }).describe('The team of the issue'),
  _assignee: z.object({ id: z.string() }).nullish().describe('The assignee of the issue'),
  _project: z.object({ id: z.string() }).nullish().describe('The project of the issue'),
})

const IssueMutationSchema = IssueSchema.pick({
  title: true,
  description: true,
}).extend({
  teamId: z.string(),
  assigneeId: z.string().optional(),
  cycleId: z.string().optional(),
  parentId: z.string().optional(),
  projectMilestoneId: z.string().optional(),
  stateId: z.string().optional(),
  projectId: z.string().optional(),
})

export const ISSUE_TOOLS: Tool[] = [
  tool({
    name: 'get_issue_by_id',
    description: 'Get an issue by its ID',
    params: { id: z.string() },
    execute: async (client, args) => {
      const issue = await client.issue(args.id)
      return { content: [{ type: 'text', text: JSON.stringify(issue) }] }
    },
  }),
  tool({
    name: 'list_issues',
    description: 'List all issues with optional filters',
    params: {
      assigneeId: IdComparatorSchema.optional().describe('Filter by assignee ID'),
      stateId: IdComparatorSchema.optional().describe('Filter by workflow state ID'),
      dueDate: DateComparatorSchema.optional().describe('Filter by due date'),
      creatorId: IdComparatorSchema.optional().describe('Filter by creator ID'),
      cycleId: IdComparatorSchema.optional().describe('Filter by cycle ID'),
      parentId: IdComparatorSchema.optional().describe('Filter by parent issue ID'),
      projectId: IdComparatorSchema.optional().describe('Filter by project ID'),
      teamId: IdComparatorSchema.optional().describe('Filter by team ID'),
      labelId: IdComparatorSchema.optional().describe('Filter by label ID(s) - Note: API might expect IssueLabelFilter for complex logic'),
      priority: NumberComparatorSchema.optional().describe('Filter by priority number (0-4)'),
      createdAt: DateComparatorSchema.optional().describe('Filter by creation date'),
      updatedAt: DateComparatorSchema.optional().describe('Filter by last update date'),
      title: StringComparatorSchema.optional().describe('Filter by issue title'),
      identifier: StringComparatorSchema.optional().describe('Filter by issue identifier (e.g., "ENG-123")'),
      number: NumberComparatorSchema.optional().describe('Filter by issue number'),
      branchName: StringComparatorSchema.optional().describe('Filter by branch name'),
    },
    execute: async (client, args) => {
      const filter: Record<string, any> = {}
      if (args.assigneeId) filter.assigneeId = args.assigneeId
      if (args.stateId) filter.stateId = args.stateId
      if (args.dueDate) filter.dueDate = args.dueDate
      if (args.creatorId) filter.creatorId = args.creatorId
      if (args.cycleId) filter.cycleId = args.cycleId
      if (args.parentId) filter.parentId = args.parentId
      if (args.projectId) filter.projectId = args.projectId
      if (args.teamId) filter.teamId = args.teamId
      if (args.labelId) filter.labels = { id: args.labelId }
      if (args.priority) filter.priority = args.priority
      if (args.createdAt) filter.createdAt = args.createdAt
      if (args.updatedAt) filter.updatedAt = args.updatedAt
      if (args.title) filter.title = args.title
      if (args.identifier) filter.identifier = args.identifier
      if (args.number) filter.number = args.number
      if (args.branchName) filter.branchName = args.branchName

      const issues = await client.issues({ filter })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(z.array(IssueSchema).parse(issues.nodes)),
          },
        ],
      }
    },
  }),
  tool({
    name: 'search_issue',
    description: 'Search issues given a query string',
    params: { query: z.string() },
    execute: async (client, args) => {
      const issues = await client.searchIssues(args.query)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(z.array(IssueSchema).parse(issues.nodes)),
          },
        ],
      }
    },
  }),
  tool({
    name: 'create_issue',
    description: 'Create an issue',
    params: IssueMutationSchema.shape,
    execute: async (client, args) => {
      const issue = await client.createIssue({
        title: args.title,
        description: args.description,
        assigneeId: args.assigneeId,
        cycleId: args.cycleId,
        parentId: args.parentId,
        projectMilestoneId: args.projectMilestoneId,
        teamId: args.teamId,
        stateId: args.stateId,
        projectId: args.projectId,
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(IssueSchema.parse(issue.issue)),
          },
        ],
      }
    },
  }),
  tool({
    name: 'update_issue',
    description: 'Update an issue',
    params: IssueMutationSchema.partial().extend({ id: z.string() }).shape,
    execute: async (client, args) => {
      const { id, ...rest } = args
      const issue = await client.updateIssue(id, rest)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issue.success),
          },
        ],
      }
    },
  }),
]
