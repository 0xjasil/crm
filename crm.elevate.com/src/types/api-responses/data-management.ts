
export type GetAllServicesResponse = { success: boolean; message: string; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; price: number; }[]; } | { success: boolean; message: string; data?: undefined; };

export type CreateServiceResponse = { success: boolean; message: string; data?: undefined; } | { success: boolean; message: string; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; price: number; }; };

export type UpdateServiceResponse = { success: boolean; message: string; data?: undefined; } | { success: boolean; message: string; data: { name: string; id: string; createdAt: Date; updatedAt: Date; isActive: boolean; price: number; }; };
