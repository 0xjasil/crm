'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  BookOpen,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdmissionStatus } from '@/types/admission';

interface AdmissionListItem {
  id: string;
  admissionNumber: string;
  candidateName: string;
  mobileNumber: string;
  email: string | null;
  status: AdmissionStatus;
  createdAt: Date;
  course: {
    id: string;
    name: string;
  };
  additionalNotes?: string | null;
  assignedToUser?: {
    id: string;
    name: string;
  } | null;
}

interface AdmissionMobileCardProps {
  admission: AdmissionListItem;
  onView: (id: string) => void;
  onEdit: (admission: any) => void;
  onDelete: (id: string, candidateName: string) => void;
  onReassign: (admission: any) => void;
  formatDate: (date: Date) => string;
}

export const AdmissionMobileCard = memo(function AdmissionMobileCard({
  admission,
  onView,
  onEdit,
  onDelete,
  onReassign,
  formatDate,
}: AdmissionMobileCardProps) {
  let stageLabel = 'Survey Recorded';
  let stageBadgeClass = 'bg-muted text-muted-foreground';

  if (admission.status === 'COMPLETED') {
    stageLabel = 'Installed ✓';
    stageBadgeClass = 'bg-emerald-600 text-white font-semibold';
  } else if (admission.additionalNotes) {
    try {
      const parsed = JSON.parse(admission.additionalNotes);
      if (parsed?.timelineStep === 'INSTALLED') {
        stageLabel = 'Installed ✓';
        stageBadgeClass = 'bg-emerald-600 text-white font-semibold';
      } else if (parsed?.timelineStep === 'INSTALLATION_IN_PROGRESS') {
        stageLabel = 'Installing';
        stageBadgeClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300';
      } else if (parsed?.timelineStep === 'MATERIAL_DISPATCHED') {
        stageLabel = 'Dispatched';
        stageBadgeClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300';
      } else if (parsed?.timelineStep === 'DOCUMENTS_VERIFIED') {
        stageLabel = 'Docs Verified';
        stageBadgeClass = 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-300';
      }
    } catch {
      // ignore
    }
  }

  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <Card
      className="w-full border-border/80 shadow-xs hover:border-border transition-colors cursor-pointer"
      onClick={() => onView(admission.id)}
    >
      <CardContent className="p-3.5 space-y-3">
        {/* Header: Survey ID & Stage Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary">
                {admission.admissionNumber}
              </span>
              <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${stageBadgeClass}`}>
                {stageLabel}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
              {admission.candidateName}
            </h3>
            {admission.email && (
              <p className="text-[11px] text-muted-foreground truncate">{admission.email}</p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleCall(e, admission.mobileNumber)}
              title="Call"
            >
              <Phone className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleWhatsApp(e, admission.mobileNumber)}
              title="WhatsApp"
            >
              <IconBrandWhatsapp className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onView(admission.id)}>
                  <Eye className="mr-2 size-3.5" />
                  View Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(admission)}>
                  <Edit className="mr-2 size-3.5" />
                  Edit Survey
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReassign(admission)}>
                  <UserPlus className="mr-2 size-3.5" />
                  Assign Surveyor
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(admission.id, admission.candidateName)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete Record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          <div className="flex items-center gap-1.5 truncate col-span-2 sm:col-span-1">
            <BookOpen className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="font-medium text-foreground truncate">
              {admission.course?.name || 'Capacity N/A'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px]">{formatDate(admission.createdAt)}</span>
          </div>

          {admission.assignedToUser && (
            <div className="flex items-center gap-1.5 col-span-2 text-[11px]">
              <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Surveyor: <span className="font-medium text-foreground">{admission.assignedToUser.name}</span></span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
