/**
 * Print API Client – Backend communication for print job management
 * Uses Supabase client for RLS-secured access
 */

import { supabase } from "@/integrations/supabase/client";

export class PrintApiClient {
  /** Fetch pending print jobs from backend */
  async fetchPending(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("print_jobs")
      .select("*, orders(*)")
      .eq("store_id", storeId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /** Confirm a print job as done */
  async confirmPrint(orderId: string, storeId: string): Promise<void> {
    const { error } = await supabase
      .from("print_jobs")
      .update({
        status: "done",
        printed_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("store_id", storeId);

    if (error) throw error;
  }

  /** Mark a print job as failed on backend */
  async markFailed(orderId: string, storeId: string, errorMsg: string): Promise<void> {
    const { error } = await supabase
      .from("print_jobs")
      .update({
        status: "failed",
        error_message: errorMsg,
        attempts: supabase.rpc ? undefined : 0, // attempts tracked locally
      })
      .eq("order_id", orderId)
      .eq("store_id", storeId);

    if (error) throw error;
  }

  /** Fetch order items for building the receipt */
  async fetchOrderItems(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) throw error;
    return data || [];
  }

  /** Fetch store info for receipt header */
  async fetchStore(storeId: string): Promise<any> {
    const { data, error } = await supabase
      .from("stores")
      .select("name, address, whatsapp")
      .eq("id", storeId)
      .single();

    if (error) throw error;
    return data;
  }

  /** Update printer heartbeat */
  async heartbeat(storeId: string, printerType: string, printerName: string | null): Promise<void> {
    const { error } = await supabase
      .from("store_print_settings")
      .upsert({
        store_id: storeId,
        auto_print: true,
        print_mode: printerType,
        updated_at: new Date().toISOString(),
      }, { onConflict: "store_id" });

    if (error) {
      console.warn("[PrintAPI] Heartbeat failed:", error.message);
    }
  }
}
