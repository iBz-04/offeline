"use client";
import { CheckIcon, CopyIcon } from "@econic";
import React from "react";
import { CodeBlock, github } from "react-code-blocks";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ButtonCodeblockProps {
  code: string;
  lang: string;
}

export default function CodeDisplayBlock({ code, lang }: ButtonCodeblockProps) {
  const [isCopied, setisCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setisCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => {
      setisCopied(false);
    }, 1500);
  };

  return (
    <div className="relative overflow-scroll overflow-x-scroll  flex flex-col   text-start  ">
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="icon"
        className="h-5 w-5 absolute top-2 right-2"
      >
        {isCopied ? (
          <CheckIcon className="w-4 h-4 scale-100 transition-all" />
        ) : (
          <CopyIcon className="w-4 h-4 scale-100 transition-all" />
        )}
      </Button>
      <CodeBlock
        customStyle={{
          background: "#F3F1EB",
          borderRadius: "1rem",
          padding: "1rem",
        }}
        text={code}
        language="tsx"
        showLineNumbers={false}
        theme={github}
      />
    </div>
  );
}
