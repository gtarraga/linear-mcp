import type { LinearClient } from "@linear/sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape, ZodTypeAny } from "zod";
import { z } from "zod";

export function tool<Args extends undefined | ZodRawShape = undefined>({
  name,
  description,
  params = {},
  execute,
}: {
  name: string;
  description: string;
  params?: Args;
  execute: (
    client: LinearClient,
    args: Args extends ZodRawShape ? z.objectOutputType<Args, ZodTypeAny> : undefined,
  ) => CallToolResult | Promise<CallToolResult>;
}) {
  return { name, description, params, execute };
}

export type Tool = ReturnType<typeof tool>;

// export declare type NullableTimelessDateComparator = {
//     /** Equals constraint. */
//     eq?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** Greater-than constraint. Matches any values that are greater than the given value. */
//     gt?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** Greater-than-or-equal constraint. Matches any values that are greater than or equal to the given value. */
//     gte?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** In-array constraint. */
//     in?: Maybe<Array<Scalars["TimelessDateOrDuration"]>>;
//     /** Less-than constraint. Matches any values that are less than the given value. */
//     lt?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** Less-than-or-equal constraint. Matches any values that are less than or equal to the given value. */
//     lte?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** Not-equals constraint. */
//     neq?: Maybe<Scalars["TimelessDateOrDuration"]>;
//     /** Not-in-array constraint. */
//     nin?: Maybe<Array<Scalars["TimelessDateOrDuration"]>>;
//     /** Null constraint. Matches any non-null values if the given value is false, otherwise it matches null values. */
//     null?: Maybe<Scalars["Boolean"]>;
// };

export const DateComparatorSchema = z.object({
  eq: z.string().nullish(),
  ne: z.string().nullish(),
  gt: z.string().nullish(),
  gte: z.string().nullish(),
  in: z.array(z.string()).nullish(),
  lt: z.string().nullish(),
  lte: z.string().nullish(),
  nin: z.array(z.string()).nullish(),
  null: z.boolean().nullish(),
});

export const StringComparatorSchema = z.object({
  contains: z.string().nullish(),
  containsIgnoreCase: z.string().nullish(),
  containsIgnoreCaseAndAccent: z.string().nullish(),
  endsWith: z.string().nullish(),
  eq: z.string().nullish(),
  eqIgnoreCase: z.string().nullish(),
  in: z.array(z.string()).nullish(),
  neq: z.string().nullish(),
  neqIgnoreCase: z.string().nullish(),
  nin: z.array(z.string()).nullish(),
  notContains: z.string().nullish(),
  notContainsIgnoreCase: z.string().nullish(),
  notEndsWith: z.string().nullish(),
  notStartsWith: z.string().nullish(),
  startsWith: z.string().nullish(),
  startsWithIgnoreCase: z.string().nullish(),
});

export const IdComparatorSchema = z.object({
  eq: z.string().optional(),
  ne: z.string().optional(),
  in: z.array(z.string()).optional(),
  nin: z.array(z.string()).optional(),
});

export const NumberComparatorSchema = z.object({
  eq: z.number().nullish(),
  neq: z.number().nullish(),
  gt: z.number().nullish(),
  gte: z.number().nullish(),
  lt: z.number().nullish(),
  lte: z.number().nullish(),
  in: z.array(z.number()).nullish(),
  nin: z.array(z.number()).nullish(),
  null: z.boolean().nullish(),
});
