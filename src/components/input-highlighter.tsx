"use client";

import React from "react";

interface InputHighlighterProps {
  value: string;
}

export default function InputHighlighter({ value }: InputHighlighterProps) {
  // Match @web, /web, or /search at the start
  const match = value.match(/^(@web|\/web|\/search)\s*/i);
  const hasCommand = !!match;
  const commandText = match ? match[0] : "";
  const restText = match ? value.slice(commandText.length) : value;

  if (!hasCommand) {
    return null;
  }

  return (
    <div className="absolute left-28 top-[22px] pointer-events-none max-h-24 text-sm flex items-start h-16 overflow-hidden whitespace-pre-wrap break-words leading-normal">
      <span className="text-violet-500 font-semibold">
        {commandText}
      </span>
      <span className="text-foreground">{restText}</span>
    </div>
  );
}
