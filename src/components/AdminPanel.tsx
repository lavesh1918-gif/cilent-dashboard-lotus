import React, { useState, useEffect, useMemo } from 'react';
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
  ProjectStatus,
} from '../types';
import {
  subscribeCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  regenerateCustomerToken,
  toggleCustomerTokenStatus,
  createProject,
  updateProject,
  deleteProject,
  createPaymentRequest,
  verifyPayment,
  createBooking,
  updateBooking,
  createNotification,
  updateSupportTicket,
  saveAdsDailyData,
  deleteAdsDailyData,
  seedDemoData,
} from '../services/firestoreService';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  LayoutDashboard,
  Users,
  FolderGit2,
  TrendingUp,
  CreditCard,
  DollarSign,
  CalendarCheck,
  Bell,
  LifeBuoy,
  Star,
  Settings,
  Plus,
  Search,
  ExternalLink,
  Copy,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Database,
  Filter,
  Check,
  X,
  MessageCircle,
  Eye,
  Sliders,
  ChevronDown,
  LogOut,
  Shield,
  Phone,
} from 'lucide-react';

interface AdminPanelProps {
  onOpenCustomerPortal?: (customerId: string, token: string) => void;
  adminUserEmail?: string | null;
  onLogout: () => void;
  currentSubroute?: string;
  onNavigateSubroute?: (route: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onOpenCustomerPortal,
  adminUserEmail,
  onLogout,
  currentSubroute,
  onNavigateSubroute,
}) => {
  const [activeTab, setActiveTab] = useState<string>(currentSubroute || 'dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Selected customer subcollection data
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [adsData, setAdsData] = useState<AdsDailyData[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customerFilterStatus, setCustomerFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState<boolean>(false);
  const [showAddPaymentReqModal, setShowAddPaymentReqModal] = useState<boolean>(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState<boolean>(false);
  const [showAddNotifModal, setShowAddNotifModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectPaymentTarget, setRejectPaymentTarget] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Customer Form State
  const [custName, setCustName] = useState<string>('');
  const [custBusiness, setCustBusiness] = useState<string>('');
  const [custEmail, setCustEmail] = useState<string>('');
  const [custMobile, setCustMobile] = useState<string>('');
  const [custAddress, setCustAddress] = useState<string>('');
  const [custService, setCustService] = useState<string>('Web Development & Marketing');
  const [custNotes, setCustNotes] = useState<string>('');
  const [custPhoto, setCustPhoto] = useState<string>('');

  // Project Form State
  const [projTargetCustId, setProjTargetCustId] = useState<string>('');
  const [projName, setProjName] = useState<string>('');
  const [projService, setProjService] = useState<string>('Full-Stack Web App');
  const [projDesc, setProjDesc] = useState<string>('');
  const [projStartDate, setProjStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projEndDate, setProjEndDate] = useState<string>('');
  const [projTotalAmount, setProjTotalAmount] = useState<string>('30000');
  const [projPaidAmount, setProjPaidAmount] = useState<string>('0');
  const [projProgress, setProjProgress] = useState<number>(10);
  const [projStatus, setProjStatus] = useState<ProjectStatus>('Started');
  const [projPreviewUrl, setProjPreviewUrl] = useState<string>('');
  const [projLiveUrl, setProjLiveUrl] = useState<string>('');
  const [projAdminNotes, setProjAdminNotes] = useState<string>('');
  const [projCustomerUpdates, setProjCustomerUpdates] = useState<string>('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Ads Entry Form State
  const [adsTargetCustId, setAdsTargetCustId] = useState<string>('');
  const [adsPlatform, setAdsPlatform] = useState<AdsPlatform>('meta');
  const [adsDate, setAdsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adsImpressions, setAdsImpressions] = useState<string>('5000');
  const [adsReach, setAdsReach] = useState<string>('4200');
  const [adsClicks, setAdsClicks] = useState<string>('240');
  const [adsCalls, setAdsCalls] = useState<string>('18');
  const [adsWebsiteClicks, setAdsWebsiteClicks] = useState<string>('180');
  const [adsLocalActions, setAdsLocalActions] = useState<string>('25');
  const [adsLeads, setAdsLeads] = useState<string>('14');
  const [adsSpend, setAdsSpend] = useState<string>('850');
  const [adsCtr, setAdsCtr] = useState<string>('4.8');
  const [adsConversions, setAdsConversions] = useState<string>('12');
  const [adsConversionValue, setAdsConversionValue] = useState<string>('0');
  const [adsProfileViews, setAdsProfileViews] = useState<string>('350');
  const [adsMessages, setAdsMessages] = useState<string>('6');
  const [adsNotes, setAdsNotes] = useState<string>('Campaign performing normally');
  const [savingAds, setSavingAds] = useState<boolean>(false);

  // Payment Request Form State
  const [payReqCustId, setPayReqCustId] = useState<string>('');
  const [payReqTitle, setPayReqTitle] = useState<string>('');
  const [payReqAmount, setPayReqAmount] = useState<string>('');
  const [payReqReason, setPayReqReason] = useState<string>('');
  const [payReqDueDate, setPayReqDueDate] = useState<string>('');
  const [payReqProjId, setPayReqProjId] = useState<string>('');
  const [payReqInstructions, setPayReqInstructions] = useState<string>('UPI: lotuswebstudio@icici or Bank A/C: 9812739128, IFSC: ICIC0001024');

  // Booking Form State
  const [bookCustId, setBookCustId] = useState<string>('');
  const [bookService, setBookService] = useState<string>('Design Review & Strategy');
  const [bookDate, setBookDate] = useState<string>('');
  const [bookStatus, setBookStatus] = useState<any>('Confirmed');
  const [bookDetails, setBookDetails] = useState<string>('');

  // Notification Form State
  const [notifCustId, setNotifCustId] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifType, setNotifType] = useState<any>('Project');
  const [notifPriority, setNotifPriority] = useState<any>('normal');

  // Loading & alerts
  const [toastMessage, setToastMessage] = useState<string>('');
  const [seedingLoading, setSeedingLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Subscribe to Customers list
  useEffect(() => {
    const unsub = subscribeCustomers(custs => {
      setCustomers(custs);
      if (custs.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custs[0].id);
        setProjTargetCustId(custs[0].id);
        setAdsTargetCustId(custs[0].id);
        setPayReqCustId(custs[0].id);
        setBookCustId(custs[0].id);
        setNotifCustId(custs[0].id);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to subcollections of selected customer
  useEffect(() => {
    if (!selectedCustomerId) {
      setProjects([]);
      setPaymentRequests([]);
      setPayments([]);
      setBookings([]);
      setNotifications([]);
      setSupportTickets([]);
      setReviews([]);
      setAdsData([]);
      return;
    }

    const unsubs: Unsubscribe[] = [];

    // Projects
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'projects'), orderBy('createdAt', 'desc')),
        s => setProjects(s.docs.map(d => d.data() as Project)),
        () => {}
      )
    );

    // Payments
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'payments'), orderBy('createdAt', 'desc')),
        s => setPayments(s.docs.map(d => d.data() as Payment)),
        () => {}
      )
    );

    // Payment Requests
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'paymentRequests'), orderBy('createdAt', 'desc')),
        s => setPaymentRequests(s.docs.map(d => d.data() as PaymentRequest)),
        () => {}
      )
    );

    // Bookings
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'bookings'), orderBy('createdAt', 'desc')),
        s => setBookings(s.docs.map(d => d.data() as Booking)),
        () => {}
      )
    );

    // Notifications
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'notifications'), orderBy('createdAt', 'desc')),
        s => setNotifications(s.docs.map(d => d.data() as NotificationItem)),
        () => {}
      )
    );

    // Support Tickets
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'support'), orderBy('createdAt', 'desc')),
        s => setSupportTickets(s.docs.map(d => d.data() as SupportTicket)),
        () => {}
      )
    );

    // Reviews
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'reviews'), orderBy('createdAt', 'desc')),
        s => setReviews(s.docs.map(d => d.data() as Review)),
        () => {}
      )
    );

    // Ads Data
    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers', selectedCustomerId, 'ads'), orderBy('date', 'desc')),
        s => setAdsData(s.docs.map(d => d.data() as AdsDailyData)),
        () => {}
      )
    );

    return () => unsubs.forEach(u => u());
  }, [selectedCustomerId]);

  // Filter customers by search query and status
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (customerFilterStatus !== 'all' && c.tokenStatus !== customerFilterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.businessName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.mobile && c.mobile.includes(q))
        );
      }
      return true;
    });
  }, [customers, searchQuery, customerFilterStatus]);

  // Financial and Aggregate Metrics across all customers
  const adminMetrics = useMemo(() => {
    const totalCustomers = customers.length;
    const totalInvoiced = customers.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    const totalPaid = customers.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
    const totalPending = customers.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);

    const pendingVerificationPayments = payments.filter(p => p.status === 'Pending');
    const openTickets = supportTickets.filter(t => t.status === 'Open' || t.status === 'In Progress');

    return {
      totalCustomers,
      totalInvoiced,
      totalPaid,
      totalPending,
      pendingVerificationCount: pendingVerificationPayments.length,
      openTicketsCount: openTickets.length,
    };
  }, [customers, payments, supportTickets]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Handle Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custBusiness.trim()) {
      alert('Please fill in Customer Name and Business Name.');
      return;
    }

    try {
      const newCust = await createCustomer({
        name: custName.trim(),
        businessName: custBusiness.trim(),
        email: custEmail.trim(),
        mobile: custMobile.trim(),
        businessAddress: custAddress.trim(),
        service: custService.trim(),
        notes: custNotes.trim(),
        profilePhoto: custPhoto.trim(),
      });

      setShowAddCustomerModal(false);
      setSelectedCustomerId(newCust.id);
      showToast(`Customer ${newCust.name} (${newCust.id}) created! Access token generated.`);

      // Reset form
      setCustName('');
      setCustBusiness('');
      setCustEmail('');
      setCustMobile('');
      setCustAddress('');
      setCustNotes('');
      setCustPhoto('');
    } catch (err) {
      alert('Error creating customer.');
    }
  };

  // Handle Copy Link
  const handleCopyLink = (customer: Customer) => {
    const url = `${window.location.origin}/customer/${customer.accessToken}`;
    navigator.clipboard.writeText(url);
    showToast(`Copied secure dashboard link for ${customer.name}!`);
  };

  // Handle Send WhatsApp Link
  const handleSendWhatsApp = (customer: Customer) => {
    const url = `${window.location.origin}/customer/${customer.accessToken}`;
    const cleanNumber = (customer.mobile || '8058378450').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi ${customer.name}, here is your secure client portal link for ${customer.businessName}: ${url}`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  // Handle Regenerate Token
  const handleRegenerateToken = async (customerId: string) => {
    if (confirm('Regenerate access token? The previous dashboard link will immediately become invalid.')) {
      await regenerateCustomerToken(customerId);
      showToast('Generated new secure dashboard access token.');
    }
  };

  // Handle Toggle Token Status
  const handleToggleToken = async (customerId: string, currentStatus: 'active' | 'disabled') => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await toggleCustomerTokenStatus(customerId, newStatus);
    showToast(`Dashboard link is now ${newStatus.toUpperCase()}.`);
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async (customerId: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer ${name}? This action cannot be undone.`)) {
      await deleteCustomer(customerId);
      showToast(`Customer ${name} deleted.`);
      if (selectedCustomerId === customerId) {
        setSelectedCustomerId('');
      }
    }
  };

  // Handle Project Creation or Update
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = projTargetCustId || selectedCustomerId;
    if (!custId) {
      alert('Please select a customer first.');
      return;
    }
    if (!projName.trim()) {
      alert('Please enter a project name.');
      return;
    }

    const totalNum = parseFloat(projTotalAmount) || 0;
    const paidNum = parseFloat(projPaidAmount) || 0;
    const remainingNum = Math.max(0, totalNum - paidNum);

    try {
      if (editingProjectId) {
        await updateProject(custId, editingProjectId, {
          name: projName.trim(),
          serviceName: projService.trim(),
          description: projDesc.trim(),
          startDate: projStartDate,
          expectedCompletionDate: projEndDate,
          totalAmount: totalNum,
          paidAmount: paidNum,
          remainingAmount: remainingNum,
          progress: Number(projProgress),
          status: projStatus,
          previewUrl: projPreviewUrl.trim(),
          liveWebsiteUrl: projLiveUrl.trim(),
          adminNotes: projAdminNotes.trim(),
          customerUpdates: projCustomerUpdates.trim(),
        });
        showToast('Project updated & customer notified!');
      } else {
        await createProject(custId, {
          name: projName.trim(),
          serviceName: projService.trim(),
          description: projDesc.trim(),
          startDate: projStartDate,
          expectedCompletionDate: projEndDate,
          totalAmount: totalNum,
          paidAmount: paidNum,
          remainingAmount: remainingNum,
          progress: Number(projProgress),
          status: projStatus,
          previewUrl: projPreviewUrl.trim(),
          liveWebsiteUrl: projLiveUrl.trim(),
          adminNotes: projAdminNotes.trim(),
          customerUpdates: projCustomerUpdates.trim(),
        });
        showToast('New project created!');
      }

      setShowAddProjectModal(false);
      setEditingProjectId(null);
      setProjName('');
      setProjDesc('');
      setProjCustomerUpdates('');
    } catch (err) {
      alert('Error saving project.');
    }
  };

  // Handle Save Ads Daily Data
  const handleSaveAdsData = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = adsTargetCustId || selectedCustomerId;
    if (!custId) {
      alert('Please select a customer.');
      return;
    }

    setSavingAds(true);
    try {
      await saveAdsDailyData(custId, {
        platform: adsPlatform,
        date: adsDate,
        impressions: Number(adsImpressions) || 0,
        reach: Number(adsReach) || 0,
        clicks: Number(adsClicks) || 0,
        calls: Number(adsCalls) || 0,
        websiteClicks: Number(adsWebsiteClicks) || 0,
        localActions: Number(adsLocalActions) || 0,
        leads: Number(adsLeads) || 0,
        spend: Number(adsSpend) || 0,
        ctr: Number(adsCtr) || 0,
        conversions: Number(adsConversions) || 0,
        conversionValue: Number(adsConversionValue) || 0,
        profileViews: Number(adsProfileViews) || 0,
        messages: Number(adsMessages) || 0,
        notes: adsNotes.trim(),
      });

      showToast(`Saved ${adsPlatform.toUpperCase()} data for ${adsDate}!`);
    } catch (err) {
      alert('Error saving ads data.');
    } finally {
      setSavingAds(false);
    }
  };

  // Handle Duplicate Previous Day Ads Data
  const handleDuplicatePrevDay = () => {
    if (adsData.length === 0) {
      alert('No previous ads data found for this customer to duplicate.');
      return;
    }
    const prev = adsData[0];
    setAdsImpressions(prev.impressions?.toString() || '0');
    setAdsReach(prev.reach?.toString() || '0');
    setAdsClicks(prev.clicks?.toString() || '0');
    setAdsCalls(prev.calls?.toString() || '0');
    setAdsWebsiteClicks(prev.websiteClicks?.toString() || '0');
    setAdsLocalActions(prev.localActions?.toString() || '0');
    setAdsLeads(prev.leads?.toString() || '0');
    setAdsSpend(prev.spend?.toString() || '0');
    setAdsCtr(prev.ctr?.toString() || '0');
    setAdsConversions(prev.conversions?.toString() || '0');
    setAdsConversionValue(prev.conversionValue?.toString() || '0');
    setAdsProfileViews(prev.profileViews?.toString() || '0');
    setAdsMessages(prev.messages?.toString() || '0');
    showToast(`Loaded previous metrics from ${prev.date}.`);
  };

  // Handle Create Payment Request
  const handleCreatePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = payReqCustId || selectedCustomerId;
    if (!custId) {
      alert('Please select a customer.');
      return;
    }
    const amountNum = parseFloat(payReqAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid request amount.');
      return;
    }

    try {
      await createPaymentRequest(custId, {
        title: payReqTitle.trim(),
        amount: amountNum,
        reason: payReqReason.trim(),
        dueDate: payReqDueDate,
        projectId: payReqProjId || undefined,
        paymentInstructions: payReqInstructions.trim(),
        status: 'pending',
      });

      setShowAddPaymentReqModal(false);
      showToast(`Created payment request of ₹${amountNum.toLocaleString('en-IN')}! Customer notified.`);
      setPayReqTitle('');
      setPayReqAmount('');
      setPayReqReason('');
    } catch (err) {
      alert('Error creating payment request.');
    }
  };

  // Handle Payment Verification (Approve / Reject)
  const handleVerifyPayment = async (payment: Payment, approve: boolean) => {
    if (approve) {
      if (confirm(`Approve payment of ₹${payment.amount.toLocaleString('en-IN')} (UTR: ${payment.utr})?`)) {
        await verifyPayment(payment.customerId, payment.id, true);
        showToast('Payment verified & customer ledger updated!');
      }
    } else {
      setRejectPaymentTarget(payment);
      setRejectionReason('UTR could not be matched with bank ledger');
      setShowRejectModal(true);
    }
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectPaymentTarget) return;
    await verifyPayment(rejectPaymentTarget.customerId, rejectPaymentTarget.id, false, rejectionReason);
    setShowRejectModal(false);
    setRejectPaymentTarget(null);
    showToast('Payment rejected & customer notified.');
  };

  // Handle Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = bookCustId || selectedCustomerId;
    if (!custId) return;

    try {
      await createBooking(custId, {
        serviceName: bookService.trim(),
        bookingDate: bookDate,
        status: bookStatus,
        appointmentDetails: bookDetails.trim(),
      });
      setShowAddBookingModal(false);
      showToast('Booking created & scheduled!');
      setBookService('');
      setBookDetails('');
    } catch (err) {
      alert('Error creating booking.');
    }
  };

  // Handle Create Notification
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = notifCustId || selectedCustomerId;
    if (!custId) return;

    try {
      await createNotification(custId, {
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        priority: notifPriority,
        read: false,
      });
      setShowAddNotifModal(false);
      showToast('Notification sent to customer dashboard!');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err) {
      alert('Error creating notification.');
    }
  };

  // Handle Seed Demo Data
  const handleSeedData = async () => {
    setSeedingLoading(true);
    try {
      const seeded = await seedDemoData();
      setSelectedCustomerId(seeded.id);
      showToast(`Sample agency client "${seeded.name}" created with live projects, ads, and payments!`);
    } catch (err) {
      alert('Error seeding demo data.');
    } finally {
      setSeedingLoading(false);
    }
  };

  // Admin Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users, badge: customers.length },
    { id: 'projects', label: 'Projects', icon: FolderGit2, badge: projects.length },
    { id: 'ads', label: 'Ads & Marketing', icon: TrendingUp },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: adminMetrics.pendingVerificationCount > 0 ? `${adminMetrics.pendingVerificationCount} Unverified` : undefined, badgeColor: 'bg-rose-500' },
    { id: 'paymentRequests', label: 'Payment Requests', icon: DollarSign, badge: paymentRequests.length },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, badge: bookings.length },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Support', icon: LifeBuoy, badge: adminMetrics.openTicketsCount > 0 ? `${adminMetrics.openTicketsCount} Open` : undefined, badgeColor: 'bg-blue-500' },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: reviews.length },
    { id: 'settings', label: 'Settings & DB', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-indigo-600 text-white shadow-2xl border border-indigo-400 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo & Agency Brand */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-xl shadow-lg">
              🪷
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Lotus Studio</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Admin
                </span>
              </div>
              <div className="text-xs text-slate-400">Agency Command Center</div>
            </div>
          </div>

          {/* Quick Customer Switcher / Active Focus */}
          <div className="mt-5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
              Active Focus Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                setProjTargetCustId(e.target.value);
                setAdsTargetCustId(e.target.value);
                setPayReqCustId(e.target.value);
                setBookCustId(e.target.value);
                setNotifCustId(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {customers.length === 0 ? (
                <option value="">No customers yet</option>
              ) : (
                customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.name})
                  </option>
                ))
              )}
            </select>

            {currentCustomer && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">{currentCustomer.id}</span>
                <button
                  onClick={() => onOpenCustomerPortal?.(currentCustomer.id, currentCustomer.accessToken)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onNavigateSubroute?.(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
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

        {/* Sidebar Footer with Admin Profile & Logout */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-white text-xs truncate max-w-[140px]">
                {adminUserEmail || 'admin@lotuswebstudio.com'}
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Admin
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>8058378450</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedData}
              disabled={seedingLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition disabled:opacity-50"
              title="Seed Sample Agency Client"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seedingLoading ? 'Generating...' : 'Seed Data'}</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
              title="Logout from Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 bg-slate-900 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="px-8 py-5 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white capitalize">
                {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h1>
              {currentCustomer && (
                <span className="text-xs bg-slate-800 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono">
                  {currentCustomer.businessName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Lotus Web Studio • Client & Operation Management</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
            <button
              onClick={() => {
                setEditingProjectId(null);
                setProjName('');
                setProjDesc('');
                setShowAddProjectModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
            <button
              onClick={() => setShowAddPaymentReqModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            >
              <DollarSign className="w-4 h-4" />
              <span>Request Payment</span>
            </button>
          </div>
        </header>

        {/* Tab Views */}
        <div className="p-6 md:p-8 space-y-6">
          {/* ========================================================
              1. ADMIN DASHBOARD OVERVIEW
             ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Financial & Customer Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Total Invoiced
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ₹{adminMetrics.totalInvoiced.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{adminMetrics.totalCustomers} total clients</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Total Revenue Collected
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ₹{adminMetrics.totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Verified payments</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Pending Receivables
                  </div>
                  <div className="text-2xl font-bold text-rose-400">
                    ₹{adminMetrics.totalPending.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Remaining milestone balances</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Pending Verification
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {adminMetrics.pendingVerificationCount} Payments
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{adminMetrics.openTicketsCount} open support tickets</div>
                </div>
              </div>

              {/* Pending Payment Verifications Action Table */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Pending Payment Verifications ({payments.filter(p => p.status === 'Pending').length})</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    View All Payments
                  </button>
                </div>

                {payments.filter(p => p.status === 'Pending').length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No pending customer payment submissions requiring verification.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">UTR / Ref</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Proof / UPI</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {payments
                          .filter(p => p.status === 'Pending')
                          .map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-900/60 transition">
                              <td className="p-3 font-semibold text-white">
                                {currentCustomer?.businessName || pay.customerId}
                              </td>
                              <td className="p-3 font-bold text-emerald-400">
                                ₹{pay.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 font-mono text-slate-300">{pay.utr}</td>
                              <td className="p-3 text-slate-400">{pay.paymentDate}</td>
                              <td className="p-3 text-slate-400">
                                {pay.paymentProofUrl ? (
                                  <a
                                    href={pay.paymentProofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>Receipt</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  pay.upiId || 'Direct Transfer'
                                )}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => handleVerifyPayment(pay, true)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(pay, false)}
                                  className="px-3 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-semibold text-xs transition"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Projects Overview in Dashboard */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Projects for {currentCustomer?.businessName || 'Active Client'} ({projects.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    Manage Projects
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No projects found for selected client. Click 'Create Project' above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(proj => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                            <p className="text-xs text-indigo-400">{proj.serviceName}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {proj.status}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Progress: {proj.progress}%</span>
                          <span>₹{(proj.totalAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              2. CUSTOMERS LIST & CONTROLS
             ======================================================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Clients & Access Control</h2>
                  <p className="text-xs text-slate-400">Manage client profiles, tokens, dashboard URLs and status</p>
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Customer</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, business, customer ID, or phone..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={customerFilterStatus}
                    onChange={e => setCustomerFilterStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="all">All Clients ({customers.length})</option>
                    <option value="active">Active Links Only</option>
                    <option value="disabled">Disabled Links Only</option>
                  </select>
                </div>
              </div>

              {/* Customer Table */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Customer & Business</th>
                        <th className="p-3.5">Client ID</th>
                        <th className="p-3.5">Mobile</th>
                        <th className="p-3.5">Total Invoiced</th>
                        <th className="p-3.5">Paid</th>
                        <th className="p-3.5">Remaining</th>
                        <th className="p-3.5">Portal Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No customers found. Click 'Add New Customer' or 'Seed Realistic Client Data'.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map(cust => (
                          <tr
                            key={cust.id}
                            className={`hover:bg-slate-900/60 transition ${
                              selectedCustomerId === cust.id ? 'bg-indigo-950/20' : ''
                            }`}
                          >
                            <td className="p-3.5">
                              <div className="font-bold text-white text-sm">{cust.businessName}</div>
                              <div className="text-xs text-slate-400">{cust.name} • {cust.email}</div>
                            </td>
                            <td className="p-3.5 font-mono text-indigo-400 font-semibold">{cust.id}</td>
                            <td className="p-3.5 text-slate-300">{cust.mobile || '—'}</td>
                            <td className="p-3.5 font-medium text-white">
                              ₹{(cust.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 font-semibold text-emerald-400">
                              ₹{(cust.paidAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 font-semibold text-rose-400">
                              ₹{(cust.remainingAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  cust.tokenStatus === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {cust.tokenStatus.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onOpenCustomerPortal?.(cust.id, cust.accessToken)}
                                  className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300"
                                  title="Open Client Dashboard"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCopyLink(cust)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="Copy Dashboard Link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {cust.mobile && (
                                  <button
                                    onClick={() => handleSendWhatsApp(cust)}
                                    className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300"
                                    title="Send Link via WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRegenerateToken(cust.id)}
                                  className="p-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300"
                                  title="Regenerate Access Token"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleToken(cust.id, cust.tokenStatus)}
                                  className={`p-1.5 rounded-lg ${
                                    cust.tokenStatus === 'active'
                                      ? 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300'
                                      : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300'
                                  }`}
                                  title={cust.tokenStatus === 'active' ? 'Disable Link' : 'Enable Link'}
                                >
                                  {cust.tokenStatus === 'active' ? (
                                    <XCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                                  title="Delete Client"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
              3. PROJECT MANAGEMENT
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Project Management</h2>
                  <p className="text-xs text-slate-400">
                    Milestones, progress bars, website previews, and live client updates
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProjectId(null);
                    setProjName('');
                    setProjDesc('');
                    setShowAddProjectModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
                  <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="font-bold text-white text-base">No Projects for Selected Client</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a client or create a new project above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {projects.map(proj => (
                    <div
                      key={proj.id}
                      className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-white">{proj.name}</h3>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                              {proj.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{proj.serviceName}</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-xl">{proj.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProjectId(proj.id);
                              setProjName(proj.name);
                              setProjService(proj.serviceName);
                              setProjDesc(proj.description || '');
                              setProjStartDate(proj.startDate || '');
                              setProjEndDate(proj.expectedCompletionDate || '');
                              setProjTotalAmount(proj.totalAmount?.toString() || '0');
                              setProjPaidAmount(proj.paidAmount?.toString() || '0');
                              setProjProgress(proj.progress || 0);
                              setProjStatus(proj.status);
                              setProjPreviewUrl(proj.previewUrl || '');
                              setProjLiveUrl(proj.liveWebsiteUrl || '');
                              setProjAdminNotes(proj.adminNotes || '');
                              setProjCustomerUpdates(proj.customerUpdates || '');
                              setShowAddProjectModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit / Progress</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete project "${proj.name}"?`)) {
                                deleteProject(selectedCustomerId, proj.id);
                                showToast('Project deleted.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar Controller */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Progress: {proj.progress}%</span>
                          <span>
                            ₹{(proj.paidAmount || 0).toLocaleString('en-IN')} paid of ₹
                            {(proj.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      {proj.customerUpdates && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                          <strong className="text-indigo-400">Customer Note:</strong> {proj.customerUpdates}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              4. ADS & MARKETING DATA ENTRY
             ======================================================== */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Manual Ads & Marketing Entry</h2>
                  <p className="text-xs text-slate-400">
                    Input campaign analytics for Meta Ads, Google Ads, and Local Business Profile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDuplicatePrevDay}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition"
                >
                  Duplicate Previous Day's Values
                </button>
              </div>

              {/* Data Entry Form */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                <form onSubmit={handleSaveAdsData} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Select Client *</label>
                      <select
                        value={adsTargetCustId || selectedCustomerId}
                        onChange={e => setAdsTargetCustId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Platform *</label>
                      <select
                        value={adsPlatform}
                        onChange={e => setAdsPlatform(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="meta">Meta Ads (Facebook & Instagram)</option>
                        <option value="google">Google Ads (Search & Maps)</option>
                        <option value="local">Local Marketing (Google Business Profile)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Report Date *</label>
                      <input
                        type="date"
                        required
                        value={adsDate}
                        onChange={e => setAdsDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Platform-Specific Metrics Input Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        {adsPlatform === 'local' ? 'Profile Views' : 'Impressions / Views'}
                      </label>
                      <input
                        type="number"
                        value={adsImpressions}
                        onChange={e => setAdsImpressions(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Clicks</label>
                      <input
                        type="number"
                        value={adsClicks}
                        onChange={e => setAdsClicks(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Inquiry Calls</label>
                      <input
                        type="number"
                        value={adsCalls}
                        onChange={e => setAdsCalls(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Generated Leads</label>
                      <input
                        type="number"
                        value={adsLeads}
                        onChange={e => setAdsLeads(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Local Actions / Directions</label>
                      <input
                        type="number"
                        value={adsLocalActions}
                        onChange={e => setAdsLocalActions(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Ad Spend (₹)</label>
                      <input
                        type="number"
                        value={adsSpend}
                        onChange={e => setAdsSpend(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">CTR (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={adsCtr}
                        onChange={e => setAdsCtr(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Conversions</label>
                      <input
                        type="number"
                        value={adsConversions}
                        onChange={e => setAdsConversions(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Campaign Observations</label>
                    <input
                      type="text"
                      placeholder="e.g. Scaling audience targeting in Mumbai region"
                      value={adsNotes}
                      onChange={e => setAdsNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingAds}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {savingAds ? 'Saving...' : 'Save Analytics Record to Firestore'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Records for Client */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Logged Records for {currentCustomer?.businessName || 'Client'} ({adsData.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Views</th>
                        <th className="p-3">Clicks</th>
                        <th className="p-3">Calls</th>
                        <th className="p-3">Leads</th>
                        <th className="p-3">Spend</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {adsData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No ad records logged yet. Fill out the form above to add daily data.
                          </td>
                        </tr>
                      ) : (
                        adsData.map(d => (
                          <tr key={d.id} className="hover:bg-slate-900/60 transition">
                            <td className="p-3 font-semibold uppercase text-indigo-400">{d.platform}</td>
                            <td className="p-3 font-medium text-white">{d.date}</td>
                            <td className="p-3">{d.impressions || d.profileViews || 0}</td>
                            <td className="p-3">{d.clicks || 0}</td>
                            <td className="p-3 text-emerald-400">{d.calls || 0}</td>
                            <td className="p-3 text-purple-400">{d.leads || 0}</td>
                            <td className="p-3">₹{(d.spend || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ad entry for ${d.date}?`)) {
                                    deleteAdsDailyData(selectedCustomerId, d.id);
                                    showToast('Record deleted.');
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
              5. PAYMENTS & VERIFICATION
             ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Payment Submissions & Verification</h2>
                  <p className="text-xs text-slate-400">Review customer UTR submissions and confirm clearance</p>
                </div>
              </div>

              {/* Payments List */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">UTR / Reference</th>
                        <th className="p-3">UPI ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Proof Link</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No payment submissions recorded for this customer.
                          </td>
                        </tr>
                      ) : (
                        payments.map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-900/60 transition">
                            <td className="p-3 text-white font-medium">{pay.paymentDate}</td>
                            <td className="p-3 font-bold text-emerald-400">
                              ₹{pay.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{pay.utr}</td>
                            <td className="p-3 text-slate-400">{pay.upiId || '—'}</td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  pay.status === 'Verified'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : pay.status === 'Rejected'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {pay.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">
                              {pay.paymentProofUrl ? (
                                <a
                                  href={pay.paymentProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-400 underline"
                                >
                                  View
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {pay.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyPayment(pay, true)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPayment(pay, false)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 font-semibold text-xs"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
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
              6. PAYMENT REQUESTS
             ======================================================== */}
          {activeTab === 'paymentRequests' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Payment Requests</h2>
                  <p className="text-xs text-slate-400">Issue milestone payment invoices to customer dashboard</p>
                </div>
                <button
                  onClick={() => setShowAddPaymentReqModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Request</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="space-y-3">
                  {paymentRequests.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No payment requests created for this customer yet.
                    </div>
                  ) : (
                    paymentRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{req.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 uppercase">
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{req.reason}</p>
                          <div className="text-[11px] text-slate-500 mt-1">Due: {req.dueDate || 'Immediate'}</div>
                        </div>

                        <div className="text-xl font-bold text-emerald-400">
                          ₹{req.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              7. BOOKINGS
             ======================================================== */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Service Bookings & Consultations</h2>
                  <p className="text-xs text-slate-400">Appointments, sprint reviews, and advisory sessions</p>
                </div>
                <button
                  onClick={() => setShowAddBookingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Booking</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map(b => (
                  <div key={b.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{b.serviceName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{b.bookingDate}</span>
                    </div>
                    {b.appointmentDetails && (
                      <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        {b.appointmentDetails}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              8. NOTIFICATIONS LOG & CREATION
             ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Push Dashboard Notifications</h2>
                  <p className="text-xs text-slate-400">Broadcast alerts and progress to customer portal</p>
                </div>
                <button
                  onClick={() => setShowAddNotifModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 flex-shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">{n.title}</h4>
                        <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              9. SUPPORT TICKETS
             ======================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Client Support Queue</h2>
                <p className="text-xs text-slate-400">Incoming tickets and inquiries requiring agent resolution</p>
              </div>

              <div className="space-y-4">
                {supportTickets.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                    No support tickets logged by this customer.
                  </div>
                ) : (
                  supportTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">#{ticket.id.slice(-5)}</span>
                          <h4 className="font-bold text-white text-sm">{ticket.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                            {ticket.category}
                          </span>
                          <select
                            value={ticket.status}
                            onChange={e => updateSupportTicket(selectedCustomerId, ticket.id, { status: e.target.value as any })}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting for Customer">Waiting for Customer</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{ticket.message}</p>

                      {/* Reply Input */}
                      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={ticket.adminReply || ''}
                          placeholder="Type response to customer..."
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              updateSupportTicket(selectedCustomerId, ticket.id, {
                                adminReply: (e.target as HTMLInputElement).value,
                                status: 'Resolved',
                              });
                              showToast('Support reply saved & customer notified!');
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                        <button
                          onClick={e => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                            updateSupportTicket(selectedCustomerId, ticket.id, {
                              adminReply: input.value,
                              status: 'Resolved',
                            });
                            showToast('Support reply saved & customer notified!');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              10. REVIEWS
             ======================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Client Reviews & Testimonials</h2>
                <p className="text-xs text-slate-400">Feedback received from clients upon project completion</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                  <div className="col-span-2 p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                    No reviews received yet.
                  </div>
                ) : (
                  reviews.map(rev => (
                    <div key={rev.id} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">{rev.projectName}</h4>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                      <div className="text-[11px] text-indigo-400 font-semibold">
                        — {rev.customerName || 'Client'} ({rev.businessName || 'Verified Client'})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              11. SETTINGS & DB
             ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">System & Firebase Configuration</h2>
                <p className="text-xs text-slate-400">Database health, permissions and developer utilities</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Firestore Database</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected & Realtime Active</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Security Rules Mode</span>
                  <span className="font-mono text-indigo-300">Hardened ABAC with Zero-Trust</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Bootstrapped Administrator</span>
                  <span className="font-mono text-slate-200">lavesh1918@gmail.com</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Official Business Contact Number</span>
                  <span className="font-mono text-emerald-400 font-semibold">8058378450</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSeedData}
                    disabled={seedingLoading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{seedingLoading ? 'Generating Agency Data...' : 'Seed Sample Client & Metrics'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    Creates an instant client record with realistic Meta & Google Ads data, milestones, and payment records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          MODAL: ADD NEW CUSTOMER
         ======================================================== */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Customer Account</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={custName}
                    onChange={e => setCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Health Clinics"
                    value={custBusiness}
                    onChange={e => setCustBusiness(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@business.com"
                    value={custEmail}
                    onChange={e => setCustEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={custMobile}
                    onChange={e => setCustMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Commissioned Service</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Web Development & Google Ads"
                  value={custService}
                  onChange={e => setCustService(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Business Address</label>
                <textarea
                  rows={2}
                  placeholder="Full office address"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={custPhoto}
                  onChange={e => setCustPhoto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
                >
                  Create & Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE / EDIT PROJECT
         ======================================================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingProjectId ? 'Update Project & Progress' : 'Create New Project'}
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Client *</label>
                <select
                  disabled={!!editingProjectId}
                  value={projTargetCustId || selectedCustomerId}
                  onChange={e => setProjTargetCustId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Patient Booking Portal"
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Custom Web App"
                    value={projService}
                    onChange={e => setProjService(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Project Status</label>
                  <select
                    value={projStatus}
                    onChange={e => setProjStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Started">Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Preview Ready">Preview Ready</option>
                    <option value="Final Payment Pending">Final Payment Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider (0 - 100%) */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Development Progress</span>
                  <span className="font-bold text-indigo-400">{projProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={projProgress}
                  onChange={e => setProjProgress(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Project Value (₹)</label>
                  <input
                    type="number"
                    value={projTotalAmount}
                    onChange={e => setProjTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={projPaidAmount}
                    onChange={e => setProjPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Preview Website URL</label>
                  <input
                    type="url"
                    placeholder="https://preview..."
                    value={projPreviewUrl}
                    onChange={e => setProjPreviewUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Live Website URL</label>
                  <input
                    type="url"
                    placeholder="https://clientdomain..."
                    value={projLiveUrl}
                    onChange={e => setProjLiveUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Customer-Visible Milestone Updates
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Stage 3 completed. UI approval in progress."
                  value={projCustomerUpdates}
                  onChange={e => setProjCustomerUpdates(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
                >
                  {editingProjectId ? 'Save & Notify Client' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE PAYMENT REQUEST
         ======================================================== */}
      {showAddPaymentReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Payment Request</h3>
              <button onClick={() => setShowAddPaymentReqModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Client *</label>
                <select
                  value={payReqCustId || selectedCustomerId}
                  onChange={e => setPayReqCustId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website Final Payment"
                    value={payReqTitle}
                    onChange={e => setPayReqTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={payReqAmount}
                    onChange={e => setPayReqAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Milestone Deliverable *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage 3 delivery sign-off and server transfer"
                  value={payReqReason}
                  onChange={e => setPayReqReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={payReqDueDate}
                    onChange={e => setPayReqDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Related Project</label>
                  <select
                    value={payReqProjId}
                    onChange={e => setPayReqProjId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="">General Invoicing</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Instructions</label>
                <input
                  type="text"
                  value={payReqInstructions}
                  onChange={e => setPayReqInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentReqModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
                >
                  Issue Request & Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REJECT PAYMENT
         ======================================================== */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Reject Payment Submission</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the reason so the customer can review their transaction and resubmit.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectPayment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SEND NOTIFICATION
         ======================================================== */}
      {showAddNotifModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Send Client Notification</h3>
              <button onClick={() => setShowAddNotifModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Preview Ready"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                  <select
                    value={notifType}
                    onChange={e => setNotifType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="Project">Project</option>
                    <option value="Payment">Payment</option>
                    <option value="Ads">Ads</option>
                    <option value="Booking">Booking</option>
                    <option value="Support">Support</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
                  <select
                    value={notifPriority}
                    onChange={e => setNotifPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Notification text..."
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNotifModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE BOOKING
         ======================================================== */}
      {showAddBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Booking</h3>
              <button onClick={() => setShowAddBookingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRO Audit & Growth Call"
                  value={bookService}
                  onChange={e => setBookService(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date & Time *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-10-15 11:30 AM IST"
                  value={bookDate}
                  onChange={e => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Meeting Link / Details</label>
                <input
                  type="text"
                  placeholder="e.g. meet.google.com/xyz-abc"
                  value={bookDetails}
                  onChange={e => setBookDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                >
                  Schedule Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
