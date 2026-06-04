-- Insert predefined packages as services
INSERT INTO "public"."services" ("id", "name", "description", "duration_minutes", "price", "is_active", "image_url")
VALUES 
(gen_random_uuid(), 'Essential Package', 'The perfect foundation for capturing your core moments. Includes Professional Photography, Standard Videography, and Basic Editing & Retouching.', 180, 5000, true, null),
(gen_random_uuid(), 'Premium Package', 'Comprehensive coverage from every angle. Includes Professional Photography, Cinematic Videography, Advanced Editing & Color Grading, and Drone Aerial Shots.', 360, 9500, true, null),
(gen_random_uuid(), 'VIP3 Package', 'The ultimate all-inclusive gold standard experience. All Premium Features + Two Lead Photographers, Extended Drone Coverage, Full RAW Footage & Premium Albums.', 480, 15000, true, null);
