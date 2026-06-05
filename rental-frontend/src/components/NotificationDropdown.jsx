import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, FileText, Info, Receipt, Zap, AlertCircle } from "lucide-react";
import { notificationService } from "../services/notification.service";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll({ page: 1, limit: 15 });
      const list = Array.isArray(response) ? response : (response?.data?.notifications || response?.data || []);
      setNotifications(list);
      
      // Tính số lượng chưa đọc
      const unread = list.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Lỗi lấy thông báo", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 3 minutes
    const interval = setInterval(fetchNotifications, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      // Update state locally for instant feedback
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setIsLoading(true);
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu đọc tất cả");
    } catch (error) {
      toast.error("Không thể đánh dấu đọc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id, notification.isRead);
    setIsOpen(false);
    
    // Điều hướng dựa trên loại thông báo
    switch (notification.type) {
      case 'NEW_INVOICE':
        navigate('/invoices');
        break;
      case 'METER_READING':
        navigate('/meter-readings');
        break;
      case 'CONTRACT':
        navigate('/contracts');
        break;
      default:
        break;
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'NEW_INVOICE':
        return <Receipt className="h-5 w-5 text-blue-500" />;
      case 'METER_READING':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'CONTRACT':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className={`relative p-2 rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 transform origin-top-right overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Thông báo {unreadCount > 0 && <span className="ml-1 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">{unreadCount} mới</span>}</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead} 
                disabled={isLoading}
                className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Đã đọc tất cả
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                <p className="text-sm">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(notification => (
                  <div 
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className={`mt-0.5 shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-100'}`}>
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <p className={`text-sm truncate ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 ${!notification.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="shrink-0 flex items-center justify-center w-2">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <span className="text-xs font-medium text-slate-500">Xem tất cả thông báo</span>
          </div>
        </div>
      )}
    </div>
  );
}
