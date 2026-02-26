import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch messages');
      console.error(error);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMessages((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id: string, status: 'read' | 'unread') => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);

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
    const { error } = await supabase
      .from('contact_messages')
      .update({ archived: !current })
      .eq('id', id);

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

    const { error } = await supabase.from('contact_messages').delete().eq('id', id);

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

    // Clean phone number (remove non-digits, keep +)
    const cleanPhone = selectedMessage.phone.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;

    window.open(whatsappUrl, '_blank');

    // Mark as replied if not already
    if (!selectedMessage.replied) {
      const { error } = await supabase
        .from('contact_messages')
        .update({
          replied: true,
          replied_at: new Date().toISOString(),
        })
        .eq('id', selectedMessage.id);

      if (!error) {
        const updatedMessage = {
          ...selectedMessage,
          replied: true,
          replied_at: new Date().toISOString(),
        };
        setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMessage : m)));
        setSelectedMessage(updatedMessage);
        toast.success('Marked as replied');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <Button onClick={fetchMessages} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subject/Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No messages found.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className={`
                                            cursor-pointer transition-colors hover:bg-muted/50
                                            ${msg.status === 'unread' ? 'bg-muted/30 font-medium' : ''}
                                        `}
                    onClick={() => openMessage(msg)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(msg.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{msg.name}</div>
                    </TableCell>
                    <TableCell>
                      {msg.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <MessageCircle className="h-3 w-3 text-status-success" />
                          {msg.phone}
                        </div>
                      )}
                      {msg.email && !msg.phone && (
                        <div className="text-xs text-muted-foreground">{msg.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{msg.message}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={msg.status === 'unread' ? 'default' : 'secondary'}>
                          {msg.status}
                        </Badge>
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
                    </TableCell>
                    <TableCell
                      className="text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 mr-2"
                        onClick={() => openMessage(msg)}
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <div className="p-4 bg-muted/30 rounded-none border border-border text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Reply Action */}
              <div className="pt-4 border-t">
                {selectedMessage.phone ? (
                  <Button
                    className="w-full sm:w-auto bg-status-success hover:bg-status-success/80 text-primary-foreground"
                    onClick={handleWhatsAppClick}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Reply via WhatsApp
                    <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
                  </Button>
                ) : (
                  <div className="p-4 bg-status-warning/10 text-status-warning rounded-none text-sm border border-status-warning/30">
                    This contact does not have a WhatsApp number associated with it.
                  </div>
                )}
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
