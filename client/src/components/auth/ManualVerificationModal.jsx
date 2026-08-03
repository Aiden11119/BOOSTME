import React, { useState } from 'react';
import { X, Send, User, Mail, ShieldAlert, Award, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManualVerificationModal = ({ initialEmail = '', mode = 'register', onClose }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: initialEmail,
    role: 'student',
    id_number: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { full_name, email, role, id_number, message } = formData;

    // Check required fields based on mode
    if (mode === 'register') {
      if (!full_name.trim() || !email.trim() || !id_number.trim() || !message.trim()) {
        return toast.error('Please fill in all required fields.');
      }
    } else {
      if (!email.trim() || !id_number.trim() || !message.trim()) {
        return toast.error('Please fill in all required fields.');
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !email.toLowerCase().endsWith('utar.my')) {
      return toast.error('A valid UTAR email (ending with utar.my) is required.');
    }

    setIsLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/submit-registration-request' : '/auth/submit-reset-request';
      const payload = mode === 'register' 
        ? formData 
        : { email: formData.email, id_number: formData.id_number, message: formData.message };
      
      const res = await api.post(endpoint, payload);
      toast.success(res.data.message || 'Request submitted successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification request.');
    } finally {
      setIsLoading(false);
    }
  };

  const isReset = mode === 'reset_password';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative overflow-hidden transition-all duration-300">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full filter blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full filter blur-2xl pointer-events-none"></div>

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {isReset ? 'Manual Password Reset Request' : 'Manual Registration Request'}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">
              {isReset ? 'Submit details to request a manual password reset' : 'Submit details for admin validation & approval'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isReset && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    placeholder="TING SING SOON"
                  />
                </div>
              </div>
            )}

            <div className={isReset ? 'col-span-2' : ''}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">UTAR Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                  placeholder="aiden@1utar.my"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isReset ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Registering Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-sm font-medium transition-all"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">UTAR ID Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Award className="h-4.5 w-4.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="id_number"
                      required
                      value={formData.id_number}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                      placeholder="2305674 / Staff ID"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">UTAR ID Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Award className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="id_number"
                    required
                    value={formData.id_number}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    placeholder="2305674 / Staff ID"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {isReset ? 'Reason for Password Reset *' : 'Verification Message / Reason *'}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 flex items-start pointer-events-none">
                <FileText className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                rows="3"
                className="pl-10 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all resize-none"
                placeholder={isReset 
                  ? "Describe why you need a manual password reset (e.g., reset email OTP didn't arrive)."
                  : "Please describe why you are requesting manual verification (e.g., OTP email never arrived)."
                }
              ></textarea>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-yellow-800 dark:text-yellow-300 font-semibold leading-relaxed">
            📢 <strong>Notice:</strong> Once approved, you will receive an confirmation email with your login details.
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'} <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ManualVerificationModal;
