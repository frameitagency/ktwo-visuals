import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { BlockedDate } from '../../types/database.types';
import { format } from 'date-fns';
import React from 'react';

export default function BlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data } = await supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true });
      if (data) setBlockedDates(data);
    } catch (err) {
      console.error('Failed to load blocked dates:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    setAdding(true);
    try {
      const { data, error } = await supabase.from('blocked_dates').insert([{ blocked_date: date, reason }]).select();
      if (error) throw error;
      
      if (data) {
        setBlockedDates([...blockedDates, data[0]].sort((a, b) => new Date(a.blocked_date).getTime() - new Date(b.blocked_date).getTime()));
      }
      setDate('');
      setReason('');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add blocked date');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
      if (error) throw error;
      setBlockedDates(blockedDates.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
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
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Blocked Dates</h1>
        <p className="text-gray-500 mt-2">Prevent bookings on specific days (holidays, personal days, full days out of studio).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6">Add Blocked Date</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 outline-none focus:border-gray-900 transition-colors text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Reason (Optional)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Summer Holiday"
                  className="w-full border border-gray-200 p-3 outline-none focus:border-gray-900 transition-colors text-sm" />
              </div>
              <button type="submit" disabled={adding || !date} className="w-full bg-gray-900 text-white p-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 mt-2 flex justify-center items-center gap-2 shadow-lg">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Date
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            {blockedDates.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No blocked dates scheduled.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blockedDates.map(bd => (
                  <div key={bd.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{format(new Date(bd.blocked_date), 'MMMM d, yyyy')}</p>
                      {bd.reason && <p className="text-sm text-gray-500 mt-1">{bd.reason}</p>}
                    </div>
                    <button onClick={() => handleDelete(bd.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Remove block">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
