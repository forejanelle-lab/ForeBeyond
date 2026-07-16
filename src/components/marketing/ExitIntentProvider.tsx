"use client";

import { useCallback, useState } from "react";
import { ExitIntentModal } from "@/components/marketing/ExitIntentModal";
import { useExitIntent } from "@/hooks/useExitIntent";

interface ExitIntentProviderProps {
  isLoggedIn: boolean;
}

export function ExitIntentProvider({ isLoggedIn }: ExitIntentProviderProps) {
  const [open, setOpen] = useState(false);

  const handleTrigger = useCallback(() => {
    setOpen(true);
  }, []);

  useExitIntent({
    isLoggedIn,
    onTrigger: handleTrigger,
  });

  return <ExitIntentModal open={open} onClose={() => setOpen(false)} />;
}
