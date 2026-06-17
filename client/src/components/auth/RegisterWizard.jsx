import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, BookOpen, GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, Upload, X, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COURSES } from '../../constants/courses';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam'
];

const DEPARTMENTS = [
  "Engineering",
  "Business",
  "CS",
  "Mathematics"
];

const RegisterWizard = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Lecturer Courses State
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  const handleCourseToggle = (course) => {
    setSelectedCourses(prev =>
      prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]
    );
  };

  const [formData, setFormData] = useState({
    role: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    student_id_number: '',
    department: '',
    semester: '',
    age: '',
    gender: '',
    family_income_level: '',
    specialty_description: '',
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Checks for Step 3 (Details) validation dynamically based on role
  const isStep3Valid = () => {
    if (!formData.full_name || !formData.password || !formData.confirm_password) return false;
    if (formData.password.length < 6) return false;
    if (formData.password !== formData.confirm_password) return false;

    if (formData.role === 'student') {
      return formData.student_id_number && formData.department && formData.semester && formData.age && formData.gender && formData.family_income_level;
    }
    if (formData.role === 'lecturer') {
      return formData.department && selectedCourses.length > 0;
    }
    if (formData.role === 'mentor') {
      return formData.specialty_description;
    }
    return false;
  };

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error("Please enter a valid email address");
    }

    setIsSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setOtpSent(true);
      toast.success('Verification code sent to your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      return toast.error("Please enter the 6-digit code");
    }

    setIsVerifyingOtp(true);
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp_code: otpCode });
      toast.success('Email verified successfully!');
      setCurrentStep(3); // Proceed to Details
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setCurrentStep(2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('File size must be less than 2MB');
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData({ ...formData, avatar_url: '' });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const selectDefaultAvatar = (avatar) => {
    setFormData({ ...formData, avatar_url: avatar });
    clearFile();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const data = new FormData();

      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      if (formData.role === 'lecturer') {
        data.append('courses', JSON.stringify(selectedCourses));
      }

      if (selectedFile) {
        data.append('avatar', selectedFile);
      }

      const response = await api.post('/auth/register', data);

      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-2xl w-full space-y-8 bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 relative z-10 w-full transition-all duration-500">

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex flex-col items-center justify-between relative">
            <div className="flex items-center justify-between relative w-full mb-2">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 rounded"></div>
              <div className="absolute left-0 top-1/2 h-1 bg-blue-500 -z-10 rounded transition-all duration-500" style={{ width: `${(currentStep - 1) * 33.3}%` }}></div>
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center border-4 font-bold transition-all duration-300 ${currentStep >= step ? 'bg-blue-600 border-blue-200 text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-200 text-gray-400'}`}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
              ))}
            </div>
            <div className="flex justify-between w-full text-xs font-medium text-gray-500">
              <span className="text-left w-1/4">Role</span>
              <span className="text-center w-1/4">Verify</span>
              <span className="text-center w-1/4">Details</span>
              <span className="text-right w-1/4">Avatar</span>
            </div>
          </div>
        </div>

        {/* STEP 1: Role Selection */}
        {currentStep === 1 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join BoostMe</h2>
              <p className="mt-2 text-gray-600">Please select your primary role</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <button onClick={() => handleRoleSelect('student')} className="group flex flex-col items-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Student</h3>
                <p className="text-sm text-gray-500 mt-2 text-center">Track predictions and get help</p>
              </button>

              <button onClick={() => handleRoleSelect('lecturer')} className="group flex flex-col items-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Lecturer</h3>
                <p className="text-sm text-gray-500 mt-2 text-center">Monitor student performance</p>
              </button>

              <button onClick={() => handleRoleSelect('mentor')} className="group flex flex-col items-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mentor</h3>
                <p className="text-sm text-gray-500 mt-2 text-center">Counsel at-risk students</p>
              </button>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link></p>
            </div>
          </div>
        )}

        {/* STEP 2: Email & OTP */}
        {currentStep === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Email Verification</h2>
              <p className="text-gray-500 mt-2">We need to verify your email address to continue.</p>
            </div>

            <div className="space-y-6 max-w-sm mx-auto">
              {!otpSent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      placeholder="you@gmail.com"
                    />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !formData.email}
                    className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSendingOtp ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button onClick={() => setOtpSent(false)} className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                    Change Email
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => { setCurrentStep(1); setOtpSent(false); }} className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Details */}
        {currentStep === 3 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 capitalize">
              {formData.role} Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Common Fields */}
              <div className="col-span-1 sm:col-span-2 space-y-5">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Verified Email: {formData.email}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" />
                </div>

                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    {formData.confirm_password && formData.password !== formData.confirm_password && (
                      <p className="text-red-500 text-xs mt-1 font-medium">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Fields */}
              {formData.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input type="text" name="student_id_number" value={formData.student_id_number} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all">
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all">
                      <option value="">Select...</option>
                      <option value="Y1S1">Y1S1</option>
                      <option value="Y1S2">Y1S2</option>
                      <option value="Y1S3">Y1S3</option>
                      <option value="Y2S1">Y2S1</option>
                      <option value="Y2S2">Y2S2</option>
                      <option value="Y2S3">Y2S3</option>
                      <option value="Y3S1">Y3S1</option>
                      <option value="Y3S2">Y3S2</option>
                      <option value="Y3S3">Y3S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="Male" onChange={handleChange} checked={formData.gender === 'Male'} className="w-4 h-4 text-blue-600" /> Male
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value="Female" onChange={handleChange} checked={formData.gender === 'Female'} className="w-4 h-4 text-pink-600" /> Female
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Family Income Level</label>
                    <select name="family_income_level" value={formData.family_income_level} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all">
                      <option value="">Select...</option>
                      <option value="Low">Low (0-3000)</option>
                      <option value="Medium">Medium (3000-8000)</option>
                      <option value="High">High (&gt;8000)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Lecturer Fields */}
              {formData.role === 'lecturer' && (
                <>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all">
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courses Taught (Select all that apply)</label>
                    <div className="border border-gray-300 rounded-xl p-4 bg-white max-h-60 overflow-y-auto space-y-2">
                      <input
                        type="text"
                        placeholder="Search courses to teach..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setCourseSearchQuery(e.target.value)}
                        value={courseSearchQuery}
                      />
                      {COURSES.filter(c => c.toLowerCase().includes((courseSearchQuery || '').toLowerCase())).map(course => {
                        const isChecked = selectedCourses.includes(course);
                        return (
                          <label key={course} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCourseToggle(course)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {course}
                          </label>
                        );
                      })}
                    </div>
                    {selectedCourses.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedCourses.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-lg">
                            {c}
                            <button type="button" onClick={() => handleCourseToggle(c)} className="text-blue-500 hover:text-blue-700">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mentor Fields */}
              {formData.role === 'mentor' && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty Description</label>
                  <textarea name="specialty_description" value={formData.specialty_description} onChange={handleChange} rows="4" placeholder="Describe your mentoring style and subjects..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"></textarea>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setCurrentStep(2)} className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!isStep3Valid()}
                className="flex items-center px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Avatar Selection */}
        {currentStep === 4 && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center text-pretty">Complete Your Profile</h2>
            <p className="text-gray-500 text-center mb-10">Upload a custom photo or choose a default avatar</p>

            {/* Custom Upload Section */}
            <div className="mb-10">
              <div className={`relative mx-auto w-40 h-40 rounded-full border-4 border-dashed border-gray-200 flex flex-col items-center justify-center transition-all ${previewUrl ? 'border-blue-400 border-solid' : 'hover:border-blue-400 hover:bg-blue-50/50'}`}>
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full rounded-full object-cover" />
                    <button
                      onClick={clearFile}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500">
                    <Upload className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">Upload Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="relative mb-10 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <span className="relative px-4 bg-white text-sm text-gray-400 font-medium">Or choose a default avatar</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
              {DEFAULT_AVATARS.map((avatar, idx) => (
                <div
                  key={idx}
                  onClick={() => selectDefaultAvatar(avatar)}
                  className={`cursor-pointer border-4 rounded-full p-1 transition-all duration-300 transform hover:scale-105 ${formData.avatar_url === avatar ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/40 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}
                >
                  <img src={avatar} alt="Avatar option" className="w-full h-auto rounded-full" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setCurrentStep(3)} className="flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={(!formData.avatar_url && !selectedFile) || isLoading}
                className="flex justify-center items-center px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Complete Registration
              </button>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default RegisterWizard;
