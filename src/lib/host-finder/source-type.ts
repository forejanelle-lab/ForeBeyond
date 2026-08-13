import type { HostLeadSourceType } from "@/lib/host-finder/types";

export function inferSourceType(url: string): HostLeadSourceType {
  const lower = url.toLowerCase();
  if (lower.includes("reddit.com")) return "reddit";
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return "facebook";
  if (lower.includes("homestay") || lower.includes("airbnb") || lower.includes("homestays")) {
    return "homestay";
  }
  if (
    lower.includes("exchange") ||
    lower.includes("afs.org") ||
    lower.includes("ef.edu") ||
    lower.includes("ciee.org")
  ) {
    return "exchange_program";
  }
  if (lower.includes("forum") || lower.includes("discourse") || lower.includes("community")) {
    return "forum";
  }
  if (lower.includes("blog") || lower.includes("medium.com") || lower.includes("wordpress")) {
    return "blog";
  }
  return "web";
}

export function sourceTypeLabel(type: HostLeadSourceType): string {
  const labels: Record<HostLeadSourceType, string> = {
    web: "Web",
    reddit: "Reddit",
    facebook: "Facebook",
    forum: "Forum",
    blog: "Blog",
    homestay: "Homestay Website",
    exchange_program: "Exchange Program",
    community: "Community",
    other: "Other",
  };
  return labels[type];
}
