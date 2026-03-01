import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  QrCode, ShoppingCart, ClipboardList, Monitor, MapPin, Printer, Users, BarChart3,
  Zap, LayoutList, CheckCircle2, Star, ChevronRight, Smartphone, ArrowRight
} from "lucide-react";
import heroDevices from "@/assets/hero-devices.png";
import logoLanding from "@/assets/logo-anoto-landing.png";
import logoIcon from "@/assets/logo-icon.png";
import benefitZeroTaxa from "@/assets/benefit-zero-taxa.png";
import benefitKanban from "@/assets/benefit-kanban.png";
import benefitPrinter from "@/assets/benefit-printer.png";

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
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 md:py-28">
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
            Cardápio digital + pedidos + caixa,{" "}
            <span style={{ color: "#1e40af" }}>tudo em um só lugar</span>
          </h1>
          <p className="max-w-md text-lg text-gray-600">
            Crie seu cardápio online, receba pedidos pelo celular, organize na cozinha e feche o caixa sem pagar taxa por pedido.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white text-base px-8">
              <Link to="/register">Começar grátis <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
      img: benefitZeroTaxa,
      title: "Zero taxa por pedido",
      desc: "Você fica com 100% do valor de cada venda. Sem comissões escondidas, sem surpresas no final do mês.",
      accent: "#FF7A1A",
    },
    {
      img: benefitKanban,
      title: "Pedidos organizados",
      desc: "Painel Kanban em tempo real. Veja o fluxo completo do pedido, da entrada à entrega, sem perder nada.",
      accent: "#1e40af",
    },
    {
      img: benefitPrinter,
      title: "Impressão automática",
      desc: "Pedido chegou, já imprime na cozinha. Compatível com impressoras térmicas ESC/POS via USB ou rede.",
      accent: "#7c3aed",
    },
  ];

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)",
      }}
    >
      {/* Decorative blurred circles */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            Por que escolher o Anotô
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
            Feito para quem vive o dia a dia do balcão
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div key={i} className="group flex flex-col overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/15 hover:-translate-y-1" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.15 }}>
              <div className="flex items-center justify-center bg-white/5 p-6">
                <img src={p.img} alt={p.title} className="h-44 w-auto object-contain" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{p.desc}</p>
                <div className="mt-5 h-1 w-12 rounded-full" style={{ backgroundColor: p.accent }} />
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
  const features = [
    { icon: QrCode, label: "Cardápio por link & QR Code", desc: "Compartilhe e seus clientes pedem pelo celular." },
    { icon: ShoppingCart, label: "Carrinho e checkout", desc: "Experiência de compra rápida e intuitiva." },
    { icon: ClipboardList, label: "Gestão de pedidos", desc: "Status em tempo real para sua equipe." },
    { icon: Monitor, label: "PDV / Caixa", desc: "Controle financeiro completo do seu dia." },
    { icon: MapPin, label: "Bairros e entregas", desc: "Taxas por região, automáticas no checkout." },
    { icon: Printer, label: "Impressão térmica", desc: "Integração direta com impressoras ESC/POS." },
    { icon: Users, label: "CRM de clientes", desc: "Conheça quem compra de você.", pro: true },
    { icon: BarChart3, label: "Relatórios", desc: "Métricas para decisões inteligentes.", pro: true },
  ];

  return (
    <section id="funcionalidades" className="bg-gray-50/70 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF7A1A" }}>
            Funcionalidades
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Tudo que você precisa, num só sistema
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md hover:border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <f.icon className="h-5 w-5 text-blue-700" />
              </div>
              <p className="text-[15px] font-semibold text-gray-900">{f.label}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-400">{f.desc}</p>
              {f.pro && (
                <Badge className="mt-3 w-fit bg-orange-50 text-orange-600 hover:bg-orange-50 text-[10px] font-bold border-orange-200 uppercase tracking-wide">
                  Pro
                </Badge>
              )}
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
    { num: "01", title: "Crie sua loja", desc: "Cadastre-se em menos de 2 minutos e personalize seu perfil.", color: "#FF7A1A" },
    { num: "02", title: "Monte o cardápio", desc: "Adicione categorias, produtos, fotos e preços.", color: "#1e40af" },
    { num: "03", title: "Receba pedidos", desc: "Compartilhe o link e receba pedidos em tempo real.", color: "#7c3aed" },
  ];
  return (
    <section id="como-funciona" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF7A1A" }}>
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Três passos para começar a vender
          </h2>
        </div>

        <div className="relative grid gap-0 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute top-12 left-[16.6%] right-[16.6%] hidden h-0.5 bg-gradient-to-r from-orange-300 via-blue-300 to-purple-300 md:block" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="relative flex flex-col items-center text-center px-8 py-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div
                className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-lg"
                style={{ backgroundColor: s.color }}
              >
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{s.title}</h3>
              <p className="mt-3 max-w-[240px] text-[15px] leading-relaxed text-gray-500">{s.desc}</p>
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
    { name: "Carlos M.", biz: "Dono de Lanchonete", text: "Antes eu anotava tudo no papel e perdia pedidos. Agora recebo tudo organizado no celular e imprimo direto na cozinha. Meus clientes notaram a diferença.", avatar: "C" },
    { name: "Ana P.", biz: "Dona de Açaiteria", text: "Montei meu cardápio digital sozinha em uma tarde. Meus clientes adoram pedir pelo celular, e minhas vendas cresceram 40% no primeiro mês.", avatar: "A" },
    { name: "Roberto S.", biz: "Dono de Pizzaria", text: "O caixa integrado me deu controle real do faturamento. Antes eu não sabia quanto entrava por dia. Hoje tenho clareza total.", avatar: "R" },
  ];
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)" }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF7A1A" }}>
            Depoimentos
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Quem usa, recomenda
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="relative flex flex-col rounded-2xl bg-white p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Quote mark */}
              <span className="absolute -top-3 left-6 text-5xl font-serif leading-none" style={{ color: "#FF7A1A", opacity: 0.3 }}>"</span>

              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-orange-400 text-orange-400" />
                ))}
              </div>

              <p className="flex-1 text-[15px] text-gray-600 leading-relaxed">{t.text}</p>

              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #FF7A1A, #7c3aed)" }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.biz}</p>
                </div>
              </div>
            </motion.div>
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
      name: "Basic",
      price: "Grátis",
      desc: "Para quem está começando",
      features: ["Cardápio digital ilimitado", "Pedidos online", "PDV / Caixa", "Bairros e taxas", "Impressão térmica"],
      cta: "Começar grátis",
      highlight: false,
    },
    {
      name: "Pro",
      price: "Em breve",
      desc: "Para quem quer crescer",
      features: ["Tudo do Basic", "CRM de clientes", "Relatórios e métricas", "Prioridade no suporte", "Funcionalidades exclusivas"],
      cta: "Assinar Pro",
      highlight: true,
    },
  ];
  return (
    <section id="planos" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Planos</h2>
          <p className="mt-3 text-gray-600">Escolha o plano ideal para o seu negócio.</p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {plans.map((p, i) => (
            <Card key={i} className={`relative overflow-hidden shadow-sm ${p.highlight ? "border-2 border-blue-700 shadow-md" : "border-gray-200"}`}>
              {p.highlight && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-700 px-3 py-1 text-xs font-bold text-white">
                  Popular
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">{p.name}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-extrabold text-gray-900">{p.price}</p>
                <ul className="space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className={`w-full ${p.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white"}`}>
                  <Link to="/register">{p.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
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
    <section id="faq" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-gray-200 bg-white px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── CTA Final ─── */
function FinalCTASection() {
  return (
    <section className="bg-blue-700 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-extrabold text-white">Pronto para digitalizar seu negócio?</h2>
        <p className="mt-3 text-blue-100">Crie sua conta gratuita e comece a receber pedidos em minutos.</p>
        <Button size="lg" asChild className="mt-6 bg-orange-500 hover:bg-orange-600 text-white text-base px-8">
          <Link to="/register">Começar grátis <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:text-left">
        <img src={logoLanding} alt="Anotô" className="h-8 w-auto object-contain" />
        <div className="flex gap-6">
          {["Termos de uso", "Privacidade", "Suporte"].map((l) => (
            <a key={l} href="#" className="text-xs text-gray-500 hover:text-gray-700 transition">{l}</a>
          ))}
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Anotô. Todos os direitos reservados.</p>
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
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
