import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {
  Smartphone, ListOrdered, Wallet, Printer, BarChart3, Zap,
  ArrowRight, Check,
} from "lucide-react";
import heroDevices from "@/assets/hero-devices.png";
import logoLanding from "@/assets/logo-anoto-landing.png";
import testimonialCarlos from "@/assets/testimonial-carlos.jpg";
import testimonialAna from "@/assets/testimonial-ana.jpg";
import testimonialRoberto from "@/assets/testimonial-roberto.jpg";

/* ─── Header ─── */
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <a href="/" className="text-base font-bold tracking-tight" style={{ color: "#FF7A1A" }}>
          Anotô
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {[
            ["Funcionalidades", "#funcionalidades"],
            ["Como funciona", "#como-funciona"],
            ["Planos", "#planos"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-[13.5px] font-medium text-gray-600 transition hover:text-gray-900">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex text-gray-700">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
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
    <section className="bg-white">
      <div className="mx-auto grid max-w-5xl items-start gap-10 px-5 py-12 md:grid-cols-[1.1fr_1fr] md:py-16">
        <div className="space-y-5">
          <img
            src={logoLanding}
            alt="Anotô"
            className="block w-[340px] md:w-[360px] h-auto object-contain mx-auto md:mx-0 mb-2"
          />
          <span className="inline-block text-[12px] font-semibold uppercase tracking-[0.14em] text-orange-600">
            Sem taxa por pedido
          </span>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight text-gray-900 md:text-[56px]">
            Venda mais e organize tudo,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #4a1d05 0%, #c2410c 35%, #fb923c 55%, #7c2d12 100%)",
              }}
            >
              sem taxa por pedido.
            </span>
          </h1>
          <p className="max-w-md text-[17px] leading-relaxed text-gray-600">
            Cardápio digital, pedidos em tempo real e controle de caixa em um só lugar.
            Simples como precisa ser.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white text-base px-7 h-12">
              <Link to="/register">Criar conta grátis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="text-gray-700 hover:text-gray-900 h-12">
              <a href="#como-funciona">Ver como funciona</a>
            </Button>
          </div>
          <p className="pt-1 text-[13px] text-gray-500">Leva menos de 2 minutos. Sem cartão de crédito.</p>
        </div>

        <div className="relative flex justify-center">
          {/* Glow ambient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 55% at 50% 55%, rgba(251,146,60,0.35) 0%, rgba(124,58,237,0.18) 45%, transparent 75%)",
              filter: "blur(40px)",
            }}
          />
          <img
            src={heroDevices}
            alt="Anotô em notebook, tablet e celular"
            className="w-full max-w-md h-auto object-contain animate-hero-float drop-shadow-[0_30px_40px_rgba(76,29,149,0.25)]"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Prova direta ─── */
function ProofSection() {
  const items = [
    { icon: Smartphone, title: "Receba pedidos no celular", desc: "Notificação instantânea, em qualquer dispositivo." },
    { icon: ListOrdered, title: "Organize tudo em tempo real", desc: "Painel claro, do pedido à entrega." },
    { icon: Wallet, title: "Feche o caixa sem erro", desc: "Controle total do seu faturamento diário." },
  ];
  return (
    <section className="border-t border-gray-200 bg-[#FAFAFA]">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Tudo que você precisa pra vender.
            <br />
            <span className="text-gray-500">Sem complicação.</span>
          </h2>
        </div>
        <div className="grid gap-px bg-gray-200 md:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="bg-[#FAFAFA] p-7">
              <it.icon className="h-6 w-6 text-orange-500" strokeWidth={1.75} />
              <h3 className="mt-5 text-[17px] font-semibold text-gray-900">{it.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Como funciona ─── */
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Crie sua loja", desc: "Cadastre-se em 2 minutos." },
    { n: "02", title: "Monte seu cardápio", desc: "Categorias, produtos e preços." },
    { n: "03", title: "Receba pedidos", desc: "Compartilhe seu link e venda." },
  ];
  return (
    <section id="como-funciona" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="mb-14 max-w-2xl">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Como funciona
          </span>
          <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Três passos. Nada além disso.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="border-t border-gray-300 pt-5">
              <span className="font-mono text-[13px] tabular-nums text-orange-500">{s.n}</span>
              <h3 className="mt-3 text-[18px] font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-1.5 text-[14px] text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Benefícios ─── */
function BenefitsSection() {
  const items = [
    "Pedidos em tempo real",
    "Impressão automática",
    "Controle total do fluxo",
    "Relatórios claros",
  ];
  return (
    <section id="funcionalidades" className="border-t border-gray-200 bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-24 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Você não precisa de vários sistemas.
          </h2>
          <p className="mt-4 text-[17px] text-gray-600">Um lugar só. Sem gambiarra.</p>
        </div>
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-3 border-b border-gray-200 pb-4 text-[16px] text-gray-800">
              <Check className="h-5 w-5 shrink-0 text-orange-500" strokeWidth={2.2} />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Prova social ─── */
function TestimonialsSection() {
  const items = [
    { name: "Carlos M.", biz: "Lanchonete", text: "Recebo todos os pedidos organizados no celular e imprimo direto na cozinha.", img: testimonialCarlos },
    { name: "Ana P.", biz: "Açaiteria", text: "Montei meu cardápio em uma tarde. Vendas cresceram 40% no primeiro mês.", img: testimonialAna },
    { name: "Roberto S.", biz: "Pizzaria", text: "O caixa integrado me deu controle real do faturamento.", img: testimonialRoberto },
  ];
  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Quem usa, continua usando.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="border-t border-gray-300 pt-6">
              <p className="text-[15px] leading-relaxed text-gray-800">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={t.img} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-[13.5px] font-semibold text-gray-900">{t.name}</p>
                  <p className="text-[12.5px] text-gray-500">{t.biz}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Planos ─── */
function PricingSection() {
  const plans = [
    {
      name: "Básico",
      price: "R$ 49,90",
      desc: "Para começar a vender online.",
      features: ["Até 10 produtos", "Pedidos via WhatsApp", "Painel de pedidos", "Caixa básico"],
      highlight: false,
    },
    {
      name: "Pro",
      price: "R$ 99,90",
      desc: "Recursos completos para crescer.",
      features: ["Produtos ilimitados", "Checkout 100% online", "CRM e relatórios", "App instalável", "Suporte prioritário"],
      highlight: true,
    },
  ];
  return (
    <section id="planos" className="border-t border-gray-200 bg-[#FAFAFA]">
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Planos simples. Sem taxa por pedido.
          </h2>
        </div>
        <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-lg border p-7 ${
                p.highlight ? "border-orange-500 bg-white" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-semibold text-gray-900">{p.name}</h3>
                {p.highlight && (
                  <span className="rounded border border-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13.5px] text-gray-500">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[32px] font-bold tabular-nums text-gray-900">{p.price}</span>
                <span className="text-[13px] text-gray-500">/mês</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.2} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 w-full h-11 ${
                  p.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                <Link to="/register">Criar conta</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const faqs = [
    { q: "Preciso pagar taxa por pedido?", a: "Não. O Anotô não cobra comissão sobre suas vendas. Você paga apenas o plano." },
    { q: "Funciona para retirada e delivery?", a: "Sim. Você habilita retirada, delivery ou ambos, com bairros e taxas." },
    { q: "Imprime em impressora térmica?", a: "Sim. Suporte a ESC/POS via USB ou rede, com impressão automática." },
    { q: "Como funciona o plano Pro?", a: "Inclui CRM, relatórios detalhados, app instalável e suporte prioritário." },
  ];
  return (
    <section id="faq" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-5 py-24">
        <div className="mb-10">
          <h2 className="text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Perguntas frequentes
          </h2>
        </div>
        <Accordion type="single" collapsible className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-0">
              <AccordionTrigger className="py-5 text-left text-[15.5px] font-semibold text-gray-900 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[14.5px] leading-relaxed text-gray-600">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── Sobre nós ─── */
function AboutSection() {
  return (
    <section id="sobre-nos" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-5 py-24">
        <div className="mb-8">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Sobre nós
          </span>
          <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Feito por quem entende do balcão.
          </h2>
        </div>
        <div className="space-y-5 text-[16px] leading-relaxed text-gray-700">
          <p>
            O Anotô nasceu da rotina real de lanchonetes, açaiterias e pizzarias que
            precisavam de uma ferramenta simples para organizar pedidos sem pagar
            comissão por venda.
          </p>
          <p>
            Nossa missão é dar ao pequeno empreendedor as mesmas armas das grandes
            redes: cardápio digital profissional, controle de caixa confiável e
            impressão automática — tudo em um só lugar, com preço justo.
          </p>
          <p>
            Somos um time enxuto, obcecado por simplicidade e atendimento próximo.
            Quando você cresce, a gente cresce junto.
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="border-t border-gray-200 bg-[#FAFAFA]">
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h2 className="text-[34px] font-bold leading-tight tracking-tight text-gray-900 md:text-[44px]">
          Comece agora. Sem taxa por pedido.
        </h2>
        <Button size="lg" asChild className="mt-8 bg-orange-500 hover:bg-orange-600 text-white text-base px-8 h-12">
          <Link to="/register">Criar conta grátis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
        <p className="mt-4 text-[13.5px] text-gray-500">Leva menos de 2 minutos.</p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <span className="text-sm font-bold" style={{ color: "#FF7A1A" }}>Anotô</span>
        <div className="flex gap-5">
          {["Termos", "Privacidade", "Suporte"].map((l) => (
            <a key={l} href="#" className="text-[12.5px] text-gray-500 hover:text-gray-800 transition">{l}</a>
          ))}
        </div>
        <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Anotô.</p>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <HeroSection />
      <ProofSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <AboutSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
