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

  /** Update printer heartbeat + runtime status */
  async heartbeat(storeId: string, printerType: string, printerName: string | null): Promise<void> {
    const now = new Date().toISOString();

    // Update print settings – print_mode must be one of 'kitchen'|'counter'|'both' (DB constraint)
    // First try to read existing print_mode; only create with default 'both' if no row exists
    const { data: existingSettings } = await supabase
      .from("store_print_settings")
      .select("id, print_mode")
      .eq("store_id", storeId)
      .maybeSingle();

    if (existingSettings) {
      // Row exists – only update auto_print and timestamp, preserve print_mode
      const { error: settingsErr } = await supabase
        .from("store_print_settings")
        .update({
          auto_print: true,
          updated_at: now,
        })
        .eq("store_id", storeId);

      if (settingsErr) {
        console.warn("[PrintAPI] Heartbeat settings update failed:", settingsErr.message);
      }
    } else {
      // No row – insert with valid default print_mode
      const { error: settingsErr } = await supabase
        .from("store_print_settings")
        .insert({
          store_id: storeId,
          auto_print: true,
          print_mode: "both",
          updated_at: now,
        });

      if (settingsErr) {
        console.warn("[PrintAPI] Heartbeat settings insert failed:", settingsErr.message);
      }
    }

    // Update runtime status (printer_type here is the connection type: webusb/webserial – no constraint)
    const { error: runtimeErr } = await supabase
      .from("store_runtime_status")
      .upsert({
        store_id: storeId,
        last_heartbeat: now,
        printer_status: "online",
        printer_type: printerType,
        printer_name: printerName,
        updated_at: now,
      }, { onConflict: "store_id" });

    if (runtimeErr) {
      console.warn("[PrintAPI] Heartbeat runtime failed:", runtimeErr.message);
    }
  }

  /** Update runtime status (queue size, failed jobs, etc.) */
  async updateRuntimeStatus(storeId: string, patch: {
    printer_status?: string;
    queue_size?: number;
    failed_jobs?: number;
    last_print_at?: string;
    total_prints?: number;
    total_errors?: number;
  }): Promise<void> {
    const { error } = await supabase
      .from("store_runtime_status")
      .upsert({
        store_id: storeId,
        ...patch,
        updated_at: new Date().toISOString(),
      }, { onConflict: "store_id" });

    if (error) {
      console.warn("[PrintAPI] Runtime status update failed:", error.message);
    }
  }

  /** Log a print event (success or failure) */
  async logPrint(storeId: string, orderId: string, jobId: string | null, status: "success" | "failed", attempts: number, errorMessage?: string): Promise<void> {
    const { error } = await supabase
      .from("print_logs")
      .insert({
        store_id: storeId,
        order_id: orderId,
        job_id: jobId,
        status,
        attempts,
        error_message: errorMessage,
        printed_at: status === "success" ? new Date().toISOString() : null,
      });

    if (error) {
      console.warn("[PrintAPI] Log print failed:", error.message);
    }
  }
}
