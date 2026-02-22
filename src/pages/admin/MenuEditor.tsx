import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Check, Upload, X, Loader2, RefreshCw, ExternalLink, Palette, Type, LayoutGrid, Image, Globe, Share2, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Menu = Database["public"]["Tables"]["menus"]["Row"];

const TABS = [
  { id: "templates", label: "Templates", icon: Sparkles },
  { id: "cores", label: "Cores", icon: Palette },
  { id: "fontes", label: "Fontes", icon: Type },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "imagens", label: "Imagens", icon: Image },
  { id: "dominio", label: "Domínio", icon: Globe },
  { id: "compartilhar", label: "Compartilhar", icon: Share2 },
];

const TEMPLATES = [
  {
    id: "acai-premium",
    name: "Açaí Premium",
    description: "Tons roxos vibrantes, layout de cards com imagens grandes. Perfeito para açaí e smoothies.",
    tags: ["Açaí", "Smoothie", "Saudável"],
    layout: "Cards",
    font: "Poppins",
    color: "hsl(270, 70%, 50%)",
    bgColor: "hsl(270, 70%, 95%)",
  },
  {
    id: "fast-food",
    name: "Fast Food",
    description: "Vermelho e laranja energético, grade de 2 colunas para mostrar mais produtos. Ideal para hambúrgueres e lanches.",
    tags: ["Hambúrguer", "Lanche", "Fast Food"],
    layout: "Grade",
    font: "Montserrat",
    color: "hsl(0, 70%, 50%)",
    bgColor: "hsl(0, 70%, 95%)",
  },
  {
    id: "pizzaria",
    name: "Pizzaria",
    description: "Verde italiano clássico, lista compacta para cardápios extensos. Elegante para pizzarias e restaurantes.",
    tags: ["Pizza", "Restaurante", "Italiano"],
    layout: "Lista",
    font: "Playfair",
    color: "hsl(142, 50%, 35%)",
    bgColor: "hsl(142, 50%, 95%)",
  },
  {
    id: "japones",
    name: "Japonês",
    description: "Vermelho japonês minimalista, lista limpa para um visual sofisticado. Ideal para sushi e culinária oriental.",
    tags: ["Sushi", "Oriental", "Minimalista"],
    layout: "Lista",
    font: "Padrão",
    color: "hsl(0, 60%, 45%)",
    bgColor: "hsl(0, 60%, 95%)",
  },
  {
    id: "sorveteria",
    name: "Sorveteria",
    description: "Rosa e azul pastéis, cards arredondados. Perfeito para sorveterias e docerias.",
    tags: ["Sorvete", "Doces", "Colorido"],
    layout: "Cards",
    font: "Poppins",
    color: "hsl(330, 60%, 55%)",
    bgColor: "hsl(330, 60%, 95%)",
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "Tema escuro elegante com dourado. Premium e sofisticado para restaurantes finos.",
    tags: ["Premium", "Dark", "Elegante"],
    layout: "Lista",
    font: "Playfair",
    color: "hsl(45, 80%, 50%)",
    bgColor: "hsl(240, 10%, 15%)",
  },
];

const FONT_OPTIONS = [
  { name: "Padrão (Inter)", value: "Inter" },
  { name: "Poppins", value: "Poppins" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
];

export default function MenuEditor() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Editable fields
  const [themeColor, setThemeColor] = useState("#7c3aed");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (store && menuId) fetchMenu();
  }, [store, menuId]);

  const fetchMenu = async () => {
    if (!store || !menuId) return;
    const { data } = await supabase.from("menus").select("*").eq("id", menuId).eq("store_id", store.id).single();
    if (data) {
      setMenu(data);
      setThemeColor(data.theme_color || "#7c3aed");
      setLogoUrl(data.logo_url);
      setBannerUrl(data.banner_url);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    const { error } = await supabase.from("menus").update({
      theme_color: themeColor,
      logo_url: logoUrl,
      banner_url: bannerUrl,
    }).eq("id", menu.id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Cardápio salvo com sucesso!");
      fetchMenu();
    }
    setSaving(false);
  };

  const handleUpload = async (file: File, type: "logo" | "banner") => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 5MB)");
      return;
    }
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${type}s/${store?.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("store-assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(fileName);
    if (type === "logo") setLogoUrl(publicUrl);
    else setBannerUrl(publicUrl);
    setUploading(false);
    toast.success(`${type === "logo" ? "Logo" : "Banner"} enviado!`);
  };

  const handleRemoveImage = (type: "logo" | "banner") => {
    if (type === "logo") setLogoUrl(null);
    else setBannerUrl(null);
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setThemeColor(template.color);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const copyLink = () => {
    if (!menu) return;
    const url = `${window.location.origin}/m/${menu.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Cardápio não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/menus")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6">
      {/* LEFT: Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/menus")} className="rounded-lg p-1 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">{menu.name}</h2>
              <p className="text-sm text-muted-foreground">Editor de design</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Check className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-card">
          <div ref={tabsRef} className="flex items-center gap-1 overflow-x-auto px-6 py-2 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1 p-6">
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Templates Prontos</h3>
                <p className="text-sm text-muted-foreground">Aplique um template para configurar cores, fonte e layout automaticamente.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {TEMPLATES.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white"
                        style={{ backgroundColor: tpl.color }}
                      >
                        {tpl.name}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{tpl.name}</h4>
                      <p className="text-sm text-muted-foreground">{tpl.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <span key={tag} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Layout: <strong>{tpl.layout}</strong> · Fonte: <strong>{tpl.font}</strong>
                    </p>
                    <Button className="w-full gap-2" onClick={() => applyTemplate(tpl)}>
                      <Check className="h-4 w-4" /> Aplicar template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "cores" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cores do Cardápio</h3>
                <p className="text-sm text-muted-foreground">Personalize as cores do seu cardápio.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor principal</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border-0 p-0"
                    />
                    <Input
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="max-w-[140px]"
                      placeholder="#7c3aed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pré-visualização</Label>
                  <div className="flex gap-3">
                    {["#7c3aed", "#ef4444", "#f97316", "#22c55e", "#3b82f6", "#ec4899", "#eab308", "#000000"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setThemeColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          themeColor === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fontes" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fontes</h3>
                <p className="text-sm text-muted-foreground">Escolha a fonte do seu cardápio.</p>
              </div>
              <div className="grid gap-3">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 text-left hover:border-primary transition-colors"
                  >
                    <div>
                      <p className="font-medium" style={{ fontFamily: font.value }}>{font.name}</p>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: font.value }}>
                        Exemplo de texto para visualização
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "layout" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Layout</h3>
                <p className="text-sm text-muted-foreground">Configure o layout do seu cardápio.</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar banner</p>
                      <p className="text-sm text-muted-foreground">Exibir banner promocional no topo</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar categorias</p>
                      <p className="text-sm text-muted-foreground">Exibir filtros de categoria</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar destaques</p>
                      <p className="text-sm text-muted-foreground">Exibir seção de produtos em destaque</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar busca</p>
                      <p className="text-sm text-muted-foreground">Exibir campo de busca de produtos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "imagens" && (
            <div className="space-y-8">
              {/* Logo */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Logo da Loja</h3>
                  <p className="text-sm text-muted-foreground">Aparece no topo do cardápio. PNG com fundo transparente recomendado.</p>
                </div>
                {logoUrl && (
                  <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                    <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium">Logo atual</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{logoUrl.split("/").pop()}</p>
                      <div className="mt-1 flex gap-3">
                        <button onClick={() => logoInputRef.current?.click()} className="text-sm font-medium text-primary hover:underline">Trocar logo</button>
                        <span className="text-muted-foreground">·</span>
                        <button onClick={() => handleRemoveImage("logo")} className="text-sm font-medium text-destructive hover:underline">Remover</button>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8" />
                      <span className="font-medium">Enviar nova logo</span>
                      <span className="text-xs">PNG, JPG ou SVG — até 5MB</span>
                    </>
                  )}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "logo");
                  e.target.value = "";
                }} />
              </div>

              {/* Banner */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Banner do Cardápio</h3>
                  <p className="text-sm text-muted-foreground">Imagem de destaque no topo do cardápio. Recomendado: 1200×400px.</p>
                </div>
                {bannerUrl && (
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-lg border">
                      <img src={bannerUrl} alt="Banner" className="aspect-[3/1] w-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => bannerInputRef.current?.click()} className="text-sm font-medium text-primary hover:underline">Trocar banner</button>
                      <span className="text-muted-foreground">·</span>
                      <button onClick={() => handleRemoveImage("banner")} className="text-sm font-medium text-destructive hover:underline">Remover</button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  {uploadingBanner ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8" />
                      <span className="font-medium">Enviar novo banner</span>
                      <span className="text-xs">JPG ou PNG — recomendado 1200×400px</span>
                    </>
                  )}
                </button>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "banner");
                  e.target.value = "";
                }} />
              </div>
            </div>
          )}

          {activeTab === "dominio" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Domínio</h3>
                <p className="text-sm text-muted-foreground">Configure o endereço do seu cardápio online.</p>
              </div>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <Label>Link do cardápio</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={`${window.location.origin}/m/${menu.slug}`} className="flex-1" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Este é o link público do seu cardápio.</p>
              </div>
            </div>
          )}

          {activeTab === "compartilhar" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Compartilhar</h3>
                <p className="text-sm text-muted-foreground">Compartilhe o link do seu cardápio.</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <Label>Link para compartilhar</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={`${window.location.origin}/m/${menu.slug}`} className="flex-1" />
                    <Button variant="outline" onClick={copyLink} className="gap-2">
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <Label>Compartilhar via WhatsApp</Label>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira nosso cardápio: ${window.location.origin}/m/${menu.slug}`)}`, "_blank")}
                  >
                    📱 Enviar pelo WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT: Mobile Preview */}
      <div className="hidden w-[380px] flex-col border-l bg-muted/30 lg:flex">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            PREVIEW MOBILE
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchMenu} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Recarregar
            </button>
            <a
              href={`/m/${menu.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex flex-1 items-start justify-center overflow-hidden p-4">
          <div className="relative w-[280px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/20 bg-background shadow-xl">
            {/* Phone notch */}
            <div className="flex items-center justify-center bg-foreground/5 py-1.5">
              <div className="h-1 w-12 rounded-full bg-foreground/20" />
            </div>
            {/* iframe preview */}
            <iframe
              src={`/m/${menu.slug}`}
              className="h-[520px] w-full border-0"
              title="Preview"
              style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "118%", height: "612px" }}
            />
          </div>
        </div>
        <div className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
          Preview ao vivo — salve para publicar
        </div>
      </div>
    </div>
  );
}
