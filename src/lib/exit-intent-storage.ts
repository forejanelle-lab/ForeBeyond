export const EXIT_INTENT_SESSION_SHOWN_KEY = "forebeyond-exit-intent-shown";
export const EXIT_INTENT_LOCAL_SUBMITTED_KEY = "forebeyond-exit-intent-submitted";
export const EXIT_INTENT_SESSION_VISIT_KEY = "forebeyond-exit-intent-first-visit";

export function markExitIntentShown() {
  sessionStorage.setItem(EXIT_INTENT_SESSION_SHOWN_KEY, "1");
}

export function markExitIntentSubmitted() {
  sessionStorage.setItem(EXIT_INTENT_SESSION_SHOWN_KEY, "1");
  localStorage.setItem(EXIT_INTENT_LOCAL_SUBMITTED_KEY, "1");
}

export function canShowExitIntent(isLoggedIn: boolean): boolean {
  if (isLoggedIn) return false;
  if (sessionStorage.getItem(EXIT_INTENT_SESSION_SHOWN_KEY)) return false;
  if (localStorage.getItem(EXIT_INTENT_LOCAL_SUBMITTED_KEY)) return false;
  if (!sessionStorage.getItem(EXIT_INTENT_SESSION_VISIT_KEY)) {
    sessionStorage.setItem(EXIT_INTENT_SESSION_VISIT_KEY, "1");
  }
  return true;
}

export function isExitIntentBlockedPath(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/settings")
  );
}
