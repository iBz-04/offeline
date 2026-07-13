"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { PaperclipIcon } from "@econic";

interface FileEmbedderProps {
  handleEmbed: (acceptedFiles: File[]) => void;
}

const FileEmbedder: React.FC<FileEmbedderProps> = ({ handleEmbed }) => {
  // Only allow standard document types
  const allowedExtensions = [
    ".pdf", ".md", ".docx", ".txt", ".csv", ".rtf"
  ];

  const fileValidator = (file: File) => {
    const extension = file.name.slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      return {
        code: "file-invalid-type",
        message: `Only PDF, Markdown, DOCX, TXT, CSV, and RTF files are allowed.`
      };
    }
    return null;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleEmbed(acceptedFiles);
    },
    [handleEmbed]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    validator: fileValidator,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/rtf': ['.rtf'],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10 MB
  });

  return (
    <div className="relative">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button type='button' variant="ghost" size="icon" className="rounded-full shrink-0">
          <PaperclipIcon className="w-5 h-5" />
        </Button>
      </div>
      <span className="pointer-events-none absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-3.5 px-1 text-[8px] font-semibold leading-none rounded-full bg-green-600 text-white">
        BETA
      </span>
    </div>
  );
};

export default FileEmbedder;
