import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Loader2,
  Mail,
  Archive,
  CheckCircle,
  Trash2,
  Eye,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Message {
  id: string;
  created_at: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  status: 'read' | 'unread';
  archived: boolean;
  replied: boolean;
  replied_at?: string;
}

export function Messages() {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const statusFilter = searchParams.get('status');

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (user.orgId) {
      query = query.or(`org_id.eq.${user.orgId},org_id.is.null`);
    }

    if (statusFilter === 'unread' || statusFilter === 'read') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to fetch messages');
      logger.error('Messages', 'Error', { error });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages((data as any) || []);
    }
    setLoading(false);
  }, [statusFilter, user]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  const applyMessageScope = <T extends { or: (filters: string) => T }>(query: T) => {
    if (user?.orgId) {
      return query.or(`org_id.eq.${user.orgId},org_id.is.null`);
    }

    return query;
  };

  const updateStatus = async (id: string, status: 'read' | 'unread') => {
    if (!user) {
      toast.error('No user context available');
      return;
    }

    const { error } = await applyMessageScope(
      supabase.from('contact_messages').update({ status }).eq('id', id)
    );

    if (error) {
      toast.error('Failed to update status');
    } else {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status } : null));
      }
    }
  };

  const toggleArchive = async (id: string, current: boolean) => {
    if (!user) {
      toast.error('No user context available');
      return;
    }

    const { error } = await applyMessageScope(
      supabase.from('contact_messages').update({ archived: !current }).eq('id', id)
    );

    if (error) {
      toast.error('Failed to update archive status');
    } else {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, archived: !current } : m)));
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, archived: !current } : null));
      }
      toast.success(current ? 'Unarchived' : 'Archived');
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    if (!user) {
      toast.error('No user context available');
      return;
    }

    const { error } = await applyMessageScope(
      supabase.from('contact_messages').delete().eq('id', id)
    );

    if (error) {
      toast.error('Failed to delete message');
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      toast.success('Message deleted');
    }
  };

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      updateStatus(msg.id, 'read');
    }
  };

  const handleWhatsAppClick = async () => {
    if (!selectedMessage?.phone) {
      toast.error('No phone number available for this contact');
      return;
    }

    const cleanPhone = selectedMessage.phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    const popup = window.open(whatsappUrl, '_blank');

    if (!popup) {
      toast.error('Popup blocked. Please allow popups.');
    }
  };

  const markSelectedMessageAsReplied = async () => {
    if (!selectedMessage || selectedMessage.replied) {
      return;
    }

    if (!user) {
      toast.error('No user context available');
      return;
    }

    const repliedAt = new Date().toISOString();
    const { error } = await applyMessageScope(
      supabase
        .from('contact_messages')
        .update({
          replied: true,
          replied_at: repliedAt,
        })
        .eq('id', selectedMessage.id)
    );

    if (error) {
      toast.error('Failed to mark message as replied');
      return;
    }

    const updatedMessage = {
      ...selectedMessage,
      replied: true,
      replied_at: repliedAt,
    };
    setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMessage : m)));
    setSelectedMessage(updatedMessage);
    toast.success('Marked as replied');
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const columns: ColumnDef<Message>[] = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <>
            {msg.phone && (
              <div className="flex items-center gap-1 text-sm">
                <MessageCircle className="h-3 w-3 text-status-success" />
                {msg.phone}
              </div>
            )}
            {msg.email && !msg.phone && (
              <div className="text-xs text-muted-foreground">{msg.email}</div>
            )}
          </>
        );
      },
    },
    {
      accessorKey: 'message',
      header: 'Subject/Message',
      cell: ({ row }) => <span className="max-w-md truncate block">{row.original.message}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="flex gap-2">
            <Badge variant={msg.status === 'unread' ? 'default' : 'secondary'}>{msg.status}</Badge>
            {msg.replied && (
              <Badge
                variant="outline"
                className="bg-status-success/10 text-status-success border-status-success/30"
              >
                Replied
              </Badge>
            )}
            {msg.archived && <Badge variant="outline">Archived</Badge>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 mr-2"
              onClick={(e) => {
                e.stopPropagation();
                openMessage(msg);
              }}
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(msg.id, msg.status === 'unread' ? 'read' : 'unread');
              }}
              title={msg.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
            >
              {msg.status === 'unread' ? (
                <Mail className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleArchive(msg.id, msg.archived);
              }}
              title={msg.archived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteMessage(msg.id);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Messages
        </h1>
        <Button onClick={fetchMessages} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 overflow-hidden bg-card text-foreground shadow-xs">
        <div className="p-6 pb-4 border-b border-border/40">
          <h2 className="text-xl font-semibold tracking-tight">Inbox</h2>
        </div>
        <div className="border border-border/40 bg-card rounded-b-xl overflow-hidden shadow-xs border-x-0 border-b-0">
          <CrudTable columns={columns} data={messages} pageSize={10} onRowClick={openMessage} />
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Received on {selectedMessage && format(new Date(selectedMessage.created_at), 'PPP p')}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">From</h4>
                  <p className="text-base font-medium">{selectedMessage.name}</p>
                  {selectedMessage.phone && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4 text-status-success" />
                      {selectedMessage.phone}
                    </p>
                  )}
                  {selectedMessage.email && (
                    <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="flex justify-end gap-2">
                    <Badge variant={selectedMessage.status === 'unread' ? 'default' : 'secondary'}>
                      {selectedMessage.status}
                    </Badge>
                    {selectedMessage.replied && (
                      <Badge
                        variant="outline"
                        className="bg-status-success/10 text-status-success border-status-success/30"
                      >
                        Replied
                      </Badge>
                    )}
                    {selectedMessage.archived && <Badge variant="outline">Archived</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Message</h4>
                <div className="p-4 bg-muted/30 rounded-md border border-border text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Reply Action */}
              <div className="pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2">
                  {selectedMessage.phone ? (
                    <Button
                      className="w-full sm:w-auto bg-status-success hover:bg-status-success/80 text-primary-foreground"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Open WhatsApp
                      <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
                    </Button>
                  ) : (
                    <div className="p-4 bg-status-warning/10 text-status-warning rounded-md text-sm border border-status-warning/30">
                      This contact does not have a WhatsApp number associated with it.
                    </div>
                  )}
                  {!selectedMessage.replied && (
                    <Button variant="outline" onClick={() => void markSelectedMessageAsReplied()}>
                      Mark as Replied
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            {selectedMessage && (
              <>
                <div className="flex mr-auto gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleArchive(selectedMessage.id, selectedMessage.archived)}
                  >
                    {selectedMessage.archived ? 'Unarchive' : 'Archive'}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => deleteMessage(selectedMessage.id)}>
                    Delete
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
