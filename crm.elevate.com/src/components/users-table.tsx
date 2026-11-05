// src/components/users-table.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconDotsVertical,
  IconTrash,
  IconShieldLock,
} from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { UsersTableProps, UserWithRole } from '@/types/user';
import { updateUserBranchAction, updateUserRoleAction, deleteUserAction, getUserDeactivationPreview, reactivateUserAction, permanentlyDeleteUnusedUserAction, type UserDeactivationPreview } from '@/lib/actions/auth';
import { useAction } from 'next-safe-action/hooks';
import { SOFTWARE_POSITIONS, ALL_FEATURE_MODULES } from '@/constants/permissions';
import { getPositionDefinition, getUserEffectivePermissions } from '@/lib/permissions';
import { PermissionsDialog } from '@/components/users/permissions-dialog';

export function UsersTable({ users, branches }: UsersTableProps) {
  const router = useRouter();
  const previewRequest = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [permanentDeleteMode, setPermanentDeleteMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [preview, setPreview] = useState<UserDeactivationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [replacementId, setReplacementId] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [updatingBranchUserId, setUpdatingBranchUserId] = useState<string | null>(null);

  // State for permissions configuration modal
  const [configUser, setConfigUser] = useState<UserWithRole | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  const { execute: updateBranch } = useAction(updateUserBranchAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        router.refresh();
      }
    },
    onError: () => {
      toast.error('Failed to update user branch. Please try again.');
    },
    onSettled: () => {
      setUpdatingBranchUserId(null);
    },
  });

  const { execute: updateRole } = useAction(updateUserRoleAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        router.refresh();
      }
    },
    onError: () => {
      toast.error('Failed to update user position. Please try again.');
    },
    onSettled: () => {
      setUpdatingRoleUserId(null);
    },
  });

  const { execute: deleteUser } = useAction(deleteUserAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        setShowDeleteDialog(false);
        setUserToDelete(null);
        router.refresh();
      } else if (data?.message) {
        toast.error(data.message);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Failed to deactivate user. Please try again.');
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const { execute: reactivateUser } = useAction(reactivateUserAction, {
    onSuccess: ({ data }) => {
      if (data?.success) { toast.success(data.message); setShowDeleteDialog(false); router.refresh(); }
      else toast.error(data?.message || 'Reactivation failed');
    },
    onError: ({ error }) => toast.error(error.serverError || 'Reactivation failed. Please try again.'),
    onSettled: () => setIsDeleting(false),
  });
  const { execute: permanentlyDeleteUser } = useAction(permanentlyDeleteUnusedUserAction, {
    onSuccess: ({ data }) => {
      if (data?.success) { toast.success(data.message); setShowDeleteDialog(false); router.refresh(); }
      else toast.error(data?.message || 'Deletion failed');
    },
    onError: ({ error }) => toast.error(error.serverError || 'Unable to delete account. It may have linked records.'),
    onSettled: () => setIsDeleting(false),
  });
  const needsTransfer = !!preview && (preview.jobs.length + preview.leads.length + preview.enquiries.length + preview.surveys.length > 0);
  const filteredUsers = useMemo(() => {
    const visible = users.filter(user => statusFilter === 'all' || (statusFilter === 'active' ? user.isActive !== false : user.isActive === false));
    if (!searchQuery) return visible;

    const query = searchQuery.toLowerCase();
    return visible.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.role && user.role.toLowerCase().includes(query)) ||
        (user.branch &&
          branches
            .find((b) => b.id === user.branch)
            ?.name.toLowerCase()
            .includes(query))
    );
  }, [users, searchQuery, branches, statusFilter]);

  const handleDeleteClick = async (user: UserWithRole) => {
    const requestId = ++previewRequest.current;
    setPermanentDeleteMode(false);
    setUserToDelete(user);
    setPreview(null);
    setPreviewError('');
    setReplacementId('');
    setLoadingPreview(true);
    setShowDeleteDialog(true);
    try {
      const result = await getUserDeactivationPreview(user.id);
      if (requestId === previewRequest.current) setPreview(result);
    }
    catch { if (requestId === previewRequest.current) setPreviewError('Unable to load pending work. Close and reopen this window to try again.'); }
    finally { if (requestId === previewRequest.current) setLoadingPreview(false); }
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete || !preview) return;
    setIsDeleting(true);
    if (permanentDeleteMode) permanentlyDeleteUser({ userId: userToDelete.id });
    else if (userToDelete.isActive === false) reactivateUser({ userId: userToDelete.id });
    else deleteUser({ userId: userToDelete.id, replacementId: replacementId || undefined, revision: preview.revision });
  };

  const handleDeleteCancel = () => {
    previewRequest.current++;
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleRoleUpdate = async (userId: string, newRole: string, currentRole: string) => {
    if (newRole === currentRole) return;
    setUpdatingRoleUserId(userId);
    updateRole({ userId, role: newRole });
  };

  const handleBranchUpdate = async (
    userId: string,
    newBranchId: string,
    currentBranchId: string
  ) => {
    if (newBranchId === currentBranchId) return;

    setUpdatingBranchUserId(userId);
    updateBranch({ userId, branchId: newBranchId });
  };

  const handleOpenPermissions = (user: UserWithRole) => {
    setConfigUser(user);
    setShowPermissionsDialog(true);
  };

  const PositionSelect = ({ user }: { user: UserWithRole }) => {
    const isUpdating = updatingRoleUserId === user.id;
    const currentPosition = getPositionDefinition(user.role);

    return (
      <div className="flex items-center gap-1.5">
        <Select
          value={user.role || 'telecaller'}
          onValueChange={(newRole) => handleRoleUpdate(user.id, newRole, user.role || '')}
          disabled={isUpdating || user.isActive === false}
        >
          <SelectTrigger className="w-44 h-8 text-xs border border-border/70 shadow-none px-2.5 focus:ring-1 focus:ring-ring bg-background">
            <SelectValue>
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-foreground truncate">
                  {currentPosition.shortTitle}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SOFTWARE_POSITIONS.map((pos) => (
              <SelectItem key={pos.id} value={pos.id} className="cursor-pointer text-xs">
                <div className="flex flex-col py-0.5">
                  <span className="font-medium text-foreground">{pos.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    {pos.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUpdating && (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    );
  };

  const BranchSelect = ({ user }: { user: UserWithRole }) => {
    const isUpdating = updatingBranchUserId === user.id;
    const currentBranchId = user.branch || '';

    const getBranchDisplayText = (branchId: string | null) => {
      if (!branchId) return 'No Branch';
      const branch = branches.find((b) => b.id === branchId);
      return branch ? branch.name : 'Unknown';
    };

    return (
      <div className="flex items-center gap-1.5">
        <Select
          value={currentBranchId}
          onValueChange={(newBranchId) => handleBranchUpdate(user.id, newBranchId, currentBranchId)}
          disabled={isUpdating || user.isActive === false}
        >
          <SelectTrigger className="w-36 h-8 text-xs border border-border/70 shadow-none px-2 focus:ring-1 focus:ring-ring bg-background">
            <SelectValue>
              <span className="text-xs text-foreground font-medium truncate">
                {getBranchDisplayText(currentBranchId)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id} className="cursor-pointer text-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{branch.name}</span>
                  {branch.address && (
                    <span className="text-[10px] text-muted-foreground">{branch.address}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUpdating && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" aria-label="Account status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active users</SelectItem>
            <SelectItem value="inactive">Inactive users</SelectItem>
            <SelectItem value="all">All users</SelectItem>
          </SelectContent>
        </Select>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="h-9 px-2.5 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Users Table Card */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Provisioned Team Accounts ({filteredUsers.length})
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            Positions & feature logins fully controlled by Admin
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead className="w-[190px]">Role</TableHead>
                  <TableHead className="min-w-[280px]">Active Feature Permissions</TableHead>
                  <TableHead className="w-[170px]">Assigned Branch</TableHead>
                  <TableHead className="w-[110px]">Created</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      No matching user accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const effectivePerms = getUserEffectivePermissions(user);
                    const isAll = effectivePerms.includes('*');
                    const activeCount = isAll ? ALL_FEATURE_MODULES.length : effectivePerms.length;

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-foreground">{user.name} {user.isActive === false && <Badge variant="secondary">Inactive</Badge>}</span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PositionSelect user={user} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isAll ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 font-semibold"
                              >
                                Full System Admin (All Features)
                              </Badge>
                            ) : (
                              <>
                                {effectivePerms.slice(0, 3).map((permId) => {
                                  const mod = ALL_FEATURE_MODULES.find((m) => m.id === permId);
                                  return (
                                    <Badge
                                      key={permId}
                                      variant="outline"
                                      className="text-[10px] px-2 py-0 font-medium bg-background"
                                    >
                                      {mod?.label || permId}
                                    </Badge>
                                  );
                                })}
                                {effectivePerms.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 font-medium"
                                  >
                                    +{effectivePerms.length - 3} more
                                  </Badge>
                                )}
                              </>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPermissions(user)}
                              className="h-6 text-[10px] px-2 ml-1 text-primary hover:bg-primary/10 hover:text-primary gap-1 font-medium"
                            >
                              <IconShieldLock className="size-3" />
                              Configure ({activeCount})
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BranchSelect user={user} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-xs font-medium cursor-pointer"
                                onClick={() => handleOpenPermissions(user)}
                              >
                                <IconShieldLock className="mr-2 h-3.5 w-3.5 text-primary" />
                                Configure Feature Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                                disabled={user.role === 'admin' || user.email === 'admin@elevate.com'}
                                onClick={() => handleDeleteClick(user)}
                              >
                                <IconTrash className="mr-2 h-3.5 w-3.5" />
                                {user.isActive === false ? 'Review / Reactivate Account' : 'Deactivate Account'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Configurator Modal */}
      <PermissionsDialog
        user={configUser}
        isOpen={showPermissionsDialog}
        onClose={() => {
          setShowPermissionsDialog(false);
          setConfigUser(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { if (!isDeleting) setShowDeleteDialog(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{permanentDeleteMode ? 'Permanently delete' : userToDelete?.isActive === false ? 'Reactivate' : 'Deactivate'} {userToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {permanentDeleteMode ? 'This unused account and its login credentials will be permanently deleted. This cannot be undone. Deletion is blocked if any CRM work or history is found.' : userToDelete?.isActive === false
                ? 'Restore login access. Previously transferred work stays with its current owner.'
                : 'Login access will end immediately. Completed work, notes, calls, invoices, payments and original authors will be preserved.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {loadingPreview && <p role="status" className="text-sm">Loading pending work...</p>}
          {previewError && <p role="alert" className="text-sm text-destructive">{previewError}</p>}
          {preview && <div className="max-h-[50vh] overflow-y-auto space-y-3 text-sm">
            {!permanentDeleteMode && userToDelete?.isActive !== false && <>
              <p>{preview.jobs.length} pending jobs  /  {preview.leads.length} pending job leads  /  {preview.enquiries.length} enquiries  /  {preview.followUps.length} pending follow-ups  /  {preview.surveys.length} surveys/projects</p>
              {preview.jobs.length > 0 && <div><strong>Jobs to transfer</strong><ul className="list-disc pl-5">{preview.jobs.map(job => <li key={job.id}>{job.name}</li>)}</ul></div>}
              {preview.leads.length > 0 && <details><summary>Pending job leads ({preview.leads.length})</summary><ul>{preview.leads.map(lead => <li key={lead.id}>{lead.job.name}  -  {lead.id}</li>)}</ul></details>}
              {preview.enquiries.length > 0 && <details><summary>Enquiries to transfer ({preview.enquiries.length})</summary><ul>{preview.enquiries.map(enquiry => <li key={enquiry.id}>{enquiry.candidateName}</li>)}</ul></details>}
              {needsTransfer && <div className="space-y-2">
                <label htmlFor="replacement-user" className="font-medium">Transfer pending work to</label>
                <Select value={replacementId} onValueChange={setReplacementId} disabled={isDeleting}>
                  <SelectTrigger id="replacement-user"><SelectValue placeholder="Select an active user" /></SelectTrigger>
                  <SelectContent>{preview.candidates.map(candidate => <SelectItem key={candidate.id} value={candidate.id}>{candidate.name}{candidate.branch ? ` (${branches.find(b => b.id === candidate.branch)?.name || candidate.branch})` : ''}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">Only eligible active users in the work&apos;s branch and administrators are listed. Follow-ups move with their enquiry.</p>
              </div>}
              {!needsTransfer && <p>No pending work needs to be transferred.</p>}
            </>}
            {preview.canPermanentlyDelete && !permanentDeleteMode && <Button variant="link" className="text-destructive px-0" disabled={isDeleting} onClick={() => setPermanentDeleteMode(true)}>Permanently delete unused account...</Button>}
            {preview.history.length > 0 && <div className="border-t pt-3"><strong>Account history</strong><ul className="space-y-2 mt-2">{preview.history.map(event => <li key={event.id}>{event.action === 'DEACTIVATED' ? 'Deactivated' : event.action === 'REACTIVATED' ? 'Reactivated' : 'Deleted unused account'} by {event.actorName} on {formatDate(event.createdAt)}{event.replacementName && `; pending work transferred to ${event.replacementName}`}</li>)}</ul></div>}
          </div>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); handleDeleteConfirm(); }}
              disabled={isDeleting || loadingPreview || !preview || (userToDelete?.isActive !== false && needsTransfer && !replacementId)}
              className="bg-rose-600 hover:bg-rose-700 text-xs text-white"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                permanentDeleteMode ? 'Permanently Delete Account' : userToDelete?.isActive === false ? 'Reactivate User' : needsTransfer ? 'Transfer & Deactivate' : 'Deactivate User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
