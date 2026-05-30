"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlanCard } from "@/components/chat/PlanCard";
import { ActivityTicker } from "@/components/widgets/ActivityTicker";
import { CanvasHost } from "@/components/widgets/CanvasHost";
import { ToolTrace } from "@/components/widgets/ToolTrace";
import {
  canvasStore,
  executeCanvasTool,
  getCanvasStateForAgent,
  type CanvasPlan,
  type CanvasPlanBridge,
  type CanvasPlanWidget,
  type PendingCall,
  type ToolAction,
  type ToolBinding,
  type ToolCallTrace,
  type WidgetInput,
} from "@/lib/workspace";

type CanvasToolCall = {
  call_id: string;
  name: string;
  arguments: unknown;
};

type StreamEvent =
  | { type: "text.delta"; delta: string }
  | { type: "tool.start"; id: string; name: string; server_label: string }
  | { type: "tool.done"; trace: ToolCallTrace }
  | { type: "canvas_tool.call"; call: CanvasToolCall }
  | { type: "response.id"; id: string }
  | { type: "awaiting_canvas_tools"; response_id: string }
  | { type: "done" }
  | { type: "error"; message: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatSpace = {
  id: string;
  title: string;
  messages: ChatMessage[];
  plans: CanvasPlan[];
  createdAt: number;
  updatedAt: number;
};

function planFromArgs(args: unknown): CanvasPlan | null {
  if (!args || typeof args !== "object") return null;
  const raw = args as {
    intent?: unknown;
    widgets?: unknown;
    bridges?: unknown;
    notes?: unknown;
  };
  if (typeof raw.intent !== "string") return null;
  if (!Array.isArray(raw.widgets) || !Array.isArray(raw.bridges)) return null;

  const widgets: CanvasPlanWidget[] = raw.widgets
    .map((w) => {
      if (!w || typeof w !== "object") return null;
      const v = w as {
        id?: unknown;
        type?: unknown;
        title?: unknown;
        rationale?: unknown;
      };
      if (
        typeof v.id !== "string" ||
        typeof v.type !== "string" ||
        typeof v.title !== "string" ||
        typeof v.rationale !== "string"
      ) {
        return null;
      }
      return {
        id: v.id,
        type: v.type,
        title: v.title,
        rationale: v.rationale,
      };
    })
    .filter((w): w is CanvasPlanWidget => w !== null);

  const bridges: CanvasPlanBridge[] = raw.bridges
    .map((b): CanvasPlanBridge | null => {
      if (!b || typeof b !== "object") return null;
      const v = b as {
        from?: { node_id?: unknown; port?: unknown };
        to?: { node_id?: unknown; port?: unknown };
        transform?: unknown;
        rationale?: unknown;
      };
      if (
        !v.from ||
        !v.to ||
        typeof v.from.node_id !== "string" ||
        typeof v.from.port !== "string" ||
        typeof v.to.node_id !== "string" ||
        typeof v.to.port !== "string" ||
        typeof v.rationale !== "string"
      ) {
        return null;
      }
      return {
        from: { nodeId: v.from.node_id, port: v.from.port },
        to: { nodeId: v.to.node_id, port: v.to.port },
        transform: typeof v.transform === "string" ? v.transform : undefined,
        rationale: v.rationale,
      };
    })
    .filter((b): b is CanvasPlanBridge => b !== null);

  return {
    id: crypto.randomUUID(),
    intent: raw.intent,
    widgets,
    bridges,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}

function plannedBridgeKey(bridge: CanvasPlanBridge): string {
  return [
    bridge.from.nodeId,
    bridge.from.port,
    bridge.to.nodeId,
    bridge.to.port,
    bridge.transform ?? "identity",
  ].join("::");
}

function plannedBridgeExists(bridge: CanvasPlanBridge): boolean {
  return Object.values(canvasStore.getState().edges).some(
    (edge) =>
      edge.from.nodeId === bridge.from.nodeId &&
      edge.from.port === bridge.from.port &&
      edge.to.nodeId === bridge.to.nodeId &&
      edge.to.port === bridge.to.port,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function materializeCanvasRender(output: unknown): boolean {
  const canvas = isRecord(output) && isRecord(output.output) ? output.output : output;
  if (!isRecord(canvas)) return false;
  const widgets = Array.isArray(canvas.widgets) ? canvas.widgets : [];
  const bridges = Array.isArray(canvas.bridges) ? canvas.bridges : [];
  if (widgets.length === 0) return false;

  for (const widget of widgets) {
    if (!isRecord(widget)) continue;
    if (
      typeof widget.id !== "string" ||
      typeof widget.type !== "string" ||
      typeof widget.title !== "string"
    ) {
      continue;
    }
    canvasStore.addWidget({
      id: widget.id,
      type: widget.type,
      title: widget.title,
      input: isRecord(widget.input) ? (widget.input as WidgetInput) : {},
      bindings: isRecord(widget.bindings)
        ? (widget.bindings as Record<string, ToolBinding>)
        : undefined,
      actions: isRecord(widget.actions)
        ? (widget.actions as Record<string, ToolAction>)
        : undefined,
      source: "agent",
    });
  }

  for (const bridge of bridges) {
    if (!isRecord(bridge) || !isRecord(bridge.from) || !isRecord(bridge.to)) {
      continue;
    }
    const from = bridge.from as Record<string, unknown>;
    const to = bridge.to as Record<string, unknown>;
    if (
      typeof from.node_id !== "string" ||
      typeof from.port !== "string" ||
      typeof to.node_id !== "string" ||
      typeof to.port !== "string"
    ) {
      continue;
    }
    canvasStore.addBridge({
      id: typeof bridge.id === "string" ? bridge.id : undefined,
      from: { nodeId: from.node_id, port: from.port },
      to: { nodeId: to.node_id, port: to.port },
      transform: typeof bridge.transform === "string" ? bridge.transform : undefined,
      createdBy: "agent",
    });
  }

  return true;
}

function isCanvasRenderTrace(trace: ToolCallTrace): boolean {
  return (
    trace.name === "canvas.render" ||
    trace.name.endsWith("_canvas_render") ||
    trace.name.endsWith("canvas_render")
  );
}

const EXAMPLES = [
  "Plan a 25-person birthday party in 4 weeks.",
  "Plan a 10-day September trip that feels intentional.",
  "Set up a launch checklist for a small product release.",
];

function createChatSpace(): ChatSpace {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New space",
    messages: [],
    plans: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createChatMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export default function Home() {
  const [intent, setIntent] = useState("");
  const [reply, setReply] = useState("");
  const [traces, setTraces] = useState<ToolCallTrace[]>([]);
  const [pending, setPending] = useState<PendingCall[]>([]);
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [catalog, setCatalog] = useState<{ name: string; description: string }[]>(
    [],
  );
  const [spaces, setSpaces] = useState<ChatSpace[]>(() => [createChatSpace()]);
  const [activeSpaceId, setActiveSpaceId] = useState(() => spaces[0]?.id ?? "");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeSpaceIdRef = useRef(activeSpaceId);
  const plannedBridgesRef = useRef<CanvasPlanBridge[]>([]);
  const settledPlannedBridgeKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);

  const activeSpace = useMemo(
    () => spaces.find((space) => space.id === activeSpaceId) ?? spaces[0],
    [activeSpaceId, spaces],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data: { catalog?: { name: string; description: string }[] }) => {
        if (!cancelled && Array.isArray(data.catalog)) setCatalog(data.catalog);
      })
      .catch(() => {
        // best-effort; the catalog is decorative
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearWorkspace = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    plannedBridgesRef.current = [];
    settledPlannedBridgeKeysRef.current = new Set();
    canvasStore.resetCanvas();
    setIntent("");
    setReply("");
    setTraces([]);
    setPending([]);
    setError("");
    setIsStreaming(false);
  }, []);

  const materializePlannedBridges = useCallback(() => {
    const plannedBridges = plannedBridgesRef.current;
    if (plannedBridges.length === 0) return;

    for (const bridge of plannedBridges) {
      const key = plannedBridgeKey(bridge);
      if (settledPlannedBridgeKeysRef.current.has(key)) continue;

      const state = canvasStore.getState();
      if (!state.nodes[bridge.from.nodeId] || !state.nodes[bridge.to.nodeId]) {
        continue;
      }

      if (plannedBridgeExists(bridge)) {
        settledPlannedBridgeKeysRef.current.add(key);
        continue;
      }

      const args = {
        from: { node_id: bridge.from.nodeId, port: bridge.from.port },
        to: { node_id: bridge.to.nodeId, port: bridge.to.port },
        ...(bridge.transform ? { transform: bridge.transform } : {}),
      };
      const output = executeCanvasTool("canvas_add_bridge", args);
      settledPlannedBridgeKeysRef.current.add(key);
      setTraces((prev) => [
        ...prev,
        {
          id: `auto:${crypto.randomUUID()}`,
          server_label: "canvas",
          name: "canvas_add_bridge",
          arguments: { ...args, source: "planned_bridge" },
          output,
          error: null,
        },
      ]);
    }
  }, []);

  const reset = useCallback(() => {
    const nextSpace = createChatSpace();
    clearWorkspace();
    setSpaces([nextSpace]);
    setActiveSpaceId(nextSpace.id);
  }, [clearWorkspace]);

  const createSpace = useCallback(() => {
    const nextSpace = createChatSpace();
    clearWorkspace();
    setSpaces((current) => [nextSpace, ...current]);
    setActiveSpaceId(nextSpace.id);
    setChatCollapsed(false);
  }, [clearWorkspace]);

  const selectSpace = useCallback(
    (spaceId: string) => {
      if (spaceId === activeSpaceId) return;
      clearWorkspace();
      setActiveSpaceId(spaceId);
      setChatCollapsed(false);
    },
    [activeSpaceId, clearWorkspace],
  );

  const runStream = useCallback(
    async (
      body: Record<string, unknown>,
      controller: AbortController,
    ): Promise<{
      awaitingResponseId: string | null;
      canvasCalls: CanvasToolCall[];
      text: string;
    }> => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const fallback = await response.json().catch(() => ({}));
        throw new Error(
          (fallback as { error?: string }).error ?? "The model did not respond.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let awaitingResponseId: string | null = null;
      const canvasCalls: CanvasToolCall[] = [];
      let text = "";

      const handle = (event: StreamEvent) => {
        switch (event.type) {
          case "text.delta":
            text += event.delta;
            setReply((prev) => prev + event.delta);
            break;
          case "tool.start":
            setPending((prev) => [
              ...prev,
              {
                id: event.id,
                name: event.name,
                server_label: event.server_label,
              },
            ]);
            break;
          case "tool.done":
            setPending((prev) => prev.filter((p) => p.id !== event.trace.id));
            setTraces((prev) => [...prev, event.trace]);
            if (isCanvasRenderTrace(event.trace)) {
              materializeCanvasRender(event.trace.output);
            }
            break;
          case "canvas_tool.call":
            canvasCalls.push(event.call);
            if (event.call.name === "canvas_announce_plan") {
              const plan = planFromArgs(event.call.arguments);
              if (plan) {
                plannedBridgesRef.current = plan.bridges;
                settledPlannedBridgeKeysRef.current = new Set();
                const targetSpaceId = activeSpaceIdRef.current;
                setSpaces((current) =>
                  current.map((space) =>
                    space.id === targetSpaceId
                      ? {
                          ...space,
                          plans: [...space.plans, plan],
                          updatedAt: Date.now(),
                        }
                      : space,
                  ),
                );
              }
            }
            setTraces((prev) => [
              ...prev,
              {
                id: event.call.call_id,
                server_label: "canvas",
                name: event.call.name,
                arguments: event.call.arguments,
                output: null,
                error: null,
              },
            ]);
            break;
          case "awaiting_canvas_tools":
            awaitingResponseId = event.response_id;
            break;
          case "error":
            setError(event.message);
            break;
          case "response.id":
          case "done":
            break;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          newlineIndex = buffer.indexOf("\n");
          if (!line) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }

          handle(event);
        }
      }

      return { awaitingResponseId, canvasCalls, text };
    },
    [],
  );

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setError("Type an intent first.");
        return;
      }

      setError("");
      setReply("");
      setTraces([]);
      setPending([]);
      setIsStreaming(true);
      setIntent("");

      const userMessage = createChatMessage("user", trimmed);
      const history = activeSpace?.messages ?? [];
      const conversation = history.map(({ role, content }) => ({
        role,
        content,
      }));
      const nextTitle =
        history.length === 0
          ? trimmed.slice(0, 64)
          : activeSpace.title;
      setSpaces((current) =>
        current.map((space) =>
          space.id === activeSpace.id
            ? {
                ...space,
                title: space.messages.length === 0 ? nextTitle : space.title,
                messages: [...space.messages, userMessage],
                updatedAt: Date.now(),
              }
            : space,
        ),
      );

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let assistantText = "";
        let next: {
          awaitingResponseId: string | null;
          canvasCalls: CanvasToolCall[];
          text: string;
        } = await runStream(
          {
            message: trimmed,
            conversation,
            canvas: getCanvasStateForAgent(),
          },
          controller,
        );
        assistantText += next.text;

        let safety = 0;
        while (
          next.awaitingResponseId &&
          next.canvasCalls.length > 0 &&
          safety < 8
        ) {
          safety += 1;
          const outputs = next.canvasCalls.map((call) => {
            const args =
              call.arguments && typeof call.arguments === "object"
                ? (call.arguments as Record<string, unknown>)
                : {};
            const output = executeCanvasTool(call.name, args);
            setTraces((prev) =>
              prev.map((trace) =>
                trace.id === call.call_id ? { ...trace, output } : trace,
              ),
            );
            if (call.name !== "canvas_announce_plan") {
              materializePlannedBridges();
            }
            return { call_id: call.call_id, name: call.name, output };
          });

          next = await runStream(
            {
              previous_response_id: next.awaitingResponseId,
              canvas_tool_outputs: outputs,
            },
            controller,
          );
          assistantText += next.text;
        }

        if (assistantText.trim()) {
          const assistantMessage = createChatMessage(
            "assistant",
            assistantText.trim(),
          );
          setSpaces((current) =>
            current.map((space) =>
              space.id === activeSpace.id
                ? {
                    ...space,
                    messages: [...space.messages, assistantMessage],
                    updatedAt: Date.now(),
                  }
                : space,
            ),
          );
        }
      } catch (caughtError) {
        if ((caughtError as { name?: string })?.name === "AbortError") return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Something went wrong.",
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeSpace, materializePlannedBridges, runStream],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(intent);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit(intent);
    }
  }

  const hasResult =
    reply.length > 0 ||
    Boolean(activeSpace?.messages.length) ||
    traces.length > 0 ||
    pending.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside
        className={`border-r border-border bg-card transition-[width] duration-200 ${
          chatCollapsed ? "w-full lg:w-14" : "w-full lg:w-[400px]"
        }`}
      >
        {chatCollapsed ? (
          <div className="flex items-center gap-2 px-3 py-2 lg:h-screen lg:flex-col lg:px-2 lg:py-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand chat"
              title="Expand chat"
              onClick={() => setChatCollapsed(false)}
            >
              <PanelLeftOpen aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="New space"
              title="New space"
              onClick={createSpace}
            >
              <Plus aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="flex max-h-[72vh] flex-col lg:h-screen lg:max-h-none">
            <header className="border-b border-border px-4 py-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Fluid OS
                  </div>
                  <h1 className="truncate text-lg font-semibold">
                    {activeSpace?.title ?? "New space"}
                  </h1>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="New space"
                    title="New space"
                    onClick={createSpace}
                    disabled={isStreaming}
                  >
                    <Plus aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Collapse chat"
                    title="Collapse chat"
                    onClick={() => setChatCollapsed(true)}
                  >
                    <PanelLeftClose aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => selectSpace(space.id)}
                    disabled={isStreaming}
                    className={`flex max-w-56 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                      space.id === activeSpace?.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    } disabled:opacity-50`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    <span className="truncate">{space.title}</span>
                  </button>
                ))}
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {activeSpace && activeSpace.messages.length > 0 ? (
                <div className="space-y-4">
                  {activeSpace.messages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                  ))}
                  {activeSpace.plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                  {reply && isStreaming ? (
                    <ChatBubble
                      message={{
                        id: "streaming",
                        role: "assistant",
                        content: reply,
                      }}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">What should change?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ask for a workspace, then keep refining it in this space.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        disabled={isStreaming}
                        onClick={() => setIntent(example)}
                        className="rounded-md border border-border bg-muted px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                  {catalog.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {catalog.slice(0, 18).map((entry) => (
                        <span
                          key={entry.name}
                          title={entry.description}
                          className="rounded border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {entry.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <footer className="border-t border-border p-4">
              <ActivityTicker
                pending={pending}
                traces={traces}
                isStreaming={isStreaming}
              />
              {error ? (
                <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
                <Textarea
                  aria-label="Message"
                  placeholder="Ask the agent to build or change the workspace..."
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  rows={3}
                  className="min-h-[92px] resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={reset}
                    disabled={isStreaming || !hasResult}
                  >
                    <RotateCcw aria-hidden />
                    Reset
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      ⌘ + Enter
                    </span>
                    <Button disabled={isStreaming} type="submit">
                      <Send aria-hidden="true" />
                      {isStreaming ? "Working" : "Send"}
                    </Button>
                  </div>
                </div>
              </form>
            </footer>
          </div>
        )}
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-5 lg:px-8">
          <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Workspace
              </div>
              <h2 className="mt-1 truncate text-2xl font-semibold">
                {activeSpace?.title ?? "New space"}
              </h2>
            </div>
            {chatCollapsed ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setChatCollapsed(false)}
              >
                <ChevronRight aria-hidden />
                Chat
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setChatCollapsed(true)}
              >
                <ChevronLeft aria-hidden />
                Hide chat
              </Button>
            )}
          </header>

          <div className="flex-1">
            <CanvasHost />
            {!hasResult ? (
              <div className="flex min-h-[55vh] items-center justify-center rounded-md border border-dashed border-border bg-card px-6 text-center">
                <div className="max-w-md">
                  <h3 className="text-lg font-semibold">No workspace yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start from the chat pane and the agent will assemble the UI
                    here.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <ToolTrace traces={traces} />
        </div>
      </section>
    </main>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-md px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-muted text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap leading-6">{message.content}</p>
      </div>
    </div>
  );
}
