"use client";

import React, { useState, useCallback } from "react";
import FileEmbedder from "./file-embedder";
import useChatStore from "@/hooks/useChatStore";
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Document } from "langchain/document";
import { FileText, X } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { PaperclipIcon } from "lucide-react";
import { toast } from "sonner";
import useMemoryStore from "@/hooks/useMemoryStore";

export default function FileLoader({
  setFileText,
  files,
  setFiles,
}: {
  setFileText: any;
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
}) {
  const chatId = useMemoryStore((state) => state.chatId);

  const readFileContent = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Resolve with the text content
        // Save as a document
        const document = new Document({
          pageContent: reader.result as string,
          metadata: {
            title: file.name,
            fileType: file.type,
          },
        });
        resolve([document]);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleEmbed = async (files: File[]) => {
    const existingFile = localStorage.getItem(`chatFile_${chatId}`);

    if (!existingFile) {
      if (files && files.length) {
        const file = files[0];
        if (!file) return;

        const fileType = file.type;
        const fileText = await readFileContent(file);

        try {
          switch (fileType) {
            case "application/pdf":
              setFiles(files);
              const blob = new Blob([file]);
              const pdfLoader = new WebPDFLoader(blob);
              const pdfText = await pdfLoader.load();
              setFileText(pdfText);
              localStorage.setItem(`chatFile_${chatId}`, file.name);
              toast.success(
                "PDF embedded successfully. Start asking questions about it."
              );
              break;
            case "text/plain":
            case "text/csv":
              setFiles(files);
              setFileText(fileText as string);
              localStorage.setItem(`chatFile_${chatId}`, file.name);
              toast.success(
                "File embedded successfully. Start asking questions about it."
              );
              break;
            default:
              setFiles(files);
              setFileText(fileText as string);
              localStorage.setItem(`chatFile_${chatId}`, file.name);
              toast.success(
                "File embedded successfully. Start asking questions about it."
              );
              break;
          }
        } catch (error) {
          console.error("Error embedding file:", error);
          toast.error("Failed to embed file. Please try again.");
          setFiles(undefined);
        }
      }
    } else {
      toast.error("You can only upload one file for each chat/session. Start a new chat to upload another file.");
    }
  };

  return (
    <div>
      {!files ? (
        <FileEmbedder handleEmbed={handleEmbed} />
      ) : (
        <Button
          disabled={files.length > 0}
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
        >
          <PaperclipIcon className="w-5 h-5 " />
        </Button>
      )}
    </div>
  );
}
