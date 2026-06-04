-- Create a public bucket for images
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- Create storage bucket policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Auth Insert"
  on storage.objects for insert
  with check ( auth.role() = 'authenticated' AND bucket_id = 'images' );

create policy "Auth Update"
  on storage.objects for update
  using ( auth.role() = 'authenticated' AND bucket_id = 'images' );

create policy "Auth Delete"
  on storage.objects for delete
  using ( auth.role() = 'authenticated' AND bucket_id = 'images' );
