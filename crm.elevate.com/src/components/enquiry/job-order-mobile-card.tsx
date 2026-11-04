'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  Trash2,
  Calendar,
  User,
  MapPin,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobOrder {
  id: string;
  name: string;
  branch: {
    name: string;
  };
  manager: {
    name: string;
  };
  startDate: Date;
  endDate: Date;
  progress: number;
  _count?: {
    jobLeads: number;
  };
}

interface JobOrderMobileCardProps {
  jobOrder: JobOrder;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const JobOrderMobileCard = memo(function JobOrderMobileCard({
  jobOrder,
  onView,
  onDelete,
  isAdmin,
}: JobOrderMobileCardProps) {
  const formatDate = (date: Date) => format(new Date(date), 'MMM dd, yyyy');

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (value >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <Card className="w-full border-border/80 shadow-xs hover:border-border transition-colors cursor-pointer" onClick={() => onView(jobOrder.id)}>
      <CardContent className="p-3.5 space-y-3">
        {/* Header: ID, leads badge, progress, actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary">
                #{jobOrder.id.slice(-6)}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {jobOrder._count?.jobLeads ?? 0} Leads
              </Badge>
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
              {jobOrder.name}
            </h3>
          </div>

          {/* Progress + Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-end gap-0.5 mr-1">
              <span className={`text-xs font-bold tabular-nums ${getProgressColor(jobOrder.progress)}`}>
                {jobOrder.progress}%
              </span>
              <Progress value={jobOrder.progress} className="w-14 h-1.5" />
            </div>

            {isAdmin ? (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => onView(jobOrder.id)}>
                      <Eye className="mr-2 size-3.5" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 size-3.5" />
                        Delete Job Order
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this job order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the job order and
                      remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(jobOrder.id)}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => onView(jobOrder.id)}
                title="View Details"
              >
                <Eye className="size-3.5 text-primary" />
              </Button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate text-[11px]">{jobOrder.branch.name}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <User className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate text-[11px]">{jobOrder.manager.name}</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px]">
              {formatDate(jobOrder.startDate)} — {formatDate(jobOrder.endDate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
