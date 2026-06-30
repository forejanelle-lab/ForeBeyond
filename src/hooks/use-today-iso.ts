"use client";

import { useEffect, useState } from "react";

/** Client-local today (YYYY-MM-DD). Starts empty so SSR and hydration match. */
export function useTodayIso() {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  return today;
}
