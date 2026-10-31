// API data types. Database access belongs to the Fastify backend.

export const EnquiryStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  NOT_INTERESTED: 'NOT_INTERESTED',
  FOLLOW_UP: 'FOLLOW_UP',
  ENROLLED: 'ENROLLED',
  DROPPED: 'DROPPED',
  INVALID: 'INVALID',
} as const;
export type EnquiryStatus = typeof EnquiryStatus[keyof typeof EnquiryStatus];

export const FollowUpStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
} as const;
export type FollowUpStatus = typeof FollowUpStatus[keyof typeof FollowUpStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const AdmissionGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type AdmissionGender = typeof AdmissionGender[keyof typeof AdmissionGender];

export const AdmissionStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type AdmissionStatus = typeof AdmissionStatus[keyof typeof AdmissionStatus];

export const CollectedTowards = {
  ADMISSION_FEE: 'ADMISSION_FEE',
  COURSE_FEE: 'COURSE_FEE',
  SEMESTER_FEE: 'SEMESTER_FEE',
  OTHER: 'OTHER',
} as const;
export type CollectedTowards = typeof CollectedTowards[keyof typeof CollectedTowards];

export const ExpenseCategory = {
  OFFICE_SUPPLIES: 'OFFICE_SUPPLIES',
  TRAVEL: 'TRAVEL',
  UTILITIES: 'UTILITIES',
  MARKETING: 'MARKETING',
  MEALS: 'MEALS',
  EQUIPMENT: 'EQUIPMENT',
  SOFTWARE: 'SOFTWARE',
  OTHER: 'OTHER',
} as const;
export type ExpenseCategory = typeof ExpenseCategory[keyof typeof ExpenseCategory];

export const JobLeadStatus = {
  PENDING: 'PENDING',
  CLOSED: 'CLOSED',
} as const;
export type JobLeadStatus = typeof JobLeadStatus[keyof typeof JobLeadStatus];

export const NotificationType = {
  ENQUIRY_ASSIGNED: 'ENQUIRY_ASSIGNED',
  JOB_ORDER_ASSIGNED: 'JOB_ORDER_ASSIGNED',
  FOLLOW_UP_ASSIGNED: 'FOLLOW_UP_ASSIGNED',
  GENERAL: 'GENERAL',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const BillingStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
} as const;
export type BillingStatus = typeof BillingStatus[keyof typeof BillingStatus];

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string | null;
  branch: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  roleId: string | null;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  courseFee: number | null;
  admissionFee: number | null;
  semesterFee: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  updatedAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface Enquiry {
  id: string;
  candidateName: string;
  phone: string;
  contact2: string | null;
  email: string | null;
  address: string | null;
  status: EnquiryStatus;
  notes: string | null;
  feedback: string | null;
  lastContactDate: Date | null;
  branchId: string | null;
  preferredCourseId: string | null;
  assignedToUserId: string | null;
  createdByUserId: string | null;
  assignedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  serviceId: string | null;
  source: string | null;
  sourceId: string | null;
}

export interface FollowUp {
  id: string;
  scheduledAt: Date;
  status: FollowUpStatus;
  outcome: string | null;
  notes: string | null;
  enquiryId: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallLog {
  id: string;
  callDate: Date;
  duration: number | null;
  outcome: string | null;
  notes: string | null;
  enquiryId: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admission {
  id: string;
  admissionNumber: string;
  candidateName: string;
  mobileNumber: string;
  email: string | null;
  gender: AdmissionGender | null;
  dateOfBirth: Date | null;
  address: string;
  leadSource: string | null;
  lastQualification: string | null;
  yearOfPassing: number | null;
  percentageCGPA: string | null;
  instituteName: string | null;
  additionalNotes: string | null;
  balance: number;
  nextDueDate: Date | null;
  status: AdmissionStatus;
  enquiryId: string | null;
  courseId: string;
  agentName: string | null;
  agentCommission: number | null;
  createdByUserId: string;
  handledByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  amountCollected: number;
  collectedTowards: CollectedTowards;
  paymentDate: Date;
  paymentMode: string | null;
  transactionId: string | null;
  notes: string | null;
  admissionId: string;
  courseId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  gstin: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  billedTo: string;
  invoiceDate: Date;
  dueDate: Date | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  withholdingAmount: number;
  withholdingType: string | null;
  serviceCharge: number;
  otherCharges: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string | null;
  amountPaid: number;
  balanceDue: number;
  shareToken: string | null;
  remindersEnabled: boolean;
  reminderRules: string[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string | null;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMode: string;
  depositTo: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: Date;
}

export interface PaymentNumberSettings {
  id: string;
  autoGenerate: boolean;
  prefix: string;
  nextNumber: number;
  padding: number;
  restartEachFiscalYear: boolean;
  lastResetFiscalYear: number | null;
  updatedAt: Date;
}

export interface InvoiceActivity {
  id: string;
  invoiceId: string;
  userId: string;
  type: string;
  message: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  invoiceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  expenseDate: Date;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceBill {
  id: string;
  serviceIds: string[];
  total: number;
  status: BillingStatus;
  billId: string;
  paid: number;
  balance: number;
  billDate: Date;
  admissionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceBillItem {
  id: string;
  serviceBillId: string;
  amount: number;
  paymentMode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobOrder {
  id: string;
  jobCode: string | null;
  name: string;
  description: string | null;
  remarks: string | null;
  managerId: string;
  assignerId: string | null;
  branchId: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface JobLead {
  id: string;
  jobId: string;
  status: JobLeadStatus;
  leadId: string;
  assignerId: string | null;
  assigneeId: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface account {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  idToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnquirySource {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  proposalNo: string;
  title: string | null;
  enquiryId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  branch: string | null;
  branchId: string | null;
  status: string;
  validUntil: Date | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  terms: string | null;
  createdById: string | null;
  createdByUser: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

