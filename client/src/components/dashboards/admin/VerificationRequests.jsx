import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Check, X, Search, Clock, Calendar, Mail, User, ShieldAlert, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';

function VerificationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/registration-requests');
      setRequests(res.data);
    } catch (err) {
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name, type) => {
    const isReset = type === 'reset_password';
    const confirmMsg = isReset
      ? `Are you sure you want to APPROVE ${name}'s request? Their password will be reset to the temporary credential '123456'.`
      : `Are you sure you want to APPROVE ${name}'s registration request? An account will be created with temporary password '123456'.`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setActionLoadingId(id);
    try {
      const res = await api.post(`/admin/registration-requests/${id}/approve`);
      toast.success(res.data.message || 'Request approved successfully!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, name, type) => {
    const isReset = type === 'reset_password';
    const confirmMsg = isReset
      ? `Are you sure you want to REJECT ${name}'s password reset request?`
      : `Are you sure you want to REJECT ${name}'s registration request?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(id);
    try {
      const res = await api.post(`/admin/registration-requests/${id}/reject`);
      toast.success(res.data.message || 'Request rejected.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const typeLabel = req.request_type === 'reset_password' ? 'password reset reset_password' : 'new register registration';
      return (
        req.full_name.toLowerCase().includes(lowerSearch) ||
        req.email.toLowerCase().includes(lowerSearch) ||
        req.id_number.toLowerCase().includes(lowerSearch) ||
        typeLabel.includes(lowerSearch)
      );
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="font-semibold text-sm">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📝 Verification & Reset Requests
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manually review and approve pending registration requests or password reset requests from users who did not receive email codes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search by name, email, ID or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-100 text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Request Type</th>
              <th className="px-6 py-4">Role & ID</th>
              <th className="px-6 py-4">Reason / Feedback</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {currentRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                  🎉 No pending registration or reset requests found.
                </td>
              </tr>
            ) : (
              currentRequests.map((req) => {
                const isReset = req.request_type === 'reset_password';
                return (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isReset ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {req.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{req.full_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isReset ? (
                        <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200/50 flex items-center gap-1.5 w-fit">
                          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} /> Password Reset
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 flex items-center gap-1.5 w-fit">
                          <User className="w-3 h-3" /> New Register
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1 capitalize mb-1.5
                        ${req.role === 'student' ? 'bg-green-50 text-green-700 border border-green-200/50' : 
                          req.role === 'lecturer' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' : 
                          'bg-purple-50 text-purple-700 border border-purple-200/50'}`}>
                        {req.role === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : 
                         req.role === 'lecturer' ? <BookOpen className="w-3.5 h-3.5" /> : 
                         <User className="w-3.5 h-3.5" />}
                        {req.role}
                      </span>
                      <p className="text-xs font-semibold text-gray-600">ID: {req.id_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                      <p className="italic bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100 text-xs">
                        "{req.message || 'No description provided.'}"
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      <p className="font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {new Date(req.created_at).toLocaleDateString()}</p>
                      <p className="flex items-center gap-1 mt-1 text-gray-400"><Clock className="w-3.5 h-3.5 text-gray-300" /> {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.full_name, req.request_type)}
                          disabled={actionLoadingId !== null}
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                          title="Approve Request"
                        >
                          {actionLoadingId === req.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.full_name, req.request_type)}
                          disabled={actionLoadingId !== null}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                          title="Reject Request"
                        >
                          {actionLoadingId === req.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-white mt-4 rounded-b-2xl">
          <p className="text-xs text-gray-500 font-semibold">
            Showing <span className="text-blue-600">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-blue-600">{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> of{' '}
            <span className="text-gray-900">{filteredRequests.length}</span> requests
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationRequests;
