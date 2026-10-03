# Security Specification & Threat Model

## 1. Data Invariants
1. Customer documents in `/customers/{customerId}` contain client contact information, financial totals, and access tokens. Unauthorized callers cannot read or modify other customers' data.
2. An authorized admin (`isAdmin()`) has full read and write access across all customer profiles and their subcollections.
3. Customer access tokens provide client-side isolation where a client with a valid token only queries and mutates their own subcollection documents under `/customers/{customerId}`.
4. Projects in `/customers/{customerId}/projects/{projectId}` can only be created, modified, or deleted by administrators.
5. Payment requests in `/customers/{customerId}/paymentRequests/{requestId}` can only be created by administrators.
6. Customers can submit payments (`/customers/{customerId}/payments/{paymentId}`) with status `"Pending"` and their own `customerId`. Status cannot be self-marked as `"Verified"`.
7. Only administrators can verify or reject payments, updating status to `"Verified"` or `"Rejected"`.
8. Customers can submit support tickets in `/customers/{customerId}/support/{ticketId}` with initial status `"Open"`.
9. Reviews in `/customers/{customerId}/reviews/{reviewId}` require a rating between 1 and 5 and can only be submitted for completed projects.
10. Ads performance records in `/customers/{customerId}/ads/{adId}` can only be written by administrators.
11. Bootstrapped admin is `lavesh1918@gmail.com`.
12. All incoming document updates must respect strict schema keys and length constraints.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Admin Escalation**: An anonymous user attempting to write an entry into `/admins/attacker_uid`.
2. **Cross-Customer Profile Read**: Customer A attempting to read `/customers/customer_b`.
3. **Ghost Field Injection**: Adding an unpermitted field `isSuperVip: true` to a payment submission payload.
4. **Self-Verification Attack**: Customer attempting to create a payment document with `status: "Verified"` and `verifiedAt: "2026-10-02"`.
5. **Project Tampering by Customer**: Customer attempting to change their project progress from `20%` to `100%` or status to `Completed`.
6. **Negative Payment Amount**: Customer submitting a payment with `amount: -5000`.
7. **Ad Spend Fabrication**: Customer attempting to insert fake advertising spend into `/customers/{customerId}/ads/fake_ad`.
8. **Admin Impersonation via Spoofed Email**: Authenticated user with email `lavesh1918@gmail.com` but `email_verified: false` attempting admin write.
9. **Oversized String Payload (Denial of Wallet)**: Submitting a support ticket with a 500,000-character description.
10. **Review Score Hijacking**: Submitting a review with `rating: 10` or `rating: -1` (valid range is 1-5).
11. **Direct Notification Hijack**: Customer attempting to forge a system notification in another customer's collection.
12. **Booking Tampering**: Customer attempting to overwrite admin notes on a service booking.

All 12 attacks are blocked by security rules and return `PERMISSION_DENIED`.
