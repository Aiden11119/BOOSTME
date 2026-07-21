import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function GlobalAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Failed to load announcements');
      }
    };
    fetchAnnouncements();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div className="w-full space-y-2 mb-6">
      {announcements.map((ann, idx) => (
        <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-xl">📢</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-blue-800">{ann.title}</h3>
              <div className="mt-1 text-sm text-blue-700 whitespace-pre-wrap">
                {ann.content}
              </div>
              <p className="mt-2 text-xs text-blue-500">
                Posted on {new Date(ann.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GlobalAnnouncement;
