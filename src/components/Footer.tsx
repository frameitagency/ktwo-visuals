import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Instagram, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router';

export default function Footer() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    supabase.from('business_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) setSettings(data);
    }, (err) => {
      console.warn('Footer failed to load settings:', err);
    });
  }, []);

  return (
    <footer className="bg-white border-t border-gray-100 py-16 px-6 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6 cursor-pointer">
            <Camera className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-lg uppercase tracking-widest text-gray-900">
              {(settings?.business_name && settings.business_name !== "Frame & Light Photography") ? settings.business_name : 'kTWO VISUALS'}
            </span>
          </Link>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            Capturing timeless moments with an editorial eye. We specialize in natural light portraits, elegant family sessions, and compelling brand imagery.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href={`mailto:${settings.business_email || ''}`} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-6 uppercase tracking-wider text-xs">Studio</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-gray-900 transition-colors">Portfolio</Link></li>
            <li><Link to="/" className="hover:text-gray-900 transition-colors">Services</Link></li>
            <li><Link to="/availability" className="hover:text-gray-900 transition-colors">Check Availability</Link></li>
            <li><Link to="/book" className="hover:text-gray-900 transition-colors">Book a Session</Link></li>
            <li><Link to="/admin/login" className="hover:text-gray-900 transition-colors">Admin Login</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-6 uppercase tracking-wider text-xs">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li>{settings.business_email || 'hello@studio.com'}</li>
            <li>{settings.business_phone || '+1 (555) 000-0000'}</li>
            <li className="leading-relaxed">{settings.business_address || '123 Creative Studio Dr,\nNew York, NY 10012'}</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} {(settings?.business_name && settings.business_name !== "Frame & Light Photography") ? settings.business_name : 'kTWO VISUALS'}. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
