-- In-app notifications for hosts when travelers submit or update stay requests.

CREATE OR REPLACE FUNCTION public.notify_host_on_stay_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traveler_name TEXT;
  v_listing_title TEXT;
BEGIN
  SELECT split_part(full_name, ' ', 1) INTO v_traveler_name
  FROM profiles
  WHERE id = NEW.traveler_id;

  SELECT title INTO v_listing_title
  FROM host_listings
  WHERE id = NEW.listing_id;

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.host_id,
    'stay_request_submitted',
    'New stay request',
    coalesce(v_traveler_name, 'A traveler') || ' requested a stay' ||
      CASE
        WHEN v_listing_title IS NOT NULL THEN ' for ' || v_listing_title
        ELSE ''
      END,
    '/host/requests/' || NEW.id::text,
    jsonb_build_object(
      'stay_request_id', NEW.id,
      'traveler_id', NEW.traveler_id,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_request_created_notify_host ON stay_requests;
CREATE TRIGGER on_stay_request_created_notify_host
  AFTER INSERT ON stay_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_host_on_stay_request();

CREATE OR REPLACE FUNCTION public.notify_host_on_stay_date_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traveler_name TEXT;
  v_listing_title TEXT;
  v_dates TEXT;
BEGIN
  IF OLD.start_date IS NOT DISTINCT FROM NEW.start_date
     AND OLD.end_date IS NOT DISTINCT FROM NEW.end_date THEN
    RETURN NEW;
  END IF;

  SELECT split_part(full_name, ' ', 1) INTO v_traveler_name
  FROM profiles
  WHERE id = NEW.traveler_id;

  SELECT title INTO v_listing_title
  FROM host_listings
  WHERE id = NEW.listing_id;

  v_dates := trim(both ' ' FROM
    coalesce(to_char(NEW.start_date, 'Mon DD, YYYY'), '—') || ' – ' ||
    coalesce(to_char(NEW.end_date, 'Mon DD, YYYY'), '—')
  );

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.host_id,
    'stay_dates_changed',
    coalesce(v_traveler_name, 'A guest') || ' updated stay dates',
    coalesce(v_listing_title, 'Stay request') || ': ' || v_dates,
    '/host/requests/' || NEW.id::text,
    jsonb_build_object(
      'stay_request_id', NEW.id,
      'traveler_id', NEW.traveler_id,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_request_dates_changed ON stay_requests;
CREATE TRIGGER on_stay_request_dates_changed
  AFTER UPDATE OF start_date, end_date ON stay_requests
  FOR EACH ROW
  WHEN (
    OLD.start_date IS DISTINCT FROM NEW.start_date
    OR OLD.end_date IS DISTINCT FROM NEW.end_date
  )
  EXECUTE FUNCTION public.notify_host_on_stay_date_change();
