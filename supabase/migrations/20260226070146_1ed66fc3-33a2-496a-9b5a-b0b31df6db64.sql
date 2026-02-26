CREATE TRIGGER trg_auto_create_print_job
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_print_job();