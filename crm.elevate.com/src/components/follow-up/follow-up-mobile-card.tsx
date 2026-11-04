'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  Eye,
  Calendar,
  FileText,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { FollowUp } from '@/types/enquiry';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FollowUpMobileCardProps {
  followUp: FollowUp;
  onUpdate: (followUp: FollowUp) => void;
}

export const FollowUpMobileCard = memo(function FollowUpMobileCard({
  followUp,
  onUpdate,
}: FollowUpMobileCardProps) {
  const formatDateTime = (date: string | Date) =>
    new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isOverdue = (scheduledAt: string | Date, status: string) =>
    new Date(scheduledAt) < new Date() && status === 'PENDING';

  const overdue = isOverdue(followUp.scheduledAt, followUp.status);

  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmail = (e: React.MouseEvent, email?: string) => {
    e.stopPropagation();
    if (email) window.open(`mailto:${email}`, '_self');
  };

  return (
    <Card className="w-full border-border/80 shadow-xs hover:border-border transition-colors">
      <CardContent className="p-3.5 space-y-3">
        {/* Header: Name, status & actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={followUp.status} size="sm" />
              {overdue && <StatusBadge status="OVERDUE" size="sm" />}
            </div>
            <Link
              href={`/enquiries/${followUp.enquiry.id}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1 hover:text-primary transition-colors">
                {followUp.enquiry.candidateName}
              </h3>
            </Link>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {followUp.enquiry.phone}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleCall(e, followUp.enquiry.phone)}
              title="Call"
            >
              <Phone className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleWhatsApp(e, followUp.enquiry.phone)}
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
                <DropdownMenuItem onClick={() => onUpdate(followUp)}>
                  <CheckCircle className="mr-2 size-3.5" />
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/enquiries/${followUp.enquiry.id}`}>
                    <Eye className="mr-2 size-3.5" />
                    View Enquiry
                  </Link>
                </DropdownMenuItem>
                {followUp.enquiry.email && (
                  <DropdownMenuItem onClick={(e) => handleEmail(e as any, followUp.enquiry.email)}>
                    <Mail className="mr-2 size-3.5" />
                    Send Email
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scheduled date + notes */}
        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px]">
              Scheduled: <span className="font-medium text-foreground">{formatDateTime(followUp.scheduledAt)}</span>
            </span>
          </div>

          {followUp.notes && (
            <div className="flex items-start gap-1.5">
              <FileText className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
              <p className="text-[11px] line-clamp-2">{followUp.notes}</p>
            </div>
          )}

          {followUp.outcome && (
            <div className="flex items-start gap-1.5">
              <CheckCircle className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] line-clamp-2 text-foreground">
                <span className="font-medium">Outcome: </span>{followUp.outcome}
              </p>
            </div>
          )}
        </div>

        {/* Update action */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate(followUp)}
          className="w-full h-8 text-xs font-medium"
        >
          <CheckCircle className="mr-1.5 size-3.5" />
          Update Follow-up
        </Button>
      </CardContent>
    </Card>
  );
});
