"use client";

import type WebLLMHelper from "@/lib/web-llm-helper";
import React from "react";

export const WebLLMContext = React.createContext<WebLLMHelper | null>(null);

export const useWebLLM = () => {
  const webLLMHelper = React.useContext(WebLLMContext);
  if (!webLLMHelper) {
    throw new Error("useWebLLM must be used within a WebLLMProvider");
  }
  return webLLMHelper;
};
