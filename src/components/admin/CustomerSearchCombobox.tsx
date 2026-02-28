import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Phone, User, AlertCircle, UserPlus } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  bairro: string | null;
  complemento: string | null;
  observations: string | null;
  last_order_at: string | null;
  total_orders: number;
  total_spent: number;
  crm_status: string;
}

interface Props {
  storeId: string;
  onSelect: (customer: CustomerResult) => void;
  onNewCustomer: (phone: string) => void;
}

function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export default function CustomerSearchCombobox({ storeId, onSelect, onNewCustomer }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    const normalized = normalizePhone(q);
    if (normalized.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone, address, bairro, complemento, observations, last_order_at, total_orders, total_spent, crm_status")
      .eq("store_id", storeId)
      .ilike("phone", `%${normalized}%`)
      .limit(10);
    
    const fetched = (data as CustomerResult[]) || [];
    setResults(fetched);
    setHighlightIndex(0);
    setOpen(true);

    // Auto-select if exactly 1 result
    if (fetched.length === 1) {
      onSelect(fetched[0]);
      setQuery(fetched[0].phone);
      setOpen(false);
    }
    setLoading(false);
  }, [storeId, onSelect]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (normalizePhone(query).length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const total = results.length + 1; // +1 for "new customer" option
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex(i => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(i => (i - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex < results.length) {
        selectCustomer(results[highlightIndex]);
      } else {
        handleNewCustomer();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectCustomer = (c: CustomerResult) => {
    onSelect(c);
    setQuery(c.phone);
    setOpen(false);
  };

  const handleNewCustomer = () => {
    const normalized = normalizePhone(query);
    onNewCustomer(normalized || query);
    setOpen(false);
  };

  const hasPendingFiado = (c: CustomerResult) => c.crm_status === "inadimplente";

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-bold mb-1 block">Buscar cliente por telefone</label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Digite 3+ dígitos do telefone..."
          className="pl-10"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {results.map((c, i) => (
            <button
              key={c.id}
              onClick={() => selectCustomer(c)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                highlightIndex === i ? "bg-accent" : "hover:bg-muted/50"
              }`}
            >
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{c.name}</span>
                  {hasPendingFiado(c) && (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                      <AlertCircle className="h-2.5 w-2.5" /> FIADO
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{c.phone}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {c.total_orders} pedidos
              </span>
            </button>
          ))}

          {/* New customer option */}
          <button
            onClick={handleNewCustomer}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm border-t transition-colors ${
              highlightIndex === results.length ? "bg-accent" : "hover:bg-muted/50"
            }`}
          >
            <UserPlus className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-primary">Cadastrar novo cliente</span>
            {normalizePhone(query) && (
              <span className="text-xs text-muted-foreground">({normalizePhone(query)})</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
