-- Convert legacy 'both' roles to traveler (users can create a separate host account if needed)
UPDATE profiles SET role = 'traveler' WHERE role = 'both';
