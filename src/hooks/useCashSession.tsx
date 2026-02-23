import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./useStore";

export interface CashSession {
  id: string;
  store_id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  initial_cash_amount: number;
  final_cash_amount: number | null;
  expected_cash_amount: number | null;
  cash_difference: number | null;
  status: string;
  notes: string | null;
}

export function useCashSession() {
  const { store } = useStore();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    if (!store) { setActiveSession(null); setLoading(false); return; }
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("store_id", store.id)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveSession(data as CashSession | null);
    setLoading(false);
  }, [store]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const openSession = async (initialAmount: number) => {
    if (!store) throw new Error("Store not loaded");
    const { data: existing } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("store_id", store.id)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();
    if (existing) throw new Error("Já existe um caixa aberto");

    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("cash_sessions").insert({
      store_id: store.id,
      opened_by: user.user?.id,
      initial_cash_amount: initialAmount,
      status: "open",
    }).select("*").single();
    if (error) throw error;
    setActiveSession(data as CashSession);
    return data;
  };

  const closeSession = async (finalCashAmount: number, notes?: string) => {
    if (!activeSession || !store) throw new Error("Nenhum caixa aberto");

    // Calculate expected cash: initial + cash payments during session
    const { data: cashPayments } = await supabase
      .from("order_payments")
      .select("amount")
      .eq("cash_session_id", activeSession.id)
      .eq("payment_method", "cash");

    const cashSalesTotal = (cashPayments || []).reduce((s, p) => s + Number(p.amount), 0);
    const expectedCash = Number(activeSession.initial_cash_amount) + cashSalesTotal;
    const difference = Math.round((finalCashAmount - expectedCash) * 100) / 100;

    const { error } = await supabase.from("cash_sessions").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      final_cash_amount: finalCashAmount,
      expected_cash_amount: Math.round(expectedCash * 100) / 100,
      cash_difference: difference,
      notes: notes || null,
    }).eq("id", activeSession.id);

    if (error) throw error;
    setActiveSession(null);
  };

  const getSessionSummary = async (sessionId: string) => {
    const { data: payments } = await supabase
      .from("order_payments")
      .select("payment_method, amount")
      .eq("cash_session_id", sessionId);

    const summary: Record<string, { count: number; total: number }> = {};
    (payments || []).forEach((p: any) => {
      if (!summary[p.payment_method]) summary[p.payment_method] = { count: 0, total: 0 };
      summary[p.payment_method].count++;
      summary[p.payment_method].total += Number(p.amount);
    });

    const grandTotal = Object.values(summary).reduce((s, v) => s + v.total, 0);
    return { byMethod: summary, grandTotal };
  };

  return { activeSession, loading, openSession, closeSession, getSessionSummary, refresh: fetchActive };
}
