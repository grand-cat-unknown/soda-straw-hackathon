"use client";

import { Calculator, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";

type RankedOption = {
  option?: Record<string, unknown>;
  score?: number;
  breakdown?: Record<string, number>;
};

type CalculatorInput = {
  result?: unknown;
  value?: unknown;
  expression?: unknown;
  ranked?: unknown;
};

export function CalculatorWidget({
  input,
  emitOutput,
}: WidgetComponentProps<CalculatorInput>) {
  const result = normalizeResult(input);
  const ranked = getRanked(result, input);
  const value = getNumber(result, "value") ?? getNumber(input, "value");
  const expression = getString(result, "expression") ?? getString(input, "expression");

  if (value === undefined && ranked.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calculator className="h-4 w-4" aria-hidden />
        No calculator result yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {value !== undefined ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-3xl font-semibold tabular-nums">
                {formatNumber(value)}
              </div>
              {expression ? (
                <div className="mt-1 break-words font-mono text-xs text-muted-foreground">
                  {expression}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => emitOutput("value", value)}
              >
                Use value
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => emitOutput("result", result)}
              >
                Emit result
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {ranked.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="h-4 w-4" aria-hidden />
            Ranked options
          </div>
          <div className="space-y-2">
            {ranked.map((item, index) => {
              const option = item.option ?? {};
              const label = optionLabel(option, index);
              return (
                <div
                  key={`${label}:${index}`}
                  className="rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="break-words text-sm font-medium">
                        {index + 1}. {label}
                      </div>
                      {typeof item.score === "number" ? (
                        <div className="text-xs text-muted-foreground">
                          Score {formatNumber(item.score)}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => emitOutput("selectedOption", item)}
                    >
                      Select
                    </Button>
                  </div>
                  {item.breakdown ? (
                    <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      {Object.entries(item.breakdown).map(([key, contribution]) => (
                        <div key={key} className="flex justify-between gap-3">
                          <dt className="truncate">{key}</dt>
                          <dd className="font-mono tabular-nums">
                            {formatNumber(contribution)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function normalizeResult(input: CalculatorInput): Record<string, unknown> {
  if (isRecord(input.result)) return input.result;
  return input as Record<string, unknown>;
}

function getRanked(
  result: Record<string, unknown>,
  input: CalculatorInput,
): RankedOption[] {
  const ranked = Array.isArray(result.ranked) ? result.ranked : input.ranked;
  if (!Array.isArray(ranked)) return [];
  return ranked.filter(isRecord).map((item) => ({
    option: isRecord(item.option) ? item.option : undefined,
    score: typeof item.score === "number" ? item.score : undefined,
    breakdown: isNumberRecord(item.breakdown) ? item.breakdown : undefined,
  }));
}

function getNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "number");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);
}

function optionLabel(option: Record<string, unknown>, index: number): string {
  const name = option.name ?? option.title ?? option.label;
  return typeof name === "string" && name.trim().length > 0
    ? name
    : `Option ${index + 1}`;
}
