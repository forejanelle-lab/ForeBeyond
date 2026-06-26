-- Host approves first; traveler confirms before trip is created
ALTER TYPE stay_request_status ADD VALUE IF NOT EXISTS 'host_approved';

-- Other experience category
ALTER TYPE experience_category ADD VALUE IF NOT EXISTS 'other';
