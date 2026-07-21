import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, List, UserCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import ProfileTab from '../profile/ProfileTab';
import GlobalAnnouncement from '../common/GlobalAnnouncement';

const ScheduleTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daySlots, setDaySlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate fixed hourly slots from 08:00 to 17:00
  const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    return `${hour}:00:00`;
  });

  useEffect(() => {
    if (selectedDate) fetchDaySlots();
  }, [selectedDate]);

  const fetchDaySlots = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/appointments/day-slots?date=${selectedDate}`);
      setDaySlots(res.data);
    } catch (err) {
      toast.error('Failed to load schedule for this date');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlot = async (startTime) => {
    // End time is assumed 1 hour later
    const hour = parseInt(startTime.split(':')[0], 10);
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

    try {
      await api.post('/appointments/slots', {
        slot_date: selectedDate,
        start_time: startTime,
        end_time: endTime
      });
      toast.success('Available slot created');
      fetchDaySlots();
    } catch (err) {
      toast.error('Failed to create slot');
    }
  };

  const handleDeleteSlot = async (appointmentId) => {
    try {
      await api.delete(`/appointments/slots/${appointmentId}`);
      toast.success('Slot removed');
      fetchDaySlots();
    } catch (err) {
      toast.error('Failed to remove slot');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Management</h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Date Picker */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 shadow-inner"
            min={new Date().toISOString().split('T')[0]} // prevent past dates broadly
          />
          <div className="mt-6 p-4 bg-purple-50 rounded-xl text-purple-800 text-sm">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pick a date on the calendar.</li>
              <li>Click an empty time to offer it.</li>
              <li>Green slots are open to students.</li>
              <li>Grey slots are already booked.</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Time Slots Grid */}
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Availability for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            {isLoading && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {TIME_SLOTS.map((timeStr) => {
              // Find if there's a slot for this time (ignore cancelled so they show as empty)
              const slotData = daySlots.find(s => s.start_time === timeStr && s.status !== 'cancelled');

              // Extract friendly time string "08:00 AM"
              const hourInt = parseInt(timeStr.split(':')[0], 10);
              const suffix = hourInt >= 12 ? 'PM' : 'AM';
              const displayHour = hourInt > 12 ? hourInt - 12 : hourInt;
              const displayTime = `${displayHour}:00 ${suffix}`;

              // State 3: Booked (confirmed or pending, has a student_id usually)
              if (slotData && slotData.student_id !== null && slotData.status !== 'available') {
                return (
                  <div key={timeStr} className="flex items-center justify-center p-3 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 font-medium cursor-not-allowed">
                    {displayTime} - Booked
                  </div>
                );
              }

              // State 2: Free / Available
              if (slotData && slotData.status === 'available') {
                return (
                  <div key={timeStr} className="relative flex items-center justify-center p-3 rounded-xl bg-green-50 text-green-700 border border-green-200 font-medium group transition-all shrink-0">
                    <span className="flex-1 text-center">{displayTime} - Free</span>
                    <button
                      onClick={() => handleDeleteSlot(slotData.appointment_id)}
                      className="absolute right-2 p-1 text-green-600 hover:text-red-500 hover:bg-red-50 rounded bg-white/50 transition-colors"
                      title="Remove availability"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              // State 1: Empty / Unselected
              return (
                <button
                  key={timeStr}
                  onClick={() => handleCreateSlot(timeStr)}
                  className="p-3 rounded-xl border border-gray-300 text-gray-600 hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors font-medium text-center"
                >
                  {displayTime}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [cancelPromptId, setCancelPromptId] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/mentor');
      const sorted = [...res.data].sort((a, b) => {
        const dateA = new Date(`${a.appointment_date.split('T')[0]}T${a.start_time}`);
        const dateB = new Date(`${b.appointment_date.split('T')[0]}T${b.start_time}`);
        return dateB - dateA; // newest first
      });
      setAppointments(sorted);
    } catch (err) { }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}`);
      if (status === 'cancelled') setCancelPromptId(null);
      fetchAppointments(); // refresh
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your counseling sessions</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No appointments scheduled.</div>
        ) : appointments.map((app) => {
          // Build a timezone-safe Date from the raw date + start_time, then add 1hr for end time
          const rawDate = app.appointment_date.split('T')[0]; // "2026-04-09"
          const [sh, sm] = app.start_time.split(':').map(Number);
          const apptEndDateTime = new Date(rawDate);
          apptEndDateTime.setHours(sh + 1, sm, 0, 0); // end = start + 1 hour
          const isDone = app.status !== 'cancelled' && apptEndDateTime < new Date();

          return (
          <div key={app.appointment_id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <img src={app.avatar_url || 'https://via.placeholder.com/50'} alt="student" className="w-12 h-12 rounded-full border border-gray-200" />
              <div>
                <h3 className="font-bold text-gray-900">{app.student_name}</h3>
                <p className="text-sm text-gray-500">{app.student_email} • {app.student_id_number || 'No ID'}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{new Date(app.appointment_date).toLocaleDateString()} at {app.start_time.substring(0, 5)}</span>
              </div>

              <div className="flex items-center gap-2">
                {isDone ? (
                  <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </span>
                ) : app.status === 'cancelled' ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Cancelled</span>
                ) : (
                  <>
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(app.appointment_id, 'confirmed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Confirm">
                          <CheckCircle className="w-6 h-6" />
                        </button>
                        <button onClick={() => setCancelPromptId(app.appointment_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    {app.status === 'confirmed' && (
                      <>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold mr-2">Confirmed</span>
                        <button onClick={() => setCancelPromptId(app.appointment_id)} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors">
                          Cancel Session
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelPromptId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <h3 className="text-xl font-bold mb-2">Cancel Appointment?</h3>
            <p className="text-gray-500 mb-6 flex items-center justify-center gap-2">
              Are you sure you want to cancel this booking? This will notify the student and mark the timeslot as unselected.
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setCancelPromptId(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={() => updateStatus(cancelPromptId, 'cancelled')}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-md"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const MentorDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: 'schedule', icon: CalendarIcon, label: 'Schedule' },
    { path: 'appointments', icon: List, label: 'Appointments' },
    { path: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const currentTab = location.pathname.split('/').pop();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 h-[calc(100vh-73px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col md:h-full flex-shrink-0">
        <div className="p-6 pb-2 hidden md:block">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-4">Mentor Menu</p>
        </div>
        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.path || (currentTab === 'mentor' && item.path === 'schedule');
            return (
              <Link
                key={item.path}
                to={`/mentor/${item.path}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${isActive ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <GlobalAnnouncement />
        <Routes>
          <Route path="/" element={<ScheduleTab />} />
          <Route path="/schedule" element={<ScheduleTab />} />
          <Route path="/appointments" element={<AppointmentsTab />} />
          <Route path="/profile" element={<ProfileTab accentColor="purple" />} />
        </Routes>
      </main>
    </div>
  );
};

export default MentorDashboard;
