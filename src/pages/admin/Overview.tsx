import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { Appointment, Service } from '../../types/database.types';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { Link } from 'react-router';

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [apptsRes, servRes] = await Promise.all([
          supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
          supabase.from('services').select('*').eq('is_active', true)
        ]);
        
        if (apptsRes.data) setAppointments(apptsRes.data);
        if (servRes.data) setServices(servRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  const today = startOfDay(new Date());
  
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const upcomingCount = appointments.filter(a => (a.status === 'confirmed' || a.status === 'pending') && isAfter(new Date(a.appointment_date), today)).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  
  const upcomingAppointments = appointments
    .filter(a => (a.status === 'confirmed' || a.status === 'pending') && new Date(a.appointment_date) >= today)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    .slice(0, 5);

  const stats = [
    { name: 'Pending Requests', value: pendingCount, icon: Clock },
    { name: 'Upcoming Sessions', value: upcomingCount, icon: Calendar },
    { name: 'Completed Sessions', value: completedCount, icon: CheckCircle },
    { name: 'Active Services', value: services.length, icon: Activity },
  ];

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500 mt-2">Welcome back to the studio workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium whitespace-nowrap">{stat.name}</p>
              <stat.icon className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-4xl font-light text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          <Link to="/admin/appointments" className="text-sm font-medium text-gray-500 hover:text-gray-900 uppercase tracking-widest">View All</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingAppointments.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
               No upcoming appointments found.
             </div>
          ) : (
            upcomingAppointments.map((appt) => {
              const service = services.find(s => s.id === appt.service_id);
              return (
                <div key={appt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{appt.full_name}</p>
                    <p className="text-sm text-gray-500">{service?.name || 'Unknown Service'}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <p className="text-sm text-gray-900 font-medium">
                      {format(new Date(appt.appointment_date), 'MMM d, yyyy')} at {appt.start_time?.substring(0, 5)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-widest font-medium ${
                      appt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
