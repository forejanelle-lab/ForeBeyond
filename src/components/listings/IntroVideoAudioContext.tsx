"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface IntroVideoAudioContextValue {
  unmutedId: string | null;
  setUnmutedId: (id: string | null) => void;
}

const IntroVideoAudioContext = createContext<IntroVideoAudioContextValue>({
  unmutedId: null,
  setUnmutedId: () => {},
});

export function useIntroVideoAudio() {
  return useContext(IntroVideoAudioContext);
}

export function SearchResultsAudioScope({ children }: { children: ReactNode }) {
  const [unmutedId, setUnmutedId] = useState<string | null>(null);

  return (
    <IntroVideoAudioContext.Provider value={{ unmutedId, setUnmutedId }}>
      {children}
    </IntroVideoAudioContext.Provider>
  );
}
