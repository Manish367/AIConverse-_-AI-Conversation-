import { useState } from "react";

export default function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(null);

  const copy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), timeout);
  };

  return [copied, copy];
}

  