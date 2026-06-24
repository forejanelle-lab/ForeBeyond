-- Fix trust score trigger: shared functions cannot reference NEW.user_id on profiles rows

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  PERFORM calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  PERFORM calculate_trust_score(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score_trips()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  PERFORM calculate_trust_score(NEW.traveler_id);
  PERFORM calculate_trust_score(NEW.host_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  PERFORM calculate_trust_score(NEW.reviewer_id);
  IF NEW.reviewee_id IS DISTINCT FROM NEW.reviewer_id THEN
    PERFORM calculate_trust_score(NEW.reviewee_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_trust_on_profile ON profiles;
CREATE TRIGGER recalc_trust_on_profile
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score_profiles();

DROP TRIGGER IF EXISTS recalc_trust_on_verification ON verification_documents;
CREATE TRIGGER recalc_trust_on_verification
  AFTER INSERT OR UPDATE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score_verification();

DROP TRIGGER IF EXISTS recalc_trust_on_trip ON trips;
CREATE TRIGGER recalc_trust_on_trip
  AFTER INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score_trips();

DROP TRIGGER IF EXISTS recalc_trust_on_review ON reviews;
CREATE TRIGGER recalc_trust_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score_reviews();
