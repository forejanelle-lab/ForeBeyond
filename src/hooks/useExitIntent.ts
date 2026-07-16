"use client";

import { useEffect, useRef } from "react";
import { canShowExitIntent, isExitIntentBlockedPath, markExitIntentShown } from "@/lib/exit-intent-storage";

const ARM_DELAY_MS = 4000;
const MIN_MOUSE_UPWARD_VELOCITY = 0.45;
const MOUSE_TOP_ZONE_PX = 72;
const MIN_SCROLL_DEPTH_PERCENT = 50;
const SCROLL_UP_WINDOW_MS = 350;
const MIN_SCROLL_UP_VELOCITY = 0.6;

interface UseExitIntentOptions {
  isLoggedIn: boolean;
  onTrigger: () => void;
}

export function useExitIntent({ isLoggedIn, onTrigger }: UseExitIntentOptions) {
  const onTriggerRef = useRef(onTrigger);
  const triggeredRef = useRef(false);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (isLoggedIn || triggeredRef.current) return;
    if (!canShowExitIntent(isLoggedIn)) return;
    if (isExitIntentBlockedPath(window.location.pathname)) return;

    let armed = false;
    let lastMouseY = window.innerHeight / 2;
    let lastMouseTime = Date.now();
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    let maxScrollPercent = 0;

    const armTimer = window.setTimeout(() => {
      armed = true;
    }, ARM_DELAY_MS);

    function fireTrigger() {
      if (triggeredRef.current || !armed) return;
      if (!canShowExitIntent(isLoggedIn)) return;

      triggeredRef.current = true;
      markExitIntentShown();
      onTriggerRef.current();
    }

    function updateScrollDepth() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        maxScrollPercent = 100;
        return;
      }
      const percent = (window.scrollY / scrollable) * 100;
      maxScrollPercent = Math.max(maxScrollPercent, percent);
    }

    function onMouseMove(event: MouseEvent) {
      if (!armed) return;

      const now = Date.now();
      const elapsed = now - lastMouseTime;
      if (elapsed <= 0) return;

      const upwardDelta = lastMouseY - event.clientY;
      const velocity = upwardDelta / elapsed;

      if (
        event.clientY <= MOUSE_TOP_ZONE_PX &&
        upwardDelta > 18 &&
        velocity >= MIN_MOUSE_UPWARD_VELOCITY
      ) {
        fireTrigger();
      }

      lastMouseY = event.clientY;
      lastMouseTime = now;
    }

    function onMouseLeave(event: MouseEvent) {
      if (!armed) return;
      if (event.clientY <= 0 && event.relatedTarget == null) {
        fireTrigger();
      }
    }

    function onScroll() {
      updateScrollDepth();

      const now = Date.now();
      const elapsed = now - lastScrollTime;
      const upwardDelta = lastScrollY - window.scrollY;

      if (
        armed &&
        maxScrollPercent >= MIN_SCROLL_DEPTH_PERCENT &&
        upwardDelta > 40 &&
        elapsed > 0 &&
        elapsed <= SCROLL_UP_WINDOW_MS &&
        upwardDelta / elapsed >= MIN_SCROLL_UP_VELOCITY
      ) {
        fireTrigger();
      }

      lastScrollY = window.scrollY;
      lastScrollTime = now;
    }

    updateScrollDepth();

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (hasFinePointer) {
      document.addEventListener("mousemove", onMouseMove, { passive: true });
      document.addEventListener("mouseleave", onMouseLeave);
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      if (hasFinePointer) {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseleave", onMouseLeave);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [isLoggedIn]);
}
