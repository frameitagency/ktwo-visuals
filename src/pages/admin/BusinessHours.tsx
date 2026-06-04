import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { BusinessHours as BusinessHoursType } from '../../types/database.types';

export default function BusinessHours() {
  const [hours, setHours] = useState<BusinessHoursType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data } = await supabase.from('business_hours').select('*').order('weekday', { ascending: true });
      if (data) {
        setHours(data);
      }
    } catch (err) {
      console.error('Failed to load hours:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (id: string, field: keyof BusinessHoursType, value: any) => {
    setHours(hours.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('business_hours').upsert(
        hours.map(h => ({
          id: h.id,
          weekday: h.weekday,
          is_open: h.is_open,
          start_time: h.start_time,
          end_time: h.end_time
        }))
      );
      if (error) throw error;
      alert('Business hours saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save hours');
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

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Business Hours</h1>
          <p className="text-gray-500 mt-2">Set your standard weekly studio availability.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 disabled:opacity-70 shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {hours.map((hour) => (
            <div key={hour.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${hour.is_open ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-6 w-full md:w-64 shrink-0">
                <button
                  type="button"
                  onClick={() => handleChange(hour.id, 'is_open', !hour.is_open)}
                  className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${hour.is_open ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${hour.is_open ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className={`font-medium ${hour.is_open ? 'text-gray-900' : 'text-gray-400'}`}>
                  {days[hour.weekday]}
                </span>
              </div>
              
              <div className={`flex items-center gap-4 transition-opacity ${hour.is_open ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={hour.start_time?.substring(0, 5) || ''}
                    onChange={e => handleChange(hour.id, 'start_time', e.target.value + ':00')}
                    disabled={!hour.is_open}
                    className="border border-gray-200 p-2 text-sm text-gray-700 outline-none focus:border-gray-900 bg-transparent"
                  />
                  <span className="text-gray-400 font-mono text-xs">TO</span>
                  <input
                    type="time"
                    value={hour.end_time?.substring(0, 5) || ''}
                    onChange={e => handleChange(hour.id, 'end_time', e.target.value + ':00')}
                    disabled={!hour.is_open}
                    className="border border-gray-200 p-2 text-sm text-gray-700 outline-none focus:border-gray-900 bg-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
