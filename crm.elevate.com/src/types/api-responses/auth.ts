
export type CreateUserActionResponse = { success: boolean; message: string; user: { userRole: { name: string; id: string; createdAt: Date; updatedAt: Date; description: string | null; permissions: string[]; } | null; name: string; id: string; email: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string | null; branch: string | null; banned: boolean | null; banReason: string | null; banExpires: Date | null; roleId: string | null; }; };

export type GetAllUsersResponse = ({ userRole: { name: string; id: string; createdAt: Date; updatedAt: Date; description: string | null; permissions: string[]; } | null; } & { name: string; id: string; email: string; emailVerified: boolean; image: string | null; createdAt: Date; updatedAt: Date; role: string | null; branch: string | null; banned: boolean | null; banReason: string | null; banExpires: Date | null; roleId: string | null; })[];

export type GetAllBranchesResponse = { name: string; id: string; email: string | null; createdAt: Date; updatedAt: Date; address: string | null; phone: string | null; isActive: boolean; }[];
