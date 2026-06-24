import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Plus, List, Shield, ArrowRight, Sparkles, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import type { Profile } from "@/types/database";

export const metadata = { title: "Host Dashboard" };

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  if (typedProfile?.role !== "host") {
    redirect("/profile/complete");
  }

  const { count: listingCount } = await supabase
    .from("host_listings")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user.id);

  const { count: publishedCount } = await supabase
    .from("host_listings")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user.id)
    .eq("status", "published");

  const { count: experienceCount } = await supabase
    .from("host_experiences")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user.id);

  const { count: publishedExperienceCount } = await supabase
    .from("host_experiences")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user.id)
    .eq("status", "published");

  const { count: pendingRequestCount } = await supabase
    .from("stay_requests")
    .select("*", { count: "exact", head: true })
    .eq("host_id", user.id)
    .eq("status", "pending");

  return (
    <Container className="py-16 md:py-24">
      <div className="mb-10">
        <Badge variant="gold" className="mb-4">
          <Home className="h-3 w-3" />
          Host Dashboard
        </Badge>
        <h1 className="text-3xl font-bold text-forest">
          Welcome{typedProfile?.full_name ? `, ${typedProfile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-charcoal-light">
          Share your family&apos;s culture with travelers seeking authentic connection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card variant="elevated" padding="lg" className="flex flex-col items-center">
          <TrustScoreRing score={typedProfile?.trust_score ?? 0} size="md" />
          <Link href="/trust-center/dashboard" className="mt-4 text-sm text-forest underline">
            View trust breakdown
          </Link>
        </Card>

        <Card variant="outline" padding="lg">
          <h3 className="font-semibold text-forest mb-4">Your Listings</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-3xl font-bold text-forest">{listingCount ?? 0}</p>
              <p className="text-sm text-charcoal-light">Total</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-forest">{publishedCount ?? 0}</p>
              <p className="text-sm text-charcoal-light">Published</p>
            </div>
          </div>
          <Link href="/host/listings">
            <Button variant="secondary" size="sm" className="w-full">
              <List className="h-4 w-4" />
              Manage Listings
            </Button>
          </Link>
        </Card>

        <Card variant="outline" padding="lg">
          <h3 className="font-semibold text-forest mb-2">Create a listing</h3>
          <p className="text-sm text-charcoal-light mb-4">
            Share your family story, photos, meals, and cultural activities with travelers.
          </p>
          <Link href="/host/listings/new">
            <Button variant="primary" size="md" className="w-full">
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/verification-center">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Verification
                </h3>
                <p className="text-sm text-charcoal-light mt-1">Boost your Trust Score</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest" />
            </div>
          </Card>
        </Link>
        <Link href="/host/listings">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">All Listings</h3>
                <p className="text-sm text-charcoal-light mt-1">Edit, publish, or archive</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest" />
            </div>
          </Card>
        </Link>
        <Link href="/host/experiences">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Experiences
                </h3>
                <p className="text-sm text-charcoal-light mt-1">
                  {publishedExperienceCount ?? 0} published · {experienceCount ?? 0} total
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest" />
            </div>
          </Card>
        </Link>
        <Link href="/host/requests">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest flex items-center gap-2">
                  <Inbox className="h-4 w-4" /> Stay Requests
                </h3>
                <p className="text-sm text-charcoal-light mt-1">
                  {pendingRequestCount ?? 0} pending review
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest" />
            </div>
          </Card>
        </Link>
        <Link href="/host/experiences/new">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">New Experience</h3>
                <p className="text-sm text-charcoal-light mt-1">Cooking, tours, workshops & more</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest" />
            </div>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
