import { useState, useEffect } from 'react';
import { Bell, Check, Clock, FileText, Receipt, ShieldAlert, Trash2 } from 'lucide-react';
import { notificationService } from '../../../services/notification.service';
import toast from 'react-hot-toast';
import { formatDate } from '../../../utils/format';

export function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationService.getAll();
      const data = res.data?.notifications || res.data || [];
      setNotifications(data);
    } catch (err) {
      toast.error('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch(type) {
      case 'NEW_INVOICE': return <Receipt className="w-5 h-5 text-blue-500" />;
      case 'INVOICE_PAID': return <Check className="w-5 h-5 text-emerald-500" />;
      case 'OVERDUE_INVOICE': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'CONTRACT_EXPIRING': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-[calc(100%+12px)] right-0 w-[320px] sm:w-[380px] origin-top-right bg-white rounded-3xl shadow-2xl shadow-[var(--color-tenant-primary)]/20 border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-[var(--color-tenant-primary)] text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" /> Thông báo
          </h3>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-[var(--color-tenant-primary)]/50 hover:text-[var(--color-tenant-primary)] transition-colors"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-tenant-primary)] border-t-transparent rounded-full animate-spin"></div></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">Không có thông báo nào</div>
          ) : (
            notifications.map(noti => (
              <div 
                key={noti._id} 
                onClick={() => !noti.isRead && handleMarkAsRead(noti._id)}
                className={`p-3 rounded-2xl flex gap-3 transition-colors cursor-pointer ${noti.isRead ? 'opacity-60 hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${noti.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                  {getIcon(noti.type)}
                </div>
                <div>
                  <h4 className={`text-sm ${noti.isRead ? 'font-bold text-slate-700' : 'font-black text-[var(--color-tenant-primary)]'}`}>
                    {noti.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{noti.message}</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block uppercase tracking-wider">{formatDate(noti.createdAt)}</span>
                </div>
                {!noti.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 self-center ml-auto" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
