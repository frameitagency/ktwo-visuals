import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { format, startOfDay, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, addMonths, subMonths, addMinutes, startOfWeek, endOfWeek } from 'date-fns';
import { Service, BusinessHours, BlockedDate, BusinessSettings, Appointment } from '../types/database.types';
import { Link } from 'react-router';

export default function Availability() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [servRes, hoursRes, blockRes, setRes, apptRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: true }),
          supabase.from('business_hours').select('*'),
          supabase.from('blocked_dates').select('*'),
          supabase.from('business_settings').select('*').maybeSingle(),
          supabase.from('appointments').select('appointment_date, start_time, end_time, status').neq('status', 'cancelled')
        ]);
        
        if (servRes.data) {
           setServices(servRes.data);
           if (servRes.data.length > 0) setSelectedService(servRes.data[0]);
        }
        if (hoursRes.data) setBusinessHours(hoursRes.data);
        if (blockRes.data) setBlockedDates(blockRes.data);
        if (setRes.data) setSettings(setRes.data as BusinessSettings);
        if (apptRes.data) setAppointments(apptRes.data as Appointment[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getSlotsForDate = (date: Date) => {
    if (!selectedService || !settings) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const isBlocked = blockedDates.some(b => b.blocked_date === dateStr);
    if (isBlocked) return [];

    const weekday = getDay(date);
    const hours = businessHours.find(h => h.weekday === weekday);
    
    if (!hours || !hours.is_open) return [];

    const existingAppts = appointments.filter(a => a.appointment_date === dateStr);

    const startTimeParts = hours.start_time.split(':').map(Number);
    const endTimeParts = hours.end_time.split(':').map(Number);
    
    let currentSlotStart = new Date(date);
    currentSlotStart.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endTimeParts[0], endTimeParts[1], 0, 0);
    
    const interval = settings.slot_interval_minutes || 60;
    const duration = selectedService.duration_minutes;
    
    const noticeHours = settings.booking_notice_hours || 24;
    const nowWithNotice = new Date();
    nowWithNotice.setHours(nowWithNotice.getHours() + noticeHours);

    const generatedSlots: { start: Date, end: Date, label: string }[] = [];

    while (currentSlotStart < dayEnd) {
      const currentSlotEnd = addMinutes(currentSlotStart, duration);
      
      if (currentSlotEnd <= dayEnd) {
        if (currentSlotStart > nowWithNotice) {
          let overlaps = false;
          for (const appt of existingAppts) {
            const apptStartParts = appt.start_time.split(':').map(Number);
            const apptEndParts = appt.end_time.split(':').map(Number);
            
            const aStart = new Date(date);
            aStart.setHours(apptStartParts[0], apptStartParts[1], 0, 0);
            
            const aEnd = new Date(date);
            aEnd.setHours(apptEndParts[0], apptEndParts[1], 0, 0);
            
            if (currentSlotStart < aEnd && currentSlotEnd > aStart) {
               overlaps = true;
               break;
            }
          }
          if (!overlaps) {
             generatedSlots.push({
               start: new Date(currentSlotStart),
               end: currentSlotEnd,
               label: format(currentSlotStart, 'h:mm a')
             });
          }
        }
      }
      currentSlotStart = addMinutes(currentSlotStart, interval);
    }
    return generatedSlots;
  };

  const availableSlotsForSelected = useMemo(() => {
    return getSlotsForDate(selectedDate);
  }, [selectedDate, selectedService, appointments, blockedDates, businessHours, settings]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (loading) {
    return (
      <div className="flex-1 w-full bg-[#fcfcfc] flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="tracking-widest uppercase text-xs font-mono">Loading Availability</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#fcfcfc] pb-24 pt-24 md:pt-32 px-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
            Studio Calendar
          </p>
          <h1 className="text-3xl md:text-5xl font-light text-gray-900 tracking-tight mb-6">
            Check Availability
          </h1>
          <p className="text-gray-500 font-light leading-relaxed">
            Select a session type below to view open dates and real-time studio availabilities.
          </p>
        </div>

        <div className="bg-white p-6 md:p-12 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Left Column: Calendar & Controls */}
          <div className="flex-1 space-y-8 lg:border-r border-gray-100 lg:pr-12">
            
            {/* Service Selector */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3 font-medium">Session Type</label>
              <select 
                className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors text-sm text-gray-900 cursor-pointer"
                value={selectedService?.id || ''}
                onChange={(e) => {
                  const s = services.find(srv => srv.id === e.target.value);
                  if (s) setSelectedService(s);
                }}
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                ))}
              </select>
            </div>

            {/* Calendar UI */}
            <div className="p-4 border border-gray-100 rounded-[20px] bg-white shadow-sm font-sans mb-8">
              <div className="flex items-center justify-between mb-4 bg-gray-50/80 p-1.5 rounded-full border border-gray-100">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                  className="p-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                  className="p-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest py-2">
                    {d}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-1">
                {(() => {
                  const mStart = startOfMonth(currentMonth);
                  const mEnd = endOfMonth(mStart);
                  const sDate = startOfWeek(mStart, { weekStartsOn: 1 });
                  const eDate = endOfWeek(mEnd, { weekStartsOn: 1 });
                  const calDays = eachDayOfInterval({ start: sDate, end: eDate });

                  return calDays.map((d, i) => {
                    const isSelected = isSameDay(d, selectedDate);
                    const isCurrentMonth = isSameMonth(d, currentMonth);
                    const isPast = isBefore(d, startOfDay(new Date()));
                    
                    // Quick check if this date has any slots
                    const slots = isPast ? [] : getSlotsForDate(d);
                    const hasSlots = slots.length > 0;
                    
                    return (
                      <div key={i} className="flex flex-col items-center justify-center h-[52px] relative">
                        {isSelected && (
                          <div className="absolute inset-0 top-1 bottom-1 bg-blue-100 rounded-full scale-90 -z-10" />
                        )}
                        <button
                          disabled={isPast}
                          onClick={() => setSelectedDate(d)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all outline-none ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
                              : isPast
                                ? 'text-gray-300 font-light cursor-not-allowed'
                                : !isCurrentMonth
                                  ? 'text-gray-300 font-light hover:bg-gray-100'
                                  : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {format(d, 'd')}
                        </button>
                        <div className="h-2 mt-0.5">
                          {!isPast && isCurrentMonth && hasSlots && !isSelected && (
                            <span className="block w-1 h-1 bg-gray-300 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
          </div>

          {/* Right Column: Time Slots */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col">
            <h3 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-2 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Clock className="w-4 h-4" /> 
              {format(selectedDate, 'EEEE, MMM d')}
            </h3>
            
            <div className="flex-1 overflow-y-auto pt-6 pb-6 pr-2">
              {availableSlotsForSelected.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-200 bg-[#fcfcfc]">
                  <p className="text-gray-500 text-sm leading-relaxed">No open studio times on this date. Please select another day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableSlotsForSelected.map((slot, i) => (
                    <div
                      key={i}
                      className="py-3 px-2 text-sm text-center border border-gray-200 text-gray-600 bg-[#fcfcfc]"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 mt-auto">
              <Link
                 to="/book"
                 className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/10"
              >
                Proceed to Book <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
