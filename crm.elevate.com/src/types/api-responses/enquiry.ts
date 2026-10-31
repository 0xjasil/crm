
export type GetCurrentUserResponse = { name: string; id: string; email: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string | null; branch: string | null; banned: boolean | null; banReason: string | null; banExpires: Date | null; roleId: string | null; } & { role: string; branch?: string; userRole?: any; };
