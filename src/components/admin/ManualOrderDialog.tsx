import { useState, useEffect, useCallback } from "react";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useCashSession } from "@/hooks/useCashSession";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search, Plus, Minus, Trash2, ArrowLeft, ArrowRight, User, ShoppingCart,
  CreditCard, MapPin, Phone, Store as StoreIcon, Truck, X, Lock
} from "lucide-react";
import CustomerSearchCombobox, { formatPhone, normalizePhone } from "@/components/admin/CustomerSearchCombobox";
import CustomerHistoryPanel from "@/components/admin/CustomerHistoryPanel";

// ── Types ───────────────────────────────────────────────────
interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  address: string | null;
  bairro: string | null;
  complemento: string | null;
  observations: string | null;
  last_order_at: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean | null;
}

interface Additional {
  id: string;
  name: string;
  price: number | null;
  product_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  additionals: { id: string; name: string; price: number; quantity: number }[];
  observation: string;
}

interface PaymentEntry {
  method: string;
  amount: number;
}

interface Neighborhood {
  id: string;
  name: string;
  delivery_fee: number | null;
  is_active: boolean | null;
}

const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix", icon: "💎" },
  { value: "cash", label: "Dinheiro", icon: "💵" },
  { value: "debit", label: "Débito", icon: "💳" },
  { value: "credit", label: "Crédito", icon: "💳" },
  { value: "credit_later", label: "Fiado", icon: "📝" },
];

// ── Main Component ──────────────────────────────────────────
export default function ManualOrderDialog({ open, onOpenChange, onOrderCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOrderCreated?: () => void;
}) {
  const { store } = useStore();
  const { activeSession, loading: cashLoading } = useCashSession();
  const [step, setStep] = useState(1); // 1=customer, 2=products, 3=payment

  // Step 1 – Customer
  const [phoneSearch, setPhoneSearch] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custBairro, setCustBairro] = useState("");
  const [custComplemento, setCustComplemento] = useState("");
  const [custObs, setCustObs] = useState("");
  const [customerHistory, setCustomerHistory] = useState<{ orders: number; total: number } | null>(null);

  // Step 2 – Products
  const [products, setProducts] = useState<Product[]>([]);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"delivery" | "counter">("counter");
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Step 3 – Payment
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch data ────────────────────────────────────────────
  useEffect(() => {
    if (!store || !open) return;
    fetchProducts();
    fetchNeighborhoods();
  }, [store, open]);

  useEffect(() => {
    if (!open) resetAll();
  }, [open]);

  const fetchProducts = async () => {
    if (!store) return;
    const { data } = await supabase.from("products").select("id, name, price, image_url, category_id, is_active").eq("store_id", store.id).eq("is_active", true).order("name");
    setProducts((data as Product[]) || []);
    const { data: adds } = await supabase.from("product_additionals").select("id, name, price, product_id").eq("store_id", store.id).eq("is_active", true);
    setAdditionals((adds as Additional[]) || []);
  };

  const fetchNeighborhoods = async () => {
    if (!store) return;
    const { data } = await supabase.from("neighborhoods").select("*").eq("store_id", store.id).eq("is_active", true);
    setNeighborhoods((data as Neighborhood[]) || []);
  };

  const resetAll = () => {
    setStep(1);
    setPhoneSearch("");
    setCustomer(null);
    setIsNewCustomer(false);
    setCustName(""); setCustPhone(""); setCustAddress(""); setCustBairro(""); setCustComplemento(""); setCustObs("");
    setCustomerHistory(null);
    setCart([]);
    setProductSearch("");
    setOrderType("counter");
    setSelectedNeighborhoodId("");
    setOrderNotes("");
    setPayments([]);
  };

  // ── Step 1: Customer search (handled by CustomerSearchCombobox) ──

  // ── Step 2: Cart ─────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1, additionals: [], observation: "" }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const toggleAdditional = (productId: string, add: Additional) => {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c;
      const exists = c.additionals.find(a => a.id === add.id);
      if (exists) {
        return { ...c, additionals: c.additionals.filter(a => a.id !== add.id) };
      }
      return { ...c, additionals: [...c.additionals, { id: add.id, name: add.name, price: add.price || 0, quantity: 1 }] };
    }));
  };

  const updateAdditionalQty = (productId: string, additionalId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c;
      return {
        ...c,
        additionals: c.additionals.map(a => {
          if (a.id !== additionalId) return a;
          const newQty = a.quantity + delta;
          if (newQty <= 0) return a; // use toggle to remove
          if (newQty > 10) return a;
          return { ...a, quantity: newQty };
        }),
      };
    }));
  };

  const subtotal = cart.reduce((s, c) => {
    const addTotal = c.additionals.reduce((a, ad) => a + ad.price * ad.quantity, 0);
    return s + (c.product.price + addTotal) * c.quantity;
  }, 0);

  const selectedNeighborhood = neighborhoods.find(n => n.id === selectedNeighborhoodId);
  const deliveryFee = orderType === "delivery" ? Number(selectedNeighborhood?.delivery_fee || 0) : 0;
  const orderTotal = subtotal + deliveryFee;

  // ── Step 3: Payments ──────────────────────────────────────
  const addPayment = () => {
    const remaining = orderTotal - payments.reduce((s, p) => s + p.amount, 0);
    setPayments(prev => [...prev, { method: "pix", amount: Math.max(0, remaining) }]);
  };

  const updatePayment = (index: number, field: keyof PaymentEntry, value: string | number) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const paymentsSum = payments.reduce((s, p) => s + p.amount, 0);
  const isFiado = payments.length === 1 && payments[0]?.method === "credit_later";
  const hasCash = payments.some(p => p.method === "cash");
  const change = hasCash && paymentsSum > orderTotal ? paymentsSum - orderTotal : 0;
  const canFinalize = (isFiado || paymentsSum >= orderTotal) && cart.length > 0 && custName.trim();

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!store || !canFinalize) return;
    setSubmitting(true);
    try {
      // 1. Upsert customer (last_order_at is updated by DB trigger automatically)
      let customerId: string | null = null;
      if (customer) {
        customerId = customer.id;
        await supabase.from("customers").update({
          name: custName, address: custAddress || null, bairro: custBairro || null,
          complemento: custComplemento || null, observations: custObs || null,
        }).eq("id", customer.id);
      } else {
        const { data: newCust } = await supabase.from("customers").insert({
          store_id: store.id, name: custName, phone: custPhone,
          address: custAddress || null, bairro: custBairro || null,
          complemento: custComplemento || null, observations: custObs || null,
        }).select("id").single();
        customerId = newCust?.id || null;
      }

      // 2. Create order
      const isFiadoOrder = payments.length === 1 && payments[0]?.method === "credit_later";
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: custName,
        customer_phone: custPhone,
        customer_address: orderType === "delivery" ? custAddress : null,
        order_type: orderType === "delivery" ? "delivery" : "pickup",
        payment_method: isFiadoOrder ? "credit_later" : (payments[0]?.method || "cash"),
        subtotal,
        delivery_fee: deliveryFee,
        total: orderTotal,
        notes: orderNotes || null,
        status: "preparing" as any,
        customer_id: customerId,
        is_manual: true,
        neighborhood_id: orderType === "delivery" ? selectedNeighborhoodId || null : null,
        payment_status: isFiadoOrder ? "pending" : "paid",
      }).select("id").single();

      if (orderErr || !order) throw orderErr;

      // 3. Create order items
      const items = cart.map(c => ({
        order_id: order.id,
        product_id: c.product.id,
        product_name: c.product.name,
        quantity: c.quantity,
        unit_price: c.product.price,
        subtotal: (c.product.price + c.additionals.reduce((a, ad) => a + ad.price * ad.quantity, 0)) * c.quantity,
        additionals: c.additionals.length > 0 ? JSON.stringify(c.additionals) : null,
      }));
      await supabase.from("order_items").insert(items);

      // 4. Create order_payments (skip for fiado - no payment yet)
      if (!isFiadoOrder) {
        const paymentRecords = payments.map(p => {
          const isLastCash = p.method === "cash" && change > 0;
          return {
            order_id: order.id,
            store_id: store.id,
            payment_method: p.method,
            amount: isLastCash ? Math.round((p.amount - change) * 100) / 100 : p.amount,
            cash_session_id: activeSession?.id || null,
          };
        }).filter(p => p.amount > 0);
        await supabase.from("order_payments").insert(paymentRecords);
      }

      toast.success(isFiadoOrder ? "Pedido fiado criado! Pagamento pendente." : "Pedido manual criado com sucesso!");
      onOpenChange(false);
      onOrderCreated?.();
    } catch (err: any) {
      toast.error("Erro ao criar pedido: " + (err?.message || "desconhecido"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Block if no cash session */}
        {!cashLoading && !activeSession ? (
          <div className="p-8 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-bold text-lg">Caixa não está aberto</p>
            <p className="text-sm text-muted-foreground">
              Abra o caixa antes de criar pedidos manuais.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        ) : (
          <>
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Novo Pedido Manual — Etapa {step}/3
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-1 px-4 pt-2">
          {[
            { n: 1, label: "Cliente", icon: <User className="h-3 w-3" /> },
            { n: 2, label: "Produtos", icon: <ShoppingCart className="h-3 w-3" /> },
            { n: 3, label: "Pagamento", icon: <CreditCard className="h-3 w-3" /> },
          ].map(s => (
            <div key={s.n} className={`flex-1 flex items-center justify-center gap-1 rounded-full py-1.5 text-xs font-medium ${step === s.n ? "bg-primary text-primary-foreground" : step > s.n ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ═══════ STEP 1: Customer ═══════ */}
          {step === 1 && (
            <>
              <CustomerSearchCombobox
                storeId={store.id}
                onSelect={(c) => {
                  setCustomer(c as any);
                  setCustName(c.name);
                  setCustPhone(c.phone);
                  setCustAddress(c.address || "");
                  setCustBairro(c.bairro || "");
                  setCustComplemento(c.complemento || "");
                  setCustObs(c.observations || "");
                  setIsNewCustomer(false);
                  setCustomerHistory({ orders: c.total_orders, total: c.total_spent });
                }}
                onNewCustomer={(phone) => {
                  setCustomer(null);
                  setIsNewCustomer(true);
                  setCustPhone(phone);
                  setCustName("");
                  setCustAddress("");
                  setCustBairro("");
                  setCustComplemento("");
                  setCustObs("");
                  setCustomerHistory(null);
                }}
              />

              {/* Customer history panel */}
              {customer && (
                <CustomerHistoryPanel customerId={customer.id} storeId={store.id} />
              )}

              {isNewCustomer && !customer && (
                <div className="rounded-lg border p-3 bg-orange-50">
                  <p className="font-bold text-orange-700">📋 Novo cliente</p>
                  <p className="text-xs text-muted-foreground">Preencha os dados para cadastrar</p>
                </div>
              )}

              {(customer || isNewCustomer) && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Nome *</label>
                    <Input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Nome do cliente" autoFocus={isNewCustomer} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Telefone *</label>
                    <Input
                      value={formatPhone(custPhone)}
                      onChange={e => setCustPhone(normalizePhone(e.target.value))}
                      placeholder="(31) 99999-9999"
                      readOnly={!!customer}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Endereço</label>
                    <Input value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Rua, número" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Bairro</label>
                      <Input value={custBairro} onChange={e => setCustBairro(e.target.value)} placeholder="Bairro" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Complemento</label>
                      <Input value={custComplemento} onChange={e => setCustComplemento(e.target.value)} placeholder="Apto, bloco..." />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Observação do cliente</label>
                    <Textarea value={custObs} onChange={e => setCustObs(e.target.value)} rows={2} placeholder="Alergia, preferência..." />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════ STEP 2: Products ═══════ */}
          {step === 2 && (
            <>
              {/* Order type */}
              <div className="space-y-2">
                <label className="text-sm font-bold">Tipo do pedido</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOrderType("counter")} className={`rounded-lg border-2 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${orderType === "counter" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                    <StoreIcon className="h-4 w-4" /> Balcão
                  </button>
                  <button onClick={() => setOrderType("delivery")} className={`rounded-lg border-2 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${orderType === "delivery" ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                    <Truck className="h-4 w-4" /> Tele Entrega
                  </button>
                </div>
              </div>

              {orderType === "delivery" && neighborhoods.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-bold">Bairro (taxa de entrega)</label>
                  <div className="flex flex-wrap gap-2">
                    {neighborhoods.map(n => (
                      <button key={n.id} onClick={() => setSelectedNeighborhoodId(n.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium border ${selectedNeighborhoodId === n.id ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                        {n.name} — {formatBRL(Number(n.delivery_fee || 0))}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto..." className="pl-10" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              </div>

              {/* Product list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                {products
                  .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} className="rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-sm text-primary font-bold">{formatBRL(p.price)}</p>
                    </button>
                  ))}
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="text-sm font-bold">🛒 Itens do pedido</h3>
                  {cart.map(item => {
                    const productAdditionals = additionals.filter(a => a.product_id === item.product.id);
                    return (
                      <div key={item.product.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{item.product.name}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQty(item.product.id, -1)} className="h-6 w-6 rounded-full border flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product.id, 1)} className="h-6 w-6 rounded-full border flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                            <button onClick={() => removeFromCart(item.product.id)} className="h-6 w-6 rounded-full border border-red-200 flex items-center justify-center text-red-500"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        {productAdditionals.length > 0 && (() => {
                          const freeAdds = productAdditionals.filter(a => !a.price || a.price === 0);
                          const paidAdds = productAdditionals.filter(a => a.price && a.price > 0);
                          return (
                            <div className="space-y-4">
                              {freeAdds.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-muted-foreground mb-2">🟢 Inclusos (grátis)</p>
                                  <div className="flex flex-wrap gap-2">
                                    {freeAdds.map(a => {
                                      const selected = item.additionals.some(ia => ia.id === a.id);
                                      return (
                                        <button key={a.id} onClick={() => toggleAdditional(item.product.id, a)}
                                          className={`rounded-lg px-4 py-2 text-sm font-medium border-2 transition-colors ${selected ? "bg-green-600 text-white border-green-600" : "border-border text-muted-foreground hover:border-green-400"}`}>
                                          {a.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {paidAdds.length > 0 && (
                                <div>
                                  <p className="text-sm font-semibold text-muted-foreground mb-2">💰 Adicionais pagos</p>
                                  <div className="flex flex-wrap gap-2">
                                    {paidAdds.map(a => {
                                      const selectedAdd = item.additionals.find(ia => ia.id === a.id);
                                      return (
                                        <div key={a.id} className="flex items-center gap-1.5">
                                          <button onClick={() => toggleAdditional(item.product.id, a)}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium border-2 transition-colors ${selectedAdd ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                                            {a.name} +{formatBRL(a.price || 0)}
                                          </button>
                                          {selectedAdd && (
                                            <div className="flex items-center gap-1.5">
                                              <button onClick={() => updateAdditionalQty(item.product.id, a.id, -1)}
                                                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                                                <Minus className="h-3.5 w-3.5" />
                                              </button>
                                              <span className="text-sm font-bold w-5 text-center">{selectedAdd.quantity}</span>
                                              <button onClick={() => updateAdditionalQty(item.product.id, a.id, 1)}
                                                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                                                <Plus className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Observações do pedido</label>
                    <Textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} placeholder="Sem cebola, sem salada..." />
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="rounded-lg border p-3 space-y-1 bg-muted/30">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
                {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Entrega</span><span>{formatBRL(deliveryFee)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span className="text-primary">{formatBRL(orderTotal)}</span></div>
              </div>
            </>
          )}

          {/* ═══════ STEP 3: Payment ═══════ */}
          {step === 3 && (
            <>
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-sm">Total do pedido: <span className="font-bold text-primary text-lg">{formatBRL(orderTotal)}</span></p>
                <p className="text-xs text-muted-foreground">{custName} · {orderType === "delivery" ? "Entrega" : "Balcão"} · {cart.length} itens</p>
              </div>

              {/* Payment mode toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setPayments([]); }}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${!isFiado ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  💳 Pagamento Normal
                </button>
                <button
                  onClick={() => { setPayments([{ method: "credit_later", amount: orderTotal }]); }}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${isFiado ? "bg-orange-600 text-white border-orange-600" : "border-border"}`}
                >
                  📝 Fiado (Pagar depois)
                </button>
              </div>

              {isFiado ? (
                <div className="rounded-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 space-y-2 text-center">
                  <p className="text-lg font-bold text-orange-600">📝 Pedido Fiado</p>
                  <p className="text-sm text-muted-foreground">
                    Este pedido será criado com <strong>pagamento pendente</strong>. Não será contabilizado no caixa até o recebimento.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gerencie fiados em <strong>Fiados → Receber Pagamento</strong>
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">Formas de Pagamento</h3>
                      <Button size="sm" variant="outline" onClick={addPayment}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                    </div>

                    {payments.map((p, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pagamento {i + 1}</span>
                          <button onClick={() => removePayment(i)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_OPTIONS.filter(o => o.value !== "credit_later").map(opt => (
                            <button key={opt.value} onClick={() => updatePayment(i, "method", opt.value)}
                              className={`rounded-lg border px-3 py-2 text-xs font-medium ${p.method === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                              {opt.icon} {opt.label}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Valor (R$)</label>
                          <Input type="number" step="0.01" min="0" value={p.amount || ""} onChange={e => updatePayment(i, "amount", parseFloat(e.target.value) || 0)} placeholder="0,00" />
                        </div>
                      </div>
                    ))}

                    {payments.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">Clique em "Adicionar" para inserir uma forma de pagamento</p>
                    )}
                  </div>

                  {/* Payment summary */}
                  <div className="rounded-lg border p-3 space-y-1">
                    <div className="flex justify-between text-sm"><span>Total do pedido</span><span>{formatBRL(orderTotal)}</span></div>
                    <div className="flex justify-between text-sm"><span>Total pago</span><span className={paymentsSum >= orderTotal ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{formatBRL(paymentsSum)}</span></div>
                    {paymentsSum < orderTotal && <div className="flex justify-between text-sm text-red-500"><span>Falta</span><span>{formatBRL(orderTotal - paymentsSum)}</span></div>}
                    {change > 0 && <div className="flex justify-between text-sm text-orange-600 font-bold"><span>Troco</span><span>{formatBRL(change)}</span></div>}
                    {paymentsSum > orderTotal && !hasCash && <p className="text-xs text-red-500">⚠️ Valor pago maior que o total só é permitido com Dinheiro (troco)</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t p-4">
          <Button variant="outline" onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)} disabled={submitting}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && !custName.trim()) || (step === 2 && cart.length === 0)}>
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canFinalize || submitting || (paymentsSum > orderTotal && !hasCash)}>
              {submitting ? "Criando..." : "✅ Finalizar Pedido"}
            </Button>
          )}
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
