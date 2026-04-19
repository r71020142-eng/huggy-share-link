import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BRAND = "#FF7A1A";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="text-base font-bold tracking-tight" style={{ color: BRAND }}>
          Anotô
        </Link>
        <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
          <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar</Link>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <span className="text-sm font-bold" style={{ color: BRAND }}>Anotô</span>
        <div className="flex gap-5">
          <Link to="/sobre-nos" className="text-[12.5px] text-white/50 hover:text-white transition">Sobre Nós</Link>
          <a href="#" className="text-[12.5px] text-white/50 hover:text-white transition">Termos</a>
          <a href="#" className="text-[12.5px] text-white/50 hover:text-white transition">Privacidade</a>
          <a href="#" className="text-[12.5px] text-white/50 hover:text-white transition">Suporte</a>
        </div>
        <p className="text-[12px] text-white/30">© {new Date().getFullYear()} Anotô.</p>
      </div>
    </footer>
  );
}

type Milestone = { year: string; title: string; desc: string };

const MILESTONES: Milestone[] = [
  {
    year: "2022",
    title: "Onde tudo começou",
    desc: "Trabalhando dentro de lanchonetes e açaiterias, vimos de perto o caos: pedidos perdidos, papel rasgado e taxas comendo a margem. Ali nasceu a faísca do Anotô.",
  },
  {
    year: "2023",
    title: "A primeira versão",
    desc: "Lançamos um cardápio digital simples, focado em quem vende todo dia. Sem firula, sem comissão por pedido. O essencial, feito direito.",
  },
  {
    year: "2024",
    title: "Operação completa",
    desc: "Painel de pedidos em tempo real, controle de caixa e impressão automática. O Anotô deixou de ser cardápio e virou a operação inteira do estabelecimento.",
  },
  {
    year: "2025",
    title: "Crescendo junto",
    desc: "Centenas de lojas usando todos os dias, do balcão ao delivery. A gente continua ouvindo, ajustando e construindo lado a lado com quem vende.",
  },
];

function TimelineItem({
  m,
  index,
  active,
  innerRef,
}: {
  m: Milestone;
  index: number;
  active: boolean;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const isLeft = index % 2 === 0;

  return (
    <div ref={innerRef} className="relative md:grid md:grid-cols-2 md:gap-12">
      {/* Dot + year badge on the central line (desktop) */}
      <div className="pointer-events-none absolute left-1/2 top-6 hidden -translate-x-1/2 items-center gap-3 md:flex">
        <span
          className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
            active ? "scale-125 border-orange-400 bg-orange-500 shadow-[0_0_18px_rgba(255,122,26,0.8)]" : "border-white/30 bg-black"
          }`}
        />
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-bold text-white shadow-lg transition-all duration-500 ${
            active ? "scale-110" : "opacity-70"
          }`}
          style={{ backgroundColor: BRAND }}
        >
          {m.year}
        </span>
      </div>

      {/* Mobile dot */}
      <div className="absolute -left-[7px] top-6 flex items-center gap-3 md:hidden">
        <span
          className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-500 ${
            active ? "scale-125 border-orange-400 bg-orange-500 shadow-[0_0_14px_rgba(255,122,26,0.8)]" : "border-white/30 bg-black"
          }`}
        />
      </div>

      {/* Card */}
      <div className={isLeft ? "md:col-start-1 md:pr-12" : "md:col-start-2 md:pl-12"}>
        <div
          className={`relative ml-8 md:ml-0 rounded-2xl border p-6 md:p-7 transition-all duration-500 ${
            active
              ? "border-orange-500/50 bg-gradient-to-b from-orange-500/[0.08] to-transparent shadow-[0_18px_50px_rgba(255,122,26,0.18)] -translate-y-1"
              : "border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.35)] opacity-70"
          }`}
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold text-white md:hidden"
            style={{ backgroundColor: BRAND }}
          >
            {m.year}
          </span>
          <h3 className="mt-3 md:mt-0 text-[20px] md:text-[22px] font-bold tracking-tight text-white">
            {m.title}
          </h3>
          <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">{m.desc}</p>
        </div>
      </div>

      {/* Spacer for alternating side */}
      <div className={isLeft ? "hidden md:block md:col-start-2" : "hidden md:block md:col-start-1"} />
    </div>
  );
}

function TimelineSection() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const wrap = wrapperRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const passed = center - rect.top;
      setProgress(Math.max(0, Math.min(1, passed / rect.height)));

      let best = 0;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActiveIndex(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="relative">
      <div className="mx-auto max-w-5xl px-6 pb-24 md:pb-32">
        <div ref={wrapperRef} className="relative">
          {/* track */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-2 md:left-1/2 md:-translate-x-1/2 w-px bg-white/10"
          />
          {/* progress fill */}
          <div
            aria-hidden
            className="absolute top-0 left-2 md:left-1/2 md:-translate-x-1/2 w-px transition-[height] duration-150"
            style={{
              height: `${progress * 100}%`,
              background: "linear-gradient(to bottom, rgba(255,122,26,0.9), rgba(255,122,26,0.6))",
              boxShadow: "0 0 12px rgba(255,122,26,0.6)",
            }}
          />
          {/* moving dot */}
          <div
            aria-hidden
            className="absolute left-2 md:left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-150"
            style={{ top: `${progress * 100}%` }}
          >
            <span className="block h-5 w-5 rounded-full border-2 border-orange-300 bg-orange-500 shadow-[0_0_22px_rgba(255,122,26,0.9)]" />
          </div>

          <div className="space-y-16 md:space-y-24">
            {MILESTONES.map((m, i) => (
              <TimelineItem
                key={m.year}
                m={m}
                index={i}
                active={i === activeIndex}
                innerRef={(el) => (itemRefs.current[i] = el)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[520px]"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(255,122,26,0.18) 0%, rgba(255,122,26,0.06) 35%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 pt-24 pb-20 md:pt-32 md:pb-24 text-center">
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-[12px] font-semibold"
            style={{ borderColor: "rgba(255,122,26,0.4)", color: BRAND, backgroundColor: "rgba(255,122,26,0.08)" }}
          >
            Nossa Jornada
          </span>
          <h1 className="mt-7 text-[44px] md:text-[68px] font-bold leading-[1.05] tracking-tight">
            A Evolução do{" "}
            <span style={{ color: BRAND }}>Anotô</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[16px] md:text-[18px] leading-relaxed text-white/60">
            Conheça os momentos-chave que definiram nossa trajetória
            e nos trouxeram até aqui.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <TimelineSection />

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-2xl px-6 py-24 md:py-28 text-center">
          <h2 className="text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-tight">
            Quer fazer parte do{" "}
            <span style={{ color: BRAND }}>próximo capítulo?</span>
          </h2>
          <p className="mt-5 text-[16px] md:text-[17px] text-white/55">
            Leva menos de 2 minutos pra começar.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-8 text-white text-base px-8 h-12 hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            <Link to="/register">
              Criar conta grátis <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
