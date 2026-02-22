import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CalendarDays, Package, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PeriodReport { date: string; orders: number; revenue: number; avgTicket: number; }

export default function ReportsContent() {
  const { store, isPro } = useStore();
  const [period, setPeriod] = useState("30");
  const [tab, setTab] = useState("period");
  const [loading, setLoading] = useState(true);
  const [periodData, setPeriodData] = useState<PeriodReport[]>([]);
  const [totals, setTotals] = useState({ orders: 0, revenue: 0, avgTicket: 0, uniqueCustomers: 0 });

  useEffect(() => { if (store) fetchReports(); }, [store, period]);

  const fetchReports = async () => {
    if (!store) return;
    setLoading(true);
    const since = new Date(Date.now() - parseInt(period) * 86400000).toISOString();
    const { data: orders } = await supabase.from("orders").select("*").eq("store_id", store.id).gte("created_at", since);
    if (!orders) { setLoading(false); return; }

    const dateMap: Record<string, { orders: number; revenue: number }> = {};
    const customerSet = new Set<string>();
    orders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString("pt-BR");
      if (!dateMap[date]) dateMap[date] = { orders: 0, revenue: 0 };
      dateMap[date].orders++;
      dateMap[date].revenue += Number(o.total);
      customerSet.add(o.customer_phone || o.customer_name);
    });

    const reportData = Object.entries(dateMap).map(([date, d]) => ({
      date, orders: d.orders, revenue: d.revenue, avgTicket: d.orders > 0 ? d.revenue / d.orders : 0,
    }));

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    setPeriodData(reportData);
    setTotals({ orders: orders.length, revenue: totalRevenue, avgTicket: orders.length > 0 ? totalRevenue / orders.length : 0, uniqueCustomers: customerSet.size });
    setLoading(false);
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Relatórios</h2>
            {isPro && <Badge className="bg-primary text-primary-foreground text-xs">✦ PRO</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Analise suas vendas e exporte os dados</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total pedidos", value: totals.orders },
          { label: "Faturamento", value: formatBRL(totals.revenue), className: "text-primary" },
          { label: "Ticket médio", value: formatBRL(totals.avgTicket), className: "text-primary" },
          { label: "Clientes únicos", value: totals.uniqueCustomers },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.className || ""}`}>{s.value}</p></CardContent></Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="period"><CalendarDays className="mr-1 h-4 w-4" /> Por período</TabsTrigger>
          <TabsTrigger value="product"><Package className="mr-1 h-4 w-4" /> Por produto</TabsTrigger>
          <TabsTrigger value="customer"><Users className="mr-1 h-4 w-4" /> Por cliente</TabsTrigger>
        </TabsList>
        <TabsContent value="period" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">↗ Relatório por período</p>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          </div>
          {loading ? <Skeleton className="h-64" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead className="text-center">Pedidos</TableHead><TableHead className="text-center">Faturamento</TableHead><TableHead className="text-right">Ticket médio</TableHead></TableRow></TableHeader>
              <TableBody>
                {periodData.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-center">{row.orders}</TableCell>
                    <TableCell className="text-center text-primary font-medium">{formatBRL(row.revenue)}</TableCell>
                    <TableCell className="text-right">{formatBRL(row.avgTicket)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{totals.orders}</TableCell>
                  <TableCell className="text-center text-primary">{formatBRL(totals.revenue)}</TableCell>
                  <TableCell className="text-right">{formatBRL(totals.avgTicket)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </TabsContent>
        <TabsContent value="product"><p className="py-8 text-center text-muted-foreground">Relatório por produto em breve.</p></TabsContent>
        <TabsContent value="customer"><p className="py-8 text-center text-muted-foreground">Relatório por cliente em breve.</p></TabsContent>
      </Tabs>
    </div>
  );
}
