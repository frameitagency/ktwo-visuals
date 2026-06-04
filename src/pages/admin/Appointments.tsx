import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Search, Filter, Trash2 } from 'lucide-react';
import { Appointment, Service } from '../../types/database.types';
import { format } from 'date-fns';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [apptsRes, servRes] = await Promise.all([
        supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
        supabase.from('services').select('*')
      ]);
      
      if (apptsRes.data) setAppointments(apptsRes.data);
      if (servRes.data) setServices(servRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus as any })
        .eq('id', id);
        
      if (error) throw error;
      
      setAppointments(appointments.map(a => 
        a.id === id ? { ...a, status: newStatus as any } : a
      ));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to delete appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    statusFilter === 'all' ? true : a.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Loading Records</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">Appointments</h1>
          <p className="text-gray-500 mt-2">Manage your photography sessions and client requests.</p>
        </div>
        
        <div className="flex items-center gap-4 border border-gray-200 bg-white p-1">
           <Filter className="w-4 h-4 text-gray-400 ml-3" />
           <select 
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="bg-transparent border-none text-sm outline-none p-2 text-gray-700 uppercase tracking-widest text-xs font-medium cursor-pointer"
           >
             <option value="all">All Statuses</option>
             <option value="pending">Pending</option>
             <option value="confirmed">Confirmed</option>
             <option value="completed">Completed</option>
             <option value="cancelled">Cancelled</option>
           </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    No appointments found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  const service = services.find(s => s.id === appt.service_id);
                  return (
                    <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{appt.full_name}</p>
                        <p className="text-sm text-gray-500">{appt.email}</p>
                        <a 
                          href={`https://wa.me/${appt.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-[#25D366] hover:underline"
                        >
                          {appt.phone} (WhatsApp)
                        </a>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-900">{service?.name || 'Unknown'}</p>
                        {appt.notes && <p className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={appt.notes}>Notes: {appt.notes}</p>}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</p>
                        <p className="text-sm text-gray-500">{appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-widest font-medium ${
                          appt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                     <td className="p-4">
                         <div className="flex items-center gap-2">
                           {updatingId === appt.id ? (
                             <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                           ) : (
                             <>
                               <select
                                 value={appt.status}
                                 onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                 className="border border-gray-200 bg-white text-xs p-2 uppercase tracking-wider text-gray-700 outline-none hover:border-gray-900 cursor-pointer transition-colors"
                               >
                                 <option value="pending">Pending</option>
                                 <option value="confirmed">Confirm</option>
                                 <option value="completed">Complete</option>
                                 <option value="cancelled">Cancel</option>
                               </select>
                               <button 
                                 type="button"
                                 onClick={() => handleDelete(appt.id)}
                                 className="p-2 text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 rounded-md"
                                 title="Delete Appointment"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
