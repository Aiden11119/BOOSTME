import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, UserCircle, Search, Mail, Filter, AlertCircle, Upload, FileSpreadsheet, Download, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ProfileTab from '../profile/ProfileTab';
import EmailModal from '../common/EmailModal';
import { useAuth } from '../../context/AuthContext';
import GlobalAnnouncement from '../common/GlobalAnnouncement';

const DEPARTMENTS = ['Engineering', 'Business', 'CS', 'Mathematics'];
const SEMESTERS = ['Y1S1', 'Y1S2', 'Y1S3', 'Y2S1', 'Y2S2', 'Y2S3', 'Y3S1', 'Y3S2', 'Y3S3'];
const MonitorTab = () => {
  const { user } = useAuth();
  const lecturerCourses = user?.courses || [];

  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ department: '', semester: '', course: '' });
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);

  const filteredCourses = courseSearch 
    ? lecturerCourses.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase())) 
    : lecturerCourses;

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.semester) queryParams.append('semester', filters.semester);
      if (filters.course) queryParams.append('course', filters.course);
      
      const res = await api.get(`/lecturer/students?${queryParams.toString()}`);
      
      // The backend already sorts 'D' and 'F' to the top.
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const applyFilter = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Monitor</h2>
          <p className="text-gray-500 text-sm mt-1">Track at-risk students and academic progress</p>
        </div>
        
        <form onSubmit={applyFilter} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select 
            value={filters.department} 
            onChange={(e) => setFilters({...filters, department: e.target.value})}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 text-sm max-w-[150px] truncate"
          >
            <option value="">All Depts</option>
            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          <select 
            value={filters.semester} 
            onChange={(e) => setFilters({...filters, semester: e.target.value})}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 text-sm max-w-[150px] truncate"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map(sem => <option key={sem} value={sem}>{sem}</option>)}
          </select>
          
          <div className="relative text-left" onMouseLeave={() => setShowCourseDropdown(false)}>
            <div className="relative">
              <input 
                type="text" 
                value={courseSearch} 
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setFilters({ ...filters, course: '' }); 
                  setShowCourseDropdown(true);
                }}
                onFocus={() => setShowCourseDropdown(true)}
                className="px-4 py-2 pr-8 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 text-sm max-w-[200px] w-full placeholder-gray-500" 
                placeholder="All Courses (Search)"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            
            {showCourseDropdown && (
              <div className="absolute z-50 w-72 mt-1 sm:right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                <div 
                  className="px-4 py-2.5 hover:bg-green-50 cursor-pointer text-sm text-gray-700 font-medium border-b border-gray-50 transition-colors"
                  onClick={() => {
                    setFilters({ ...filters, course: '' });
                    setCourseSearch('');
                    setShowCourseDropdown(false);
                  }}
                >
                  Clear Selection (All Courses)
                </div>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course, idx) => (
                    <div 
                      key={idx} 
                      className="px-4 py-2 hover:bg-green-50 cursor-pointer text-xs text-gray-700 font-medium border-b border-gray-50 transition-colors"
                      onClick={() => {
                        setFilters({ ...filters, course: course });
                        setCourseSearch(course);
                        setShowCourseDropdown(false);
                      }}
                    >
                      {course}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No matching courses</div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4">Student</th>
                <th className="p-4">ID & Dept</th>
                <th className="p-4">Course</th>
                <th className="p-4">Latest Grade</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {isLoading && (
                <tr className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                   <td><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div></td>
                </tr>
              )}
              {students.length === 0 && !isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No student records found.</td></tr>
              ) : students.map((row) => (
                <tr 
                  key={row.prediction_id} 
                  className={`transition-colors border-l-4 ${row.predicted_grade === 'D' || row.predicted_grade === 'F' ? 'bg-red-50 text-red-900 font-semibold border-red-500 hover:bg-red-100' : 'bg-white border-transparent hover:bg-gray-50'}`}
                >
                  <td className="p-4 flex items-center gap-3">
                    <img src={row.avatar_url || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full bg-gray-200" />
                    <div>
                      <p className="font-medium text-gray-900">{row.full_name}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <p className="font-medium">{row.student_id_number || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{row.department} - {row.semester}</p>
                  </td>
                  <td className="p-4 text-sm font-medium">{row.course_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       { (row.predicted_grade === 'D' || row.predicted_grade === 'F') && <AlertCircle className="w-4 h-4 text-red-600 animate-pulse"/>}
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${row.predicted_grade === 'A' || row.predicted_grade === 'B' ? 'bg-green-100 text-green-800' : 
                        row.predicted_grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-200 text-red-900 border border-red-300 shadow-sm'}`}>
                      {row.predicted_grade}
                    </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setEmailModalData({ email: row.email, name: row.full_name })}
                      className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors shadow-sm"
                      title="Contact Student"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {emailModalData && (
        <EmailModal 
          recipientEmail={emailModalData.email} 
          recipientName={emailModalData.name} 
          onClose={() => setEmailModalData(null)} 
        />
      )}
    </div>
  );
};


const UploadMarksTab = () => {
  const { user } = useAuth();
  const lecturerCourses = user?.courses || [];
  
  const [view, setView] = useState('upload'); // 'upload' or 'history'
  const [selectedCourse, setSelectedCourse] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [historyData, setHistoryData] = useState([]);
  const [historyCourseFilter, setHistoryCourseFilter] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    }
  }, [view]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const url = historyCourseFilter 
        ? `/lecturer/uploaded-files?course=${encodeURIComponent(historyCourseFilter)}`
        : `/lecturer/uploaded-files`;
      const res = await api.get(url);
      setHistoryData(res.data);
    } catch (err) {
      toast.error('Failed to load uploaded files history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const res = await api.get(`/lecturer/download-file/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'];
      const extension = droppedFile.name.split('.').pop().toLowerCase();
      
      if (validTypes.includes(droppedFile.type) || ['xlsx', 'csv', 'xls'].includes(extension)) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a valid Excel (.xlsx) or CSV file.");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return toast.error("Please select a course.");
    if (!file) return toast.error("Please select an Excel or CSV file.");

    const formData = new FormData();
    formData.append('course_name', selectedCourse);
    formData.append('file', file);

    setIsLoading(true);
    try {
      const res = await api.post('/lecturer/upload-marks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Marks uploaded successfully!');
      setFile(null); // Reset file after success
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload marks.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,student_id_number,attendance,assignment,midterm,quiz\n1234567,85,90,75,80";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "marks_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{view === 'upload' ? 'Upload Course Marks' : 'Upload History'}</h2>
        <button 
          onClick={() => setView(view === 'upload' ? 'history' : 'upload')}
          className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition-colors shadow-sm flex items-center gap-2"
        >
          {view === 'upload' ? <><Clock className="w-4 h-4"/> View History</> : <><Upload className="w-4 h-4"/> Upload Marks</>}
        </button>
      </div>

      {view === 'upload' ? (
        <>
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Course Marks</h2>
            <p className="text-gray-500 text-sm mt-1">Upload Excel or CSV files to batch update student marks.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
              required
            >
              <option value="" disabled>-- Select a course you teach --</option>
              {lecturerCourses.map((course, idx) => (
                <option key={idx} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Marks File (.xlsx, .csv)</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-2 flex justify-center px-6 pt-10 pb-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-green-400'}`}
            >
              <input id="file-upload" name="file-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".xlsx, .csv" onChange={handleFileChange} />
              
              <div className="space-y-3 text-center pointer-events-none">
                <FileSpreadsheet className={`mx-auto h-12 w-12 ${isDragging ? 'text-green-500 animate-bounce' : 'text-gray-400'}`} />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="font-medium text-green-600">Click to browse</span>
                  <span className="pl-1">or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? <span className="font-bold text-green-700 text-sm bg-green-100 px-3 py-1 rounded-full">{file.name}</span> : 'Excel or CSV up to 10MB'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-6">
            <button type="button" onClick={downloadTemplate} className="text-sm flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors">
              <Download className="w-4 h-4"/> Download Template
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Uploading...' : 'Upload Marks'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
         <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4"/> Important Instructions
         </h3>
         <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Ensure the file contains a column with the student's ID (e.g., <strong>student_id_number</strong>).</li>
            <li>Other expected columns: <strong>attendance</strong>, <strong>assignment</strong>, <strong>midterm</strong>, <strong>quiz</strong>.</li>
            <li>Column names are case-insensitive and match partially (e.g., "Student ID" works).</li>
            <li>Marks will be auto-filled for students when they predict their grade for this course.</li>
         </ul>
      </div>
      </>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <form onSubmit={handleFilterSubmit} className="flex gap-3 items-center w-full sm:max-w-sm">
              <select 
                value={historyCourseFilter} 
                onChange={(e) => setHistoryCourseFilter(e.target.value)} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white text-sm"
              >
                <option value="">All Uploaded Courses</option>
                {lecturerCourses.map((course, idx) => (
                  <option key={idx} value={course}>{course}</option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4"/> Filter
              </button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                  <th className="p-4">File Name</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y relative">
                {isLoadingHistory && (
                  <tr className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center min-h-[100px]">
                     <td><div className="animate-spin h-6 w-6 border-4 border-green-500 border-t-transparent rounded-full"></div></td>
                  </tr>
                )}
                {historyData.length === 0 && !isLoadingHistory ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">No uploaded files found.</td></tr>
                ) : historyData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-blue-600 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                      <span className="truncate max-w-[200px]" title={row.original_file_name}>{row.original_file_name}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={row.course_name}>{row.course_name}</td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(row.uploaded_at).toLocaleDateString()} {new Date(row.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDownloadFile(row.id, row.original_file_name)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const LecturerDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: 'monitor', icon: Users, label: 'Student Monitor' },
    { path: 'upload-marks', icon: Upload, label: 'Upload Marks' },
    { path: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const currentTab = location.pathname.split('/').pop();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-gray-50 h-[calc(100vh-73px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col md:h-full flex-shrink-0">
        <div className="p-6 pb-2 hidden md:block">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-4">Lecturer Menu</p>
        </div>
        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.path || (currentTab === 'lecturer' && item.path === 'monitor');
            return (
              <Link
                key={item.path}
                to={`/lecturer/${item.path}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  isActive ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
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
          <Route path="/" element={<MonitorTab />} />
          <Route path="/monitor" element={<MonitorTab />} />
          <Route path="/upload-marks" element={<UploadMarksTab />} />
          <Route path="/profile" element={<ProfileTab accentColor="green" />} />
        </Routes>
      </main>
    </div>
  );
};

export default LecturerDashboard;
