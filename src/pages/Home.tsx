import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Star, Check } from 'lucide-react';
import { Link } from 'react-router';
import { Service } from '../types/database.types';

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [siteAssets, setSiteAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, settingsRes, assetsRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: true }),
          supabase.from('business_settings').select('*').maybeSingle(),
          supabase.from('site_assets').select('*')
        ]);
        if (servicesRes.data) setServices(servicesRes.data);
        if (settingsRes.data) setSettings(settingsRes.data);
        if (assetsRes?.data) setSiteAssets(assetsRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  let heroImages = siteAssets
    .filter(a => a.asset_key.startsWith('hero_bg'))
    .map(a => a.image_url)
    .filter(Boolean);

  if (heroImages.length === 0) {
    heroImages = [
      'https://images.unsplash.com/photo-1621644781498-d7318bed2614?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518104593124-ac2e82abcb47?q=80&w=2050&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop'
    ];
  }

  const aboutAsset = siteAssets.find(a => a.asset_key === 'about_portrait');
  const aboutDetailAsset = siteAssets.find(a => a.asset_key === 'about_detail');
  
  const aboutImage = aboutAsset?.image_url || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop';
  const aboutDetail = aboutDetailAsset?.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2000&auto=format&fit=crop';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // cycle every 5 seconds
    
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const studioSessions = services.filter(s => !s.name.toLowerCase().includes('package') && !s.name.toLowerCase().includes('vip'));
  const weddingPackages = services.filter(s => s.name.toLowerCase().includes('package') || s.name.toLowerCase().includes('vip'));

  return (
    <div className="flex-1 w-full bg-[#fcfcfc]">
      {/* Hero Section */}
      <section 
        id="hero-section" 
        className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden"
      >
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              backgroundImage: `url('${img}')`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
            }}
          />
        ))}

        <div className="absolute inset-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfc] via-transparent to-transparent opacity-90" />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center mt-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight mb-8 drop-shadow-lg">
            Capturing the <br className="hidden md:block"/> Authentic Moment
          </h1>
          <p className="max-w-xl mx-auto text-lg text-white/90 font-light mb-12 drop-shadow-md">
            A premium portrait studio crafting timeless imagery. We focus on natural light, elegant compositions, and telling your unique visual story.
          </p>
          <Link to="/book" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm font-medium uppercase tracking-widest rounded-full hover:scale-105 transition-transform duration-300 shadow-xl shadow-black/10">
            Book a Session
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <p className="font-mono text-sm tracking-[0.2em] uppercase text-gray-400 mb-4">Our Offering</p>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">Studio Sessions</h2>
            </div>
            <Link to="/availability" className="group flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-gray-900 border border-gray-200 rounded-full px-6 py-3 hover:border-gray-900 hover:bg-gray-50 transition-colors">
              View Availabilities
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="aspect-[4/5] bg-gray-100 rounded-sm w-full"></div>
                  <div className="h-6 bg-gray-100 w-2/3 mt-2"></div>
                  <div className="h-4 bg-gray-100 w-full relative"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {studioSessions.map(service => (
                <Link to={`/book?service=${encodeURIComponent(service.name)}`} key={service.id} className="group cursor-pointer block transform hover:-translate-y-2 transition-all duration-500">
                  <div className="relative rounded-[32px] overflow-hidden bg-[#1f242b] shadow-xl shadow-gray-200/40 flex flex-col h-[520px]">
                    {/* Top Image */}
                    <div className="relative h-[240px] w-full overflow-hidden shrink-0 bg-gray-800">
                      {service.image_url ? (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-light text-xs uppercase tracking-widest">No Image</div>
                      )}
                      {/* Gradient overlay to blend into bottom section */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1f242b] to-transparent pointer-events-none" />
                    </div>
                    
                    {/* Bottom Content */}
                    <div className="flex flex-col flex-1 px-8 pb-8 pt-2 justify-between z-10 relative">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-[22px] leading-tight font-medium text-white tracking-wide">{service.name}</h3>
                          <div className="px-3 py-1 rounded-[16px] bg-white/10 border border-white/5 text-white text-xs font-semibold tracking-wide shrink-0 backdrop-blur-sm">
                            R{service.price}
                          </div>
                        </div>
                        
                        <p className="text-[13px] text-gray-400 font-light leading-relaxed line-clamp-3 mb-6">
                          {service.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3.5 py-1.5 rounded-[16px] bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium tracking-wide">
                            {service.duration_minutes >= 60 
                              ? `${service.duration_minutes / 60} Hour${service.duration_minutes / 60 > 1 ? 's' : ''}` 
                              : `${service.duration_minutes} Mins`}
                          </span>
                          <span className="px-3.5 py-1.5 rounded-[16px] bg-white/5 border border-white/10 text-gray-300 text-[11px] font-medium tracking-wide">
                            Studio Session
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full py-3.5 mt-6 bg-white text-gray-900 rounded-[20px] text-center text-sm font-semibold hover:bg-gray-100 transition-colors">
                        Reserve
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Packages Section */}
      <section className="relative py-32 px-6 bg-[#050505] overflow-hidden flex flex-col items-center">
        {/* Huge blurred background text */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-[18vw] font-bold text-white opacity-20 blur-[2px] select-none pointer-events-none tracking-tighter leading-none z-0">
          Pricing
        </div>
        
        <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
            {weddingPackages.map((pkg, index) => {
              const lines = pkg.description.split('\n').filter(l => l.trim().length > 0);
              const features = lines; // Use all lines as features
              const isPopular = pkg.name.toLowerCase().includes('premium') || index === 1; // Default to middle card if no premium

              return (
                <div 
                   key={pkg.id} 
                   className={`flex flex-col p-8 rounded-3xl transition-transform duration-300 backdrop-blur-md border border-white/10 relative overflow-hidden ${
                     isPopular 
                       ? 'bg-gradient-to-b from-white/10 to-transparent transform md:-translate-y-4 shadow-2xl shadow-black' 
                       : 'bg-[#0f0f0f]/80'
                   }`}
                >
                  {/* Card Header */}
                  <div className="mb-8">
                    <p className="text-gray-400 text-sm mb-3 font-medium tracking-wide">{pkg.name}</p>
                    <h3 className="text-5xl font-bold text-white tracking-tight">
                      R{pkg.price}
                    </h3>
                  </div>
                  
                  {/* Features List */}
                  <ul className="space-y-4 mb-10 flex-grow">
                    {features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                        <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-3 text-gray-300 text-sm">
                      <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="leading-relaxed">
                        {pkg.duration_minutes >= 60 ? `${pkg.duration_minutes / 60} Hour${pkg.duration_minutes / 60 > 1 ? 's' : ''}` : `${pkg.duration_minutes} Mins`} Coverage
                      </span>
                    </li>
                  </ul>
                  
                  {/* Button */}
                  <div className="mt-auto pt-4">
                    <Link 
                      to={`/book?service=${encodeURIComponent(pkg.name)}`} 
                      className={`block w-full py-4 text-center text-sm font-semibold rounded-full transition-all duration-300 ${
                        isPopular 
                          ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                          : 'bg-transparent border border-[#333] text-white hover:bg-white/10'
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* About / Editorial Section */}
      <section className="py-24 px-6 bg-[#f5f5f4]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 relative">
            <div className="aspect-[3/4] w-full max-w-md mx-auto relative z-10">
              <img 
                src={aboutImage} 
                alt="Photographer holding camera" 
                className="w-full h-full object-cover shadow-2xl"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-2/3 aspect-square bg-[#e5e5e4] z-0 hidden md:block"></div>
            <div className="absolute top-12 -left-12 aspect-square w-32 hidden md:block">
              <img src={aboutDetail} alt="detail" className="w-full h-full object-cover shadow-lg border-4 border-[#f5f5f4]" />
            </div>
          </div>
          <div className="flex-1 max-w-xl">
             <p className="font-mono text-sm tracking-[0.2em] uppercase text-gray-500 mb-6">The Studio</p>
             <h2 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight mb-8 leading-tight">
               Crafting visual legacies through light and intention.
             </h2>
             <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
               More than just pressing a shutter, photography is about preserving the atmosphere of a fleeting moment. We approach every session with an editorial eye, seeking genuine emotion over rigid poses.
             </p>
             <p className="text-gray-500 font-light leading-relaxed mb-10">
               Our studio provides a calm, collaborative space where you can feel at ease. Whether it's a quiet portrait, a dynamic brand shoot, or a chaotic family milestone, we structure the session so the real you shines through safely and authentically.
             </p>
             <Link to="/book" className="inline-flex py-4 px-8 border border-gray-900 rounded-full text-sm font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-colors">
               Schedule a Consultation
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
