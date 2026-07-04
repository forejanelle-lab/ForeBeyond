"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE, parseLanguageCode } from "@/lib/languages";

function getBrowserLanguageSnapshot(): string {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  return parseLanguageCode(navigator.language);
}

function subscribeToBrowserLanguage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => onStoreChange();
  window.addEventListener("languagechange", handleChange);
  return () => window.removeEventListener("languagechange", handleChange);
}

/** Browser UI language for user-content translation (not site locale). */
export function useBrowserLanguage(): string {
  return useSyncExternalStore(
    subscribeToBrowserLanguage,
    getBrowserLanguageSnapshot,
    () => DEFAULT_LANGUAGE
  );
}
