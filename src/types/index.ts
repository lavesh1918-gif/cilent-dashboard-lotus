export type ProjectStatus =
  | 'Pending'
  | 'Started'
  | 'In Progress'
  | 'Review'
  | 'Preview Ready'
  | 'Final Payment Pending'
  | 'Completed'
  | 'Delivered'
  | 'On Hold';

export type PaymentStatus = 'Pending' | 'Verified' | 'Rejected';

export type PaymentRequestStatus = 'pending' | 'submitted' | 'paid' | 'cancelled';

export type BookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export type NotificationType = 'Payment' | 'Project' | 'Ads' | 'Booking' | 'Support' | 'General' | 'System';

export type SupportTicketStatus = 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed';

export type SupportPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type AdsPlatform = 'meta' | 'google' | 'local';

export interface Customer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  mobile: string;
  businessAddress: string;
  service: string;
  notes: string;
  profilePhoto?: string;
  accessToken: string;
  tokenStatus: 'active' | 'disabled';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  customerId: string;
  name: string;
  serviceName: string;
  description: string;
  startDate: string;
  expectedCompletionDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progress: number;
  status: ProjectStatus;
  previewUrl?: string;
  liveWebsiteUrl?: string;
  adminNotes?: string;
  customerUpdates?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdsDailyData {
  id: string;
  customerId: string;
  platform: AdsPlatform;
  date: string; // YYYY-MM-DD
  impressions: number;
  reach?: number;
  clicks: number;
  calls: number;
  websiteClicks: number;
  localActions: number;
  leads: number;
  spend: number;
  ctr: number;
  conversions: number;
  conversionValue?: number;
  profileViews?: number;
  messages?: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  customerId: string;
  title: string;
  amount: number;
  reason: string;
  description?: string;
  dueDate: string;
  projectId?: string;
  paymentInstructions?: string;
  status: PaymentRequestStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  projectId?: string;
  requestId?: string;
  amount: number;
  utr: string;
  paymentDate: string;
  upiId?: string;
  paymentProofUrl?: string;
  notes?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  serviceName: string;
  bookingDate: string;
  status: BookingStatus;
  tokenStatus?: string;
  projectId?: string;
  adminNotes?: string;
  appointmentDetails?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedProjectId?: string;
  relatedPaymentId?: string;
  actionButton?: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  popupShown?: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  category: string;
  message: string;
  relatedProjectId?: string;
  priority: SupportPriority;
  status: SupportTicketStatus;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  customerId: string;
  projectId: string;
  projectName: string;
  rating: number; // 1 to 5
  comment: string;
  customerName?: string;
  businessName?: string;
  createdAt: string;
}
