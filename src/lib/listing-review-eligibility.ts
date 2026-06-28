import type { SupabaseClient } from "@supabase/supabase-js";
import type { Review } from "@/types/database";

export const LISTING_REVIEW_DISABLED_MESSAGE =
  "Only users who have completed a trip or experience with this host can leave a review.";

export type HostReviewExisting = Pick<
  Review,
  "id" | "trip_id" | "experience_booking_id" | "rating" | "comment" | "moderation_status"
>;

export type HostReviewTarget =
  | {
      source: "trip";
      tripId: string;
      travelerId: string;
      revieweeId: string;
    }
  | {
      source: "experience";
      experienceBookingId: string;
      travelerId: string;
      revieweeId: string;
    };

export interface HostReviewEligibility {
  canReview: boolean;
  canEdit: boolean;
  target: HostReviewTarget | null;
  existingReview: HostReviewExisting | null;
}

function pickListingTrip<T extends { id: string; listing_id: string | null }>(
  trips: T[],
  listingId?: string | null
) {
  if (listingId) {
    return trips.find((trip) => trip.listing_id === listingId) ?? null;
  }
  return trips[0] ?? null;
}

export async function getHostReviewEligibility(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  hostId: string,
  listingId?: string | null
): Promise<HostReviewEligibility> {
  const empty: HostReviewEligibility = {
    canReview: false,
    canEdit: false,
    target: null,
    existingReview: null,
  };

  if (!userId || userId === hostId) {
    return empty;
  }

  const [{ data: completedTrips }, { data: completedExperiences }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, traveler_id, host_id, listing_id, end_date")
      .eq("traveler_id", userId)
      .eq("host_id", hostId)
      .eq("status", "completed")
      .order("end_date", { ascending: false }),
    supabase
      .from("experience_bookings")
      .select("id, traveler_id, host_id, scheduled_date")
      .eq("traveler_id", userId)
      .eq("host_id", hostId)
      .eq("status", "completed")
      .order("scheduled_date", { ascending: false }),
  ]);

  const trips = completedTrips ?? [];
  const experiences = completedExperiences ?? [];

  if (trips.length === 0 && experiences.length === 0) {
    return empty;
  }

  const tripIds = trips.map((trip) => trip.id);
  const experienceBookingIds = experiences.map((booking) => booking.id);

  const [{ data: tripReviews }, { data: experienceReviews }] = await Promise.all([
    tripIds.length > 0
      ? supabase
          .from("reviews")
          .select("id, trip_id, rating, comment, moderation_status")
          .eq("reviewer_id", userId)
          .in("trip_id", tripIds)
      : Promise.resolve({ data: [] }),
    experienceBookingIds.length > 0
      ? supabase
          .from("reviews")
          .select("id, trip_id, experience_booking_id, rating, comment, moderation_status")
          .eq("reviewer_id", userId)
          .in("experience_booking_id", experienceBookingIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reviewsByTripId = new Map(
    ((tripReviews as HostReviewExisting[]) ?? [])
      .filter((review) => review.trip_id)
      .map((review) => [review.trip_id as string, review])
  );
  const reviewsByExperienceId = new Map(
    ((experienceReviews as HostReviewExisting[]) ?? [])
      .filter((review) => review.experience_booking_id)
      .map((review) => [review.experience_booking_id as string, review])
  );

  const listingTrip = pickListingTrip(trips, listingId);
  if (listingTrip) {
    const existingReview = reviewsByTripId.get(listingTrip.id) ?? null;
    if (existingReview) {
      return {
        canReview: true,
        canEdit: true,
        existingReview,
        target: {
          source: "trip",
          tripId: listingTrip.id,
          travelerId: listingTrip.traveler_id,
          revieweeId: listingTrip.host_id,
        },
      };
    }

    return {
      canReview: true,
      canEdit: false,
      existingReview: null,
      target: {
        source: "trip",
        tripId: listingTrip.id,
        travelerId: listingTrip.traveler_id,
        revieweeId: listingTrip.host_id,
      },
    };
  }

  const unreviewedTrip = trips.find((trip) => !reviewsByTripId.has(trip.id)) ?? null;
  if (unreviewedTrip) {
    return {
      canReview: true,
      canEdit: false,
      existingReview: null,
      target: {
        source: "trip",
        tripId: unreviewedTrip.id,
        travelerId: unreviewedTrip.traveler_id,
        revieweeId: unreviewedTrip.host_id,
      },
    };
  }

  const unreviewedExperience =
    experiences.find((booking) => !reviewsByExperienceId.has(booking.id)) ?? null;
  if (unreviewedExperience) {
    return {
      canReview: true,
      canEdit: false,
      existingReview: null,
      target: {
        source: "experience",
        experienceBookingId: unreviewedExperience.id,
        travelerId: unreviewedExperience.traveler_id,
        revieweeId: unreviewedExperience.host_id,
      },
    };
  }

  const reviewedTrip = trips.find((trip) => reviewsByTripId.has(trip.id)) ?? null;
  if (reviewedTrip) {
    return {
      canReview: true,
      canEdit: true,
      existingReview: reviewsByTripId.get(reviewedTrip.id) ?? null,
      target: {
        source: "trip",
        tripId: reviewedTrip.id,
        travelerId: reviewedTrip.traveler_id,
        revieweeId: reviewedTrip.host_id,
      },
    };
  }

  const reviewedExperience = experiences.find((booking) => reviewsByExperienceId.has(booking.id));
  if (reviewedExperience) {
    return {
      canReview: true,
      canEdit: true,
      existingReview: reviewsByExperienceId.get(reviewedExperience.id) ?? null,
      target: {
        source: "experience",
        experienceBookingId: reviewedExperience.id,
        travelerId: reviewedExperience.traveler_id,
        revieweeId: reviewedExperience.host_id,
      },
    };
  }

  return empty;
}
