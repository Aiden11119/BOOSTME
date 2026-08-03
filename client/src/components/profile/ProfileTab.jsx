import React, { useState, useEffect, useRef } from 'react';
import { Pencil, X, Save, User, Mail, BookOpen, IdCard, GraduationCap, BadgeInfo, Camera, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { COURSES } from '../../constants/courses';
import { useAuth } from '../../context/AuthContext';

// ─── Reusable sub-components ────────────────────────────────────────────────

const DEPARTMENTS = ['Computer Science', 'Engineering', 'Business', 'Mathematics', 'Science', 'Arts', 'Law', 'Medicine'];
const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
const INCOME_LEVELS = ['Low', 'Medium', 'High'];

/** A read-only info card for View mode */
const InfoField = ({ label, value, icon: Icon, fullWidth = false }) => (
  <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : ''}`}>
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </span>
    <span className="text-gray-800 font-medium text-base leading-snug break-words">
      {value || <span className="text-gray-300 italic">Not set</span>}
    </span>
  </div>
);

/** Shared input wrapper for Edit mode */
const FormField = ({ label, children, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 transition-all";
const selectCls = `${inputCls} cursor-pointer`;

// ─── Main ProfileTab component ───────────────────────────────────────────────

const ProfileTab = ({ accentColor = 'blue' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);   // authoritative data from DB
  const [formData, setFormData] = useState({});     // working copy for edit mode
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const { updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Initialize theme from localStorage and apply global class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_new_password: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleChangePassword = async () => {
    const { current_password, new_password, confirm_new_password } = passwordData;
    if (!current_password || !new_password || !confirm_new_password) {
      return toast.error('All password fields are required.');
    }
    if (new_password.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }
    if (new_password !== confirm_new_password) {
      return toast.error('New passwords do not match.');
    }

    setIsChangingPassword(true);
    try {
      await api.put('/users/change-password', passwordData);
      toast.success('Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
      setShowChangePassword(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setIsUploadingAvatar(true);
    try {
      const res = await api.post('/users/profile/avatar', uploadData);
      const newUrl = res.data.avatar_url;
      setProfile(prev => ({ ...prev, avatar_url: newUrl }));
      setFormData(prev => ({ ...prev, avatar_url: newUrl }));
      
      updateUser({ avatar_url: newUrl });
      
      toast.success('Avatar updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
    }
  };

  // ── Fetch profile on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data);
        setFormData(res.data);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCancel = () => {
    setFormData(profile);       // reset to last saved state
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/users/profile', formData);
      const updated = res.data.user;
      setProfile(updated);
      setFormData(updated);
      updateUser(updated);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading / error guards ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin h-10 w-10 border-4 border-${accentColor}-500 border-t-transparent rounded-full`} />
      </div>
    );
  }
  if (!profile) return null;

  const role = profile.role;

  // Accent palette derived from role colour prop
  const accent = {
    blue: { ring: 'focus:ring-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-100', avatarBorder: 'border-blue-200' },
    green: { ring: 'focus:ring-green-500', btn: 'bg-green-600 hover:bg-green-700', badge: 'bg-green-100 text-green-700', border: 'border-green-100', avatarBorder: 'border-green-200' },
    purple: { ring: 'focus:ring-purple-500', btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-100', avatarBorder: 'border-purple-200' },
  }[accentColor] || accent?.blue;

  // ── Role badge label ─────────────────────────────────────────────────────
  const roleLabel = { student: '🎓 Student', lecturer: '📖 Lecturer', mentor: '🤝 Mentor' }[role] || role;

  // ── VIEW MODE ────────────────────────────────────────────────────────────
  const ViewContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
      <InfoField label="Full Name" value={profile.full_name} icon={User} />
      <InfoField label="Email" value={profile.email} icon={Mail} />

      {role === 'student' && (<>
        <InfoField label="Student ID" value={profile.student_id_number} icon={IdCard} />
        <InfoField label="Department" value={profile.department} icon={BookOpen} />
        <InfoField label="Semester" value={profile.semester} icon={GraduationCap} />
        <InfoField label="Age" value={profile.age} />
        <InfoField label="Gender" value={profile.gender} />
        <InfoField label="Family Income Level" value={profile.family_income_level} />
      </>)}

      {role === 'lecturer' && (
        <>
          <InfoField label="Department" value={profile.department} icon={BookOpen} />
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Courses Taught
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.courses && profile.courses.length > 0 ? (
                profile.courses.map(course => (
                  <span key={course} className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${accent.badge}`}>
                    {course}
                  </span>
                ))
              ) : (
                <span className="text-gray-300 italic">None selected</span>
              )}
            </div>
          </div>
        </>
      )}

      {role === 'mentor' && (
        <InfoField
          label="Specialty Description"
          value={profile.specialty_description}
          icon={BadgeInfo}
          fullWidth
        />
      )}
    </div>
  );

  // ── EDIT MODE ────────────────────────────────────────────────────────────
  const EditContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

      {/* Common — Full Name */}
      <FormField label="Full Name">
        <input
          type="text" name="full_name"
          value={formData.full_name || ''}
          onChange={handleChange}
          className={inputCls}
          placeholder="Your full name"
        />
      </FormField>

      {/* Common — Email (always disabled) */}
      <FormField label="Email">
        <input
          type="email" name="email"
          value={profile.email}
          disabled
          className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
        />
      </FormField>

      {/* ── Student fields ── */}
      {role === 'student' && (<>
        <FormField label="Student ID">
          <input
            type="text" name="student_id_number"
            value={profile.student_id_number || ''}
            disabled
            className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
          />
        </FormField>

        <FormField label="Department">
          <select name="department" value={formData.department || ''} onChange={handleChange} className={selectCls}>
            <option value="">Select department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        <FormField label="Semester">
          <select name="semester" value={formData.semester || ''} onChange={handleChange} className={selectCls}>
            <option value="">Select semester</option>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>

        <FormField label="Age">
          <input
            type="number" name="age" min="15" max="60"
            value={formData.age || ''}
            onChange={handleChange}
            className={inputCls}
          />
        </FormField>

        <FormField label="Gender">
          <div className="flex items-center gap-6 mt-2">
            {['Male', 'Female', 'Other'].map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium">
                <input
                  type="radio" name="gender" value={g}
                  checked={formData.gender === g}
                  onChange={handleChange}
                  className="accent-blue-600 w-4 h-4"
                />
                {g}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Family Income Level">
          <select name="family_income_level" value={formData.family_income_level || ''} onChange={handleChange} className={selectCls}>
            <option value="">Select level</option>
            {INCOME_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormField>
      </>)}

      {/* ── Lecturer fields ── */}
      {role === 'lecturer' && (
        <>
          <FormField label="Department">
            <select name="department" value={formData.department || ''} onChange={handleChange} className={selectCls}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          
          <FormField label="Courses Taught (Select all that apply)" fullWidth>
            <div className="border border-gray-200 rounded-xl p-4 bg-white max-h-60 overflow-y-auto space-y-2 mt-1">
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                value={courseSearchQuery}
              />
              {COURSES.filter(c => c.toLowerCase().includes((courseSearchQuery || '').toLowerCase())).map(course => {
                const isChecked = (formData.courses || []).includes(course);
                return (
                  <label key={course} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const currentCourses = formData.courses || [];
                        const updatedCourses = currentCourses.includes(course)
                          ? currentCourses.filter(c => c !== course)
                          : [...currentCourses, course];
                        setFormData(prev => ({ ...prev, courses: updatedCourses }));
                      }}
                      className="rounded border-gray-200 text-green-600 focus:ring-green-500"
                    />
                    {course}
                  </label>
                );
              })}
            </div>
            {(formData.courses || []).length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(formData.courses || []).map(c => (
                  <span key={c} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-lg">
                    {c}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, courses: (prev.courses || []).filter(course => course !== c) }));
                      }}
                      className="text-green-500 hover:text-green-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>
        </>
      )}

      {/* ── Mentor fields ── */}
      {role === 'mentor' && (
        <FormField label="Specialty Description" fullWidth>
          <textarea
            name="specialty_description"
            value={formData.specialty_description || ''}
            onChange={handleChange}
            rows={5}
            className={`${inputCls} resize-none leading-relaxed`}
            placeholder="Describe your specialty, experience, and how you help students..."
          />
        </FormField>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header card */}
      <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-sm border ${accent.border}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div 
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`w-20 h-20 rounded-full border-4 ${accent.avatarBorder} overflow-hidden shadow-sm relative`}>
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=random&size=128`}
                alt="Avatar"
                className={`w-full h-full object-cover transition-opacity duration-200 ${isUploadingAvatar ? 'opacity-50' : 'group-hover:opacity-75'}`}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className={`animate-spin h-5 w-5 border-2 border-${accentColor}-600 border-t-transparent rounded-full`} />
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{profile.full_name}</h2>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${accent.badge}`}>
              {roleLabel}
            </span>
          </div>

          {/* Buttons — top-right on desktop */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-2 px-5 py-2.5 ${accent.btn} text-white rounded-xl font-semibold shadow-sm transition-all hover:-translate-y-0.5`}
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-5 py-2.5 ${accent.btn} text-white rounded-xl font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Field grid */}
        {isEditing ? <EditContent /> : <ViewContent />}
      </div>

      {/* Change Password Section */}
      <div className={`bg-white rounded-3xl shadow-sm border ${accent.border} overflow-hidden`}>
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${accent.badge}`}>
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>
          {showChangePassword ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showChangePassword && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-fade-in-up">
            <div className="max-w-md space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className={inputCls + ' pr-10'}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className={inputCls + ' pr-10'}
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.new_password && passwordData.new_password.length < 6 && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Password must be at least 6 characters</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={passwordData.confirm_new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
                    className={inputCls + ' pr-10'}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordData.confirm_new_password && passwordData.new_password !== passwordData.confirm_new_password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_new_password || passwordData.new_password.length < 6 || passwordData.new_password !== passwordData.confirm_new_password}
                  className={`flex items-center gap-2 px-6 py-2.5 ${accent.btn} text-white rounded-xl font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  <Lock className="w-4 h-4" />
                  {isChangingPassword ? 'Changing...' : 'Update Password'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
                  }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Settings Section */}
      <div className={`bg-white rounded-3xl shadow-sm border ${accent.border} overflow-hidden`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${accent.badge}`}>
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Theme Mode</h3>
              <p className="text-sm text-gray-500">Switch between light and dark mode</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none cursor-pointer ${theme === 'dark' ? accentColor === 'blue' ? 'bg-blue-600' : accentColor === 'green' ? 'bg-green-600' : 'bg-purple-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Member since footer */}
      <p className="text-center text-xs text-gray-300">
        Member since {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
};

export default ProfileTab;
