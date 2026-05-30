// Trace-to-widget auto-materialization has been removed.
// Widgets are now created exclusively by the agent via the `canvas_*`
// mutation tools (see lib/workspace/canvas-tools.ts), which dispatch
// through `widgetContracts`. There is no longer any code outside
// `components/widgets/*` that maps tool outputs to specific widget types.
export {};
