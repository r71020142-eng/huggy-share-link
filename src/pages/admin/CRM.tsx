import { useStore } from "@/hooks/useStore";
import { ProGate } from "@/components/admin/ProGate";
import CRMContent from "./CRMContent";

export default function CRM() {
  const { isPro } = useStore();

  if (!isPro) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">CRM de Clientes</h2>
        <ProGate
          feature="CRM Avançado de Clientes"
          description="Veja todos os seus clientes, histórico de compras, LTV, e envie mensagens personalizadas via WhatsApp."
        >
          <div />
        </ProGate>
      </div>
    );
  }

  return <CRMContent />;
}
