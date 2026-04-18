import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  QrCode, ShoppingCart, ClipboardList, Monitor, MapPin, Printer, Users, BarChart3,
  Zap, LayoutList, CheckCircle2, Star, ChevronRight, Smartphone, ArrowRight, Lock
} from "lucide-react";
import heroDevices from "@/assets/hero-devices.png";
import logoLanding from "@/assets/logo-anoto-landing.png";
import logoIcon from "@/assets/logo-icon.png";
import benefitOrdersApp from "@/assets/hero-app-screenshot.png";
import benefitKanbanUI from "@/assets/benefit-kanban-ui.png";
import benefitThermalPrinter from "@/assets/benefit-thermal-printer.png";
import testimonialCarlos from "@/assets/testimonial-carlos.jpg";
import testimonialAna from "@/assets/testimonial-ana.jpg";
import testimonialRoberto from "@/assets/testimonial-roberto.jpg";

/* ─── Header ─── */
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center">
          <span className="text-lg font-extrabold" style={{ color: "#FF7A1A" }}>Anotô<span className="font-medium text-gray-500">, pedidos &amp; atendimento</span></span>
        </a>
        <nav className="hidden gap-6 md:flex">
          {[
            ["Funcionalidades", "#funcionalidades"],
            ["Como funciona", "#como-funciona"],
            ["Planos", "#planos"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white">
            <Link to="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <img src={logoLanding} alt="Anotô - Pedidos e atendimento" style={{ width: "320px", height: "auto" }} />
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-xs font-semibold">
            Para lanchonetes, pizzarias, açaiterias e mais
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">
            Cardápio em app nativo + pedidos + caixa,{" "}
            <span style={{ color: "#1e40af" }}>tudo em um só lugar</span>
          </h1>
          <p className="max-w-md text-lg text-gray-600">
            Seu cardápio como um app instalável no celular do cliente. Receba pedidos, rastreie entregas em tempo real, organize na cozinha e feche o caixa. Sem taxa por pedido.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white text-base px-8">
              <a href={`https://wa.me/5531986570126?text=${encodeURIComponent("Oi, vim pelo site do Anotô. Gostaria de um teste para conhecer mais sobre.")}`} target="_blank" rel="noopener noreferrer">Testar agora <ArrowRight className="ml-1 h-4 w-4" /></a>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-gray-300 text-gray-700">
              <a href="#como-funciona">Ver como funciona</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <img src={heroDevices} alt="Anotô em notebook, tablet e celular" className="w-full max-w-lg h-auto object-contain" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Benefícios ─── */
function BenefitsSection() {
  const pillars = [
    {
      img: benefitOrdersApp,
      title: "Zero taxa por pedido",
      desc: "Você fica com 100% do valor de cada venda. Sem comissões escondidas, sem surpresas no final do mês.",
      tag: "Margem 100%",
    },
    {
      img: benefitKanbanUI,
      title: "Pedidos organizados",
      desc: "Painel Kanban em tempo real. Veja o fluxo completo do pedido, da entrada à entrega, sem perder nada.",
      tag: "Realtime",
    },
    {
      img: benefitThermalPrinter,
      title: "Impressão automática",
      desc: "Pedido chegou, já imprime na cozinha. Compatível com impressoras térmicas ESC/POS via USB ou rede.",
      tag: "ESC/POS",
    },
  ];

  return (
    <section
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(900px 500px at 90% -10%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(800px 500px at 0% 110%, rgba(30,64,175,0.20), transparent 55%), linear-gradient(180deg, #07071A 0%, #0A0F25 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            Por que Anotô
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Feito para quem vive o{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #FF7A1A 0%, #FF3D7F 55%, #A855F7 100%)" }}
            >
              dia a dia
            </span>
            <br className="hidden md:block" /> do balcão
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_20px_60px_-15px_rgba(255,122,26,0.25)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex h-56 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/30 p-4">
                <img src={p.img} alt={p.title} className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300/80">0{i + 1} · {p.tag}</span>
                <h3 className="mt-2 text-xl font-bold text-white">{p.title}</h3>
                <div className="my-4 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
                <p className="text-[13.5px] leading-relaxed text-white/55">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Funcionalidades ─── */
function FeaturesSection() {
  const medium = [
    {
      icon: QrCode,
      title: "Cardápio digital",
      headline: "Vire um app no celular do cliente",
      desc: "Link, QR Code e PWA instalável. Sem App Store, sem fricção.",
      meta: "PWA · QR · Link",
    },
    {
      icon: ShoppingCart,
      title: "Checkout direto",
      headline: "Conversão em poucos toques",
      desc: "Endereço, pagamento e confirmação em um fluxo só. Sem cadastro obrigatório.",
      meta: "Pix · Cartão · Dinheiro",
    },
  ];

  const small = [
    { icon: BarChart3, title: "Relatórios inteligentes", desc: "Faturamento, ticket médio e ranking de produtos.", pro: true },
    { icon: Users, title: "CRM de clientes", desc: "Histórico, LTV e disparo no WhatsApp.", pro: true },
    { icon: Printer, title: "Impressão térmica", desc: "ESC/POS via USB ou rede, automático.", pro: false },
    { icon: MapPin, title: "Entregas por bairro", desc: "Taxas e raio calculados no checkout.", pro: false },
  ];

  const cardBase =
    "group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_20px_60px_-15px_rgba(255,122,26,0.25)]";

  const IconTile = ({ icon: Icon, size = "md" }: { icon: typeof Zap; size?: "md" | "lg" }) => (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg border border-orange-500/30 ${
        size === "lg" ? "h-12 w-12" : "h-10 w-10"
      }`}
      style={{
        background: "linear-gradient(135deg, rgba(255,122,26,0.18) 0%, rgba(255,61,127,0.10) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px -4px rgba(255,122,26,0.3)",
      }}
    >
      <Icon className={size === "lg" ? "h-6 w-6 text-orange-400" : "h-[18px] w-[18px] text-orange-400"} strokeWidth={2.2} />
    </div>
  );

  const ProTag = () => (
    <span
      className="inline-flex items-center rounded-md border border-orange-500/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-300"
      style={{ background: "linear-gradient(135deg, rgba(255,122,26,0.18), rgba(255,61,127,0.12))" }}
    >
      Pro
    </span>
  );

  const kanbanOrders = [
    { id: "#1287", name: "Ana Paula", items: "2 itens · R$ 48,90", status: "novo", time: "agora", color: "#FF7A1A" },
    { id: "#1286", name: "João M.", items: "1 item · R$ 29,00", status: "preparo", time: "3 min", color: "#3B82F6" },
    { id: "#1285", name: "Carlos R.", items: "4 itens · R$ 92,40", status: "entrega", time: "12 min", color: "#A855F7" },
  ];

  return (
    <section
      id="funcionalidades"
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(1100px 600px at 8% -5%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(900px 500px at 100% 110%, rgba(30,64,175,0.22), transparent 55%), radial-gradient(700px 400px at 50% 50%, rgba(255,122,26,0.05), transparent 60%), linear-gradient(180deg, #07071A 0%, #0A0F25 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            Plataforma
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Um sistema completo para{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #FF7A1A 0%, #FF3D7F 55%, #A855F7 100%)" }}
            >
              vender mais
            </span>
            <br className="hidden md:block" /> e operar melhor
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-white/55">
            Pedidos, cardápio, caixa e logística em uma única operação — sem gambiarra, sem taxa por pedido.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          {/* MAIN CARD */}
          <motion.div
            className={`${cardBase} md:col-span-4 md:row-span-2 p-7 md:p-8`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.18] blur-3xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ background: "radial-gradient(circle, #FF7A1A 0%, transparent 70%)" }}
            />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <IconTile icon={Zap} size="lg" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-orange-300/80">Engine de pedidos</p>
                    <h3 className="mt-0.5 text-2xl font-bold leading-tight text-white md:text-[26px]">
                      Pedidos em tempo real,<br className="hidden sm:block" /> sem perder nada no rush
                    </h3>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 sm:inline-flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Online</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 divide-x divide-white/[0.06] rounded-lg border border-white/[0.06] bg-black/20">
                {[
                  { label: "Pedidos hoje", value: "127", trend: "+18%" },
                  { label: "Tempo médio", value: "4m 12s", trend: "-9%" },
                  { label: "Conversão", value: "82%", trend: "+5%" },
                ].map((s) => (
                  <div key={s.label} className="px-4 py-3.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.label}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <p className="text-xl font-bold tabular-nums text-white">{s.value}</p>
                      <span className="text-[10px] font-semibold text-emerald-400">{s.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-white/[0.06] bg-black/30 p-3">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Fila ao vivo</p>
                  <p className="text-[10px] tabular-nums text-white/30">atualizado · 2s</p>
                </div>
                <div className="space-y-1.5">
                  {kanbanOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="h-8 w-1 rounded-full" style={{ background: o.color, boxShadow: `0 0 8px ${o.color}80` }} />
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="font-mono text-[11px] tabular-nums text-white/40">{o.id}</span>
                        <span className="truncate text-[13px] font-medium text-white/90">{o.name}</span>
                        <span className="hidden text-[12px] text-white/45 sm:inline">{o.items}</span>
                      </div>
                      <span
                        className="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: o.color, borderColor: `${o.color}60`, background: `${o.color}15` }}
                      >
                        {o.status}
                      </span>
                      <span className="hidden w-10 text-right font-mono text-[10px] tabular-nums text-white/35 sm:inline">{o.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {["Kanban ao vivo", "Notificação instantânea", "Multi-dispositivo", "Realtime sync"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/65"
                  >
                    <CheckCircle2 className="h-3 w-3 text-orange-400" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* MEDIUM CARDS */}
          {medium.map((f, i) => (
            <motion.div
              key={f.title}
              className={`${cardBase} md:col-span-2 p-6`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.08 }}
            >
              <div className="flex items-start justify-between">
                <IconTile icon={f.icon} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">0{i + 2}</span>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300/80">{f.title}</p>
              <h3 className="mt-1.5 text-[19px] font-bold leading-tight text-white">{f.headline}</h3>
              <div className="my-4 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
              <p className="text-[13px] leading-relaxed text-white/55">{f.desc}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-white/35">{f.meta}</p>
            </motion.div>
          ))}

          {/* SMALL CARDS */}
          {small.map((f, i) => (
            <motion.div
              key={f.title}
              className={`${cardBase} md:col-span-3 p-5`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: 0.25 + i * 0.07 }}
            >
              <div className="flex items-start gap-4">
                <IconTile icon={f.icon} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-white">{f.title}</h3>
                    {f.pro && <ProTag />}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{f.desc}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-orange-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Como funciona ─── */
function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Crie sua loja", desc: "Cadastre-se em menos de 2 minutos e personalize seu perfil.", tag: "Setup" },
    { num: "02", title: "Monte o cardápio", desc: "Adicione categorias, produtos, fotos e preços.", tag: "Catálogo" },
    { num: "03", title: "Receba pedidos", desc: "Compartilhe o link e receba pedidos em tempo real.", tag: "Live" },
  ];
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(900px 500px at 10% -5%, rgba(30,64,175,0.20), transparent 55%), radial-gradient(800px 500px at 100% 110%, rgba(124,58,237,0.18), transparent 55%), linear-gradient(180deg, #0A0F25 0%, #07071A 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div className="mx-auto mb-16 max-w-3xl text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            Como funciona
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Três passos para{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(120deg, #FF7A1A 0%, #FF3D7F 55%, #A855F7 100%)" }}>
              começar a vender
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_20px_60px_-15px_rgba(255,122,26,0.25)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-orange-500/30 text-2xl font-black text-orange-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,122,26,0.18) 0%, rgba(255,61,127,0.10) 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px -4px rgba(255,122,26,0.3)",
                  }}
                >
                  {s.num}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{s.tag}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{s.title}</h3>
              <div className="my-4 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
              <p className="text-[13.5px] leading-relaxed text-white/55">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Prova social ─── */
function TestimonialsSection() {
  const testimonials = [
    { name: "Carlos M.", biz: "Dono de Lanchonete", text: "Antes eu anotava tudo no papel e perdia pedidos. Agora recebo tudo organizado no celular e imprimo direto na cozinha. Meus clientes notaram a diferença.", img: testimonialCarlos },
    { name: "Ana P.", biz: "Dona de Açaiteria", text: "Montei meu cardápio digital sozinha em uma tarde. Meus clientes adoram pedir pelo celular, e minhas vendas cresceram 40% no primeiro mês.", img: testimonialAna },
    { name: "Roberto S.", biz: "Dono de Pizzaria", text: "O caixa integrado me deu controle real do faturamento. Antes eu não sabia quanto entrava por dia. Hoje tenho clareza total.", img: testimonialRoberto },
  ];
  return (
    <section
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(900px 500px at 90% -10%, rgba(255,122,26,0.12), transparent 55%), radial-gradient(800px 500px at 0% 110%, rgba(124,58,237,0.18), transparent 55%), linear-gradient(180deg, #07071A 0%, #0A0F25 100%)",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div className="mx-auto mb-16 max-w-3xl text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            Depoimentos
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Quem usa,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(120deg, #FF7A1A 0%, #FF3D7F 55%, #A855F7 100%)" }}>
              recomenda
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_20px_60px_-15px_rgba(255,122,26,0.25)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="mb-5 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="flex-1 text-[14.5px] leading-relaxed text-white/75">"{t.text}"</p>
              <div className="my-5 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-500/30" />
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-white/50">{t.biz}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
function PricingSection() {
  const plans = [
    {
      name: "Básico",
      price: "R$ 49,90",
      period: "/mês",
      desc: "Para começar a vender online",
      included: ["Até 10 produtos", "1 cardápio online", "3 categorias", "Pedidos via WhatsApp", "Painel de pedidos básico", "Dashboard com visão geral", "Caixa (PDV) básico"],
      locked: ["CRM avançado de clientes", "Analytics e relatórios detalhados", "Rastreio de pedidos em tempo real", "App personalizado instalável", "Múltiplos cardápios", "Gestão financeira completa"],
      cta: "Começar agora",
      highlight: false,
    },
    {
      name: "Pro",
      price: "R$ 99,90",
      period: "/mês",
      desc: "Recursos completos para crescer",
      included: ["Produtos ilimitados", "Múltiplos cardápios", "Categorias ilimitadas", "Checkout 100% online (sem WhatsApp)", "Rastreio de pedidos em tempo real", "Dashboard completo com métricas", "Gestão financeira (caixa, sangrias, suprimentos)", "Analytics avançado (faturamento, ticket médio, top produtos)", "CRM de clientes (LTV, histórico, WhatsApp)", "Relatórios exportáveis (CSV)", "App personalizado instalável", "Domínio customizado", "Suporte prioritário 24/7", "Painel de pedidos avançado"],
      locked: [],
      cta: "Assinar Pro",
      highlight: true,
    },
  ];
  return (
    <section
      id="planos"
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(900px 500px at 10% -5%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(800px 500px at 100% 110%, rgba(255,122,26,0.14), transparent 55%), linear-gradient(180deg, #0A0F25 0%, #07071A 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div className="mx-auto mb-16 max-w-3xl text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            Planos
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Escolha o plano ideal para{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(120deg, #FF7A1A 0%, #FF3D7F 55%, #A855F7 100%)" }}>
              seu negócio
            </span>
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-white/55">Sem taxa por pedido. Sem surpresas. Escolha o plano que cabe no seu bolso.</p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group relative flex h-full flex-col overflow-hidden rounded-xl border backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] p-7 transition-all duration-300 hover:-translate-y-1 ${
                p.highlight
                  ? "border-orange-500/40 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.02] hover:shadow-[0_20px_60px_-15px_rgba(255,122,26,0.4)]"
                  : "border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] hover:border-orange-500/30"
              }`}
            >
              {p.highlight && (
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
                  style={{ background: "radial-gradient(circle, #FF7A1A 0%, transparent 70%)" }}
                />
              )}
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg border border-orange-500/30"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,122,26,0.18) 0%, rgba(255,61,127,0.10) 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px -4px rgba(255,122,26,0.3)",
                    }}
                  >
                    <Zap className="h-6 w-6 text-orange-400" strokeWidth={2.2} />
                  </div>
                  {p.highlight && (
                    <span
                      className="inline-flex items-center rounded-md border border-orange-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300"
                      style={{ background: "linear-gradient(135deg, rgba(255,122,26,0.18), rgba(255,61,127,0.12))" }}
                    >
                      Popular
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">{p.name}</h3>
                <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tabular-nums text-white">{p.price}</span>
                  <span className="text-sm text-white/50">{p.period}</span>
                </div>

                <div className="my-5 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />

                <ul className="flex-1 space-y-2.5">
                  {p.included.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[13.5px] text-white/75">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                      {f}
                    </li>
                  ))}
                  {p.locked.map((f, j) => (
                    <li key={`l-${j}`} className="flex items-start gap-2.5 text-[13.5px] text-white/30">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className={`mt-7 w-full text-base font-semibold ${p.highlight ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30" : "bg-white/10 hover:bg-white/15 text-white border border-white/15"}`}>
                  <a href={`https://wa.me/5531986570126?text=${encodeURIComponent(`Olá, gostaria de assinar o plano ${p.name}.`)}`} target="_blank" rel="noopener noreferrer">{p.cta} <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const faqs = [
    { q: "Preciso pagar taxa por pedido?", a: "Não. O Anotô não cobra comissão sobre suas vendas. Você paga apenas pelo plano escolhido." },
    { q: "Funciona para retirada e delivery?", a: "Sim! Você pode habilitar retirada no local, delivery ou ambos, configurando bairros e taxas de entrega." },
    { q: "Dá para imprimir em impressora térmica?", a: "Sim. O Anotô suporta impressão automática via ESC/POS em impressoras térmicas USB ou de rede." },
    { q: "Posso ter mais de uma loja?", a: "No momento, cada conta gerencia uma loja. Estamos trabalhando no suporte a múltiplas unidades." },
    { q: "Como funciona o plano Pro?", a: "O plano Pro inclui funcionalidades avançadas como CRM de clientes, relatórios detalhados e prioridade no suporte." },
  ];
  return (
    <section
      id="faq"
      className="relative overflow-hidden py-28"
      style={{
        background:
          "radial-gradient(800px 500px at 50% -10%, rgba(30,64,175,0.18), transparent 55%), linear-gradient(180deg, #07071A 0%, #0A0F25 100%)",
      }}
    >
      <div className="relative mx-auto max-w-3xl px-4">
        <motion.div className="mb-14 text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(255,122,26,0.7)]" />
            FAQ
          </span>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">Perguntas frequentes</h2>
          <p className="mt-5 text-[17px] text-white/55">Tire suas dúvidas antes de começar</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.015] backdrop-blur-xl px-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] transition-all hover:border-orange-500/30 data-[state=open]:border-orange-500/40"
              >
                <AccordionTrigger className="py-5 text-[15px] font-semibold text-white hover:no-underline [&[data-state=open]]:text-orange-300">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[14px] leading-relaxed text-white/65">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Final ─── */
function FinalCTASection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white">Pronto para digitalizar seu negócio?</h2>
        <p className="mt-3 text-white/70">Crie sua conta gratuita e comece a receber pedidos em minutos.</p>
        <Button size="lg" asChild className="mt-6 bg-orange-500 hover:bg-orange-600 text-white text-base px-8">
          <a href={`https://wa.me/5531986570126?text=${encodeURIComponent("Oi, vim pelo site do Anotô. Gostaria de um teste para conhecer mais sobre.")}`} target="_blank" rel="noopener noreferrer">Começar grátis <ArrowRight className="ml-1 h-4 w-4" /></a>
        </Button>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:text-left">
        <img src={logoLanding} alt="Anotô" className="h-8 w-auto object-contain brightness-0 invert" />
        <div className="flex gap-6">
          {["Termos de uso", "Privacidade", "Suporte"].map((l) => (
            <a key={l} href="#" className="text-xs text-white/50 hover:text-white/80 transition">{l}</a>
          ))}
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} Anotô. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Light top: Header + Hero */}
      <div style={{ background: "linear-gradient(180deg, #f0f4ff 0%, #ffffff 50%, #eef2ff 100%)" }}>
        <LandingHeader />
        <HeroSection />
      </div>

      {/* Dark zone: Benefits + Features */}
      <div style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)" }}>
        <BenefitsSection />
        <FeaturesSection />
      </div>

      {/* Light zone: How it works + Testimonials + Pricing + FAQ */}
      <div style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 15%, #f0f4ff 40%, #ffffff 60%, #eef2ff 80%, #f8fafc 100%)" }}>
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </div>

      {/* Dark zone: CTA + Footer */}
      <div style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)" }}>
        <FinalCTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
