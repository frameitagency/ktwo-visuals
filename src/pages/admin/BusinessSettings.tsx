import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { BusinessSettings, SiteAsset } from '../../types/database.types';
import React from 'react';
import { ImageUpload } from '../../components/ImageUpload';

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [heroUrl, setHeroUrl] = useState('');
  const [heroUrl2, setHeroUrl2] = useState('');
  const [heroUrl3, setHeroUrl3] = useState('');
  const [heroUrl4, setHeroUrl4] = useState('');
  const [aboutUrl, setAboutUrl] = useState('');
  const [aboutDetailUrl, setAboutDetailUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsRes, assetsRes] = await Promise.all([
        supabase.from('business_settings').select('*').maybeSingle(),
        supabase.from('site_assets').select('*')
      ]);
      
      if (settingsRes.data) setSettings(settingsRes.data as BusinessSettings);
      if (assetsRes?.data) {
         setAssets(assetsRes.data);
         const hero = assetsRes.data.find(a => a.asset_key === 'hero_bg' || a.asset_key === 'hero_bg_1');
         const hero2 = assetsRes.data.find(a => a.asset_key === 'hero_bg_2');
         const hero3 = assetsRes.data.find(a => a.asset_key === 'hero_bg_3');
         const hero4 = assetsRes.data.find(a => a.asset_key === 'hero_bg_4');

         const about = assetsRes.data.find(a => a.asset_key === 'about_portrait');
         const aboutDetail = assetsRes.data.find(a => a.asset_key === 'about_detail');
         const logo = assetsRes.data.find(a => a.asset_key === 'logo_image');
         
         if (hero) setHeroUrl(hero.image_url);
         if (hero2) setHeroUrl2(hero2.image_url);
         if (hero3) setHeroUrl3(hero3.image_url);
         if (hero4) setHeroUrl4(hero4.image_url);

         if (about) setAboutUrl(about.image_url);
         if (aboutDetail) setAboutDetailUrl(aboutDetail.image_url);
         if (logo) setLogoUrl(logo.image_url);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('business_settings').update({
        business_name: settings.business_name,
        business_email: settings.business_email,
        business_phone: settings.business_phone,
        business_address: settings.business_address,
        slot_interval_minutes: settings.slot_interval_minutes,
        booking_notice_hours: settings.booking_notice_hours
      }).eq('id', settings.id);
      if (error) throw error;

      // Update assets
      const updates = [
        supabase.from('site_assets').upsert({ asset_key: 'hero_bg', image_url: heroUrl }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'hero_bg_2', image_url: heroUrl2 }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'hero_bg_3', image_url: heroUrl3 }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'hero_bg_4', image_url: heroUrl4 }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'about_portrait', image_url: aboutUrl }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'about_detail', image_url: aboutDetailUrl }, { onConflict: 'asset_key' }),
        supabase.from('site_assets').upsert({ asset_key: 'logo_image', image_url: logoUrl }, { onConflict: 'asset_key' })
      ];
      await Promise.all(updates);

      alert('Settings and assets saved successfully');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12 text-gray-500">No business settings found in database.</div>;
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Studio Settings</h1>
        <p className="text-gray-500 mt-2">Manage your brand identity, contact information, and booking rules.</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm max-w-3xl">
        <form onSubmit={handleSave} className="divide-y divide-gray-100">
          
          <div className="p-8 space-y-6">
             <h2 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6">Site Images & Logo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <ImageUpload 
                    label="Studio Logo Image (Navbar Logo)" 
                    value={logoUrl} 
                    onChange={setLogoUrl} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="Hero BG Image 1" 
                    value={heroUrl} 
                    onChange={setHeroUrl} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="Hero BG Image 2" 
                    value={heroUrl2} 
                    onChange={setHeroUrl2} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="Hero BG Image 3" 
                    value={heroUrl3} 
                    onChange={setHeroUrl3} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="Hero BG Image 4" 
                    value={heroUrl4} 
                    onChange={setHeroUrl4} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="About Section Image" 
                    value={aboutUrl} 
                    onChange={setAboutUrl} 
                  />
                </div>
                <div>
                  <ImageUpload 
                    label="About Section Detail Image" 
                    value={aboutDetailUrl} 
                    onChange={setAboutDetailUrl} 
                  />
                </div>
             </div>
          </div>

          <div className="p-8 space-y-6">
             <h2 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6">Brand Details</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Studio Name</label>
                  <input required type="text" value={settings.business_name} onChange={e => setSettings({...settings, business_name: e.target.value})}
                    className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Studio Email</label>
                  <input required type="email" value={settings.business_email} onChange={e => setSettings({...settings, business_email: e.target.value})}
                    className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Studio Phone</label>
                  <input type="tel" value={settings.business_phone} onChange={e => setSettings({...settings, business_phone: e.target.value})}
                    className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Studio Address</label>
                  <textarea value={settings.business_address} onChange={e => setSettings({...settings, business_address: e.target.value})}
                    className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors resize-none h-24" />
                </div>
             </div>
          </div>

          <div className="p-8 space-y-6">
            <h2 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6">Booking Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Slot Interval (Minutes)</label>
                 <select value={settings.slot_interval_minutes} onChange={e => setSettings({...settings, slot_interval_minutes: Number(e.target.value)})}
                   className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors bg-transparent">
                   <option value={15}>15 Minutes</option>
                   <option value={30}>30 Minutes</option>
                   <option value={60}>60 Minutes</option>
                   <option value={120}>120 Minutes</option>
                 </select>
                 <p className="text-xs text-gray-400 mt-2">Drives the start times shown in the calendar.</p>
               </div>
               <div>
                 <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Booking Notice (Hours)</label>
                 <input type="number" min="0" value={settings.booking_notice_hours} onChange={e => setSettings({...settings, booking_notice_hours: Number(e.target.value)})}
                   className="w-full border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors" />
                 <p className="text-xs text-gray-400 mt-2">Minimum advance notice required to book.</p>
               </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end">
            <button type="submit" disabled={saving} className="bg-gray-900 text-white px-8 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 flex items-center justify-center min-w-[200px] shadow-lg">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
