import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, ChevronRight, ChevronLeft, Loader2, Info } from 'lucide-react';
import { addMinutes, format, isSameDay, parse, startOfDay, addDays, getDay, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns';
import { Service, BusinessHours, BlockedDate, BusinessSettings } from '../types/database.types';
import { Link, useSearchParams } from 'react-router';
import React from 'react';

type BookingStep = 'service' | 'datetime' | 'details' | 'success';

interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

export default function Booking() {
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get('service');

  const [step, setStep] = useState<BookingStep>('service');
  
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Remove the static 14-days array at the top of the file, not needed anymore

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, hoursRes, blockedRes, settingsRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: true }),
          supabase.from('business_hours').select('*'),
          supabase.from('blocked_dates').select('*'),
          supabase.from('business_settings').select('*').maybeSingle()
        ]);
        
        if (servicesRes.data) {
          setServices(servicesRes.data);
          
          if (requestedService) {
            const match = servicesRes.data.find(s => s.name.toLowerCase().includes(requestedService.toLowerCase()));
            if (match) {
              setSelectedService(match);
              setStep('datetime');
            }
          }
        }
        if (hoursRes.data) setBusinessHours(hoursRes.data);
        if (blockedRes.data) setBlockedDates(blockedRes.data);
        if (settingsRes.data) setSettings(settingsRes.data as BusinessSettings);
      } catch (error) {
        console.error('Error loading booking data:', error);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [requestedService]);


  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate, businessHours, blockedDates, settings]);

  async function loadAvailableSlots() {
    if (!selectedService || !settings) return;
    setSlotsLoading(true);
    
    try {
      // Check if blocked date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isBlocked = blockedDates.some(b => b.blocked_date === dateStr);
      if (isBlocked) {
        setAvailableSlots([]);
        setSlotsLoading(false);
        return;
      }

      // Check business hours
      const weekday = getDay(selectedDate);
      const hours = businessHours.find(h => h.weekday === weekday);
      
      if (!hours || !hours.is_open) {
        setAvailableSlots([]);
        setSlotsLoading(false);
        return;
      }

      // Fetch existing appointments for the day to check overlap
      const { data: existingAppts } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Generate possible slots
      const startTimeParts = hours.start_time.split(':').map(Number);
      const endTimeParts = hours.end_time.split(':').map(Number);
      
      let currentSlotStart = new Date(selectedDate);
      currentSlotStart.setHours(startTimeParts[0], startTimeParts[1], 0, 0);
      
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(endTimeParts[0], endTimeParts[1], 0, 0);
      
      const interval = settings.slot_interval_minutes || 60;
      const duration = selectedService.duration_minutes;
      
      const noticeHours = settings.booking_notice_hours || 24;
      const nowWithNotice = new Date();
      nowWithNotice.setHours(nowWithNotice.getHours() + noticeHours);

      const generatedSlots: TimeSlot[] = [];

      while (currentSlotStart < dayEnd) {
        const currentSlotEnd = addMinutes(currentSlotStart, duration);
        
        // Slot must end before or exactly when business closes
        if (currentSlotEnd <= dayEnd) {
          
          // Must respect notice period
          if (currentSlotStart > nowWithNotice) {
            
            // Check overlaps
            let overlaps = false;
            if (existingAppts) {
               for (const appt of existingAppts) {
                  const apptStartParts = appt.start_time.split(':').map(Number);
                  const apptEndParts = appt.end_time.split(':').map(Number);
                  
                  const aStart = new Date(selectedDate);
                  aStart.setHours(apptStartParts[0], apptStartParts[1], 0, 0);
                  
                  const aEnd = new Date(selectedDate);
                  aEnd.setHours(apptEndParts[0], apptEndParts[1], 0, 0);
                  
                  // overlap logic: new_start < existing_end && new_end > existing_start
                  if (currentSlotStart < aEnd && currentSlotEnd > aStart) {
                     overlaps = true;
                     break;
                  }
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

      setAvailableSlots(generatedSlots);
    } catch (e) {
      console.error(e);
    } finally {
      setSlotsLoading(false);
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
    setSelectedTimeSlot(null);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;
    
    setSubmitting(true);
    setSubmitError('');
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startStr = format(selectedTimeSlot.start, 'HH:mm:ss');
    const endStr = format(selectedTimeSlot.end, 'HH:mm:ss');

    try {
      const { error } = await supabase.from('appointments').insert({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        service_id: selectedService.id,
        appointment_date: dateStr,
        start_time: startStr,
        end_time: endStr,
        status: 'pending',
        notes: formData.notes
      });

      if (error) throw error;
      
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex-1 w-full bg-[#fcfcfc] flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="tracking-widest uppercase text-xs font-mono">Loading Studio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#fcfcfc] pb-24 pt-24 md:pt-32 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-16">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 mb-4 text-center">
            {step === 'success' ? 'Confirmed' : 'Reservation'}
          </p>
          <h1 className="text-3xl md:text-5xl font-light text-center text-gray-900 tracking-tight">
             {step === 'service' && 'Select a Session'}
             {step === 'datetime' && 'Date & Time'}
             {step === 'details' && 'Your Details'}
             {step === 'success' && 'Request Received'}
          </h1>
        </div>

        {/* Steps Content */}
        <div className="bg-white p-6 md:p-12 shadow-sm border border-gray-100 relative">
          
          {step === 'service' && (
            <div className="space-y-4">
               {services.length === 0 ? (
                 <p className="text-center text-gray-500 py-12">No services available currently. Please check back later.</p>
               ) : (
                  services.map(service => (
                    <div 
                      key={service.id} 
                      onClick={() => handleServiceSelect(service)}
                      className="group p-6 border border-gray-100 rounded-3xl hover:border-gray-900 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">{service.name}</h3>
                        <p className="text-sm text-gray-500 max-w-lg leading-relaxed">{service.description}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-gray-900 font-medium">R{service.price}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-widest">{service.duration_minutes} min</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </div>
                  ))
               )}
            </div>
          )}

          {step === 'datetime' && selectedService && (
            <div>
              <button 
                onClick={() => setStep('service')}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 mb-10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Services
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 
                 {/* Full Calendar Picker */}
                 <div>
                   <h3 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                     <CalendarIcon className="w-4 h-4" /> Select Date
                   </h3>
                   
                   <div className="p-4 border border-gray-100 rounded-[20px] bg-white shadow-sm font-sans mb-8">
                     <div className="flex items-center justify-between mb-4 bg-gray-50/80 p-1.5 rounded-full border border-gray-100">
                       <button 
                         onClick={(e) => {
                           e.preventDefault();
                           const newDate = subMonths(selectedDate, 1);
                           setSelectedDate(newDate);
                           setSelectedTimeSlot(null);
                         }} 
                         className="p-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                       >
                         <ChevronLeft className="w-4 h-4" />
                       </button>
                       <span className="text-sm font-semibold text-gray-900">
                         {format(selectedDate, 'MMMM yyyy')}
                       </span>
                       <button 
                         onClick={(e) => {
                           e.preventDefault();
                           const newDate = addMonths(selectedDate, 1);
                           setSelectedDate(newDate);
                           setSelectedTimeSlot(null);
                         }} 
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
                          const mStart = startOfMonth(selectedDate);
                          const mEnd = endOfMonth(mStart);
                          const sDate = startOfWeek(mStart, { weekStartsOn: 1 });
                          const eDate = endOfWeek(mEnd, { weekStartsOn: 1 });
                          const calDays = eachDayOfInterval({ start: sDate, end: eDate });
                          
                          return calDays.map((d, i) => {
                            const isSelected = isSameDay(d, selectedDate);
                            const isCurrentMonth = isSameMonth(d, selectedDate);
                            const isPast = isBefore(d, startOfDay(new Date()));
                            
                            return (
                              <div key={i} className="flex items-center justify-center h-10 relative">
                                {isSelected && (
                                  <div className="absolute inset-0 bg-blue-100 rounded-full scale-90 -z-10" />
                                )}
                                <button
                                  disabled={isPast}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDate(d);
                                    setSelectedTimeSlot(null);
                                  }}
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
                              </div>
                            );
                          });
                       })()}
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h3 className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Select Time
                   </h3>
                   
                   {slotsLoading ? (
                     <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                     </div>
                   ) : availableSlots.length === 0 ? (
                     <div className="text-center py-10 px-4 border border-dashed border-gray-200">
                       <p className="text-gray-500 text-sm">No available times on this date. Please select another date.</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-3 gap-3">
                       {availableSlots.map((slot, i) => {
                         const isSelected = selectedTimeSlot?.start.getTime() === slot.start.getTime();
                         return (
                           <button
                             key={i}
                             onClick={() => setSelectedTimeSlot(slot)}
                             className={`py-3 px-2 rounded-full text-sm text-center border transition-all ${
                               isSelected ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-900'
                             }`}
                           >
                             {slot.label}
                           </button>
                         )
                       })}
                     </div>
                   )}
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Or Enter Custom Time
                  </p>
                  <input 
                    type="time" 
                    required
                    className="w-full max-w-sm bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                    onChange={(e) => {
                      const timeVal = e.target.value;
                      if (!timeVal) return;
                      
                      const [hh, mm] = timeVal.split(':').map(Number);
                      const start = new Date(selectedDate);
                      start.setHours(hh, mm, 0, 0);
                      
                      const end = new Date(start.getTime() + (selectedService!.duration_minutes * 60000));
                      
                      setSelectedTimeSlot({
                        start,
                        end,
                        label: format(start, 'h:mm a') + ' (Custom)'
                      });
                    }}
                    value={selectedTimeSlot ? format(selectedTimeSlot.start, 'HH:mm') : ''}
                  />
               </div>
              
              <div className="mt-12 flex justify-end pt-8 border-t border-gray-100">
                <button
                   disabled={!selectedTimeSlot}
                   onClick={() => setStep('details')}
                   className="bg-gray-900 text-white px-8 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                >
                  Continue to Details
                </button>
              </div>
            </div>
          )}

          {step === 'details' && selectedService && selectedTimeSlot && (
            <div>
              <button 
                onClick={() => setStep('datetime')}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 mb-10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Time
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 
                 <div className="lg:col-span-2">
                   <form onSubmit={submitBooking} id="booking-form" className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                         <input required type="text" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                           value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                       </div>
                       <div>
                         <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                         <input required type="email" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                           value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">WhatsApp Number</label>
                       <input required type="tel" className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors"
                         placeholder="e.g. +27 82 123 4567"
                         value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </div>
                     <div>
                       <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Session Notes / Goals</label>
                       <textarea className="w-full bg-[#fcfcfc] border border-gray-200 p-4 outline-none focus:border-gray-900 transition-colors h-32 resize-none"
                         placeholder="Tell us a bit about what you want to capture..."
                         value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                     </div>
                   </form>
                   
                   {submitError && (
                     <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-3">
                       <Info className="w-5 h-5 shrink-0" />
                       <p>{submitError}</p>
                     </div>
                   )}
                 </div>
                 
                 <div className="lg:col-span-1">
                    <div className="bg-[#fcfcfc] border border-gray-100 p-6 md:p-8">
                      <h4 className="font-medium text-gray-900 mb-6 uppercase tracking-wider text-xs">Summary</h4>
                      <div className="space-y-4 text-sm mb-8">
                        <div>
                          <p className="text-gray-400 text-xs uppercase mb-1">Service</p>
                          <p className="text-gray-900">{selectedService.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase mb-1">Date</p>
                          <p className="text-gray-900">{format(selectedDate, 'MMMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase mb-1">Time</p>
                          <p className="text-gray-900">{selectedTimeSlot.label} - {format(selectedTimeSlot.end, 'h:mm a')}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase mb-1">Total</p>
                          <p className="text-gray-900 font-medium">R{selectedService.price}</p>
                        </div>
                      </div>
                      <button
                        type="submit"
                        form="booking-form"
                        disabled={submitting}
                        className="w-full bg-gray-900 text-white px-6 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-gray-800 transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/10"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                      </button>
                    </div>
                 </div>
                 
              </div>
            </div>
          )}

          {step === 'success' && selectedService && selectedTimeSlot && (
            <div className="py-16 text-center max-w-lg mx-auto">
              <CheckCircle className="w-16 h-16 text-gray-900 mx-auto mb-8 font-light" strokeWidth={1} />
              <h2 className="text-3xl font-light text-gray-900 mb-4">Request Sent</h2>
              <p className="text-gray-500 mb-10 leading-relaxed font-light">
                Thank you, {formData.full_name}. We have received your booking request for the <strong className="font-medium text-gray-900">{selectedService.name}</strong> on <strong className="font-medium text-gray-900">{format(selectedDate, 'MMM d')}</strong> at <strong className="font-medium text-gray-900">{selectedTimeSlot.label}</strong>. We will be in touch shortly to finalize details.
              </p>
              <div className="flex flex-col gap-4 items-center justify-center">
                {settings?.business_phone && (
                  <a 
                    href={`https://wa.me/${settings.business_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I just sent a booking request for the ${selectedService.name} on ${format(selectedDate, 'MMM d')} at ${selectedTimeSlot.label}.`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 hover:bg-[#128C7E] shadow-lg shadow-[#25D366]/20 transition-all duration-300"
                  >
                    Take Conversation to WhatsApp
                  </a>
                )}
                <Link to="/" className="inline-flex py-3 px-6 border-b-2 border-gray-900 rounded-full text-sm font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300">
                  Return to Studio
                </Link>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
