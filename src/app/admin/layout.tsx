import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin",
  description: "Fore Beyond platform administration.",
  path: "/admin",
});

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  return children;
}
