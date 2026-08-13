/**
 * Refresh About-tab content for existing sample.host.*@forebeyond.demo accounts.
 *
 * Usage: npm run db:update-sample-host-stories
 */
import { createClient } from "@supabase/supabase-js";
import { createPgClient } from "./pg-connect.mjs";
import { loadEnvLocal } from "./load-env-local.mjs";
import { getSampleHostStory } from "./sample-host-stories.mjs";

loadEnvLocal(process.cwd(), { force: true });

const EMAIL_DOMAIN = "@forebeyond.demo";
const EMAIL_PREFIX = "sample.host.";
const SAMPLE_CODES = ["jp", "it", "es", "gt", "mx", "fr", "pt", "ma", "th", "ca"];

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function applyStoryPg(client, userId, code) {
  const story = getSampleHostStory(code);

  await client.query(
    `UPDATE profiles SET bio = $2, updated_at = NOW() WHERE id = $1`,
    [userId, story.bio]
  );

  await client.query(
    `UPDATE host_profiles SET
      cultural_offerings = $2,
      household_description = $3,
      experience_description = $4,
      neighborhood = $5,
      host_motivation = $6,
      updated_at = NOW()
     WHERE user_id = $1`,
    [
      userId,
      story.familyActivities,
      story.householdDescription,
      story.experienceDescription,
      story.neighborhood,
      story.hostMotivation,
    ]
  );

  await client.query(
    `UPDATE host_listings SET
      family_story = $2,
      stay_details = $3,
      meals = $4,
      family_activities = $5,
      house_rules = $6,
      updated_at = NOW()
     WHERE host_id = $1 AND status = 'published'`,
    [
      userId,
      story.familyStory,
      story.stayDetails,
      story.meals,
      story.familyActivities,
      story.houseRules,
    ]
  );
}

async function applyStoryApi(supabase, userId, code) {
  const story = getSampleHostStory(code);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ bio: story.bio })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error: hostProfileError } = await supabase
    .from("host_profiles")
    .update({
      cultural_offerings: story.familyActivities,
      household_description: story.householdDescription,
      experience_description: story.experienceDescription,
      neighborhood: story.neighborhood,
      host_motivation: story.hostMotivation,
    })
    .eq("user_id", userId);
  if (hostProfileError) throw hostProfileError;

  const { error: listingError } = await supabase
    .from("host_listings")
    .update({
      family_story: story.familyStory,
      stay_details: story.stayDetails,
      meals: story.meals,
      family_activities: story.familyActivities,
      house_rules: story.houseRules,
    })
    .eq("host_id", userId)
    .eq("status", "published");
  if (listingError) throw listingError;
}

async function main() {
  const hasDatabaseUrl =
    Boolean(process.env.DATABASE_URL?.trim()) || Boolean(process.env.DATABASE_HOST?.trim());

  console.log("Updating sample host stories...\n");

  if (hasDatabaseUrl) {
    const client = await createPgClient();
    try {
      for (const code of SAMPLE_CODES) {
        const email = `${EMAIL_PREFIX}${code}${EMAIL_DOMAIN}`;
        const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
        const userId = rows[0]?.id;
        if (!userId) {
          console.log("  — skip %s (not found)", email);
          continue;
        }
        await applyStoryPg(client, userId, code);
        console.log("  ✓ %s — richer About content", email);
      }
    } finally {
      await client.end();
    }
  } else {
    const supabase = createSupabaseAdmin();
    for (const code of SAMPLE_CODES) {
      const email = `${EMAIL_PREFIX}${code}${EMAIL_DOMAIN}`;
      const userId = await findUserIdByEmail(supabase, email);
      if (!userId) {
        console.log("  — skip %s (not found)", email);
        continue;
      }
      await applyStoryApi(supabase, userId, code);
      console.log("  ✓ %s — richer About content", email);
    }
  }

  console.log("\nDone. Open any sample host profile and check the About tab.\n");
}

main().catch((err) => {
  console.error("Update sample host stories failed:", err.message);
  process.exit(1);
});
