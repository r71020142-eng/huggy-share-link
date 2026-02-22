import { useStore } from "@/hooks/useStore";
import { ProGate } from "@/components/admin/ProGate";
import ReportsContent from "./ReportsContent";

export default function Reports() {
  const { isPro } = useStore();

  if (!isPro) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <ProGate
          feature="Relatórios e Analytics Avançados"
          description="Analise vendas por período, produto e cliente. Exporte relatórios detalhados em CSV."
        >
          <div />
        </ProGate>
      </div>
    );
  }

  return <ReportsContent />;
}
