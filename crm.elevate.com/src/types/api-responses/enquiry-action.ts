
export type GetBranchesResponse = { success: boolean; data: { name: string; id: string; email: string | null; createdAt: Date; updatedAt: Date; address: string | null; phone: string | null; isActive: boolean; }[]; };

export type GetCoursesResponse = { success: boolean; data: { name: string; id: string; createdAt: Date; updatedAt: Date; duration: string | null; description: string | null; isActive: boolean; courseFee: number | null; admissionFee: number | null; semesterFee: number | null; }[]; };
