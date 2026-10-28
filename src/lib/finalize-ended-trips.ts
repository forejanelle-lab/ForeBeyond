import { createServiceClient } from "@/lib/supabase/service";

/** Mark confirmed stays complete once their end date has passed. */
export async function finalizeEndedConfirmedTrips() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc("complete_ended_confirmed_trips");
    if (error) {
      console.error("complete_ended_confirmed_trips", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finalize ended trips.";
    console.error("complete_ended_confirmed_trips", message);
  }
}
