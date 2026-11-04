'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Proposal } from '@/types/proposal';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/utils';

interface ProposalMobileCardProps {
  proposal: Proposal;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}

export const ProposalMobileCard = memo(function ProposalMobileCard({
  proposal,
  onView,
  onEdit,
  onDelete,
  formatDate,
}: ProposalMobileCardProps) {
  return (
    <Card
      className="w-full border-border/80 shadow-xs hover:border-border transition-colors cursor-pointer"
      onClick={() => onView(proposal.id)}
    >
      <CardContent className="p-3.5 space-y-3">
        {/* Header: Proposal No, Amount & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary">
                {proposal.proposalNo}
              </span>
              <StatusBadge status={proposal.status} size="sm" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-1">
              {proposal.clientName}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-primary hover:bg-primary/10"
              onClick={() => onView(proposal.id)}
              title="View Proposal"
            >
              <Eye className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onView(proposal.id)}>
                  <Eye className="mr-2 size-3.5" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(proposal.id)}>
                  <Edit className="mr-2 size-3.5" />
                  Edit Proposal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(proposal.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete Proposal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Amount & Details Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">Proposal Amount</span>
            <div className="font-mono font-bold text-sm text-foreground">
              {formatCurrency(proposal.totalAmount || 0)}
            </div>
          </div>

          <div className="text-right space-y-0.5 text-muted-foreground">
            <div className="flex items-center gap-1 justify-end text-[11px]">
              <Calendar className="size-3" />
              <span>{formatDate(proposal.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-[11px]">
              <User className="size-3" />
              <span className="truncate max-w-[120px]">{proposal.createdByUser || 'System'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

