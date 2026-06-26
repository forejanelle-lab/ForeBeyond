import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead } from "@/lib/notifications";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { AppNotification } from "@/types/database";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/notifications");

  await markAllNotificationsRead(supabase, user.id);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (notifications as AppNotification[]) ?? [];

  return (
    <Container className="py-6 md:py-10 max-w-2xl">
      <Badge variant="gold" className="mb-3">
        <Bell className="h-3 w-3" />
        Notifications
      </Badge>
      <h1 className="text-2xl md:text-3xl font-bold text-forest mb-6">Your notifications</h1>

      {rows.length === 0 ? (
        <Card variant="outline" padding="lg" className="text-center py-12">
          <p className="text-charcoal-light">You&apos;re all caught up.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className="block">
              <Card
                variant="outline"
                padding="md"
                className={`hover:shadow-md transition-shadow ${!n.read_at ? "bg-sage/10" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-forest">{n.title}</p>
                    {n.body && (
                      <p className="text-sm text-charcoal-light mt-1">{n.body}</p>
                    )}
                    <p className="text-xs text-charcoal-light mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read_at && <Badge variant="gold">New</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
