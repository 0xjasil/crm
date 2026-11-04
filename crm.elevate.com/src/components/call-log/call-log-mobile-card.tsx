'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneCall,
  Clock,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import Link from 'next/link';
import { CallLog } from '@/types/enquiry';
import { StatusBadge } from '@/components/ui/status-badge';

interface CallLogMobileCardProps {
  callLog: CallLog;
  formatDuration: (seconds: number) => string;
  formatTimestamp: (date: Date | string) => string;
}

export const CallLogMobileCard = memo(function CallLogMobileCard({
  callLog,
  formatDuration,
  formatTimestamp,
}: CallLogMobileCardProps) {
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <Card className="w-full border-border/80 shadow-xs hover:border-border transition-colors">
      <CardContent className="p-3.5 space-y-3">
        {/* Top Header: Candidate Name, Outcome & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/enquiries/${callLog.enquiry.id}`}
              className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {callLog.enquiry.candidateName}
            </Link>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <StatusBadge status={callLog.outcome} size="sm" />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="size-3" />
                {formatDuration(callLog.duration || 0)}
              </span>
            </div>
          </div>

          {/* Quick Call / WhatsApp / View */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => handleCall(callLog.enquiry.phone)}
              title="Call"
            >
              <Phone className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => handleWhatsApp(callLog.enquiry.phone)}
              title="WhatsApp"
            >
              <IconBrandWhatsapp className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              asChild
            >
              <Link href={`/enquiries/${callLog.enquiry.id}`}>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 truncate">
            <PhoneCall className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="font-mono text-[11px] text-foreground">{callLog.enquiry.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <User className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="truncate">{callLog.createdBy.name}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-[11px]">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span>{formatTimestamp(callLog.createdAt)}</span>
          </div>
        </div>

        {/* Notes if available */}
        {callLog.notes && (
          <div className="text-xs bg-muted/40 p-2 rounded-md text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Notes: </span>
            {callLog.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
