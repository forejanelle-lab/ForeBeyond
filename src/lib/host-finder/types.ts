export type HostSignalIntent = "high" | "medium";

export type HostLeadPriority =
  | "high_priority"
  | "good_prospect"
  | "possible"
  | "low_priority";

export type HostPipelineStatus =
  | "new"
  | "researching"
  | "contacted"
  | "follow_up_due"
  | "replied"
  | "interested"
  | "application_started"
  | "verified"
  | "signed_up"
  | "not_interested"
  | "do_not_contact";

export type HostFinderHostType =
  | "experienced_cultural_exchange_host"
  | "homestay_host"
  | "language_teacher"
  | "general";

export type HostSearchStatus = "pending" | "running" | "completed" | "failed";

export type HostLeadSourceType =
  | "web"
  | "reddit"
  | "facebook"
  | "forum"
  | "blog"
  | "homestay"
  | "exchange_program"
  | "community"
  | "other";

export interface HostSignalLibraryEntry {
  id: string;
  phrase: string;
  intent_level: HostSignalIntent;
  category: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostSearch {
  id: string;
  created_by: string | null;
  country: string;
  region: string | null;
  host_type: HostFinderHostType;
  leads_requested: number;
  status: HostSearchStatus;
  leads_found: number;
  high_priority_count: number;
  provider_used: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface HostLeadScoreExplanation {
  confirmed_evidence: string[];
  reasonable_inference: string[];
  unknown: string[];
  summary: string;
}

export interface HostLead {
  id: string;
  search_id: string | null;
  name: string;
  email: string | null;
  country: string | null;
  region: string | null;
  score: number;
  priority: HostLeadPriority;
  host_type: HostFinderHostType | null;
  evidence_excerpt: string | null;
  why_good_fit: string[];
  host_experience: string | null;
  potential_concerns: string[];
  recommended_approach: string | null;
  score_explanation: HostLeadScoreExplanation;
  pipeline_status: HostPipelineStatus;
  notes: string | null;
  tags: string[];
  dedup_key: string;
  dismissed_at: string | null;
  dismissed_reason: string | null;
  outreach_draft: string | null;
  discovered_at: string;
  created_at: string;
  updated_at: string;
}

export interface HostLeadSource {
  id: string;
  lead_id: string;
  source_type: HostLeadSourceType;
  source_url: string;
  title: string | null;
  snippet: string | null;
  published_at: string | null;
  discovered_at: string;
  created_at: string;
}

export interface HostLeadScore {
  id: string;
  lead_id: string;
  score: number;
  priority: HostLeadPriority;
  explanation: HostLeadScoreExplanation;
  model: string | null;
  scored_at: string;
}

export interface HostPipelineEvent {
  id: string;
  lead_id: string;
  from_status: HostPipelineStatus | null;
  to_status: HostPipelineStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface HostDiscoverySchedule {
  id: string;
  enabled: boolean;
  name: string;
  country: string;
  region: string | null;
  host_type: HostFinderHostType;
  leads_per_run: number;
  cron_expression: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostLeadWithSources extends HostLead {
  sources: HostLeadSource[];
}

export const HOST_PIPELINE_STATUSES: HostPipelineStatus[] = [
  "new",
  "researching",
  "contacted",
  "follow_up_due",
  "replied",
  "interested",
  "application_started",
  "verified",
  "signed_up",
  "not_interested",
  "do_not_contact",
];

export const HOST_LEAD_TAGS = [
  "Experienced Host",
  "Exchange Host",
  "Homestay",
  "Cultural Exchange",
  "Language Teacher",
  "Referral",
  "Organization",
  "High Intent",
] as const;

export const HOST_FINDER_HOST_TYPES: { value: HostFinderHostType; label: string }[] = [
  { value: "experienced_cultural_exchange_host", label: "Experienced Cultural Exchange Host" },
  { value: "homestay_host", label: "Homestay Host" },
  { value: "language_teacher", label: "Language Teacher" },
  { value: "general", label: "General Host Prospect" },
];

export function priorityFromScore(score: number): HostLeadPriority {
  if (score >= 90) return "high_priority";
  if (score >= 75) return "good_prospect";
  if (score >= 50) return "possible";
  return "low_priority";
}

export function priorityLabel(priority: HostLeadPriority): string {
  const labels: Record<HostLeadPriority, string> = {
    high_priority: "HIGH PRIORITY",
    good_prospect: "GOOD PROSPECT",
    possible: "POSSIBLE",
    low_priority: "LOW PRIORITY",
  };
  return labels[priority];
}

export function pipelineStatusLabel(status: HostPipelineStatus): string {
  const labels: Record<HostPipelineStatus, string> = {
    new: "New",
    researching: "Researching",
    contacted: "Contacted",
    follow_up_due: "Follow-up Due",
    replied: "Replied",
    interested: "Interested",
    application_started: "Application Started",
    verified: "Verified",
    signed_up: "Signed Up",
    not_interested: "Not Interested",
    do_not_contact: "Do Not Contact",
  };
  return labels[status];
}
