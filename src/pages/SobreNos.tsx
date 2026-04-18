import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, Target, Users } from "lucide-react";
import logoLanding from "@/assets/logo-anoto-landing.png";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="text-base font-bold tracking-tight" style={{ color: "#FF7A1A" }}>
          Anotô
        </Link>
        <Button variant="ghost" asChild className="text-gray-700">
          <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar</Link>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <span className="text-sm font-bold" style={{ color: "#FF7A1A" }}>Anotô</span>
        <div className="flex gap-5">
          <Link to="/sobre-nos" className="text-[12.5px] text-gray-500 hover:text-gray-800 transition">Sobre Nós</Link>
          <a href="#" className="text-[12.5px] text-gray-500 hover:text-gray-800 transition">Termos</a>
          <a href="#" className="text-[12.5px] text-gray-500 hover:text-gray-800 transition">Privacidade</a>
          <a href="#" className="text-[12.5px] text-gray-500 hover:text-gray-800 transition">Suporte</a>
        </div>
        <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Anotô.</p>
      </div>
    </footer>
  );
}

export default function SobreNos() {
  const values = [
    { icon: Heart, title: "Feito com cuidado", desc: "Cada detalhe pensado pra rotina real do balcão." },
    { icon: Target, title: "Sem taxa por pedido", desc: "Você paga o plano. Suas vendas são suas." },
    { icon: Users, title: "Próximo de você", desc: "Atendimento humano, sem burocracia." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-24 text-center">
          <img src={logoLanding} alt="Anotô" className="mx-auto w-[260px] md:w-[300px] h-auto object-contain mb-6" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-orange-600">
            Sobre nós
          </span>
          <h1 className="mt-3 text-[36px] md:text-[48px] font-bold leading-[1.1] tracking-tight text-gray-900">
            Feito por quem entende{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4a1d05 0%, #c2410c 35%, #fb923c 55%, #7c2d12 100%)" }}
            >
              do balcão.
            </span>
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-gray-600">
            O Anotô nasceu para dar ao pequeno empreendedor as mesmas armas das grandes redes —
            sem cobrar comissão sobre cada venda.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-[#FAFAFA]">
        <div className="mx-auto max-w-3xl px-5 py-20 space-y-6 text-[16.5px] leading-relaxed text-gray-700">
          <h2 className="text-[26px] font-bold tracking-tight text-gray-900">Nossa história</h2>
          <p>
            Começamos observando lanchonetes, açaiterias e pizzarias se perderem em cadernos,
            grupos de WhatsApp e planilhas. O pedido entrava, mas a organização escapava — e
            com ela, dinheiro, clientes e paciência.
          </p>
          <p>
            Construímos o Anotô para resolver isso de um jeito direto: cardápio digital
            profissional, painel de pedidos em tempo real, controle de caixa confiável e
            impressão automática. Um lugar só. Sem gambiarra.
          </p>
          <p>
            Acreditamos que tecnologia boa é a que some no fluxo do trabalho. Você atende seus
            clientes; o Anotô cuida do resto.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <h2 className="text-[26px] font-bold tracking-tight text-gray-900 mb-10">No que acreditamos</h2>
          <div className="grid gap-px bg-gray-200 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="bg-white p-7">
                <v.icon className="h-6 w-6 text-orange-500" strokeWidth={1.75} />
                <h3 className="mt-5 text-[17px] font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-[#FAFAFA]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight text-gray-900">
            Vamos crescer juntos.
          </h2>
          <Button size="lg" asChild className="mt-6 bg-orange-500 hover:bg-orange-600 text-white text-base px-7 h-12">
            <Link to="/register">Criar conta grátis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
