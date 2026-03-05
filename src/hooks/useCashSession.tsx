import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./useStore";

export interface CashSession {
  id: string;
  store_id: string;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  initial_cash_amount: number;
  final_cash_amount: number | null;
  expected_cash_amount: number | null;
  cash_difference: number | null;
  total_sales_amount: number | null;
  total_cash_amount: number | null;
  total_pix_amount: number | null;
  total_card_amount: number | null;
  total_sangrias: number | null;
  total_suprimentos: number | null;
  status: string;
  notes: string | null;
}

export interface CashMovement {
  id: string;
  store_id: string;
  cash_session_id: string;
  type: "sangria" | "suprimento";
  amount: number;
  description: string | null;
  created_by: string;
  created_at: string;
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

  // Close session via atomic RPC function
  const closeSession = async (finalCashAmount: number, notes?: string) => {
    if (!activeSession || !store) throw new Error("Nenhum caixa aberto");
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("close_cash_session", {
      p_session_id: activeSession.id,
      p_closing_amount: finalCashAmount,
      p_closed_by: user.user?.id!,
      p_notes: notes || null,
    });

    if (error) throw error;
    setActiveSession(null);
    return data;
  };

  // Get live summary during session
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

    const totalOrders = (payments || []).length;
    const grandTotal = Object.values(summary).reduce((s, v) => s + v.total, 0);
    return { byMethod: summary, grandTotal, totalOrders };
  };

  // Cash movements (sangria / suprimento)
  const addCashMovement = async (type: "sangria" | "suprimento", amount: number, description?: string) => {
    if (!activeSession || !store) throw new Error("Nenhum caixa aberto");
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("cash_movements").insert({
      store_id: store.id,
      cash_session_id: activeSession.id,
      type,
      amount,
      description: description || null,
      created_by: user.user?.id!,
    }).select("*").single();

    if (error) throw error;
    return data as CashMovement;
  };

  const getSessionMovements = async (sessionId: string) => {
    const { data } = await supabase
      .from("cash_movements")
      .select("*")
      .eq("cash_session_id", sessionId)
      .order("created_at", { ascending: false });
    return (data as CashMovement[]) || [];
  };

  return {
    activeSession,
    loading,
    openSession,
    closeSession,
    getSessionSummary,
    addCashMovement,
    getSessionMovements,
    refresh: fetchActive,
  };
}
