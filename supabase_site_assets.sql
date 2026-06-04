-- Create site_assets table
CREATE TABLE site_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_key text UNIQUE NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert defaults
INSERT INTO site_assets (asset_key, image_url) VALUES 
('hero_bg', 'https://images.unsplash.com/photo-1621644781498-d7318bed2614?q=80&w=2670&auto=format&fit=crop'),
('about_portrait', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop'),
('service_default', 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=2070&auto=format&fit=crop')
ON CONFLICT (asset_key) DO NOTHING;

-- RLS policies
ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site assets" ON site_assets FOR SELECT USING (true);
CREATE POLICY "Admins can insert site assets" ON site_assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update site assets" ON site_assets FOR UPDATE USING (auth.role() = 'authenticated');
