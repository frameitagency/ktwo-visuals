import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';
import { Service } from '../../types/database.types';
import React from 'react';
import { ImageUpload } from '../../components/ImageUpload';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', duration_minutes: 60, price: 0, is_active: true, image_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      const { data } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (data) {
        setServices(data.filter(s => !s.name.toLowerCase().includes('package') && !s.name.toLowerCase().includes('vip')));
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  }

  const openNewForm = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', duration_minutes: 60, price: 0, is_active: true, image_url: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    setEditingService(service);
    setFormData({ 
      name: service.name, 
      description: service.description, 
      duration_minutes: service.duration_minutes, 
      price: service.price, 
      is_active: service.is_active,
      image_url: service.image_url || ''
    });
    setIsFormOpen(true);
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async (id: string) => {
    // Removed window.confirm because it is blocked in sandboxed iframes
    try {
      setErrorMsg('');
      setLoading(true);
      await supabase.from('appointments').delete().eq('service_id', id);
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      loadServices();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error deleting service');
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (editingService) {
        const { error } = await supabase.from('services').update(formData).eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([formData]);
        if (error) throw error;
      }
      setIsFormOpen(false);
      loadServices();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error saving service');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isFormOpen && services.length === 0) {
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
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Studio Sessions</h1>
          <p className="text-gray-500 mt-2">Manage your individual studio services, pricing, and durations.</p>
        </div>
        
        <button 
          onClick={openNewForm}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm">
          {errorMsg === 'Failed to fetch' 
            ? 'Network Error: Failed to fetch. Please ensure your Supabase database is reachable, credentials are correct, or disable any adblockers.' 
            : errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className={`bg-white border p-6 shadow-sm flex flex-col ${service.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-widest font-medium ${service.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => openEditForm(service)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="text-red-300 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">{service.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-grow">{service.description}</p>
            <div className="flex justify-between items-center text-sm font-medium border-t border-gray-100 pt-4 mt-auto">
              <span className="text-gray-500">{service.duration_minutes} min</span>
              <span className="text-gray-900">R{service.price}</span>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-light text-gray-900">{editingService ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Service Name</label>
                <input required type="text" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Description</label>
                <textarea required className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 h-32 resize-none text-sm"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Duration (min)</label>
                  <input required type="number" min="15" step="15" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900"
                    value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Price (R)</label>
                  <input required type="number" min="0" step="1" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900"
                    value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
              </div>
              
              <div>
                <ImageUpload 
                  label="Service Image" 
                  value={formData.image_url} 
                  onChange={(url) => setFormData({...formData, image_url: url})} 
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                  className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${formData.is_active ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-medium text-gray-900">Active on Website</span>
              </div>

              <div className="pt-8">
                <button type="submit" disabled={saving} className="w-full bg-gray-900 text-white px-6 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 flex justify-center shadow-lg">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
