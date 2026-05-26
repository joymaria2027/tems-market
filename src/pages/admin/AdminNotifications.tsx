import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell, Search, ChevronLeft, ChevronRight, MessageSquare, Smartphone,
} from "lucide-react";
import { format } from "date-fns";

interface NotificationLog {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  message: string;
  twilio_sid: string | null;
  sent_at: string;
  meta_message_id?: string | null;
  at_message_id?: string | null;
}

const PAGE_SIZE = 25;

const typeBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  invite: "default",
  otp: "secondary",
  approval: "default",
  order_update: "outline",
  commission: "outline",
  gift_card: "secondary",
};

const channelIcon = (ch: string) =>
  ch === "whatsapp"
    ? <MessageSquare className="h-3.5 w-3.5" />
    : <Smartphone className="h-3.5 w-3.5" />;

const AdminNotifications = () => {
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<NotificationLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications", page, typeFilter, channelFilter, search],
    queryFn: async () => {
      let q = supabase
        .from("notifications_log")
        .select("*", { count: "exact" })
        .order("sent_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      if (channelFilter !== "all") q = q.eq("channel", channelFilter);
      if (search.trim()) q = q.ilike("message", `%${search.trim()}%`);

      const { data: rows, error, count } = await q;
      if (error) throw error;
      return { rows: (rows ?? []) as NotificationLog[], total: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout>
      <div className="container py-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications Log</h1>
            <p className="text-sm text-muted-foreground">{total} total notifications</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invite">Invite</SelectItem>
              <SelectItem value="otp">OTP</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="order_update">Order Update</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="gift_card">Gift Card</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications found.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="min-w-[300px]">Message</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow
                    key={n.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetail(n)}
                  >
                    <TableCell>
                      <Badge variant={typeBadge[n.type] ?? "outline"} className="capitalize text-xs">
                        {n.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {channelIcon(n.channel)}
                        <span className="capitalize">{n.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[350px] truncate">
                      {n.message}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(n.sent_at), "dd MMM HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Detail
              </DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant={typeBadge[detail.type] ?? "outline"} className="capitalize mt-0.5">
                      {detail.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Channel</p>
                    <div className="flex items-center gap-1.5 mt-0.5 font-medium capitalize">
                      {channelIcon(detail.channel)} {detail.channel}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs mt-0.5">{detail.user_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sent At</p>
                    <p className="mt-0.5">{format(new Date(detail.sent_at), "dd MMM yyyy HH:mm:ss")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap break-words">
                    {detail.message}
                  </div>
                </div>
                {(detail.meta_message_id || detail.twilio_sid) && (
                  <div className="grid grid-cols-2 gap-3">
                    {detail.meta_message_id && (
                      <div>
                        <p className="text-xs text-muted-foreground">Meta Message ID</p>
                        <p className="font-mono text-xs mt-0.5 break-all">{detail.meta_message_id}</p>
                      </div>
                    )}
                    {detail.twilio_sid && (
                      <div>
                        <p className="text-xs text-muted-foreground">Twilio SID</p>
                        <p className="font-mono text-xs mt-0.5 break-all">{detail.twilio_sid}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminNotifications;
