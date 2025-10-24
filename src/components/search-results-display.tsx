"use client";

import { SearchResult } from "@/lib/duckduckgo";
import { ExternalLink } from "lucide-react";
import { Card } from "./ui/card";

interface SearchResultsDisplayProps {
  results: SearchResult[];
}

export default function SearchResultsDisplay({ results }: SearchResultsDisplayProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4 px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <ExternalLink className="h-4 w-4" />
        <span>Search Results ({results.length})</span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {results.map((result, index) => (
          <Card
            key={index}
            className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => window.open(result.url, '_blank')}
          >
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0 mt-0.5">
                [{index + 1}]
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-1 mb-1">
                  {result.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                  {result.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <span className="truncate">{new URL(result.url).hostname}</span>
                  {result.publishedDate && (
                    <>
                      <span>•</span>
                      <span>{new Date(result.publishedDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
