import React from 'react';
import { X, Mail } from 'lucide-react';

const EmailModal = ({ recipientEmail, recipientName, onClose }) => {
  const getGmailLink = () => `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}`;
  const getOutlookLink = () => `https://outlook.live.com/mail/0/deeplink/compose?to=${recipientEmail}`;
  const getYahooLink = () => `https://compose.mail.yahoo.com/?to=${recipientEmail}`;

  const providers = [
    { name: 'Gmail', icon: 'https://img.icons8.com/color/48/000000/gmail-new.png', link: getGmailLink() },
    { name: 'Outlook', icon: 'https://img.icons8.com/color/48/000000/microsoft-outlook-2019--v2.png', link: getOutlookLink() },
    { name: 'Yahoo Mail', icon: 'https://img.icons8.com/color/48/000000/yahoo.png', link: getYahooLink() }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Contact {recipientName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6 text-center">
            Send an email using your own personal email account. Choose your preferred email provider below:
          </p>
          
          <div className="space-y-3">
            {providers.map((provider) => (
              <a 
                key={provider.name}
                href={provider.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center gap-4 w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all group"
              >
                <img src={provider.icon} alt={provider.name} className="w-8 h-8 object-contain" />
                <span className="font-medium text-gray-700 group-hover:text-blue-600">{provider.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
