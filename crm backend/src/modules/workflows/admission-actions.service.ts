import { moneySchema } from '../../shared/utils/money.schemas.js';
import { ForbiddenError } from '../../errors/app-error.js';
import type { PrismaClient } from '@prisma/client';
import type { WorkflowUser } from './workflow-user.js';
import { z } from "zod";
import { installationProgressSchema, saveInstallationProgress } from "./support/lib/installation-progress.js";
import { AdmissionGender, AdmissionStatus, AdmissionCreateData, } from "./support/types/admission.js";
import { Prisma } from "@prisma/client";
import { calculateBalance, calculateTotalFee } from "./support/lib/fee-utils.js";
import { cacheService } from "./support/lib/cache/cache-service.js";
import { CACHE_KEYS, CACHE_TTL } from "./support/lib/cache/cache-keys.js";
import { invalidateDashboardCache } from "./support/lib/cache/cache-invalidation.js";
import { normalizePagination, validateSortField, validateSortOrder, buildPaginationResult, } from "./support/lib/pagination-utils.js";
export function createAdmissionActionsService(prisma: PrismaClient, currentUser: WorkflowUser) {
    async function getCurrentUser() { return currentUser; }
    const agentRoles = ["manager", "admin", "counsellor"];
    function generateAdmissionNumber(): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");
        return `ADM-${year}${month}${day}-${random}`;
    }
    const createAdmissionSchema = z.object({
        candidateName: z.string().min(1, "Candidate name is required"),
        mobileNumber: z.string().min(10, "Valid mobile number is required"),
        email: z.string().email().optional().or(z.literal("")),
        gender: z.nativeEnum(AdmissionGender).optional(),
        dateOfBirth: z.coerce.date().optional(),
        address: z.string().min(1, "Address is required"),
        leadSource: z.string().optional(),
        lastQualification: z.string().optional(),
        yearOfPassing: z.number().min(1950).max(new Date().getFullYear()).optional(),
        percentageCGPA: z.string().optional(),
        instituteName: z.string().optional(),
        additionalNotes: z.string().optional(),
        courseId: z.string().min(1, "Course selection is required"),
        agentName: z.string().optional(),
        agentCommission: moneySchema.refine((value) => value.greaterThanOrEqualTo(0), "Amount is below the minimum").optional(),
        enquiryId: z.string().optional(),
        createdAt: z.coerce.date().optional()
    });
    const updateAdmissionSchema = z.object({
        id: z.string().min(1, "Admission ID is required"),
        candidateName: z.string().optional(),
        mobileNumber: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        gender: z.nativeEnum(AdmissionGender).optional(),
        dateOfBirth: z.coerce.date().optional(),
        address: z.string().optional(),
        agentName: z.string().optional(),
        agentCommission: moneySchema.refine((value) => value.greaterThanOrEqualTo(0), "Amount is below the minimum").optional(),
        leadSource: z.string().optional(),
        lastQualification: z.string().optional(),
        yearOfPassing: z.number().min(1950).max(new Date().getFullYear()).optional(),
        percentageCGPA: z.string().optional(),
        instituteName: z.string().optional(),
        additionalNotes: z.string().optional(),
        courseId: z.string().optional(),
        createdAt: z.coerce.date().optional(),
        status: z.nativeEnum(AdmissionStatus).optional(),
        enquiryId: z.string().optional(),
    });
    const deleteAdmissionSchema = z.object({
        id: z.string().min(1, "Admission ID is required"),
    });
    const getAdmissionsSchema = z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        status: z.nativeEnum(AdmissionStatus).optional(),
        branchId: z.string().optional(),
        courseId: z.string().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
    });
    const getAdmissionByIdSchema = z.object({
        id: z.string().min(1, "Admission ID is required"),
    });
    const getAdmissionsByEnquirySchema = z.object({
        enquiryId: z.string().min(1, "Enquiry ID is required"),
    });
    async function createAdmission(input: unknown) {
        const parsedInput = createAdmissionSchema.parse(input ?? {});
        try {
            const user = await getCurrentUser();
            // Get course details
            const course = await prisma.course.findUnique({
                where: { id: parsedInput.courseId },
                select: {
                    id: true,
                    name: true,
                    admissionFee: true,
                    courseFee: true,
                    semesterFee: true,
                },
            });
            if (!course) {
                throw new Error("Course not found");
            }
            // Generate unique admission number
            let admissionNumber: string;
            let attempts = 0;
            const maxAttempts = 10;
            do {
                admissionNumber = generateAdmissionNumber();
                const existing = await prisma.admission.findUnique({
                    where: { admissionNumber },
                });
                if (!existing)
                    break;
                attempts++;
            } while (attempts < maxAttempts);
            if (attempts >= maxAttempts) {
                throw new Error("Could not generate unique admission number");
            }
            const eligibleForAgentCommission = user.role && agentRoles.includes(user?.role?.toLocaleLowerCase());
            if (!eligibleForAgentCommission && (parsedInput.agentName || parsedInput.agentCommission)) {
                throw new Error("You don't have permission to add agent details");
            }
            // Prepare data object with conditional fields
            const admissionData: AdmissionCreateData = {
                admissionNumber,
                candidateName: parsedInput.candidateName,
                mobileNumber: parsedInput.mobileNumber,
                email: parsedInput.email || null,
                gender: parsedInput.gender || null,
                dateOfBirth: parsedInput.dateOfBirth || null,
                address: parsedInput.address,
                leadSource: parsedInput.leadSource || null,
                lastQualification: parsedInput.lastQualification || null,
                yearOfPassing: parsedInput.yearOfPassing || null,
                percentageCGPA: parsedInput.percentageCGPA || null,
                instituteName: parsedInput.instituteName || null,
                additionalNotes: parsedInput.additionalNotes || null,
                createdAt: parsedInput.createdAt || new Date(),
                ...(eligibleForAgentCommission ? { agentName: parsedInput.agentName, agentCommission: parsedInput.agentCommission, handledBy: { connect: { id: user.id } } } : {}),
                status: AdmissionStatus.PENDING,
                course: {
                    connect: { id: parsedInput.courseId },
                },
                createdBy: {
                    connect: { id: user.id },
                },
                balance: calculateTotalFee({ ...course, agentCommission: parsedInput.agentCommission || 0 }),
            };
            // Add enquiryId only if it exists
            if (parsedInput.enquiryId) {
                admissionData.enquiry = { connect: { id: parsedInput.enquiryId } };
            }
            const admission = await prisma.admission.create({
                data: admissionData,
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    enquiry: {
                        select: {
                            id: true,
                            candidateName: true,
                            phone: true,
                            email: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            await invalidateDashboardCache();
            return {
                success: true,
                data: admission,
                message: "Admission created successfully",
            };
        }
        catch (error) {
            console.error("Error creating admission:", error);
            throw new Error("Failed to create admission");
        }
    }
    const updateInstallationProgressSchema = installationProgressSchema;
    async function updateInstallationProgress(input: unknown) {
        const parsedInput = updateInstallationProgressSchema.parse(input ?? {}), ctx = { user: currentUser, userId: currentUser.id, userRole: currentUser.role, session: { id: currentUser.id, userId: currentUser.id } };
        await prisma.$transaction(async (tx) => {
            await saveInstallationProgress(tx, ctx.user, parsedInput);
        });
        await invalidateDashboardCache();
        return { success: true, message: 'Installation progress updated successfully' };
    }
    async function updateAdmission(input: unknown) {
        if (!["admin"].includes(currentUser.role || ''))
            throw new ForbiddenError('Insufficient permissions');
        const parsedInput = updateAdmissionSchema.parse(input ?? {});
        try {
            const user = await getCurrentUser();
            const { id, ...updateData } = parsedInput;
            // Check if admission exists
            const existingAdmission = await prisma.admission.findUnique({
                where: { id },
                include: { course: true },
            });
            if (!existingAdmission) {
                throw new Error("Admission not found");
            }
            // Build update data
            const data: Record<string, unknown> = {};
            const eligibleForAgentCommission = user.role && agentRoles.includes(user?.role?.toLocaleLowerCase());
            if (!eligibleForAgentCommission && (updateData.agentName || updateData.agentCommission)) {
                throw new Error("You don't have permission to add agent details");
            }
            // Basic fields
            if (updateData.candidateName)
                data.candidateName = updateData.candidateName;
            if (updateData.mobileNumber)
                data.mobileNumber = updateData.mobileNumber;
            if (updateData.email !== undefined)
                data.email = updateData.email || null;
            if (updateData.gender)
                data.gender = updateData.gender;
            if (updateData.dateOfBirth)
                data.dateOfBirth = updateData.dateOfBirth;
            if (updateData.address)
                data.address = updateData.address;
            if (updateData.leadSource !== undefined)
                data.leadSource = updateData.leadSource || null;
            if (updateData.lastQualification)
                data.lastQualification = updateData.lastQualification;
            if (updateData.yearOfPassing)
                data.yearOfPassing = updateData.yearOfPassing;
            if (updateData.percentageCGPA)
                data.percentageCGPA = updateData.percentageCGPA;
            if (updateData.instituteName)
                data.instituteName = updateData.instituteName;
            if (updateData.additionalNotes !== undefined)
                data.additionalNotes = updateData.additionalNotes || null;
            if (updateData.status)
                data.status = updateData.status;
            if (updateData.createdAt)
                data.createdAt = updateData.createdAt;
            if (updateData.agentName || updateData.agentCommission) {
                data.agentName = updateData.agentName || null;
                data.agentCommission = updateData.agentCommission || null;
                data.handledBy = { connect: { id: user.id } };
            }
            // Handle course change
            if (updateData.courseId) {
                data.course = { connect: { id: updateData.courseId } };
            }
            const admission = await prisma.admission.update({
                where: { id },
                data: { ...data, balance: calculateBalance(existingAdmission.balance, updateData.agentCommission || 0) },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    enquiry: {
                        select: {
                            id: true,
                            candidateName: true,
                            phone: true,
                            email: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            await invalidateDashboardCache();
            return {
                success: true,
                data: admission,
                message: "Admission updated successfully",
            };
        }
        catch (error) {
            console.error("Error updating admission:", error);
            throw new Error("Failed to update admission");
        }
    }
    async function deleteAdmission(input: unknown) {
        if (!["admin"].includes(currentUser.role || ''))
            throw new ForbiddenError('Insufficient permissions');
        const parsedInput = deleteAdmissionSchema.parse(input ?? {});
        try {
            const { id } = parsedInput;
            // Check if admission exists
            const existingAdmission = await prisma.admission.findUnique({
                where: { id },
            });
            if (!existingAdmission) {
                throw new Error("Admission not found");
            }
            // Perform soft delete by updating status to CANCELLED
            await prisma.admission.update({
                where: { id },
                data: {
                    status: AdmissionStatus.CANCELLED,
                },
            });
            await invalidateDashboardCache();
            return { success: true, message: "Admission deleted successfully" };
        }
        catch (error) {
            console.error("Error deleting admission:", error);
            throw new Error("Failed to delete admission");
        }
    }
    const ADMISSION_SORT_FIELDS = [
        "createdAt",
        "candidateName",
        "admissionNumber",
        "status",
        "balance",
        "updatedAt",
    ];
    async function getAdmissions(input: unknown) {
        const parsedInput = getAdmissionsSchema.parse(input ?? {});
        try {
            const { search, status, courseId, branchId, dateFrom, dateTo, } = parsedInput;
            const { page, limit, skip } = normalizePagination({
                page: parsedInput.page,
                limit: parsedInput.limit,
            });
            const sortBy = validateSortField(parsedInput.sortBy, ADMISSION_SORT_FIELDS, "createdAt");
            const sortOrder = validateSortOrder(parsedInput.sortOrder, "desc");
            // Build where clause
            const where: Prisma.AdmissionWhereInput = {};
            const user = await getCurrentUser();
            const role = (user.role || "").toLowerCase();
            if (role === "telecaller") {
                where.createdByUserId = user.id;
            }
            else if ((role === "manager" || role === "executive" || role === "branch manager") &&
                user.branch) {
                where.OR = [
                    { enquiry: { branchId: user.branch } },
                    { createdBy: { branch: user.branch } },
                ];
            }
            else if (branchId) {
                where.OR = [
                    { enquiry: { branchId } },
                    { createdBy: { branch: branchId } },
                ];
            }
            // Add status filter
            if (status) {
                where.status = status;
            }
            // Add search filter
            if (search && search.trim()) {
                const query = search.trim();
                const searchConditions: Prisma.AdmissionWhereInput[] = [
                    { candidateName: { contains: query, mode: "insensitive" } },
                    { mobileNumber: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { admissionNumber: { contains: query, mode: "insensitive" } },
                    { course: { name: { contains: query, mode: "insensitive" } } },
                ];
                if (where.OR) {
                    where.AND = [{ OR: where.OR }, { OR: searchConditions }];
                    delete where.OR;
                }
                else {
                    where.OR = searchConditions;
                }
            }
            // Add other filters
            if (courseId)
                where.courseId = courseId;
            // Add date range filter
            if (dateFrom || dateTo) {
                where.createdAt = {};
                if (dateFrom)
                    where.createdAt.gte = dateFrom;
                if (dateTo)
                    where.createdAt.lte = dateTo;
            }
            const [admissions, totalCount] = await Promise.all([
                prisma.admission.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                }),
                prisma.admission.count({ where }),
            ]);
            const pagination = buildPaginationResult(totalCount, page, limit);
            return {
                success: true,
                data: {
                    admissions,
                    totalCount,
                    currentPage: page,
                    totalPages: pagination.totalPages,
                    pagination: {
                        page: pagination.page,
                        limit: pagination.limit,
                        total: pagination.total,
                        totalPages: pagination.totalPages,
                    },
                },
            };
        }
        catch (error) {
            console.error("Error fetching admissions:", error);
            throw new Error("Failed to fetch admissions");
        }
    }
    async function getAdmissionById(input: unknown) {
        const parsedInput = getAdmissionByIdSchema.parse(input ?? {});
        try {
            const { id } = parsedInput;
            const admission = await prisma.admission.findUnique({
                where: { id },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            duration: true,
                        },
                    },
                    enquiry: {
                        select: {
                            id: true,
                            candidateName: true,
                            phone: true,
                            email: true,
                            source: true,
                        },
                    },
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            if (!admission) {
                throw new Error("Admission not found");
            }
            return { success: true, data: admission };
        }
        catch (error) {
            console.error("Error fetching admission:", error);
            throw new Error("Failed to fetch admission");
        }
    }
    async function getAdmissionsByEnquiry(input: unknown) {
        const parsedInput = getAdmissionsByEnquirySchema.parse(input ?? {});
        try {
            const { enquiryId } = parsedInput;
            const admissions = await prisma.admission.findMany({
                where: {
                    enquiryId,
                    status: { not: AdmissionStatus.CANCELLED },
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return { success: true, data: admissions };
        }
        catch (error) {
            console.error("Error fetching admissions by enquiry:", error);
            throw new Error("Failed to fetch admissions");
        }
    }
    const getEnquirySourcesForAdmissionSchema = z.object({}).optional();
    async function getEnquirySourcesForAdmission(input: unknown = undefined) {
        getEnquirySourcesForAdmissionSchema.parse(input ?? {});
        try {
            const enquirySources = await cacheService.getOrSet(CACHE_KEYS.sources, CACHE_TTL.MASTER_DATA, async () => await prisma.enquirySource.findMany());
            return { success: true, data: enquirySources };
        }
        catch (error) {
            console.error("Error fetching enquiry sources:", error);
            throw new Error("Failed to fetch enquiry sources");
        }
    }
    const getCoursesForAdmissionSchema = z.object({}).optional();
    async function getCoursesForAdmission(input: unknown = undefined) {
        getCoursesForAdmissionSchema.parse(input ?? {});
        try {
            const courses = await cacheService.getOrSet(`${CACHE_KEYS.courses}:active`, CACHE_TTL.MASTER_DATA, async () => await prisma.course.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    admissionFee: true,
                    semesterFee: true,
                    courseFee: true,
                    description: true,
                    duration: true,
                },
                orderBy: { name: "asc" },
            }));
            return { success: true, data: courses };
        }
        catch (error) {
            console.error("Error fetching courses:", error);
            throw new Error("Failed to fetch courses");
        }
    }
    return { getCurrentUser, createAdmission, updateInstallationProgress, updateAdmission, deleteAdmission, getAdmissions, getAdmissionById, getAdmissionsByEnquiry, getEnquirySourcesForAdmission, getCoursesForAdmission };
}
