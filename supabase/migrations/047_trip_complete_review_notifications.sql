-- Notify host and guest to leave feedback when a trip is marked complete.
-- Scope public reviews to listing via trip for listing profile pages.

CREATE OR REPLACE FUNCTION public.notify_trip_completed_review_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_name TEXT;
  v_traveler_name TEXT;
  v_listing_title TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT split_part(full_name, ' ', 1) INTO v_host_name
    FROM profiles
    WHERE id = NEW.host_id;

    SELECT split_part(full_name, ' ', 1) INTO v_traveler_name
    FROM profiles
    WHERE id = NEW.traveler_id;

    SELECT title INTO v_listing_title
    FROM host_listings
    WHERE id = NEW.listing_id;

    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.traveler_id,
      'leave_trip_review',
      'How was your stay?',
      'Leave feedback for ' || coalesce(v_host_name, 'your host') ||
        CASE
          WHEN v_listing_title IS NOT NULL THEN ' at ' || v_listing_title
          ELSE ''
        END || '. Your review appears on their listing.',
      '/trips/' || NEW.id::text,
      jsonb_build_object(
        'trip_id', NEW.id,
        'reviewee_id', NEW.host_id,
        'listing_id', NEW.listing_id,
        'reviewer_role', 'traveler'
      )
    );

    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.host_id,
      'leave_trip_review',
      'Rate your guest',
      'Leave feedback for ' || coalesce(v_traveler_name, 'your guest') ||
        '. Your review appears on their guest profile.',
      '/trips/' || NEW.id::text,
      jsonb_build_object(
        'trip_id', NEW.id,
        'reviewee_id', NEW.traveler_id,
        'listing_id', NEW.listing_id,
        'reviewer_role', 'host'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trip_completed_review_prompt ON trips;
CREATE TRIGGER on_trip_completed_review_prompt
  AFTER UPDATE OF status ON trips
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trip_completed_review_prompt();

-- Link review-received notifications to listing or trust dashboard.
CREATE OR REPLACE FUNCTION public.notify_review_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link TEXT;
  v_listing_id UUID;
  v_reviewer_name TEXT;
BEGIN
  IF NEW.moderation_status = 'approved'
    AND (TG_OP = 'INSERT' OR OLD.moderation_status IS DISTINCT FROM 'approved') THEN
    SELECT listing_id INTO v_listing_id
    FROM trips
    WHERE id = NEW.trip_id;

    SELECT split_part(full_name, ' ', 1) INTO v_reviewer_name
    FROM profiles
    WHERE id = NEW.reviewer_id;

    v_link := CASE
      WHEN NEW.reviewer_role = 'traveler' AND v_listing_id IS NOT NULL
        THEN '/families/' || v_listing_id::text
      ELSE '/trust-center/dashboard'
    END;

    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.reviewee_id,
      'review_received',
      'New review received',
      coalesce(v_reviewer_name, 'Someone') || ' left you a ' || NEW.rating || '-star review.',
      v_link,
      jsonb_build_object(
        'review_id', NEW.id,
        'rating', NEW.rating,
        'trip_id', NEW.trip_id,
        'listing_id', v_listing_id,
        'reviewer_role', NEW.reviewer_role
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP VIEW IF EXISTS public_reviews;
CREATE VIEW public_reviews AS
SELECT
  r.id,
  r.trip_id,
  t.listing_id,
  r.reviewer_id,
  r.reviewee_id,
  r.rating,
  r.comment,
  r.is_positive,
  r.reviewer_role,
  r.created_at,
  split_part(p.full_name, ' ', 1) AS reviewer_first_name
FROM reviews r
JOIN profiles p ON p.id = r.reviewer_id
LEFT JOIN trips t ON t.id = r.trip_id
WHERE r.moderation_status = 'approved';

GRANT SELECT ON public_reviews TO anon, authenticated;
