-- Migration 91: Remove expired Satoo derby announcement
-- Ensures the notification is completely revoked from the database until a new announcement is created.

DELETE FROM public.announcements 
WHERE id = '877d67ac-f255-4dfe-a34e-5c724803869b' 
   OR title ILIKE '%satoo%' 
   OR content ILIKE '%satoo%';
