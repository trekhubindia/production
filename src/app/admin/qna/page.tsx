'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HelpCircle,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Reply,
  Archive,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  admin_reply?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function QnAPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contact?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages based on search and status
  useEffect(() => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(
        (msg) =>
          msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  }, [messages, searchTerm]);

  // Fetch messages on component mount and when status filter changes
  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  // Update message status
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchMessages();
      } else {
        console.error('Failed to update message status');
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const response = await fetch(`/api/contact/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_reply: replyText,
          admin_notes: notesText,
          status: 'replied',
        }),
      });

      if (response.ok) {
        setReplyText('');
        setNotesText('');
        setIsReplyDialogOpen(false);
        fetchMessages();
        
        // Show success message
        alert(`Reply sent successfully! An email has been sent to ${selectedMessage.email} with your response.`);
      } else {
        console.error('Failed to send reply');
        alert('Failed to send reply. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/contact/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMessages();
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive"><Inbox className="w-3 h-3 mr-1" />Unread</Badge>;
      case 'read':
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />Read</Badge>;
      case 'replied':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Replied</Badge>;
      case 'archived':
        return <Badge variant="outline"><Archive className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get message stats
  const getStats = () => {
    const total = messages.length;
    const unread = messages.filter(m => m.status === 'unread').length;
    const replied = messages.filter(m => m.status === 'replied').length;
    const archived = messages.filter(m => m.status === 'archived').length;

    return { total, unread, replied, archived };
  };

  const stats = getStats();

  return (
    <div className="flex flex-col gap-8 py-10 px-4 w-full flex-1 bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary" />
            Q&A Messages
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            Manage contact form submissions and customer inquiries
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-card border border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Messages</CardTitle>
            <MessageSquare className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Unread</CardTitle>
            <AlertCircle className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Replied</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Archived</CardTitle>
            <Archive className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.archived}</div>
            <p className="text-xs text-muted-foreground mt-1">Stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search messages by name, email, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      <Card className="bg-card border border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Contact Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <Card key={message.id} className="border border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{message.name}</span>
                              {getStatusBadge(message.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {message.email}
                              </div>
                              {message.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {message.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(message.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-foreground leading-relaxed">{message.message}</p>
                        </div>

                        {message.admin_reply && (
                          <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
                            <div className="flex items-center gap-2 mb-2">
                              <Reply className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-primary">Admin Reply</span>
                            </div>
                            <p className="text-foreground">{message.admin_reply}</p>
                          </div>
                        )}

                        {message.admin_notes && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span className="font-medium text-yellow-800 dark:text-yellow-200">Internal Notes</span>
                            </div>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">{message.admin_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2">
                        <Dialog open={isReplyDialogOpen && selectedMessage?.id === message.id} onOpenChange={setIsReplyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMessage(message);
                                setReplyText(message.admin_reply || '');
                                setNotesText(message.admin_notes || '');
                              }}
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Reply to {message.name}</DialogTitle>
                              <DialogDescription>
                                Send a response to this customer inquiry. Your reply will be saved in the database and automatically emailed to {message.email} in a professional format that includes their original question.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Reply Message
                                </label>
                                <Textarea
                                  placeholder="Type your reply here..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={6}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  Internal Notes (Optional)
                                </label>
                                <Textarea
                                  placeholder="Add internal notes for future reference..."
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)} disabled={isSendingReply}>
                                  Cancel
                                </Button>
                                <Button onClick={sendReply} disabled={!replyText.trim() || isSendingReply}>
                                  {isSendingReply ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                      Sending Email...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-1" />
                                      Send Reply & Email
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Select
                          value={message.status}
                          onValueChange={(status) => updateMessageStatus(message.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
