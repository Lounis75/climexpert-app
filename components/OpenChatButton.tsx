"use client";

import { ReactNode } from "react";

interface Props {
  className?: string;
  children: ReactNode;
  topic?: string;
}

export default function OpenChatButton({ className, children, topic }: Props) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-chat", topic ? { detail: { topic } } : undefined))}
      className={className}
    >
      {children}
    </button>
  );
}
