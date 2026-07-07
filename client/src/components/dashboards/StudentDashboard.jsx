import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Clock, Users, UserCircle, LogOut, AlertTriangle, Trophy, Calendar, CheckCircle, X, Mail, Search, ChevronDown, Info, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ProfileTab from '../profile/ProfileTab';
import EmailModal from '../common/EmailModal';
import AIChatTab from '../chatbot/AIChatTab';
import StressTestModal from './StressTestModal';

const formatGradeStr = (grade) => {
  const map = { 'A': 'A (80-100)', 'B': 'B (70-79)', 'C': 'C (60-69)', 'D': 'D (50-59)', 'F': 'F (0-49)' };
  return map[grade] || grade;
};

const COURSES = [
  "ENGLISH FOR INFORMATION TECHNOLOGY",
  "INFORMATION TECHNOLOGY PROFESSIONAL ETHICS",
  "SUN ZI'S ART OF WAR AND BUSINESS STRATEGIES",
  "PROGRAMMING CONCEPTS AND PRACTICES",
  "PROBABILITY AND STATISTICS FOR COMPUTING",
  "OBJECT ORIENTED SYSTEMS ANALYSIS AND DESIGN",
  "INTRODUCTION TO CALCULUS AND APPLICATIONS",
  "DATA COMMUNICATIONS AND NETWORKING",
  "PENGHAYATAN ETIKA DAN PERADABAN (FOR LOCAL STUDENTS)",
  "PHILOSOPHY AND CURRENT ISSUES (FOR INTERNATIONAL STUDENTS)",
  "DATA STRUCTURE AND ALGORITHMIC PROBLEM SOLVING",
  "INTRODUCTION TO COMPUTER ORGANISATION AND ARCHITECTURE",
  "DATABASE DEVELOPMENT AND APPLICATIONS",
  "BASIC ALGEBRA",
  "DISCRETE MATHEMATICS",
  "BAHASA MELAYU",
  "FALSAFAH DAN ISU SEMASA ",
  "CYBERSECURITY",
  "BASIC PROFESSIONAL WRITING",
  "CRITICAL READING AND THINKING",
  "INTERPERSONAL COMMUNICATION",
  "SOCIAL ENTREPRENEURSHIP PROJECT",
  "ARTS AND CULTURAL PERFORMANCE",
  "COMMUNITY PROJECT",
  "LANGUAGE, CULTURE AND SOCIAL STUDY ABROAD",
  "TEAM WORK AND COLLABORATIVE PROJECT",
  "STUDY SOFT SKILLS AND/OR LIFE SKILLS ABROAD",
  "ART, CRAFT, AND DESIGN",
  "ORAL COMMUNICATION",
  "MUSIC PERFORMANCE",
  "MANAGING PERSONAL FINANCE",
  "WORK ETHICS AND EQ",
  "MANAGEMENT OF SPORTS ACTIVITY",
  "CRITICAL THINKING, CREATIVE THINKING AND PROBLEM SOLVING",
  "LEADERSHIP AND TEAMBUILDING",
  "BUSINESS PLAN WRITING & PREPARATION",
  "MASSIVE OPEN ONLINE COURSES (MOOC)",
  "OBJECT-ORIENTED PROGRAMMING PRACTICES",
  "CLOUD COMPUTING AND SERVICES",
  "OPERATING SYSTEMS",
  "DATABASE TECHNOLOGY",
  "INTERNETWORKING PRINCIPLES AND PRACTICES",
  "ALGORITHMS ANALYSIS",
  "MINI PROJECT",
  "ARTIFICIAL INTELLIGENCE TECHNIQUES",
  "SOFTWARE ENGINEERING PRINCIPLES",
  "FRONT-END WEB DEVELOPMENT",
  "INTRODUCTION TO INVENTIVE PROBLEM SOLVING AND PROPOSAL WRITING",
  "INDUSTRIAL TRAINING",
  "INTEGRITY AND ANTI-CORRUPTION",
  "MALAYSIAN ECONOMY"
];

const PredictTab = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    course_name: '', attendance_rate: '', midterm_score: '', assignments_avg: '', quizzes_avg: '', study_hours: '', stress_level: '5'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isFetchingMarks, setIsFetchingMarks] = useState(false);
  const [marksNotUploaded, setMarksNotUploaded] = useState(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);
  
  const filteredCourses = COURSES.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase()));

  useEffect(() => {
    const fetchCourseMarks = async () => {
      if (!formData.course_name) {
        setIsAutoFilled(false);
        setMarksNotUploaded(false);
        return;
      }
      setIsFetchingMarks(true);
      try {
        const res = await api.get(`/student/course-marks?course_name=${encodeURIComponent(formData.course_name)}`);
        if (res.data.has_marks) {
          const marks = res.data.marks;
          setFormData(prev => ({
            ...prev,
            attendance_rate: marks.attendance_rate || '',
            midterm_score: marks.midterm_score || '',
            assignments_avg: marks.assignments_avg || '',
            quizzes_avg: marks.quizzes_avg || ''
          }));
          setIsAutoFilled(true);
          setMarksNotUploaded(false);
          toast.success("Course marks auto-filled by Lecturer!");
        } else {
          setFormData(prev => ({
            ...prev,
            attendance_rate: '',
            midterm_score: '',
            assignments_avg: '',
            quizzes_avg: ''
          }));
          setIsAutoFilled(false);
          setMarksNotUploaded(true);
        }
      } catch (err) {
        console.error("Failed to fetch course marks", err);
        setIsAutoFilled(false);
        setMarksNotUploaded(false);
      } finally {
        setIsFetchingMarks(false);
      }
    };

    fetchCourseMarks();
  }, [formData.course_name]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.course_name) return toast.error("Please select a valid course from the list.");
    
    setIsLoading(true);
    try {
      const res = await api.post('/student/predict', formData);
      setResult(res.data.predicted_grade);
      toast.success('Prediction generated!');
    } catch (err) {
      toast.error('Prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100" onMouseLeave={() => setShowCourseDropdown(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Predict Performance</h2>
        <form onSubmit={handlePredict} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={courseSearch} 
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setFormData({...formData, course_name: ''}); 
                    setShowCourseDropdown(true);
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" 
                  placeholder="Type to search for a course..."
                  required={!formData.course_name}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
              
              {showCourseDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, idx) => (
                      <div 
                        key={idx} 
                        className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 font-medium border-b border-gray-50 transition-colors last:border-b-0"
                        onClick={() => {
                          setFormData({...formData, course_name: course});
                          setCourseSearch(course);
                          setShowCourseDropdown(false);
                        }}
                      >
                        {course}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No courses found matching "{courseSearch}"</div>
                  )}
                </div>
              )}
            </div>
            {isAutoFilled && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                <Info className="w-5 h-5 flex-shrink-0" />
                Marks for this course have been uploaded by your lecturer and are locked. You only need to provide your study hours and stress level.
              </div>
            )}
            {marksNotUploaded && (
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                Your lecturer has not uploaded marks for this course yet. Please wait until marks are uploaded to predict your grade.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate (%)</label>
              <input type="number" required min="0" max="100" name="attendance_rate" value={formData.attendance_rate} onChange={handleChange} disabled={isAutoFilled || isFetchingMarks || marksNotUploaded} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Midterm Score</label>
              <input type="number" required min="0" max="100" name="midterm_score" value={formData.midterm_score} onChange={handleChange} disabled={isAutoFilled || isFetchingMarks || marksNotUploaded} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignments Average</label>
              <input type="number" required min="0" max="100" name="assignments_avg" value={formData.assignments_avg} onChange={handleChange} disabled={isAutoFilled || isFetchingMarks || marksNotUploaded} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quizzes Average</label>
              <input type="number" required min="0" max="100" name="quizzes_avg" value={formData.quizzes_avg} onChange={handleChange} disabled={isAutoFilled || isFetchingMarks || marksNotUploaded} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Hours (per week)</label>
              <input type="number" required min="0" name="study_hours" value={formData.study_hours} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl flex flex-col justify-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Stress Level (1-10): {formData.stress_level}</label>
                  <button 
                    type="button"
                    onClick={() => setIsStressModalOpen(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
                  >
                    Not sure? Take a quick quiz
                  </button>
                </div>
                <input type="range" min="1" max="10" name="stress_level" value={formData.stress_level} onChange={handleChange} className="w-full mt-2 accent-blue-600"/>
                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium px-1">
                  <span>1 (Low)</span>
                  <span>10 (High)</span>
                </div>
              </div>
            </div>
          </div>
          <button disabled={isLoading || isFetchingMarks || marksNotUploaded} type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? 'Processing...' : 'Predict My Grade'}
          </button>
        </form>
      </div>

      <StressTestModal 
        isOpen={isStressModalOpen} 
        onClose={() => setIsStressModalOpen(false)} 
        onComplete={(val) => {
          setFormData(prev => ({ ...prev, stress_level: val.toString() }));
          setIsStressModalOpen(false);
        }} 
      />

      {result && (
        <div className={`p-8 rounded-3xl border-2 shadow-lg banner-animation ${result === 'A' || result === 'B' ? 'bg-green-50 border-green-200 text-green-900' : result === 'C' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' : 'bg-red-50 border-red-300 text-red-900 bg-red-stripes'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${result === 'A' || result === 'B' ? 'bg-green-200' : result === 'C' ? 'bg-yellow-200' : 'bg-red-200 animate-pulse'}`}>
              {result === 'A' || result === 'B' ? <Trophy className="w-8 h-8 text-green-700"/> : result === 'C' ? <AlertTriangle className="w-8 h-8 text-yellow-700"/> : <AlertTriangle className="w-8 h-8 text-red-700"/>}
            </div>
            <div>
              <h3 className="text-2xl font-bold">Predicted Grade: {formatGradeStr(result)}</h3>
              <p className="mt-1 font-medium text-lg">
                {result === 'A' || result === 'B' ? 'Great job! You are on track.' : result === 'C' ? 'You are doing okay, but there is room for improvement.' : 'Warning: High Risk of Failing.'}
              </p>
            </div>
          </div>
          { (result === 'D' || result === 'F') && (
            <div className="mt-6 border-t border-red-200/50 pt-6">
              <button onClick={() => navigate('/student/mentors')} className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg transform hover:-translate-y-1 transition-all">
                Book a Mentor Now
              </button>
            </div>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
        .banner-animation { animation: slideIn 0.4s ease-out; }
      `}} />
    </div>
  );
};

const HistoryTab = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/student/history');
        setHistory(res.data);
      } catch (err) { toast.error("Failed to load history"); }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Prediction History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Course</th>
              <th className="p-4 font-medium">Attendance</th>
              <th className="p-4 font-medium">Scores (Mid/Assign/Quiz)</th>
              <th className="p-4 font-medium">Study Hrs</th>
              <th className="p-4 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No predictions made yet.</td></tr>
            ) : history.map((row) => (
              <tr key={row.prediction_id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="p-4 font-medium text-gray-900">{row.course_name}</td>
                <td className="p-4 text-gray-600">{row.attendance_rate}%</td>
                <td className="p-4 text-gray-600">{row.midterm_score} / {row.assignments_avg} / {row.quizzes_avg}</td>
                <td className="p-4 text-gray-600">{row.study_hours}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                    ${row.predicted_grade === 'A' || row.predicted_grade === 'B' ? 'bg-green-100 text-green-800' : 
                      row.predicted_grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {formatGradeStr(row.predicted_grade)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MentorsTab = () => {
  const [stats, setStats] = useState({ totalBookings: 0, completedSessions: 0 });
  const [view, setView] = useState('mentors'); // 'mentors' or 'bookings'
  const [mentors, setMentors] = useState([]);
  const [emailModalData, setEmailModalData] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [cancelPromptId, setCancelPromptId] = useState(null);

  useEffect(() => {
    if (view === 'mentors') {
      const fetchMentors = async () => {
        try {
          const res = await api.get('/mentors');
          setMentors(res.data);
        } catch (err) { toast.error("Failed to load mentors"); }
      };
      fetchMentors();
    } else {
      fetchMyBookings();
    }
  }, [view]);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/appointments/student');
      setMyBookings(res.data);
    } catch (err) {
      toast.error('Failed to load your bookings');
    }
  };

  const handleMentorSelect = async (mentor) => {
    setSelectedMentor(mentor);
    setSelectedSlotId('');
    setAvailableSlots([]);
    setIsLoadingSlots(true);
    try {
      const res = await api.get(`/mentors/slots/${mentor.id}`);
      setAvailableSlots(res.data);
    } catch (err) {
      toast.error("Failed to load mentor's available slots");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return toast.error("Please select a time slot");
    
    const slot = availableSlots.find(s => s.slot_id.toString() === selectedSlotId);
    if (!slot) return toast.error("Invalid slot selected");

    try {
      await api.post('/appointments/book', {
        mentor_id: selectedMentor.id,
        appointment_date: slot.slot_date.split('T')[0],
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_id: slot.slot_id
      });
      toast.success("Appointment Booked Successfully!");
      setSelectedMentor(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    }
  };

  const handleCancelBooking = async (appointmentId) => {
    try {
      await api.put(`/appointments/${appointmentId}/cancel-student`);
      toast.success('Booking cancelled');
      setCancelPromptId(null);
      fetchMyBookings();
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{view === 'mentors' ? 'Available Mentors' : 'My Bookings'}</h2>
        <button 
          onClick={() => setView(view === 'mentors' ? 'bookings' : 'mentors')}
          className="px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-xl hover:bg-purple-200 transition-colors shadow-sm"
        >
          {view === 'mentors' ? 'View My Bookings' : 'View Mentors'}
        </button>
      </div>

      {view === 'mentors' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map(mentor => (
              <div key={mentor.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-lg flex flex-col transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <img src={mentor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${String(mentor.full_name || 'Mentor').replace(/[^a-zA-Z]/g, '')}`} alt={mentor.full_name || 'Mentor'} className="w-16 h-16 rounded-full border-2 border-purple-100 bg-gray-100" />
                  <div className="flex-1 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{mentor.full_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><UserCircle className="w-4 h-4" /> Mentor</p>
                    </div>
                    {mentor.email && (
                      <button onClick={() => setEmailModalData({ email: mentor.email, name: mentor.full_name })} className="text-purple-600 hover:text-purple-800 bg-purple-50 p-2 rounded-full hover:bg-purple-100 transition-colors inline-block" title="Email Mentor">
                        <Mail className="w-5 h-5"/>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-6 line-clamp-3 h-16">{mentor.specialty_description || 'No description provided.'}</p>
                <button onClick={() => handleMentorSelect(mentor)} className="w-full py-2.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl font-medium transition-colors">
                  Book Session
                </button>
              </div>
            ))}
          </div>

          {/* Booking Modal */}
          {selectedMentor && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button onClick={() => setSelectedMentor(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold mb-2">Book with {selectedMentor.full_name}</h3>
                <p className="text-gray-500 mb-6 flex items-center gap-2"><Calendar className="w-4 h-4"/> Schedule a session</p>
                
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots</label>
                    {isLoadingSlots ? (
                      <p className="text-sm text-gray-500 py-2">Loading slots...</p>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-red-500 py-2">No available slots at the moment.</p>
                    ) : (
                      <select 
                        required 
                        value={selectedSlotId} 
                        onChange={(e) => setSelectedSlotId(e.target.value)} 
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="" disabled>Select a timeslot</option>
                        {availableSlots.map(slot => (
                          <option key={slot.slot_id} value={slot.slot_id}>
                            {new Date(slot.slot_date).toLocaleDateString()} ({slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={availableSlots.length === 0 || isLoadingSlots}
                    className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Confirm Booking
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {(() => {
            const upcomingBookings = [];
            const pastBookings = [];
            
            myBookings.forEach(booking => {
              const apptDateTime = new Date(`${booking.appointment_date.split('T')[0]}T${booking.end_time}`);
              if (booking.status === 'cancelled' || apptDateTime < new Date()) {
                pastBookings.push(booking);
              } else {
                upcomingBookings.push(booking);
              }
            });

            const renderBooking = (booking) => {
              const apptDateTime = new Date(`${booking.appointment_date.split('T')[0]}T${booking.end_time}`);
              const isDone = booking.status !== 'cancelled' && apptDateTime < new Date();

              return (
                <div key={booking.appointment_id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img src={booking.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${String(booking.mentor_name || 'Mentor').replace(/[^a-zA-Z]/g, '')}`} alt="mentor" className="w-12 h-12 rounded-full border border-gray-200 bg-gray-100" />
                    <div>
                      <h3 className="font-bold text-gray-900">{booking.mentor_name}</h3>
                      <p className="text-sm text-gray-500">{booking.mentor_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">
                        {new Date(booking.appointment_date).toLocaleDateString()} at {booking.start_time.substring(0,5)}
                      </span>
                    </div>
                    {booking.status === 'cancelled' ? (
                      <span className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
                        Cancelled
                      </span>
                    ) : isDone ? (
                      <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Done
                      </span>
                    ) : (
                      <button 
                        onClick={() => setCancelPromptId(booking.appointment_id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 px-1">Upcoming Sessions</h3>
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {upcomingBookings.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">You have no upcoming bookings.</div>
                    ) : (
                      <div className="flex flex-col">
                        {upcomingBookings.map(renderBooking)}
                      </div>
                    )}
                  </div>
                </div>

                {pastBookings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 px-1 mt-6">Past Sessions</h3>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden opacity-80">
                      <div className="flex flex-col">
                        {pastBookings.map(renderBooking)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {emailModalData && (
        <EmailModal 
          recipientEmail={emailModalData.email} 
          recipientName={emailModalData.name} 
          onClose={() => setEmailModalData(null)} 
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelPromptId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cancel Booking?</h3>
            <p className="text-gray-500 mb-6 flex items-center justify-center gap-2">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setCancelPromptId(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => handleCancelBooking(cancelPromptId)}
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



const StudentDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: 'predict', icon: Activity, label: 'Predict' },
    { path: 'history', icon: Clock, label: 'History' },
    { path: 'mentors', icon: Users, label: 'Mentors' },
    { path: 'chat', icon: Bot, label: 'AI Chat' },
    { path: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const currentTab = location.pathname.split('/').pop();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 h-[calc(100vh-73px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col md:h-full flex-shrink-0">
        <div className="p-6 pb-2 hidden md:block">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Student Menu</p>
        </div>
        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.path || (currentTab === 'student' && item.path === 'predict');
            return (
              <Link
                key={item.path}
                to={`/student/${item.path}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Routes>
          <Route path="/" element={<PredictTab />} />
          <Route path="/predict" element={<PredictTab />} />
          <Route path="/history" element={<HistoryTab />} />
          <Route path="/mentors" element={<MentorsTab />} />
          <Route path="/chat" element={<AIChatTab />} />
          <Route path="/profile" element={<ProfileTab accentColor="blue" />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentDashboard;
