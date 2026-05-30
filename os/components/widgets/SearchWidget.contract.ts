import {
  AnySchema,
  StringSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const SearchWidgetContract: WidgetContract = {
  type: "search",
  title: "Search",
  description: "Renders web search result cards.",
  inputs: {
    query: {
      schema: StringSchema,
      description: "Search query.",
      optional: true,
    },
    results: {
      schema: UnknownArraySchema,
      description: "Search results from search.web.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw search capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedResult: {
      schema: UnknownRecordSchema,
      description: "Search result selected by the user.",
    },
    url: {
      schema: StringSchema,
      description: "URL selected from a search result.",
    },
  },
  render: {
    renderer: "search",
    defaultLayout: { x: 0, y: 0, w: 66, h: 5 },
    minLayout: { w: 40, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedResult: "Result selection buttons",
      url: "Use URL buttons",
    },
  },
};
