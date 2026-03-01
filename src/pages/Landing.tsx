import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import {
  QrCode, ShoppingCart, ClipboardList, Monitor, MapPin, Printer, Users, BarChart3,
  Zap, LayoutList, CheckCircle2, Star, ChevronRight, Smartphone, ArrowRight
} from "lucide-react";
import heroDevices from "@/assets/hero-devices.png";
import logoLanding from "@/assets/logo-anoto-landing.png";

/* ─── Header ─── */
function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center">
          <img src={logoLanding} alt="Anotô" className="h-16 w-auto object-contain" />
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
        <div className="space-y-6">
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
        </div>

        {/* Hero image */}
        <div className="flex justify-center">
          <img src={heroDevices} alt="Anotô em notebook, tablet e celular" className="w-full max-w-lg h-auto object-contain" />
        </div>
      </div>
    </section>
  );
}

/* ─── Benefícios ─── */
function BenefitsSection() {
  const benefits = [
    { icon: Zap, title: "Receba pedidos sem taxas por pedido", desc: "Diferente dos marketplaces, você não paga comissão sobre vendas." },
    { icon: LayoutList, title: "Organize pedidos em Kanban", desc: "Acompanhe cada pedido: pendente → preparando → entregando → concluído." },
    { icon: Printer, title: "Impressão térmica automática", desc: "Imprima pedidos direto na cozinha com impressoras ESC/POS." },
  ];
  return (
    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
        {benefits.map((b, i) => (
          <Card key={i} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-start gap-3 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                <b.icon className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{b.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ─── Funcionalidades ─── */
function FeaturesSection() {
  const features = [
    { icon: QrCode, label: "Cardápio público por link / QR Code" },
    { icon: ShoppingCart, label: "Carrinho e checkout" },
    { icon: ClipboardList, label: "Gestão de pedidos (status)" },
    { icon: Monitor, label: "PDV / Caixa" },
    { icon: MapPin, label: "Bairros e taxa de entrega" },
    { icon: Printer, label: "Impressão térmica" },
    { icon: Users, label: "CRM de clientes", pro: true },
    { icon: BarChart3, label: "Relatórios e métricas", pro: true },
  ];
  return (
    <section id="funcionalidades" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Tudo que você precisa para vender mais</h2>
          <p className="mt-3 text-gray-600">Funcionalidades pensadas para o dia a dia do seu negócio.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <f.icon className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                {f.pro && <Badge className="mt-1 bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] border-orange-200">Pro</Badge>}
              </div>
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
    { num: "1", title: "Crie sua loja", desc: "Cadastre-se em menos de 2 minutos e personalize seu perfil." },
    { num: "2", title: "Monte o cardápio", desc: "Adicione categorias, produtos, fotos e preços." },
    { num: "3", title: "Comece a receber pedidos", desc: "Compartilhe o link do cardápio e receba pedidos em tempo real." },
  ];
  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Como funciona</h2>
          <p className="mt-3 text-gray-600">Três passos para colocar seu negócio online.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-xl font-extrabold text-white">
                {s.num}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              {i < 2 && <ChevronRight className="mx-auto mt-4 hidden h-5 w-5 text-gray-300 md:block rotate-90 md:rotate-0" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Prova social ─── */
function TestimonialsSection() {
  const testimonials = [
    { name: "Carlos M.", biz: "Lanchonete", text: "Antes eu anotava tudo no papel. Agora recebo os pedidos organizados no celular e imprimo direto na cozinha." },
    { name: "Ana P.", biz: "Açaiteria", text: "Meus clientes adoram pedir pelo cardápio digital. Montei tudo sozinha em uma tarde." },
    { name: "Roberto S.", biz: "Pizzaria", text: "O caixa integrado me ajudou a ter controle real do meu faturamento. Recomendo." },
  ];
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">O que dizem nossos clientes</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-3 flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-sm text-gray-700 italic leading-relaxed">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.biz}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
