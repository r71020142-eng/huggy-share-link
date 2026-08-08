import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Download, FileCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SCHEMA_SQL } from "@/data/schemaSql";

/**
 * Exibe o SQL completo (tipos, tabelas, índices, grants e políticas RLS)
 * para copiar e recriar o schema em outro projeto.
 */
export function SchemaSqlCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      toast({ title: "SQL copiado", description: "Cole no editor SQL do destino para migrar as tabelas." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", description: "Selecione o texto manualmente.", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([SCHEMA_SQL], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="h-4 w-4" />
            SQL do schema (migração de tabelas)
          </CardTitle>
          <CardDescription>
            Tipos enum, tabelas, constraints, índices, grants e políticas RLS. Execute antes de importar os CSVs.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            .sql
          </Button>
          <Button size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar SQL"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={SCHEMA_SQL}
          onFocus={(e) => e.currentTarget.select()}
          spellCheck={false}
          className="h-80 resize-y font-mono text-xs"
          aria-label="SQL do schema do banco de dados"
        />
      </CardContent>
    </Card>
  );
}
