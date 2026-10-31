import type { AdmissionWithReceiptsAndCourse } from "@/types/fee-collection";
import type { FeeCalculationResult } from '@/types/fee-collection';
import type * as ApiModels from '@/types/api-models';

export type CreateReceiptResponse = { error: string; success?: undefined; data?: undefined; } | { success: boolean; data: { id: string; createdAt: Date; updatedAt: Date; courseId: string; notes: string | null; createdById: string; paymentDate: Date; paymentMode: string | null; receiptNumber: string; amountCollected: number; collectedTowards: ApiModels.CollectedTowards; transactionId: string | null; admissionId: string; }; error?: undefined; };

export type UpdateReceiptResponse = { error: string; success?: undefined; data?: undefined; } | { success: boolean; data: { id: string; createdAt: Date; updatedAt: Date; courseId: string; notes: string | null; createdById: string; paymentDate: Date; paymentMode: string | null; receiptNumber: string; amountCollected: number; collectedTowards: ApiModels.CollectedTowards; transactionId: string | null; admissionId: string; }; error?: undefined; };

export type GetReceiptsByAdmissionIdResponse = { success: boolean; data: ({ createdBy: { name: string; id: string; email: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string | null; branch: string | null; banned: boolean | null; banReason: string | null; banExpires: Date | null; roleId: string | null; }; } & { id: string; createdAt: Date; updatedAt: Date; courseId: string; notes: string | null; createdById: string; paymentDate: Date; paymentMode: string | null; receiptNumber: string; amountCollected: number; collectedTowards: ApiModels.CollectedTowards; transactionId: string | null; admissionId: string; })[]; error?: undefined; } | { error: string; success?: undefined; data?: undefined; };

export type GetAdmissionWithFeeDetailsResponse = { error: string; success?: undefined; data?: undefined; } | { success: boolean; data: { admission: AdmissionWithReceiptsAndCourse; feeDetails: FeeCalculationResult; }; error?: undefined; };
