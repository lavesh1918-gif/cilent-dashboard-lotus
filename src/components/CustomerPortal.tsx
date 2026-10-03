import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Customer,
  Project,
  AdsDailyData,
  PaymentRequest,
  Payment,
  Booking,
  NotificationItem,
  SupportTicket,
  Review,
  AdsPlatform,
} from '../types';
import {
  subscribeCustomer,
  subscribeProjects,
  subscribePayments,
  subscribePaymentRequests,
  subscribeBookings,
  subscribeNotifications,
  subscribeSupportTickets,
  subscribeReviews,
  subscribeAdsData,
  submitPayment,
  createSupportTicket,
  createReview,
  markNotificationRead,
  markNotificationPopupShown,
  updateCustomer,
} from '../services/firestoreService';
import { AdsChart } from './AdsChart';
import { NotificationPopup } from './NotificationPopup';
import {
  LayoutDashboard,
  FolderGit2,
  TrendingUp,
  CreditCard,
  CalendarCheck,
  LifeBuoy,
  Bell,
  Star,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  MousePointerClick,
  PhoneCall,
  MapPin,
  Send,
  MessageCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  Menu,
  X,
  Upload,
  Sparkles,
  ArrowUpRight,
  Percent,
} from 'lucide-react';

interface CustomerPortalProps {
  customerId: string;
  token: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customerId,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Firestore Realtime State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adsData, setAdsData] = useState<AdsDailyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Ads Filter State
  const [adsPlatform, setAdsPlatform] = useState<AdsPlatform>('meta');
  const [adsDateFilter, setAdsDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals & Forms
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentUtr, setPaymentUtr] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentUpi, setPaymentUpi] = useState<string>('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string>('');

  // Support Form State
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportCategory, setSupportCategory] = useState<string>('Website Update');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportPriority, setSupportPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [supportProjectId, setSupportProjectId] = useState<string>('');
  const [submittingSupport, setSubmittingSupport] = useState<boolean>(false);
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string>('');

  // Review Form State
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewProjectId, setReviewProjectId] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Profile Edit State
  const [profileMobile, setProfileMobile] = useState<string>('');
  const [profileAddress, setProfileAddress] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');

  const [effectiveCustomerId, setEffectiveCustomerId] = useState<string>(customerId);

  // Resolve customer ID from token if not provided directly
  useEffect(() => {
    if (customerId) {
      setEffectiveCustomerId(customerId);
      return;
    }
    if (token) {
      const resolveToken = async () => {
        try {
          const q = query(collection(db, 'customers'), where('accessToken', '==', token));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setEffectiveCustomerId(snap.docs[0].id);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      };
      resolveToken();
    }
  }, [customerId, token]);

  // Real-time Listeners
  useEffect(() => {
    if (!effectiveCustomerId) return;
    setLoading(true);
    const unsubs = [
      subscribeCustomer(effectiveCustomerId, cust => {
        setCustomer(cust);
        if (cust) {
          setProfileMobile(cust.mobile || '');
          setProfileAddress(cust.businessAddress || '');
          setProfilePhoto(cust.profilePhoto || '');
        }
        setLoading(false);
      }),
      subscribeProjects(effectiveCustomerId, setProjects),
      subscribePayments(effectiveCustomerId, setPayments),
      subscribePaymentRequests(effectiveCustomerId, setPaymentRequests),
      subscribeBookings(effectiveCustomerId, setBookings),
      subscribeNotifications(effectiveCustomerId, setNotifications),
      subscribeSupportTickets(effectiveCustomerId, setSupportTickets),
      subscribeReviews(effectiveCustomerId, setReviews),
      subscribeAdsData(effectiveCustomerId, setAdsData),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [effectiveCustomerId]);

  // Unread notifications & popup trigger
  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Show popup for latest unread notification that hasn't been shown yet
  const popupNotification = useMemo(() => {
    return notifications.find(n => !n.read && !n.popupShown) || null;
  }, [notifications]);

  const handleDismissPopup = async () => {
    if (popupNotification && effectiveCustomerId) {
      await markNotificationPopupShown(effectiveCustomerId, popupNotification.id);
    }
  };

  // Filter Ads Data based on Platform & Date Filter
  const filteredAdsData = useMemo(() => {
    const platformData = adsData.filter(d => d.platform === adsPlatform);
    const now = new Date();

    return platformData
      .filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);

        if (adsDateFilter === 'today') {
          return item.date === now.toISOString().split('T')[0];
        }
        if (adsDateFilter === 'yesterday') {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          return item.date === y.toISOString().split('T')[0];
        }
        if (adsDateFilter === '7days') {
          const past = new Date(now);
          past.setDate(past.getDate() - 7);
          return itemDate >= past;
        }
        if (adsDateFilter === '30days') {
          const past = new Date(now);
          past.setDate(past.getDate() - 30);
          return itemDate >= past;
        }
        if (adsDateFilter === 'custom') {
          if (customStartDate && item.date < customStartDate) return false;
          if (customEndDate && item.date > customEndDate) return false;
          return true;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [adsData, adsPlatform, adsDateFilter, customStartDate, customEndDate]);

  // Aggregate Ads Metrics
  const adsMetrics = useMemo(() => {
    const totalViews = filteredAdsData.reduce((acc, d) => acc + (d.impressions || d.profileViews || 0), 0);
    const totalClicks = filteredAdsData.reduce((acc, d) => acc + (d.clicks || d.websiteClicks || 0), 0);
    const totalCalls = filteredAdsData.reduce((acc, d) => acc + (d.calls || 0), 0);
    const totalLocalActions = filteredAdsData.reduce((acc, d) => acc + (d.localActions || 0), 0);
    const totalLeads = filteredAdsData.reduce((acc, d) => acc + (d.leads || 0), 0);
    const totalSpend = filteredAdsData.reduce((acc, d) => acc + (d.spend || 0), 0);
    const totalConversions = filteredAdsData.reduce((acc, d) => acc + (d.conversions || 0), 0);
    const avgCtr = filteredAdsData.length > 0
      ? +(filteredAdsData.reduce((acc, d) => acc + (d.ctr || 0), 0) / filteredAdsData.length).toFixed(2)
      : 0;

    return {
      totalViews,
      totalClicks,
      totalCalls,
      totalLocalActions,
      totalLeads,
      totalSpend,
      totalConversions,
      avgCtr,
    };
  }, [filteredAdsData]);

  // Overall Project Progress calculation
  const overallProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    const totalProg = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(totalProg / projects.length);
  }, [projects]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered').length;
  }, [projects]);

  // Pending payment requests
  const pendingRequests = useMemo(() => {
    return paymentRequests.filter(r => r.status === 'pending');
  }, [paymentRequests]);

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (!paymentUtr.trim() || paymentUtr.trim().length < 4) {
      alert('Please enter a valid UTR or Transaction Reference (min 4 characters).');
      return;
    }

    setSubmittingPayment(true);
    try {
      await submitPayment(effectiveCustomerId, {
        amount: amountNum,
        utr: paymentUtr.trim(),
        paymentDate,
        upiId: paymentUpi.trim(),
        paymentProofUrl: paymentProofUrl.trim(),
        notes: paymentNotes.trim(),
        requestId: selectedPaymentRequest?.id,
        projectId: selectedPaymentRequest?.projectId,
      });

      setPaymentSuccessMsg('Payment submitted successfully! Status is Pending Verification.');
      setTimeout(() => {
        setPaymentSuccessMsg('');
        setShowPaymentModal(false);
        setSelectedPaymentRequest(null);
        setPaymentAmount('');
        setPaymentUtr('');
        setPaymentNotes('');
      }, 1800);
    } catch (err) {
      alert('Failed to submit payment. Please verify your connection.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Support Ticket Submit
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      alert('Please fill in both the subject and message.');
      return;
    }

    setSubmittingSupport(true);
    try {
      await createSupportTicket(effectiveCustomerId, {
        subject: supportSubject.trim(),
        category: supportCategory,
        message: supportMessage.trim(),
        priority: supportPriority,
        relatedProjectId: supportProjectId || undefined,
      });

      setSupportSuccessMsg('Support request submitted! We will respond promptly.');
      setSupportSubject('');
      setSupportMessage('');
      setTimeout(() => setSupportSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error submitting support ticket.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  // Handle Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProjectId) {
      alert('Please select a project to review.');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Please leave a comment or feedback.');
      return;
    }

    const proj = projects.find(p => p.id === reviewProjectId);
    setSubmittingReview(true);
    try {
      await createReview(effectiveCustomerId, {
        projectId: reviewProjectId,
        projectName: proj?.name || 'Client Project',
        rating: reviewRating,
        comment: reviewComment.trim(),
        customerName: customer?.name,
        businessName: customer?.businessName,
      });

      setShowReviewModal(false);
      setReviewComment('');
      alert('Thank you for your valuable review!');
    } catch (err) {
      alert('Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateCustomer(effectiveCustomerId, {
        mobile: profileMobile.trim(),
        businessAddress: profileAddress.trim(),
        profilePhoto: profilePhoto.trim(),
      });
      setProfileSuccessMsg('Profile updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Check token validity / access authorization
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Verifying secure portal credentials...</p>
      </div>
    );
  }

  // If customer not found or token disabled or token mismatch
  if (!customer || customer.tokenStatus === 'disabled' || (token && customer.accessToken !== token)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted or Expired</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {customer?.tokenStatus === 'disabled'
              ? 'This customer portal access link has been disabled by the agency.'
              : 'The secure link you opened is invalid or expired. Please contact Lotus Web Studio to request a fresh dashboard link.'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="https://wa.me/918058378450?text=Hi%20Lotus%20Web%20Studio,%20I%20need%20assistance%20with%20my%20dashboard%20link."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Support on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: FolderGit2, badge: projects.length },
    { id: 'ads', label: 'Ads & Marketing', icon: TrendingUp },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: pendingRequests.length > 0 ? `${pendingRequests.length} Due` : undefined, badgeColor: 'bg-amber-500' },
    { id: 'bookings', label: 'Bookings / Orders', icon: CalendarCheck, badge: bookings.length },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications.length || undefined, badgeColor: 'bg-rose-500' },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Active notification popup */}
      <NotificationPopup
        notification={popupNotification}
        onDismiss={handleDismissPopup}
        onAction={url => {
          setActiveTab(url);
          if (popupNotification) markNotificationRead(customerId, popupNotification.id);
        }}
      />

      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-base shadow-sm">
            🪷
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none text-white">Lotus Web Studio</div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[170px]">{customer.businessName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 text-slate-300 hover:text-white rounded-lg"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 bg-slate-900 text-slate-200 w-64 flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex hidden'
        }`}
      >
        <div className="p-5 flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Agency Branding */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-xl shadow-md flex-shrink-0">
              🪷
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Lotus Studio</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Client
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5">{customer.businessName}</div>
            </div>
          </div>

          {/* Customer Quick Profile Chip */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
              {customer.profilePhoto ? (
                <img src={customer.profilePhoto} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                customer.name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{customer.name}</div>
              <div className="text-[10px] font-mono text-indigo-400">{customer.id}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1 flex-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor ? `${item.badgeColor} text-white` : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Quick WhatsApp Contact */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <a
            href="https://wa.me/918058378450?text=Hi%20Lotus%20Web%20Studio,%20I%20have%20a%20question%20regarding%20my%20project."
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat with Account Mgr</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
              <span>{navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}</span>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {customer.businessName}
              </span>
            </h1>
            <p className="text-xs text-slate-500">Live Client Workspace • Ref: {customer.id}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct WhatsApp CTA */}
            <a
              href="https://wa.me/918058378450"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Agency</span>
            </a>

            {/* Notifications Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Profile Avatar click */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              <span className="text-xs font-semibold text-slate-800">{customer.name}</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs overflow-hidden">
                {customer.profilePhoto ? (
                  <img src={customer.profilePhoto} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  customer.name.charAt(0)
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Tab Content Views */}
        <div className="p-4 md:p-8 space-y-6">
          {/* ========================================================
              1. DASHBOARD HOME
             ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Client Portal Dashboard</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      Welcome back, {customer.name}!
                    </h2>
                    <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                      Track your digital campaigns, web development progress, invoices, and performance metrics in real time.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md"
                    >
                      View Projects ({projects.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('ads')}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition backdrop-blur-sm"
                    >
                      View Ad Analytics
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending Payment Request Alert (if active) */}
              {pendingRequests.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500 text-white flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        🔔 Pending Payment Request
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        ₹{pendingRequests[0].amount.toLocaleString('en-IN')} — {pendingRequests[0].title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Due Date: {pendingRequests[0].dueDate || 'Immediate'} • {pendingRequests[0].reason}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPaymentRequest(pendingRequests[0]);
                      setPaymentAmount(pendingRequests[0].amount.toString());
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex-shrink-0"
                  >
                    Submit Payment Details
                  </button>
                </div>
              )}

              {/* Key Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Projects */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{activeProjectsCount}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>Total {projects.length} commissioned</span>
                  </div>
                </div>

                {/* Overall Project Progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{overallProgress}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Total Paid */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Paid</span>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ₹{(customer.paidAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Verified payments</div>
                </div>

                {/* Remaining Amount */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-md">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">Remaining</span>
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(customer.remainingAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Total: ₹{(customer.totalAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Marketing Summary Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Ads & Marketing Summary (Last 7 Days)
                    </h3>
                    <p className="text-xs text-slate-500">Performance across Meta, Google & Local Marketing</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ads')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Full Analytics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span>Ad Views / Imp.</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {adsMetrics.totalViews.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                      <MousePointerClick className="w-4 h-4 text-blue-600" />
                      <span>Total Clicks</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {adsMetrics.totalClicks.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <span>Inquiry Calls</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {adsMetrics.totalCalls.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Generated Leads</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {adsMetrics.totalLeads.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Projects List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Current Projects ({projects.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View All
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No projects available. Our team will initialize your project shortly.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map(proj => (
                      <div
                        key={proj.id}
                        className="p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition bg-white"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base">{proj.name}</h4>
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  proj.status === 'Completed' || proj.status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : proj.status === 'In Progress' || proj.status === 'Review'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{proj.serviceName}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            {proj.previewUrl && (
                              <a
                                href={proj.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                              >
                                <span>Preview Website</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {proj.liveWebsiteUrl && (
                              <a
                                href={proj.liveWebsiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <span>Live Website</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Development Progress</span>
                            <span className="font-bold text-slate-800">{proj.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                        </div>

                        {proj.customerUpdates && (
                          <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/60 text-xs text-indigo-900 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <span><strong>Latest Update:</strong> {proj.customerUpdates}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              2. MY PROJECTS TAB
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Commissioned Projects</h2>
                  <p className="text-xs text-slate-500">Live milestones, deliverables, and progress tracking</p>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No projects available</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Your assigned projects will appear here once configured by our studio.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {projects.map(proj => (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-900">{proj.name}</h3>
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                proj.status === 'Completed' || proj.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : proj.status === 'Review' || proj.status === 'Preview Ready'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {proj.status}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-600 font-semibold mt-0.5">{proj.serviceName}</p>
                          <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                            {proj.description || 'Custom digital development milestone.'}
                          </p>
                        </div>

                        {/* External Links & Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {proj.previewUrl && (
                            <a
                              href={proj.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                            >
                              <span>Preview Site</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {proj.liveWebsiteUrl && (
                            <a
                              href={proj.liveWebsiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            >
                              <span>Live Website</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(proj.status === 'Completed' || proj.status === 'Delivered') && (
                            <button
                              onClick={() => {
                                setReviewProjectId(proj.id);
                                setShowReviewModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                            >
                              <Star className="w-3.5 h-3.5" />
                              <span>Submit Review</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Timeline */}
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Project Completion Status</span>
                          <span className="font-bold text-indigo-600">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs text-slate-500">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Start Date</span>
                            <span className="font-medium text-slate-800">{proj.startDate || 'Scheduled'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Expected Delivery</span>
                            <span className="font-medium text-slate-800">{proj.expectedCompletionDate || 'TBD'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Total Project Value</span>
                            <span className="font-medium text-slate-800">₹{(proj.totalAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Amount Paid</span>
                            <span className="font-medium text-emerald-600">₹{(proj.paidAmount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer-Visible Updates & Notes */}
                      {proj.customerUpdates && (
                        <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Milestone Updates</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{proj.customerUpdates}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              3. ADS & MARKETING TAB
             ======================================================== */}
          {activeTab === 'ads' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ads & Marketing Analytics</h2>
                  <p className="text-xs text-slate-500">Verified campaign performance metrics managed by Lotus Web Studio</p>
                </div>

                {/* Date Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom' },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setAdsDateFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        adsDateFilter === filter.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range Picker */}
              {adsDateFilter === 'custom' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Platform Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  onClick={() => setAdsPlatform('meta')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    adsPlatform === 'meta'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Meta Ads (FB & Insta)</span>
                </button>
                <button
                  onClick={() => setAdsPlatform('google')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    adsPlatform === 'google'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Google Search Ads</span>
                </button>
                <button
                  onClick={() => setAdsPlatform('local')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    adsPlatform === 'local'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Local / Google Business</span>
                </button>
              </div>

              {/* Empty State */}
              {filteredAdsData.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Ads Data Available</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Ads data will appear here once your campaign report is added by our marketing team.
                  </p>
                </div>
              ) : (
                <>
                  {/* Aggregated KPI Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                        Impressions / Views
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {adsMetrics.totalViews.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Total ad exposures</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                        Clicks to Action
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {adsMetrics.totalClicks.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">CTR: {adsMetrics.avgCtr}%</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                        Inquiries / Leads
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {adsMetrics.totalLeads.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Calls: {adsMetrics.totalCalls}</div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                        Ad Spend
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        ₹{adsMetrics.totalSpend.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Conversions: {adsMetrics.totalConversions}</div>
                    </div>
                  </div>

                  {/* Responsive Daily Trend Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AdsChart
                      title="Views & Impressions Trend"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.impressions || d.profileViews || 0,
                      }))}
                      metricLabel="Views"
                      color="#4f46e5"
                    />

                    <AdsChart
                      title="User Clicks Trend"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.clicks || d.websiteClicks || 0,
                      }))}
                      metricLabel="Clicks"
                      color="#0284c7"
                    />

                    <AdsChart
                      title="Phone Calls Generated"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.calls || 0,
                      }))}
                      metricLabel="Calls"
                      color="#10b981"
                      chartType="bar"
                    />

                    <AdsChart
                      title="Direct Inquiries & Leads"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.leads || 0,
                      }))}
                      metricLabel="Leads"
                      color="#8b5cf6"
                    />

                    <AdsChart
                      title="Local Actions & Direction Requests"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.localActions || 0,
                      }))}
                      metricLabel="Actions"
                      color="#f59e0b"
                      chartType="bar"
                    />

                    <AdsChart
                      title="Daily Ad Spend"
                      data={filteredAdsData.map(d => ({
                        date: d.date,
                        value: d.spend || 0,
                      }))}
                      metricLabel="Spend (₹)"
                      formatValue={v => `₹${v.toLocaleString('en-IN')}`}
                      color="#ef4444"
                    />
                  </div>

                  {/* Daily Performance Breakdown Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900">Daily Log Summary</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Impressions</th>
                            <th className="p-3">Clicks</th>
                            <th className="p-3">Calls</th>
                            <th className="p-3">Leads</th>
                            <th className="p-3">Spend</th>
                            <th className="p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAdsData.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{row.date}</td>
                              <td className="p-3">{(row.impressions || row.profileViews || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3">{(row.clicks || row.websiteClicks || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3 font-medium text-emerald-600">{row.calls || 0}</td>
                              <td className="p-3 font-semibold text-purple-600">{row.leads || 0}</td>
                              <td className="p-3 font-medium">₹{(row.spend || 0).toLocaleString('en-IN')}</td>
                              <td className="p-3 text-slate-500 max-w-xs truncate">{row.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================
              4. PAYMENTS TAB
             ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Payments & Invoicing</h2>
                  <p className="text-xs text-slate-500">Track invoices, submit transaction receipts, and view payment history</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPaymentRequest(null);
                    setPaymentAmount('');
                    setShowPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Submit Payment Details</span>
                </button>
              </div>

              {/* Financial Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Total Invoiced Amount
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ₹{(customer.totalAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Across all project milestones</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Verified Paid Amount
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ₹{(customer.paidAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Cleared with UTR verification</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Remaining Balance Due
                  </div>
                  <div className="text-2xl font-bold text-rose-600">
                    ₹{(customer.remainingAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Pending milestone payments</div>
                </div>
              </div>

              {/* Active Payment Requests */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Active Payment Requests ({paymentRequests.length})
                </h3>

                {paymentRequests.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No pending payment requests.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentRequests.map(req => (
                      <div
                        key={req.id}
                        className={`p-5 rounded-xl border transition ${
                          req.status === 'paid'
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : req.status === 'submitted'
                            ? 'border-blue-200 bg-blue-50/30'
                            : 'border-amber-200 bg-amber-50/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base">{req.title}</span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  req.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : req.status === 'submitted'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {req.status === 'submitted' ? 'Pending Verification' : req.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{req.reason}</p>
                            {req.paymentInstructions && (
                              <p className="text-xs text-indigo-700 mt-2 bg-indigo-50 p-2 rounded-lg font-mono">
                                ℹ️ {req.paymentInstructions}
                              </p>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                            <div className="text-xl font-black text-slate-900">
                              ₹{req.amount.toLocaleString('en-IN')}
                            </div>
                            {req.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedPaymentRequest(req);
                                  setPaymentAmount(req.amount.toString());
                                  setShowPaymentModal(true);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                              >
                                Submit UTR
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">Payment Submission History</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">UTR / Ref ID</th>
                        <th className="p-3">UPI ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Remarks / Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No payment transactions submitted yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 font-semibold text-slate-900">{pay.paymentDate}</td>
                            <td className="p-3 font-bold text-slate-900">
                              ₹{pay.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 font-mono text-slate-700">{pay.utr}</td>
                            <td className="p-3 text-slate-600">{pay.upiId || '—'}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  pay.status === 'Verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pay.status === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {pay.status === 'Verified' && <Check className="w-3 h-3" />}
                                {pay.status === 'Pending' && <Clock className="w-3 h-3" />}
                                <span>{pay.status}</span>
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">
                              {pay.rejectionReason && (
                                <span className="text-rose-600 font-medium">Reason: {pay.rejectionReason}</span>
                              )}
                              {pay.paymentProofUrl && (
                                <a
                                  href={pay.paymentProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 underline ml-2"
                                >
                                  View Receipt
                                </a>
                              )}
                              {!pay.rejectionReason && !pay.paymentProofUrl && (pay.notes || '—')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              5. BOOKINGS / ORDERS TAB
             ======================================================== */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Service Bookings & Consultations</h2>
                <p className="text-xs text-slate-500">Scheduled strategy calls, reviews, and design sessions</p>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No scheduled bookings</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Any consultation meetings or scheduled deliverables will be listed here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map(b => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                            Booked Service
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">{b.serviceName}</h4>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            b.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{b.bookingDate}</span>
                      </div>

                      {b.appointmentDetails && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                          <strong>Details:</strong> {b.appointmentDetails}
                        </div>
                      )}

                      {b.adminNotes && (
                        <div className="text-xs text-slate-500 italic">
                          Consultant Notes: {b.adminNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              6. SUPPORT TAB
             ======================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dedicated Client Support</h2>
                  <p className="text-xs text-slate-500">Reach Lotus Web Studio via direct channels or ticket</p>
                </div>
              </div>

              {/* Direct Reach Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/918058378450?text=Hello%20Lotus%20Studio%20Support"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 transition flex items-center gap-4 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-base">Instant WhatsApp Support</h3>
                    <p className="text-xs text-emerald-800 mt-0.5">Average response time under 15 minutes</p>
                  </div>
                </a>

                <a
                  href="tel:+918058378450"
                  className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 hover:border-indigo-300 transition flex items-center gap-4 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-950 text-base">Call Account Manager</h3>
                    <p className="text-xs text-indigo-800 mt-0.5">+91 8058378450 (Mon - Sat 10am - 7pm IST)</p>
                  </div>
                </a>
              </div>

              {/* Support Request Form */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Submit Support Ticket</h3>
                <p className="text-xs text-slate-500 mb-5">
                  Need a design tweak, ad budget update, or bug fix? Log a ticket directly into our sprint board.
                </p>

                {supportSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{supportSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Update phone number on homepage"
                        value={supportSubject}
                        onChange={e => setSupportSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={supportCategory}
                        onChange={e => setSupportCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="Website Update">Website Update / Change Request</option>
                        <option value="Ads Campaign">Ads & Marketing Inquiries</option>
                        <option value="Billing / Invoicing">Billing / Invoicing Support</option>
                        <option value="Bug / Issue">Bug / Technical Issue</option>
                        <option value="General Consultation">General Consultation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                      <select
                        value={supportPriority}
                        onChange={e => setSupportPriority(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="Low">Low — General inquiry</option>
                        <option value="Medium">Medium — Standard revision</option>
                        <option value="High">High — Important priority</option>
                        <option value="Urgent">Urgent — Live site disruption</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Related Project</label>
                      <select
                        value={supportProjectId}
                        onChange={e => setSupportProjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="">None / General</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Message *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please specify details, URL links, or specific revisions..."
                      value={supportMessage}
                      onChange={e => setSupportMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingSupport}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingSupport ? 'Submitting...' : 'Send Support Request'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Previous Support Tickets List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Support Ticket History ({supportTickets.length})
                </h3>

                {supportTickets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No support tickets logged. You are all set!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-600 font-bold">
                              #{ticket.id.slice(-5)}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{ticket.subject}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {ticket.category}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                ticket.status === 'Resolved' || ticket.status === 'Closed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ticket.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{ticket.message}</p>

                        {ticket.adminReply && (
                          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-indigo-900 flex items-center gap-1">
                              <span>Lotus Studio Agent Reply:</span>
                            </span>
                            <p className="text-indigo-950">{ticket.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              7. NOTIFICATIONS TAB
             ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Notifications & Alerts</h2>
                  <p className="text-xs text-slate-500">Live milestone updates, billing invoices, and alerts</p>
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={() => {
                      unreadNotifications.forEach(n => markNotificationRead(customerId, n.id));
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">You're all caught up!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    New notifications will appear here when projects progress or milestones are reached.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markNotificationRead(customerId, n.id)}
                      className={`p-5 transition flex items-start gap-4 cursor-pointer ${
                        n.read ? 'bg-white hover:bg-slate-50/70' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                      }`}
                    >
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 flex-shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        {n.actionButton && n.actionUrl && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setActiveTab(n.actionUrl!);
                              markNotificationRead(customerId, n.id);
                            }}
                            className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
                          >
                            <span>{n.actionButton}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              8. REVIEWS TAB
             ======================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Project Reviews & Testimonials</h2>
                  <p className="text-xs text-slate-500">Feedback submitted for completed deliverables</p>
                </div>
              </div>

              {/* Completed projects ready for review */}
              {projects.filter(p => p.status === 'Completed' || p.status === 'Delivered').length > 0 && (
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-indigo-950 text-sm">Have feedback on a completed project?</h3>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Your feedback helps our engineers and designers continuously refine our service quality.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const completed = projects.find(p => p.status === 'Completed' || p.status === 'Delivered');
                      setReviewProjectId(completed?.id || '');
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex-shrink-0"
                  >
                    Leave a Review
                  </button>
                </div>
              )}

              {/* Reviews List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Your Submitted Reviews ({reviews.length})
                </h3>

                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No reviews submitted yet. Once a project reaches 'Completed' or 'Delivered' status, you can submit your rating here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(rev => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-xl border border-slate-200 space-y-2 bg-slate-50/40"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{rev.projectName}</h4>
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed">"{rev.comment}"</p>
                        <div className="text-[10px] text-slate-400 pt-1">
                          Submitted on {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              9. PROFILE TAB
             ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Client Profile</h2>
                <p className="text-xs text-slate-500">Your agency contact profile and business information</p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <form onSubmit={handleProfileSave} className="space-y-4">
                  {/* Readonly Core Identifiers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Customer ID</label>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-indigo-600">
                        {customer.id}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email (Primary Account)</label>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        {customer.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        disabled
                        value={customer.name}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        disabled
                        value={customer.businessName}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Editable contact fields */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
                    <input
                      type="text"
                      value={profileMobile}
                      onChange={e => setProfileMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business Address</label>
                    <textarea
                      rows={2}
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      placeholder="Suite #, Building, City, State, PIN"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                    <input
                      type="url"
                      value={profilePhoto}
                      onChange={e => setProfilePhoto(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                    >
                      {savingProfile ? 'Saving...' : 'Update Profile Info'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Passwordless Security Notice */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Secure Passwordless Access:</span>
                  <p className="mt-0.5 leading-relaxed">
                    This portal uses a high-entropy 256-bit cryptographic token. No password is stored. If you ever suspect your link has been compromised, contact Lotus Web Studio to immediately regenerate or invalidate your access token.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          MODAL: SUBMIT PAYMENT DETAILS
         ======================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Payment Verification</h3>
                <p className="text-xs text-slate-500">Provide payment proof and UTR reference number</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentRequest(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccessMsg && (
              <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
              {selectedPaymentRequest && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  <strong>Paying for:</strong> {selectedPaymentRequest.title} (₹{selectedPaymentRequest.amount.toLocaleString('en-IN')})
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UTR / Bank Transaction Reference ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR847291039821 or IMPS / NEFT ref"
                  value={paymentUtr}
                  onChange={e => setPaymentUtr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okaxis"
                    value={paymentUpi}
                    onChange={e => setPaymentUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Proof / Screenshot URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or image link"
                  value={paymentProofUrl}
                  onChange={e => setPaymentProofUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 2 advance transfer"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {submittingPayment ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SUBMIT REVIEW
         ======================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Review Completed Project</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Completed Project</label>
                <select
                  value={reviewProjectId}
                  onChange={e => setReviewProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  {projects
                    .filter(p => p.status === 'Completed' || p.status === 'Delivered')
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback / Testimonial *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience working with Lotus Web Studio..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
