import React from 'react';
import { NotificationItem } from '../types';
import {
  Bell,
  CreditCard,
  FolderGit2,
  TrendingUp,
  CalendarCheck,
  LifeBuoy,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationPopupProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onAction?: (actionUrl: string) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'Payment':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'Project':
        return <FolderGit2 className="w-5 h-5 text-indigo-600" />;
      case 'Ads':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'Booking':
        return <CalendarCheck className="w-5 h-5 text-amber-600" />;
      case 'Support':
        return <LifeBuoy className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBg = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-amber-400 bg-amber-50/95';
      case 'high':
        return 'border-indigo-400 bg-indigo-50/95';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-xl shadow-2xl border ${getBg()} backdrop-blur-sm transition-all`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-100 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {notification.type} Update
              </span>
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5">{notification.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
              {notification.message}
            </p>

            <div className="mt-3 flex items-center gap-2">
              {notification.actionButton && notification.actionUrl && onAction && (
                <button
                  onClick={() => {
                    onAction(notification.actionUrl!);
                    onDismiss();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                >
                  <span>{notification.actionButton}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
