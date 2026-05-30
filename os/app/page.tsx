"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ActivityTicker } from "@/components/widgets/ActivityTicker";
import { CanvasHost } from "@/components/widgets/CanvasHost";
import { ToolTrace } from "@/components/widgets/ToolTrace";
import {
  canvasStore,
  executeCanvasTool,
  getCanvasStateForAgent,
  type PendingCall,
  type ToolCallTrace,
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
};

const EXAMPLES = [
  "Plan a 25-person birthday party in 4 weeks.",
  "Plan a 10-day September trip that feels intentional.",
  "Set up a launch checklist for a small product release.",
];

function createChatSpace(): ChatSpace {
  return {
    id: crypto.randomUUID(),
    title: "Untitled space",
    messages: [],
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
  const [activeSpace, setActiveSpace] = useState<ChatSpace>(() =>
    createChatSpace(),
  );
  const abortRef = useRef<AbortController | null>(null);

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

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    canvasStore.resetCanvas();
    setIntent("");
    setReply("");
    setTraces([]);
    setPending([]);
    setError("");
    setIsStreaming(false);
    setActiveSpace(createChatSpace());
  }, []);

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
            break;
          case "canvas_tool.call":
            canvasCalls.push(event.call);
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

      const userMessage = createChatMessage("user", trimmed);
      const conversation = activeSpace.messages.map(({ role, content }) => ({
        role,
        content,
      }));
      const nextTitle =
        activeSpace.messages.length === 0
          ? trimmed.slice(0, 64)
          : activeSpace.title;
      setActiveSpace((space) => ({
        ...space,
        title: space.messages.length === 0 ? nextTitle : space.title,
        messages: [...space.messages, userMessage],
      }));

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
            space: {
              id: activeSpace.id,
              title: nextTitle,
            },
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
          setActiveSpace((space) => ({
            ...space,
            messages: [...space.messages, assistantMessage],
          }));
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
    [activeSpace, runStream],
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
    activeSpace.messages.length > 0 ||
    traces.length > 0 ||
    pending.length > 0;

  return (
    <main className="min-h-screen px-4 py-12">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Fluid OS
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              State your intent.
            </h1>
            <p className="text-sm text-muted-foreground">
              The agent assembles a workspace from modular tools.
            </p>
          </div>
          {hasResult ? (
            <Button
              type="button"
              variant="ghost"
              onClick={reset}
              aria-label="Start over"
            >
              <RotateCcw aria-hidden />
              New intent
            </Button>
          ) : null}
        </header>

        <Card className="fluid-enter">
          <CardHeader>
            <CardTitle className="text-base">What do you want to do?</CardTitle>
            <CardDescription>
              {catalog.length > 0
                ? `${catalog.length} tools available via Soda Straw.`
                : "Try an example or describe your own."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => setIntent(example)}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <Textarea
                aria-label="Intent"
                placeholder="Describe what you want to accomplish..."
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={3}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="min-h-5 text-sm text-destructive">{error}</p>
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
          </CardContent>
        </Card>

        {!hasResult && catalog.length > 0 ? (
          <div className="fluid-enter flex flex-wrap gap-1.5">
            {catalog.map((entry) => (
              <span
                key={entry.name}
                title={entry.description}
                className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {entry.name}
              </span>
            ))}
          </div>
        ) : null}

        <ActivityTicker
          pending={pending}
          traces={traces}
          isStreaming={isStreaming}
        />

        {activeSpace.messages.length > 0 || reply ? (
          <Card className="fluid-enter">
            <CardHeader>
              <CardTitle className="text-base">{activeSpace.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSpace.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[85%] rounded-md border border-border bg-muted px-3 py-2 text-sm"
                  }
                >
                  <p className="whitespace-pre-wrap leading-6">
                    {message.content}
                  </p>
                </div>
              ))}
              {reply && isStreaming ? (
                <div className="max-w-[85%] rounded-md border border-border bg-muted px-3 py-2 text-sm">
                  <p className="whitespace-pre-wrap leading-6">{reply}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="fluid-enter">
          <CanvasHost />
        </div>

        <ToolTrace traces={traces} />
      </section>
    </main>
  );
}
