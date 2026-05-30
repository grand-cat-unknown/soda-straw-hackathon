"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  getNumber,
  getString,
  isRecord,
  WidgetItem,
  WidgetMeta,
} from "@/components/widgets/widget-utils";

export function SearchWidget({ input, emitOutput, runAction }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const markers = asRecords(input.markers);
  const seedQuery = getString(result, "query") ?? getString(input, "query") ?? "";
  const [query, setQuery] = useState(seedQuery);
  const [searchResult, setSearchResult] = useState<Record<string, unknown> | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const markerContext = useMemo(() => markers.map(markerSearchContext).filter(Boolean), [markers]);
  const results = asRecords(result.results).length
    ? asRecords(result.results)
    : asRecords(searchResult?.results).length
      ? asRecords(searchResult?.results)
      : asRecords(input.results);

  useEffect(() => {
    if (seedQuery) setQuery(seedQuery);
  }, [seedQuery]);

  async function submitSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setSearchError(null);
    setIsSearching(true);
    try {
      const output = await runAction("searchWeb", {
        query: buildSearchQuery(trimmedQuery, markerContext),
        num_results: 8,
      });
      setSearchResult(isRecord(output) ? output : null);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  if (results.length === 0) {
    return (
      <div className="space-y-3">
        <SearchControls
          query={query}
          markersCount={markers.length}
          isSearching={isSearching}
          error={searchError}
          onQueryChange={setQuery}
          onSubmit={() => void submitSearch()}
        />
        <EmptyWidget icon={<Search className="h-4 w-4" aria-hidden />}>
          No search results yet.
        </EmptyWidget>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SearchControls
        query={query}
        markersCount={markers.length}
        isSearching={isSearching}
        error={searchError}
        onQueryChange={setQuery}
        onSubmit={() => void submitSearch()}
      />
      {query ? (
        <div className="text-sm text-muted-foreground">
          Results for <span className="font-medium text-foreground">{query}</span>
        </div>
      ) : null}
      <div className="space-y-2">
        {results.map((item, index) => {
          const url = getString(item, "url");
          return (
            <WidgetItem
              key={url ?? getString(item, "title") ?? `result:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="break-words text-sm font-medium">
                    {getString(item, "title") ?? `Result ${index + 1}`}
                  </div>
                  <WidgetMeta
                    items={[
                      getString(item, "source"),
                      getString(item, "published_date"),
                      getNumber(item, "score") !== undefined
                        ? `Score ${getNumber(item, "score")?.toFixed(3)}`
                        : undefined,
                    ]}
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  {url ? (
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Use URL"
                      title="Use URL"
                      onClick={() => emitOutput("url", url)}
                    >
                      <ExternalLink aria-hidden />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => emitOutput("selectedResult", item)}
                  >
                    Select
                  </Button>
                </div>
              </div>
              {getString(item, "snippet") ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {getString(item, "snippet")}
                </p>
              ) : null}
              {url ? (
                <div className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {url}
                </div>
              ) : null}
            </WidgetItem>
          );
        })}
      </div>
    </div>
  );
}

function SearchControls({
  query,
  markersCount,
  isSearching,
  error,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  markersCount: number;
  isSearching: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 gap-1 text-xs text-muted-foreground">
          Query
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSubmit();
            }}
            placeholder="Find bars closest to these markers"
            className="h-8 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          />
        </label>
        <Button type="button" size="sm" onClick={onSubmit} disabled={isSearching}>
          {isSearching ? "Searching" : "Search"}
        </Button>
      </div>
      {markersCount > 0 ? (
        <div className="text-xs text-muted-foreground">
          Using {markersCount} map marker{markersCount === 1 ? "" : "s"} as location context.
        </div>
      ) : null}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  );
}

function buildSearchQuery(query: string, markerContext: string[]): string {
  if (markerContext.length === 0) return query;
  return `${query}. Use these marker locations as the location context: ${markerContext.join("; ")}. Prioritize nearby places.`;
}

function markerSearchContext(marker: Record<string, unknown>): string {
  const label = getString(marker, "label") ?? getString(marker, "name") ?? getString(marker, "id");
  const city = getString(marker, "city");
  const lat = getNumber(marker, "lat");
  const lng = getNumber(marker, "lng");
  const parts = [
    label,
    city,
    lat !== undefined && lng !== undefined ? `${lat},${lng}` : undefined,
  ].filter(Boolean);
  return parts.join(" ");
}
