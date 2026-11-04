'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  User,
  Calendar,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Enquiry } from '@/types/enquiry';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { authClient } from '@/lib/auth-client';
import { StatusBadge } from '@/components/ui/status-badge';

interface EnquiryMobileCardProps {
  enquiry: Enquiry;
  onView: (enquiryId: string) => void;
  onEdit: (enquiry: Enquiry) => void;
  onDelete: (enquiryId: string, candidateName: string) => void;
}

export const EnquiryMobileCard = memo(function EnquiryMobileCard({
  enquiry,
  onView,
  onEdit,
  onDelete,
}: EnquiryMobileCardProps) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
    <Card
      className="w-full border-border/80 shadow-xs hover:border-border transition-colors cursor-pointer"
      onClick={() => onView(enquiry.id)}
    >
      <CardContent className="p-3.5 space-y-3">
        {/* Header: Name, Status & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={enquiry.status} size="sm" />
              {enquiry.branch && (
                <span className="text-[10px] text-muted-foreground font-medium truncate">
                  {enquiry.branch.name}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
              {enquiry.candidateName}
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {enquiry.phone}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleCall(e, enquiry.phone)}
              title="Call"
            >
              <Phone className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={(e) => handleWhatsApp(e, enquiry.phone)}
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
                <DropdownMenuItem onClick={() => onView(enquiry.id)}>
                  <Eye className="mr-2 size-3.5" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(enquiry)}>
                  <Edit className="mr-2 size-3.5" />
                  Edit Enquiry
                </DropdownMenuItem>
                {enquiry.email && (
                  <DropdownMenuItem onClick={(e) => handleEmail(e as any, enquiry.email)}>
                    <Mail className="mr-2 size-3.5" />
                    Send Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(enquiry.id, enquiry.candidateName)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete Enquiry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          {enquiry.preferredCourse && (
            <div className="flex items-center gap-1.5 col-span-2 truncate">
              <GraduationCap className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="font-medium text-foreground truncate">
                {enquiry.preferredCourse.name}
              </span>
            </div>
          )}

          {enquiry.assignedTo && (
            <div className="flex items-center gap-1.5 col-span-2 text-[11px]">
              <User className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span>
                Assigned to:{' '}
                <span className="font-medium text-foreground">
                  {enquiry.assignedTo.id === currentUserId ? 'Yourself' : enquiry.assignedTo.name}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span className="text-[11px]">{formatDate(enquiry.createdAt)}</span>
          </div>

          {enquiry.enquirySource && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="truncate text-[11px]">{enquiry.enquirySource.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
