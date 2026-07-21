import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetStudents, setTargetStudents] = useState(true);
  const [targetLecturers, setTargetLecturers] = useState(true);
  const [targetMentors, setTargetMentors] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/all');
      setAnnouncements(res.data);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return toast.error('Please fill in all fields');
    
    try {
      await api.post('/announcements', { 
        title, 
        content,
        target_students: targetStudents,
        target_lecturers: targetLecturers,
        target_mentors: targetMentors
      });
      toast.success('Announcement published!');
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to publish announcement');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/announcements/${id}/status`, { is_active: !currentStatus });
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Post Global Announcement</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. System Maintenance Tomorrow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="4"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your announcement details here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={targetStudents} 
                  onChange={(e) => setTargetStudents(e.target.checked)} 
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Students</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={targetLecturers} 
                  onChange={(e) => setTargetLecturers(e.target.checked)} 
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Lecturers</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={targetMentors} 
                  onChange={(e) => setTargetMentors(e.target.checked)} 
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Mentors</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Announcements</h2>
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-500 p-4">No announcements found.</div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className={`border rounded-lg p-4 ${ann.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {ann.title}
                      {!ann.is_active && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>}
                    </h3>
                    <div className="flex gap-2 my-1">
                      {ann.target_students ? <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Students</span> : null}
                      {ann.target_lecturers ? <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">Lecturers</span> : null}
                      {ann.target_mentors ? <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">Mentors</span> : null}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">By {ann.author} on {new Date(ann.created_at).toLocaleString()}</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{ann.content}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleStatus(ann.id, ann.is_active)}
                      className={`px-3 py-1 text-sm rounded ${ann.is_active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {ann.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnouncementManagement;
