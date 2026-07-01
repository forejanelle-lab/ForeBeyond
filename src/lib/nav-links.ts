export function isMailtoNavHref(href: string): boolean {
  return href.startsWith("mailto:");
}

export function isExternalNavHref(href: string): boolean {
  return (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}
