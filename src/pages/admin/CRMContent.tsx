import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, MessageCircle, Phone, ShoppingBag, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerData {
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  isVip: boolean;
}

export default function CRMContent() {
  const { store } = useStore();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("spent");
  const [whatsappMsg, setWhatsappMsg] = useState("Olá {nome}, seu pedido está pronto! 🎉");

  useEffect(() => {
    if (store) fetchCustomers();
  }, [store]);

  const fetchCustomers = async () => {
    if (!store) return;
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_name, customer_phone, total, created_at")
      .eq("store_id", store.id);

    if (!orders) { setLoading(false); return; }

    const customerMap: Record<string, CustomerData> = {};
    orders.forEach((o) => {
      const key = o.customer_phone || o.customer_name;
      if (!customerMap[key]) {
        customerMap[key] = { name: o.customer_name, phone: o.customer_phone || "", orders: 0, totalSpent: 0, lastOrder: o.created_at, isVip: false };
      }
      customerMap[key].orders++;
      customerMap[key].totalSpent += Number(o.total);
      if (o.created_at > customerMap[key].lastOrder) customerMap[key].lastOrder = o.created_at;
    });

    let list = Object.values(customerMap);
    list.sort((a, b) => b.totalSpent - a.totalSpent);
    const vipThreshold = Math.ceil(list.length * 0.1);
    list.forEach((c, i) => { c.isVip = i < vipThreshold && c.orders >= 3; });

    setCustomers(list);
    setLoading(false);
  };

  const filtered = customers
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a, b) => sortBy === "spent" ? b.totalSpent - a.totalSpent : b.orders - a.orders);

  const totalCustomers = customers.length;
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recurrents = customers.filter((c) => c.orders > 1).length;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const sendWhatsApp = (customer: CustomerData) => {
    const msg = whatsappMsg.replace("{nome}", customer.name);
    const phone = customer.phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CRM de Clientes</h2>
          <p className="text-sm text-muted-foreground">
            {totalCustomers} clientes · {totalOrders} pedidos · {formatBRL(totalRevenue)} total
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Clientes únicos", value: totalCustomers },
          { label: "Ticket médio", value: formatBRL(avgTicket), className: "text-primary" },
          { label: "Recorrentes", value: recurrents },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.className || ""}`}>{s.value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4 text-green-600" />WhatsApp para clientes</div>
          <Textarea value={whatsappMsg} onChange={(e) => setWhatsappMsg(e.target.value)} rows={2} />
          <p className="text-xs text-muted-foreground">Use {"{nome}"} para inserir o nome do cliente.</p>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente ou telefone..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="spent">Maior gasto</SelectItem>
            <SelectItem value="orders">Mais pedidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          filtered.map((c, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.isVip && <Badge className="bg-yellow-500 text-white text-[10px]">VIP</Badge>}
                    </div>
                    {c.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">↗ {formatBRL(c.totalSpent)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{c.orders} pedidos</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.lastOrder).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {c.phone && (
                    <Button size="sm" variant="ghost" className="mt-1 text-green-600" onClick={() => sendWhatsApp(c)}>
                      <MessageCircle className="mr-1 h-3 w-3" /> Enviar WhatsApp
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
