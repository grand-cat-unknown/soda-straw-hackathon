"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReply("");

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Type something first.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "The model did not respond.");
      }

      setReply(data.reply ?? "");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-10 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">Basic chat</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ask anything</CardTitle>
            <CardDescription>One prompt, one reply.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <Textarea
                aria-label="Message"
                placeholder="Write a quick prompt..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="min-h-5 text-sm text-destructive">{error}</p>
                <Button disabled={isLoading} type="submit">
                  <Send aria-hidden="true" />
                  {isLoading ? "Sending" : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {reply ? (
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6">{reply}</p>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
