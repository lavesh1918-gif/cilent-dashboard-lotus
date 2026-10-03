import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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

// Helper to generate secure random token for passwordless customer dashboard link
export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

export function generateCustomerId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CUST-${num}`;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ---------------- CUSTOMERS ----------------

export async function createCustomer(data: Omit<Customer, 'id' | 'accessToken' | 'tokenStatus' | 'totalAmount' | 'paidAmount' | 'remainingAmount' | 'createdAt' | 'updatedAt'> & { customId?: string }): Promise<Customer> {
  const id = data.customId || generateCustomerId();
  const now = new Date().toISOString();
  const customer: Customer = {
    ...data,
    id,
    accessToken: generateSecureToken(),
    tokenStatus: 'active',
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const path = `customers/${id}`;
  try {
    await setDoc(doc(db, 'customers', id), customer);
    // Create initial welcome notification
    await createNotification(id, {
      title: 'Welcome to your Client Portal!',
      message: `Welcome ${customer.name}! You can monitor your projects, track live ad metrics, submit payments, and contact support here.`,
      type: 'System',
      priority: 'normal',
      read: false,
    });
    return customer;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const path = `customers/${id}`;
  try {
    await updateDoc(doc(db, 'customers', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function regenerateCustomerToken(customerId: string): Promise<string> {
  const newToken = generateSecureToken();
  await updateCustomer(customerId, {
    accessToken: newToken,
    tokenStatus: 'active',
  });
  return newToken;
}

export async function toggleCustomerTokenStatus(customerId: string, status: 'active' | 'disabled'): Promise<void> {
  await updateCustomer(customerId, { tokenStatus: status });
}

export async function deleteCustomer(id: string): Promise<void> {
  const path = `customers/${id}`;
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCustomers(callback: (customers: Customer[]) => void): Unsubscribe {
  const path = 'customers';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as Customer);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeCustomer(customerId: string, callback: (customer: Customer | null) => void): Unsubscribe {
  const path = `customers/${customerId}`;
  return onSnapshot(
    doc(db, 'customers', customerId),
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Customer);
      } else {
        callback(null);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ---------------- PROJECTS ----------------

export async function createProject(customerId: string, projectData: Omit<Project, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const id = generateId('proj');
  const now = new Date().toISOString();
  const project: Project = {
    ...projectData,
    id,
    customerId,
    createdAt: now,
    updatedAt: now,
  };

  const path = `customers/${customerId}/projects/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'projects', id), project);

    // Update customer total financial figures
    await recalculateCustomerFinancials(customerId);

    // Create notification
    await createNotification(customerId, {
      title: `New Project Started: ${project.name}`,
      message: `Your project "${project.name}" (${project.serviceName}) has been scheduled. Expected completion: ${project.expectedCompletionDate || 'TBD'}.`,
      type: 'Project',
      relatedProjectId: id,
      priority: 'normal',
      read: false,
    });

    return project;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(customerId: string, projectId: string, updates: Partial<Project>, notifyCustomer = true): Promise<void> {
  const path = `customers/${customerId}/projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId, 'projects', projectId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await recalculateCustomerFinancials(customerId);

    if (notifyCustomer && (updates.progress !== undefined || updates.status !== undefined || updates.customerUpdates)) {
      const messageParts: string[] = [];
      if (updates.status) messageParts.push(`Status changed to ${updates.status}`);
      if (updates.progress !== undefined) messageParts.push(`Progress updated to ${updates.progress}%`);
      if (updates.customerUpdates) messageParts.push(`Update: ${updates.customerUpdates}`);

      await createNotification(customerId, {
        title: updates.status === 'Completed' || updates.status === 'Delivered'
          ? `🎉 Project ${updates.status}: ${updates.name || 'Your Project'}`
          : `Project Progress Updated (${updates.progress ?? ''}%)`,
        message: messageParts.join('. ') || 'Project details have been updated.',
        type: 'Project',
        relatedProjectId: projectId,
        priority: updates.status === 'Completed' ? 'high' : 'normal',
        read: false,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(customerId: string, projectId: string): Promise<void> {
  const path = `customers/${customerId}/projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId, 'projects', projectId));
    await recalculateCustomerFinancials(customerId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeProjects(customerId: string, callback: (projects: Project[]) => void): Unsubscribe {
  const path = `customers/${customerId}/projects`;
  const q = query(collection(db, 'customers', customerId, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as Project);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- PAYMENT REQUESTS ----------------

export async function createPaymentRequest(customerId: string, data: Omit<PaymentRequest, 'id' | 'customerId' | 'createdAt'>): Promise<PaymentRequest> {
  const id = generateId('req');
  const now = new Date().toISOString();
  const request: PaymentRequest = {
    ...data,
    id,
    customerId,
    createdAt: now,
  };

  const path = `customers/${customerId}/paymentRequests/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'paymentRequests', id), request);

    // Notify customer immediately
    await createNotification(customerId, {
      title: `🔔 New Payment Request: ₹${request.amount.toLocaleString('en-IN')}`,
      message: `${request.title} — Reason: ${request.reason}. Due date: ${request.dueDate || 'Immediate'}. Please submit your transaction details once paid.`,
      type: 'Payment',
      relatedPaymentId: id,
      actionButton: 'View Payment',
      actionUrl: 'payments',
      priority: 'urgent',
      read: false,
    });

    return request;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribePaymentRequests(customerId: string, callback: (requests: PaymentRequest[]) => void): Unsubscribe {
  const path = `customers/${customerId}/paymentRequests`;
  const q = query(collection(db, 'customers', customerId, 'paymentRequests'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as PaymentRequest);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- PAYMENTS ----------------

export async function submitPayment(customerId: string, paymentData: Omit<Payment, 'id' | 'customerId' | 'status' | 'createdAt'>): Promise<Payment> {
  const id = generateId('pay');
  const now = new Date().toISOString();
  const payment: Payment = {
    ...paymentData,
    id,
    customerId,
    status: 'Pending',
    createdAt: now,
  };

  const path = `customers/${customerId}/payments/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'payments', id), payment);

    // If related to a payment request, update request status to submitted
    if (paymentData.requestId) {
      await updateDoc(doc(db, 'customers', customerId, 'paymentRequests', paymentData.requestId), {
        status: 'submitted',
      });
    }

    // Create acknowledgement notification
    await createNotification(customerId, {
      title: 'Payment Submitted for Verification',
      message: `We received your payment submission of ₹${payment.amount.toLocaleString('en-IN')} (UTR: ${payment.utr}). Our billing team is verifying it.`,
      type: 'Payment',
      priority: 'normal',
      read: false,
    });

    return payment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function verifyPayment(customerId: string, paymentId: string, approved: boolean, rejectionReason?: string): Promise<void> {
  const path = `customers/${customerId}/payments/${paymentId}`;
  try {
    const paymentRef = doc(db, 'customers', customerId, 'payments', paymentId);
    const snap = await getDoc(paymentRef);
    if (!snap.exists()) return;
    const payment = snap.data() as Payment;

    if (approved) {
      await updateDoc(paymentRef, {
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
      });

      if (payment.requestId) {
        await updateDoc(doc(db, 'customers', customerId, 'paymentRequests', payment.requestId), {
          status: 'paid',
        });
      }

      // If associated with a project, update project paid amount
      if (payment.projectId) {
        const projRef = doc(db, 'customers', customerId, 'projects', payment.projectId);
        const pSnap = await getDoc(projRef);
        if (pSnap.exists()) {
          const proj = pSnap.data() as Project;
          const newPaid = (proj.paidAmount || 0) + payment.amount;
          const newRemaining = Math.max(0, (proj.totalAmount || 0) - newPaid);
          await updateDoc(projRef, {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      await recalculateCustomerFinancials(customerId);

      await createNotification(customerId, {
        title: '✅ Payment Verified Successfully',
        message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} (UTR: ${payment.utr}) has been verified. Your balance has been updated.`,
        type: 'Payment',
        priority: 'high',
        read: false,
      });
    } else {
      await updateDoc(paymentRef, {
        status: 'Rejected',
        rejectionReason: rejectionReason || 'Information could not be verified',
      });

      if (payment.requestId) {
        await updateDoc(doc(db, 'customers', customerId, 'paymentRequests', payment.requestId), {
          status: 'pending',
        });
      }

      await createNotification(customerId, {
        title: '⚠️ Payment Verification Issue',
        message: `Your payment submission of ₹${payment.amount.toLocaleString('en-IN')} could not be verified. Reason: ${rejectionReason || 'Please verify UTR details and retry'}.`,
        type: 'Payment',
        priority: 'urgent',
        read: false,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribePayments(customerId: string, callback: (payments: Payment[]) => void): Unsubscribe {
  const path = `customers/${customerId}/payments`;
  const q = query(collection(db, 'customers', customerId, 'payments'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as Payment);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- BOOKINGS ----------------

export async function createBooking(customerId: string, bookingData: Omit<Booking, 'id' | 'customerId' | 'createdAt'>): Promise<Booking> {
  const id = generateId('book');
  const now = new Date().toISOString();
  const booking: Booking = {
    ...bookingData,
    id,
    customerId,
    createdAt: now,
  };

  const path = `customers/${customerId}/bookings/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'bookings', id), booking);

    await createNotification(customerId, {
      title: `Booking Confirmed: ${booking.serviceName}`,
      message: `Your booking for "${booking.serviceName}" on ${booking.bookingDate} is scheduled. Status: ${booking.status}.`,
      type: 'Booking',
      priority: 'normal',
      read: false,
    });

    return booking;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBooking(customerId: string, bookingId: string, updates: Partial<Booking>): Promise<void> {
  const path = `customers/${customerId}/bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId, 'bookings', bookingId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeBookings(customerId: string, callback: (bookings: Booking[]) => void): Unsubscribe {
  const path = `customers/${customerId}/bookings`;
  const q = query(collection(db, 'customers', customerId, 'bookings'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as Booking);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- NOTIFICATIONS ----------------

export async function createNotification(customerId: string, data: Omit<NotificationItem, 'id' | 'customerId' | 'createdAt'>): Promise<NotificationItem> {
  const id = generateId('notif');
  const now = new Date().toISOString();
  const notif: NotificationItem = {
    ...data,
    id,
    customerId,
    popupShown: false,
    createdAt: now,
  };

  const path = `customers/${customerId}/notifications/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'notifications', id), notif);
    return notif;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(customerId: string, notificationId: string): Promise<void> {
  const path = `customers/${customerId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId, 'notifications', notificationId), {
      read: true,
      popupShown: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markNotificationPopupShown(customerId: string, notificationId: string): Promise<void> {
  const path = `customers/${customerId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId, 'notifications', notificationId), {
      popupShown: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeNotifications(customerId: string, callback: (notifs: NotificationItem[]) => void): Unsubscribe {
  const path = `customers/${customerId}/notifications`;
  const q = query(collection(db, 'customers', customerId, 'notifications'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as NotificationItem);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- SUPPORT TICKETS ----------------

export async function createSupportTicket(customerId: string, data: Omit<SupportTicket, 'id' | 'customerId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
  const id = generateId('ticket');
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    ...data,
    id,
    customerId,
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };

  const path = `customers/${customerId}/support/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'support', id), ticket);

    await createNotification(customerId, {
      title: `Support Ticket Received: #${id.slice(-5)}`,
      message: `We have received your ticket "${ticket.subject}". An agent will review it shortly.`,
      type: 'Support',
      priority: 'normal',
      read: false,
    });

    return ticket;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSupportTicket(customerId: string, ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
  const path = `customers/${customerId}/support/${ticketId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId, 'support', ticketId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (updates.adminReply || updates.status) {
      await createNotification(customerId, {
        title: `Support Ticket Updated: #${ticketId.slice(-5)}`,
        message: updates.adminReply
          ? `Support Reply: ${updates.adminReply.slice(0, 100)}... (Status: ${updates.status || 'Updated'})`
          : `Ticket status is now ${updates.status}`,
        type: 'Support',
        priority: 'high',
        read: false,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeSupportTickets(customerId: string, callback: (tickets: SupportTicket[]) => void): Unsubscribe {
  const path = `customers/${customerId}/support`;
  const q = query(collection(db, 'customers', customerId, 'support'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as SupportTicket);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- REVIEWS ----------------

export async function createReview(customerId: string, reviewData: Omit<Review, 'id' | 'customerId' | 'createdAt'>): Promise<Review> {
  const id = generateId('rev');
  const now = new Date().toISOString();
  const review: Review = {
    ...reviewData,
    id,
    customerId,
    createdAt: now,
  };

  const path = `customers/${customerId}/reviews/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'reviews', id), review);

    await createNotification(customerId, {
      title: 'Thank You for Your Review! ⭐',
      message: `We appreciate your feedback for "${review.projectName}". Your review has been recorded.`,
      type: 'General',
      priority: 'normal',
      read: false,
    });

    return review;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeReviews(customerId: string, callback: (reviews: Review[]) => void): Unsubscribe {
  const path = `customers/${customerId}/reviews`;
  const q = query(collection(db, 'customers', customerId, 'reviews'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as Review);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- ADS DAILY DATA ----------------

export async function saveAdsDailyData(customerId: string, data: Omit<AdsDailyData, 'id' | 'customerId' | 'createdAt'>): Promise<AdsDailyData> {
  const id = `${data.platform}_${data.date}`;
  const now = new Date().toISOString();
  const adRecord: AdsDailyData = {
    ...data,
    id,
    customerId,
    createdAt: now,
  };

  const path = `customers/${customerId}/ads/${id}`;
  try {
    await setDoc(doc(db, 'customers', customerId, 'ads', id), adRecord);
    return adRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteAdsDailyData(customerId: string, adId: string): Promise<void> {
  const path = `customers/${customerId}/ads/${adId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId, 'ads', adId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAdsData(customerId: string, callback: (data: AdsDailyData[]) => void): Unsubscribe {
  const path = `customers/${customerId}/ads`;
  const q = query(collection(db, 'customers', customerId, 'ads'), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const list = snapshot.docs.map(d => d.data() as AdsDailyData);
      callback(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ---------------- FINANCIALS RECALCULATION ----------------

export async function recalculateCustomerFinancials(customerId: string): Promise<void> {
  try {
    const projectsSnap = await getDocs(collection(db, 'customers', customerId, 'projects'));
    let total = 0;
    let paid = 0;

    projectsSnap.forEach(docSnap => {
      const p = docSnap.data() as Project;
      total += p.totalAmount || 0;
      paid += p.paidAmount || 0;
    });

    const remaining = Math.max(0, total - paid);

    await updateDoc(doc(db, 'customers', customerId), {
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recalculating financials:', error);
  }
}

// ---------------- DEMO SEED DATA GENERATOR ----------------

export async function seedDemoData(): Promise<Customer> {
  const customer = await createCustomer({
    name: 'Rajesh Sharma',
    businessName: 'Apex Health & Wellness Clinics',
    email: 'rajesh@apexhealth.in',
    mobile: '+91 98765 43210',
    businessAddress: '402 Lotus Business Park, Andheri East, Mumbai, Maharashtra 400069',
    service: 'Full-Stack Web App & Digital Ads',
    notes: 'Premium healthcare client. High focus on mobile lead generation and local search rankings.',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  });

  const custId = customer.id;

  // Projects
  const p1 = await createProject(custId, {
    name: 'Apex Modern Patient Portal & Website',
    serviceName: 'Custom Web Application',
    description: 'Bespoke healthcare portal with patient booking, doctor schedules, HIPAA-compliant forms, and high-converting landing pages.',
    startDate: '2026-09-01',
    expectedCompletionDate: '2026-10-25',
    totalAmount: 45000,
    paidAmount: 30000,
    remainingAmount: 15000,
    progress: 80,
    status: 'Review',
    previewUrl: 'https://preview.apexhealth.demo-portal.com',
    liveWebsiteUrl: 'https://apexhealth.in',
    adminNotes: 'All clinic modules approved. Waiting for doctor profile photos.',
    customerUpdates: 'Stage 3 UI review active. Doctor schedule widget integrated.',
  });

  const p2 = await createProject(custId, {
    name: 'SEO & Meta Ads Growth Funnel',
    serviceName: 'Performance Marketing',
    description: 'Targeted Google Ads + Meta Ads campaign for cosmetic dermatology and health checkup packages in Mumbai region.',
    startDate: '2026-09-15',
    expectedCompletionDate: '2026-11-15',
    totalAmount: 20000,
    paidAmount: 20000,
    remainingAmount: 0,
    progress: 100,
    status: 'Completed',
    previewUrl: '',
    liveWebsiteUrl: 'https://apexhealth.in/campaign',
    adminNotes: 'Campaign setup complete and running efficiently.',
    customerUpdates: 'Generated 140+ verified patient leads this month.',
  });

  // Payment Requests
  await createPaymentRequest(custId, {
    title: 'Website Milestone 3 Payment',
    amount: 15000,
    reason: 'Stage 3 UI Delivery & Patient Portal Integration',
    description: 'Final payment upon preview sign-off and server deployment.',
    dueDate: '2026-10-10',
    projectId: p1.id,
    paymentInstructions: 'Please pay via UPI to lotuswebstudio@icici or Bank Transfer to Lotus Web Studio, A/C: 9812739128, IFSC: ICIC0001024. Submit UTR once done.',
    status: 'pending',
  });

  // Payment History
  const pay1 = await submitPayment(custId, {
    projectId: p1.id,
    amount: 15000,
    utr: 'UTR98347102948',
    paymentDate: '2026-09-02',
    upiId: 'rajesh@okaxis',
    notes: 'Advance booking token for web portal',
    paymentProofUrl: '',
  });
  await verifyPayment(custId, pay1.id, true);

  const pay2 = await submitPayment(custId, {
    projectId: p1.id,
    amount: 15000,
    utr: 'UTR58291048201',
    paymentDate: '2026-09-20',
    upiId: 'rajesh@okaxis',
    notes: 'Milestone 2 payment',
    paymentProofUrl: '',
  });
  await verifyPayment(custId, pay2.id, true);

  // Bookings
  await createBooking(custId, {
    serviceName: 'Quarterly Growth Strategy & CRO Audit',
    bookingDate: '2026-10-08 11:00 AM IST',
    status: 'Confirmed',
    tokenStatus: 'Paid',
    projectId: p1.id,
    appointmentDetails: 'Google Meet link: meet.google.com/lotus-apex-q4',
    adminNotes: 'Review patient acquisition CAC and Meta ad creative rotation.',
  });

  // Sample Ads data for last 7 days
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Meta Ads
    await saveAdsDailyData(custId, {
      platform: 'meta',
      date: dateStr,
      impressions: 12000 + Math.floor(Math.random() * 4000),
      reach: 9500 + Math.floor(Math.random() * 2500),
      clicks: 480 + Math.floor(Math.random() * 120),
      calls: 35 + Math.floor(Math.random() * 20),
      websiteClicks: 320 + Math.floor(Math.random() * 80),
      localActions: 45 + Math.floor(Math.random() * 20),
      leads: 28 + Math.floor(Math.random() * 15),
      spend: 1800 + Math.floor(Math.random() * 400),
      ctr: +(4.2 + Math.random() * 0.9).toFixed(2),
      conversions: 24 + Math.floor(Math.random() * 10),
      notes: 'Creative A performing well with video testimonials.',
    });

    // Google Ads
    await saveAdsDailyData(custId, {
      platform: 'google',
      date: dateStr,
      impressions: 8500 + Math.floor(Math.random() * 2500),
      clicks: 620 + Math.floor(Math.random() * 150),
      calls: 55 + Math.floor(Math.random() * 25),
      websiteClicks: 490 + Math.floor(Math.random() * 110),
      localActions: 70 + Math.floor(Math.random() * 30),
      leads: 36 + Math.floor(Math.random() * 14),
      spend: 2400 + Math.floor(Math.random() * 500),
      ctr: +(7.1 + Math.random() * 1.2).toFixed(2),
      conversions: 32 + Math.floor(Math.random() * 12),
      conversionValue: 18000 + Math.floor(Math.random() * 6000),
      notes: 'High intent local search keywords capturing clinic appointment queries.',
    });

    // Local / GMB
    await saveAdsDailyData(custId, {
      platform: 'local',
      date: dateStr,
      impressions: 3200 + Math.floor(Math.random() * 800),
      profileViews: 1400 + Math.floor(Math.random() * 400),
      clicks: 160 + Math.floor(Math.random() * 40),
      calls: 42 + Math.floor(Math.random() * 18),
      websiteClicks: 210 + Math.floor(Math.random() * 60),
      localActions: 95 + Math.floor(Math.random() * 30),
      leads: 18 + Math.floor(Math.random() * 8),
      messages: 12 + Math.floor(Math.random() * 6),
      spend: 0,
      ctr: 0,
      conversions: 18,
      notes: 'Google Business Profile impressions trending upwards.',
    });
  }

  // Reviews on completed project
  await createReview(custId, {
    projectId: p2.id,
    projectName: p2.name,
    rating: 5,
    comment: 'Lotus Web Studio transformed our patient inquiries! The Meta and Google Ad campaign reached our target audience immediately with measurable returns. Highly professional team.',
    customerName: customer.name,
    businessName: customer.businessName,
  });

  // Support ticket
  await createSupportTicket(custId, {
    subject: 'Request to update clinic timings on Google Business profile',
    category: 'Local Marketing',
    message: 'Hello, our Saturday OPD timings are now 10:00 AM to 4:00 PM. Please update this on GMB profile.',
    priority: 'Medium',
    relatedProjectId: p1.id,
  });

  return customer;
}
