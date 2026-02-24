import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MessageCircle, Phone, ShoppingBag, Calendar, Filter, Users, TrendingUp, AlertTriangle, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  bairro: string | null;
  total_orders: number;
  total_spent: number;
  first_order_at: string | null;
  last_order_at: string | null;
  crm_status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  novo: { label: "Novo", color: "bg-blue-500", icon: <Users className="h-3 w-3" /> },
  ativo: { label: "Ativo", color: "bg-green-500", icon: <TrendingUp className="h-3 w-3" /> },
  morno: { label: "Morno", color: "bg-yellow-500", icon: <AlertTriangle className="h-3 w-3" /> },
  inativo: { label: "Inativo", color: "bg-orange-500", icon: <AlertTriangle className="h-3 w-3" /> },
  perdido: { label: "Perdido", color: "bg-red-500", icon: <UserX className="h-3 w-3" /> },
};

export default function CRMContent() {
  const { store } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("spent");
  const [minSpent, setMinSpent] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("Olá {nome}, sentimos sua falta! 🎉 Volte e aproveite nossas novidades!");

  useEffect(() => {
    if (store) fetchCustomers();
  }, [store]);

  const fetchCustomers = async () => {
    if (!store) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, address, bairro, total_orders, total_spent, first_order_at, last_order_at, crm_status, created_at")
      .eq("store_id", store.id)
      .order("total_spent", { ascending: false });

    if (!error && data) {
      setCustomers(data as CustomerRow[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = customers;

    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
    }

    if (statusFilter !== "all") {
      list = list.filter((c) => c.crm_status === statusFilter);
    }

    if (minSpent) {
      const v = parseFloat(minSpent);
      if (!isNaN(v)) list = list.filter((c) => c.total_spent >= v);
    }

    if (minOrders) {
      const v = parseInt(minOrders);
      if (!isNaN(v)) list = list.filter((c) => c.total_orders >= v);
    }

    list = [...list].sort((a, b) =>
      sortBy === "spent" ? b.total_spent - a.total_spent :
      sortBy === "orders" ? b.total_orders - a.total_orders :
      (b.last_order_at || "").localeCompare(a.last_order_at || "")
    );

    return list;
  }, [customers, search, statusFilter, sortBy, minSpent, minOrders]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    customers.forEach((c) => {
      byStatus[c.crm_status] = (byStatus[c.crm_status] || 0) + 1;
    });
    const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
    const totalOrders = customers.reduce((s, c) => s + c.total_orders, 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { byStatus, totalRevenue, totalOrders, avgTicket, total: customers.length };
  }, [customers]);

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const sendWhatsApp = (customer: CustomerRow) => {
    const msg = whatsappMsg.replace("{nome}", customer.name);
    const phone = customer.phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendWhatsAppBulk = () => {
    const withPhone = filtered.filter((c) => c.phone);
    if (withPhone.length === 0) return;
    // Open first one immediately, rest with delay to avoid popup blocker
    withPhone.forEach((c, i) => {
      setTimeout(() => {
        sendWhatsApp(c);
      }, i * 1500);
    });
  };

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Status", "Pedidos", "Total Gasto", "Último Pedido", "Primeiro Pedido", "Bairro"];
    const rows = filtered.map((c) => [
      c.name,
      c.phone,
      c.crm_status,
      c.total_orders,
      c.total_spent.toFixed(2),
      c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "",
      c.first_order_at ? new Date(c.first_order_at).toLocaleDateString("pt-BR") : "",
      c.bairro || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-clientes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM de Clientes</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} clientes · {stats.totalOrders} pedidos · {formatBRL(stats.totalRevenue)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={sendWhatsAppBulk}
            disabled={filtered.filter((c) => c.phone).length === 0}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar para todos ({filtered.filter((c) => c.phone).length})
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${statusFilter === key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                {cfg.label}
              </div>
              <p className="text-xl font-bold">{stats.byStatus[key] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Médio */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Clientes únicos</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ticket médio</p><p className="text-2xl font-bold text-primary">{formatBRL(stats.avgTicket)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Recorrentes (2+ pedidos)</p><p className="text-2xl font-bold">{customers.filter((c) => c.total_orders > 1).length}</p></CardContent></Card>
      </div>

      {/* WhatsApp Template */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4 text-green-600" />Mensagem WhatsApp para reativação</div>
          <Textarea value={whatsappMsg} onChange={(e) => setWhatsappMsg(e.target.value)} rows={2} />
          <p className="text-xs text-muted-foreground">Use {"{nome}"} para inserir o nome do cliente.</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome ou telefone..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="spent">Maior gasto</SelectItem>
            <SelectItem value="orders">Mais pedidos</SelectItem>
            <SelectItem value="recent">Mais recente</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Min. gasto (R$)" className="w-36" value={minSpent} onChange={(e) => setMinSpent(e.target.value)} />
        <Input type="number" placeholder="Min. pedidos" className="w-32" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Total Gasto</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const cfg = STATUS_CONFIG[c.crm_status] || STATUS_CONFIG.novo;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            {c.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} text-white text-[10px] gap-1`}>
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1 text-sm"><ShoppingBag className="h-3 w-3" />{c.total_orders}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary text-sm">{formatBRL(c.total_spent)}</TableCell>
                      <TableCell>
                        {c.last_order_at ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.last_order_at).toLocaleDateString("pt-BR")}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {c.phone && (
                          <Button size="sm" variant="ghost" className="text-green-600 h-8" onClick={() => sendWhatsApp(c)}>
                            <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Status atualizado automaticamente pelo banco de dados · Ativo ≤10d · Morno ≤30d · Inativo ≤60d · Perdido &gt;60d
      </p>
    </div>
  );
}
