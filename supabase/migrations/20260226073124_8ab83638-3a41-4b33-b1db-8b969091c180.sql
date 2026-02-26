
-- Fix RLS policy parameter order for print_agents
DROP POLICY IF EXISTS "Store owners can manage their print agents" ON public.print_agents;

CREATE POLICY "Store owners can manage their print agents"
ON public.print_agents
FOR ALL
USING (is_store_owner(auth.uid(), store_id))
WITH CHECK (is_store_owner(auth.uid(), store_id));

-- Also fix print_jobs RLS
DROP POLICY IF EXISTS "Store owners manage print jobs" ON public.print_jobs;

CREATE POLICY "Store owners manage print jobs"
ON public.print_jobs
FOR ALL
USING (is_store_owner(auth.uid(), store_id));
