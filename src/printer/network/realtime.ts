/**
 * Realtime – Supabase realtime subscription for new print jobs
 */

import { supabase } from "@/integrations/supabase/client";

type NewJobCallback = (printJob: any) => void;

export class PrintRealtime {
  private storeId: string;
  private channel: any = null;
  private callback: NewJobCallback;

  constructor(storeId: string, onNewJob: NewJobCallback) {
    this.storeId = storeId;
    this.callback = onNewJob;
  }

  /** Subscribe to new print_jobs for this store */
  start(): void {
    this.stop();

    this.channel = supabase
      .channel(`print-jobs-${this.storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "print_jobs",
          filter: `store_id=eq.${this.storeId}`,
        },
        (payload) => {
          this.callback(payload.new);
        }
      )
      .subscribe();
  }

  stop(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
