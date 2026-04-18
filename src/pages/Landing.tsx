import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  QrCode, ShoppingCart, ClipboardList, Monitor, MapPin, Printer, Users, BarChart3,
  Zap, LayoutList, CheckCircle2, Star, ChevronRight, Smartphone, ArrowRight, Lock,
  type LucideIcon,
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
    <section className="bg-[#0B0D12] py-28 border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-2xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/40">Por que Anotô</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-[40px] md:leading-[1.15]">
            Feito para quem vive o dia a dia do balcão.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Três pilares que sustentam a operação, do pedido à cozinha.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md bg-white/[0.06] md:grid-cols-3">
          {pillars.map((p, i) => (
            <div key={i} className="group flex flex-col bg-[#101319] transition-colors duration-200 hover:bg-[#13171F]">
              <div className="flex h-48 items-center justify-center border-b border-white/[0.06] bg-black/30 p-4">
                <img src={p.img} alt={p.title} className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
                  0{i + 1} · {p.tag}
                </span>
                <h3 className="mt-3 text-[15px] font-medium text-white">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Funcionalidades ─── */
function FeaturesSection() {
  const features = [
    { icon: QrCode, title: "Cardápio digital com QR Code", desc: "Link público, PWA instalável e atualizações instantâneas no menu." },
    { icon: ShoppingCart, title: "Checkout intuitivo", desc: "Endereço, pagamento e confirmação em um único fluxo, sem fricção." },
    { icon: BarChart3, title: "Relatórios inteligentes", desc: "Faturamento, ticket médio e ranking de produtos por período.", pro: true },
    { icon: Users, title: "Gestão de clientes", desc: "CRM com histórico, LTV e segmentação por frequência.", pro: true },
    { icon: Printer, title: "Impressão térmica", desc: "ESC/POS via USB ou rede, impressão automática ao receber.", size: "md" as const },
    { icon: Monitor, title: "PDV e controle de caixa", desc: "Abertura, sangria, suprimento e fechamento conciliado.", size: "md" as const },
  ];

  return (
    <section
      id="funcionalidades"
      className="relative overflow-hidden py-32"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(88,28,135,0.25), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 100%, rgba(30,58,138,0.28), transparent 60%), linear-gradient(180deg, #0A0B14 0%, #0B0E1C 100%)",
      }}
    >
      {/* subtle noise / grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Funcionalidades
          </span>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white md:text-[52px] md:leading-[1.05]">
            Um sistema completo para{" "}
            <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              vender mais
            </span>{" "}
            e operar melhor
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-white/55">
            Tudo integrado em uma única plataforma — do pedido à impressão na cozinha,
            sem gambiarras e sem múltiplos sistemas.
          </p>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-6 md:grid-rows-[auto_auto]">
          {/* Featured card */}
          <FeatureCard
            featured
            icon={Zap}
            title="Pedidos automatizados em tempo real"
            desc="Recebimento instantâneo, fila ao vivo e atualização contínua entre todos os dispositivos. Sua operação inteira sincronizada."
            className="md:col-span-4 md:row-span-2"
            delay={0}
          >
            <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/40 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
                  Fila ao vivo
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  ativo
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { id: "#1287", name: "Ana Paula", status: "Novo", time: "agora", color: "text-orange-300" },
                  { id: "#1286", name: "João M.", status: "Preparo", time: "3 min", color: "text-amber-300" },
                  { id: "#1285", name: "Carlos R.", status: "Entrega", time: "12 min", color: "text-blue-300" },
                ].map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-white/40">{o.id}</span>
                      <span className="text-white/90">{o.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] font-medium ${o.color}`}>{o.status}</span>
                      <span className="font-mono tabular-nums text-white/40">{o.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FeatureCard>

          {/* Two medium cards stacked next to featured */}
          <FeatureCard
            icon={features[0].icon}
            title={features[0].title}
            desc={features[0].desc}
            className="md:col-span-2"
            delay={80}
          />
          <FeatureCard
            icon={features[1].icon}
            title={features[1].title}
            desc={features[1].desc}
            className="md:col-span-2"
            delay={140}
          />

          {/* Smaller cards row */}
          <FeatureCard
            icon={features[2].icon}
            title={features[2].title}
            desc={features[2].desc}
            pro={features[2].pro}
            className="md:col-span-2"
            delay={200}
          />
          <FeatureCard
            icon={features[3].icon}
            title={features[3].title}
            desc={features[3].desc}
            pro={features[3].pro}
            className="md:col-span-2"
            delay={260}
          />
          <FeatureCard
            icon={features[4].icon}
            title={features[4].title}
            desc={features[4].desc}
            className="md:col-span-1"
            delay={320}
            compact
          />
          <FeatureCard
            icon={features[5].icon}
            title={features[5].title}
            desc={features[5].desc}
            className="md:col-span-1"
            delay={380}
            compact
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  pro,
  featured,
  compact,
  className = "",
  delay = 0,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  pro?: boolean;
  featured?: boolean;
  compact?: boolean;
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05] hover:shadow-[0_20px_60px_-15px_rgba(124,58,237,0.35)] ${className}`}
      style={{
        animation: `featureCardIn 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
      }}
    >
      {/* gradient sheen on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-orange-400/10 via-transparent to-purple-500/10" />
      </div>

      <div className={`relative flex h-full flex-col ${compact ? "p-6" : featured ? "p-8" : "p-7"}`}>
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-[0_8px_24px_-8px_rgba(251,146,60,0.6)] ${
              featured ? "h-12 w-12" : "h-10 w-10"
            }`}
          >
            <Icon className={featured ? "h-5 w-5 text-white" : "h-[18px] w-[18px] text-white"} strokeWidth={2} />
          </div>
          {pro && (
            <span className="rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_12px_-4px_rgba(251,146,60,0.6)]">
              Pro
            </span>
          )}
        </div>

        <h3
          className={`mt-6 font-semibold tracking-tight text-white ${
            featured ? "text-[22px] leading-tight md:text-[26px]" : compact ? "text-[15px]" : "text-[17px]"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 leading-relaxed text-white/55 ${
            featured ? "max-w-md text-[15px]" : compact ? "text-[13px]" : "text-[14px]"
          }`}
        >
          {desc}
        </p>

        {children && <div className="flex flex-1 flex-col justify-end">{children}</div>}
      </div>
    </div>
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
    <div className="min-h-screen relative overflow-hidden bg-[#07071A]">
      {/* Light top: Header + Hero */}
      <div style={{ background: "linear-gradient(180deg, #f0f4ff 0%, #ffffff 50%, #eef2ff 100%)" }}>
        <LandingHeader />
        <HeroSection />
      </div>

      {/* Dark zone — unified premium aesthetic */}
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />

      {/* CTA + Footer */}
      <div style={{ background: "linear-gradient(180deg, #0A0F25 0%, #07071A 100%)" }}>
        <FinalCTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
