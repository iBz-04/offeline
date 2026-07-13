"use client";

import useChatStore from "@/hooks/useChatStore";
import WebLLMHelper from "@/lib/web-llm-helper";
import React, { useEffect } from "react";
import { WebLLMContext } from "@/providers/web-llm-context";

export const WebLLMProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const engine = useChatStore((state) => state.engine);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const modelHasChanged = useChatStore((state) => state.modelHasChanged);
  const setModelHasChanged = useChatStore((state) => state.setModelHasChanged);

  const [webLLMHelper] = React.useState(new WebLLMHelper(engine));

  useEffect(() => {
    webLLMHelper.setEngineInstance(engine);
  }, [engine, webLLMHelper]);

  useEffect(() => {
    if (!modelHasChanged) {
      return;
    }

    let isDisposed = false;

    const resetForModelChange = async () => {
      try {
        await webLLMHelper.unload();
      } finally {
        if (!isDisposed) {
          setModelHasChanged(false);
        }
      }
    };

    void resetForModelChange();

    return () => {
      isDisposed = true;
    };
  }, [selectedModel, modelHasChanged, setModelHasChanged, webLLMHelper]);

  return (
    <WebLLMContext.Provider value={webLLMHelper}>
      {children}
    </WebLLMContext.Provider>
  );
};
