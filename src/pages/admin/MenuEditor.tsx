import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Check, Upload, X, Loader2, ExternalLink, Palette, Type, LayoutGrid, Image, Globe, Share2, Sparkles, Copy, QrCode } from "lucide-react";
import { MobilePreview } from "@/components/admin/MobilePreview";
import { toast } from "sonner";
import { MenuBannerManager } from "@/components/admin/MenuBannerManager";
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
    id: "acai-premium", name: "Açaí Premium", icon: "🍇",
    description: "Tons roxos vibrantes, layout de cards com imagens grandes. Perfeito para açaí e smoothies.",
    tags: ["Açaí", "Smoothie", "Saudável"], layout: "Cards", font: "Poppins",
    color: "#7c3aed", dots: ["#7c3aed", "#9ca3af", "#d1d5db"],
  },
  {
    id: "fast-food", name: "Fast Food", icon: "🍔",
    description: "Vermelho e laranja energético, grade de 2 colunas para mostrar mais produtos. Ideal para hambúrgueres e lanches.",
    tags: ["Hambúrguer", "Lanche", "Fast Food"], layout: "Grade", font: "Montserrat",
    color: "#dc2626", dots: ["#dc2626", "#9ca3af", "#d1d5db"],
  },
  {
    id: "pizzaria", name: "Pizzaria", icon: "🍕",
    description: "Verde italiano clássico, lista compacta para cardápios extensos. Elegante para pizzarias e restaurantes.",
    tags: ["Pizza", "Restaurante", "Italiano"], layout: "Lista", font: "Playfair Display",
    color: "#16a34a", dots: ["#16a34a", "#9ca3af", "#d1d5db"],
  },
  {
    id: "japones", name: "Japonês", icon: "🍣",
    description: "Vermelho japonês minimalista, lista limpa para um visual sofisticado. Ideal para sushi e culinária oriental.",
    tags: ["Sushi", "Oriental", "Minimalista"], layout: "Lista", font: "Inter",
    color: "#b91c1c", dots: ["#b91c1c", "#9ca3af", "#d1d5db"],
  },
  {
    id: "sorveteria", name: "Sorveteria", icon: "🍦",
    description: "Rosa e azul pastéis, cards arredondados. Perfeito para sorveterias e docerias.",
    tags: ["Sorvete", "Doces", "Colorido"], layout: "Cards", font: "Poppins",
    color: "#db2777", dots: ["#db2777", "#9ca3af", "#d1d5db"],
  },
  {
    id: "dark-premium", name: "Dark Premium", icon: "✨",
    description: "Tema escuro elegante com dourado. Premium e sofisticado para restaurantes finos.",
    tags: ["Premium", "Dark", "Elegante"], layout: "Lista", font: "Playfair Display",
    color: "#eab308", dots: ["#eab308", "#9ca3af", "#d1d5db"],
  },
];

const PALETTES = [
  { name: "Açaí", color: "#7c3aed", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Verde", color: "#16a34a", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Laranja", color: "#ea580c", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Azul", color: "#2563eb", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Rosa", color: "#db2777", bg: "#ffffff", text: "#1a1a1a" },
  { name: "Dark", color: "#ffffff", bg: "#1a1a1a", text: "#ffffff", isDark: true },
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

  // Design fields
  const [themeColor, setThemeColor] = useState("#7c3aed");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [selectedPalette, setSelectedPalette] = useState("Açaí");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [showBanner, setShowBanner] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showFeatured, setShowFeatured] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (store && menuId) fetchMenu();
  }, [store, menuId]);

  const fetchMenu = async () => {
    if (!store || !menuId) return;
    const { data } = await supabase.from("menus").select("*").eq("id", menuId).eq("store_id", store.id).single();
    if (data) {
      setMenu(data);
      setThemeColor(data.theme_color || "#7c3aed");
      setBgColor((data as any).bg_color || "#ffffff");
      setTextColor((data as any).text_color || "#1a1a1a");
      setFontFamily((data as any).font_family || "Inter");
      setShowBanner((data as any).show_banner ?? true);
      setShowCategories((data as any).show_categories ?? true);
      setShowFeatured((data as any).show_featured ?? true);
      setShowSearch((data as any).show_search ?? true);
      setLogoUrl(data.logo_url);
      // banner_url is now managed by MenuBannerManager
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    const { error } = await supabase.from("menus").update({
      theme_color: themeColor,
      logo_url: logoUrl,
      font_family: fontFamily,
      bg_color: bgColor,
      text_color: textColor,
      show_banner: showBanner,
      show_categories: showCategories,
      show_featured: showFeatured,
      show_search: showSearch,
    } as any).eq("id", menu.id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Cardápio salvo com sucesso!");
      fetchMenu();
    }
    setSaving(false);
  };

  const handleUploadLogo = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 5MB)");
      return;
    }
    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const fileName = `logos/${store?.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploadingLogo(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(fileName);
    setLogoUrl(publicUrl);
    setUploadingLogo(false);
    toast.success("Logo enviada!");
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setThemeColor(template.color);
    setFontFamily(template.font);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const applyPalette = (palette: typeof PALETTES[0]) => {
    setThemeColor(palette.color);
    setBgColor(palette.bg);
    setTextColor(palette.text);
    setSelectedPalette(palette.name);
    toast.success(`Paleta "${palette.name}" aplicada!`);
  };

  const copyLink = () => {
    if (!menu) return;
    navigator.clipboard.writeText(`${window.location.origin}/m/${menu.slug}`);
    toast.success("Link copiado!");
  };

  const menuUrl = menu ? `${window.location.origin}/m/${menu.slug}` : "";
  const qrCodeUrl = menu ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}` : "";

  const downloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode-${menu?.slug || "cardapio"}.png`;
    link.click();
    toast.success("QR Code baixado!");
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
              <h2 className="text-lg font-semibold">{store?.name || menu.name}</h2>
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
          <div className="flex items-center gap-1 overflow-x-auto px-6 py-2 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          {/* TEMPLATES TAB */}
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Templates Prontos</h3>
                <p className="text-sm text-muted-foreground">Aplique um template para configurar cores, fonte e layout automaticamente.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {TEMPLATES.map((tpl) => (
                  <div key={tpl.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex justify-center w-full">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: tpl.color }}>
                          {tpl.icon} {tpl.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {tpl.dots.map((dot, i) => (
                          <div key={i} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
                        ))}
                      </div>
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
                    <Button className="w-full gap-2 text-white" style={{ backgroundColor: tpl.color }} onClick={() => applyTemplate(tpl)}>
                      <Check className="h-4 w-4" /> Aplicar template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CORES TAB */}
          {activeTab === "cores" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Paletas Prontas</h3>
                <div className="grid grid-cols-3 gap-3">
                  {PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => applyPalette(palette)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                        selectedPalette === palette.name ? "border-primary ring-2 ring-primary/20" : "hover:border-muted-foreground/50"
                      } ${palette.isDark ? "bg-foreground text-background" : ""}`}
                    >
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.isDark ? "#ffffff" : palette.color }} />
                      {palette.name}
                      {selectedPalette === palette.name && <Check className="ml-auto h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cores Personalizadas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full" style={{ backgroundColor: themeColor }} />
                      <div>
                        <p className="font-medium">Cor primária</p>
                        <p className="text-sm text-muted-foreground">Botões, destaques, links</p>
                      </div>
                    </div>
                    <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-24 text-center font-mono text-sm" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border" style={{ backgroundColor: bgColor }} />
                      <div>
                        <p className="font-medium">Cor de fundo</p>
                        <p className="text-sm text-muted-foreground">Fundo geral do cardápio</p>
                      </div>
                    </div>
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-24 text-center font-mono text-sm" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full" style={{ backgroundColor: textColor }} />
                      <div>
                        <p className="font-medium">Cor do texto</p>
                        <p className="text-sm text-muted-foreground">Textos e títulos</p>
                      </div>
                    </div>
                    <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-24 text-center font-mono text-sm" />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="overflow-hidden rounded-lg border">
                <div className="px-4 py-3" style={{ backgroundColor: themeColor }}>
                  <p className="font-semibold text-white">{store?.name || "Nome da Loja"}</p>
                  <p className="text-sm text-white/80">Cardápio online</p>
                </div>
                <div className="p-4 space-y-2" style={{ backgroundColor: bgColor }}>
                  <p className="font-medium" style={{ color: textColor }}>Açaí Tradicional</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: textColor }}>500ml</p>
                    <button className="rounded-md px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: themeColor }}>
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FONTES TAB */}
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
                    onClick={() => {
                      setFontFamily(font.value);
                      toast.success(`Fonte "${font.name}" selecionada!`);
                    }}
                    className={`flex items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors ${
                      fontFamily === font.value ? "border-primary ring-2 ring-primary/20" : "hover:border-primary"
                    }`}
                  >
                    <div>
                      <p className="font-medium" style={{ fontFamily: font.value }}>{font.name}</p>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: font.value }}>
                        Exemplo de texto para visualização
                      </p>
                    </div>
                    {fontFamily === font.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LAYOUT TAB */}
          {activeTab === "layout" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Layout</h3>
                <p className="text-sm text-muted-foreground">Configure o layout do seu cardápio.</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar banner</p>
                      <p className="text-sm text-muted-foreground">Exibir banner promocional no topo</p>
                    </div>
                    <Switch checked={showBanner} onCheckedChange={setShowBanner} />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar categorias</p>
                      <p className="text-sm text-muted-foreground">Exibir filtros de categoria</p>
                    </div>
                    <Switch checked={showCategories} onCheckedChange={setShowCategories} />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar destaques</p>
                      <p className="text-sm text-muted-foreground">Exibir seção de produtos em destaque</p>
                    </div>
                    <Switch checked={showFeatured} onCheckedChange={setShowFeatured} />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mostrar busca</p>
                      <p className="text-sm text-muted-foreground">Exibir campo de busca de produtos</p>
                    </div>
                    <Switch checked={showSearch} onCheckedChange={setShowSearch} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IMAGENS TAB */}
          {activeTab === "imagens" && (
            <div className="space-y-8">
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
                        <button onClick={handleRemoveLogo} className="text-sm font-medium text-destructive hover:underline">Remover</button>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted"
                >
                  {uploadingLogo ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                    <>
                      <Upload className="mb-2 h-8 w-8" />
                      <span className="font-medium">Enviar nova logo</span>
                      <span className="text-xs">PNG, JPG ou SVG — até 5MB</span>
                    </>
                  )}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadLogo(file);
                  e.target.value = "";
                }} />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Banners do Cardápio</h3>
                  <p className="text-sm text-muted-foreground">Adicione múltiplos banners com links clicáveis. Ative o carrossel para rotação automática.</p>
                </div>
                <MenuBannerManager
                  menuId={menuId!}
                  storeId={store!.id}
                  bannerMode={(menu as any)?.banner_mode || "single"}
                  onBannerModeChange={async (mode) => {
                    await supabase.from("menus").update({ banner_mode: mode } as any).eq("id", menuId!);
                    setMenu((prev: any) => prev ? { ...prev, banner_mode: mode } : prev);
                    toast.success(mode === "carousel" ? "Carrossel ativado!" : "Modo banner único ativado");
                  }}
                />
              </div>
            </div>
          )}

          {/* DOMÍNIO TAB */}
          {activeTab === "dominio" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Domínio</h3>
                <p className="text-sm text-muted-foreground">Configure o endereço do seu cardápio online.</p>
              </div>
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <Label>Link do cardápio</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={menuUrl} className="flex-1" />
                  <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">Este é o link público do seu cardápio.</p>
              </div>
            </div>
          )}

          {/* COMPARTILHAR TAB */}
          {activeTab === "compartilhar" && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold">QR Code do cardápio</h3>
                  <p className="text-sm text-muted-foreground">Imprima e cole na sua loja física</p>
                </div>
                <div className="flex justify-center">
                  <div className="rounded-lg border p-3">
                    <img src={qrCodeUrl} alt="QR Code" className="h-[200px] w-[200px]" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
                    <Copy className="h-4 w-4" /> Copiar link
                  </Button>
                  <Button className="flex-1 gap-2" onClick={downloadQR}>
                    <QrCode className="h-4 w-4" /> Baixar QR
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 space-y-3">
                <h3 className="font-semibold">Status da publicação</h3>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${menu.is_published ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="text-sm">
                    {menu.is_published ? "Publicado — cardápio online" : "Rascunho — não publicado"}
                  </span>
                </div>
                {menu.is_published && (
                  <a href={`/m/${menu.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Abrir cardápio público
                  </a>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <MobilePreview slug={menu.slug} onRefresh={fetchMenu} />
    </div>
  );
}
