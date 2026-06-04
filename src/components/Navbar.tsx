import { Link } from 'react-router';
import { Camera, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [studioName, setStudioName] = useState('kTWO VISUALS');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.from('business_settings').select('business_name').maybeSingle().then(({ data }) => {
      if (data?.business_name && data.business_name !== "Frame & Light Photography") {
        setStudioName(data.business_name);
      }
    }, (err) => {
      console.warn('Navbar failed to load studio name:', err);
    });

    supabase.from('site_assets').select('image_url').eq('asset_key', 'logo_image').maybeSingle().then(({ data }) => {
      if (data?.image_url) {
        setLogoUrl(data.image_url);
      }
    }, (err) => {
      console.warn('Navbar failed to load logo:', err);
    });
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {logoUrl ? (
            <img src={logoUrl} alt={studioName} className="h-10 w-auto object-contain" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-gray-900 group-hover:text-gray-600 transition-colors" />
              <span className="font-medium text-lg uppercase tracking-widest text-gray-900 group-hover:text-gray-600 transition-colors truncate max-w-[200px] sm:max-w-none">
                {studioName}
              </span>
            </>
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Portfolio</Link>
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Services</Link>
          <Link to="/availability" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Check Availability</Link>
          <Link to="/book" className="text-xs font-medium uppercase tracking-widest bg-gray-900 text-white px-6 py-3 rounded-full hover:scale-105 hover:bg-gray-800 transition-all duration-300 shadow-sm">
            Book Session
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg">
          <div className="flex flex-col px-6 py-4 space-y-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2 border-b border-gray-50">Portfolio</Link>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2 border-b border-gray-50">Services</Link>
            <Link to="/availability" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2 border-b border-gray-50">Check Availability</Link>
            <Link to="/book" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-medium uppercase tracking-widest bg-gray-900 text-white px-6 py-4 text-center rounded-full hover:scale-105 hover:bg-gray-800 transition-all duration-300 shadow-sm mt-2">
              Book Session
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
