import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* BLOCO 1 — ABERTURA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pt-28 pb-32 md:pt-40 md:pb-44">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-orange-600">
            Sobre nós
          </span>
          <h1 className="mt-6 text-[40px] md:text-[68px] font-bold leading-[1.05] tracking-tight text-gray-900">
            Criado por quem vive o balcão{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4a1d05 0%, #c2410c 35%, #fb923c 55%, #7c2d12 100%)" }}
            >
              todos os dias.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-[19px] md:text-[22px] leading-relaxed text-gray-600">
            O Anotô nasceu pra resolver o caos de pedidos, sistemas quebrados
            e taxas que só atrapalham quem quer vender.
          </p>
        </div>
      </section>

      {/* BLOCO 2 — HISTÓRIA */}
      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-28 md:py-40">
          <div className="space-y-8 text-[20px] md:text-[24px] leading-[1.55] text-gray-900 font-medium">
            <p>Quem tem lanchonete ou delivery sabe como é.</p>
            <p className="text-gray-600">
              Pedido chegando em vários lugares, anotação no papel,
              erro na cozinha, taxa em cima de taxa.
            </p>
            <p className="text-orange-600">A gente cansou disso.</p>
            <p className="text-gray-600">
              O Anotô foi criado pra resolver exatamente esse problema:
              centralizar tudo, simplificar a operação e deixar você focar
              no que realmente importa — <span className="text-gray-900 font-semibold">vender.</span>
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 3 — POSICIONAMENTO */}
      <section className="border-t border-gray-100 bg-[#FAFAFA]">
        <div className="mx-auto max-w-2xl px-6 py-28 md:py-40">
          <h2 className="text-[36px] md:text-[56px] font-bold leading-[1.05] tracking-tight text-gray-900">
            Simples de verdade.
          </h2>
          <div className="mt-10 space-y-5 text-[20px] md:text-[24px] leading-[1.5] text-gray-700">
            <p>Sem integrações frágeis.</p>
            <p>Sem múltiplos sistemas.</p>
            <p>Sem gambiarra.</p>
          </div>
          <p className="mt-12 text-[20px] md:text-[24px] leading-[1.5] text-gray-900 font-medium">
            Um único lugar pra cuidar do seu cardápio, pedidos e caixa.
          </p>
          <p className="mt-6 text-[18px] md:text-[20px] leading-relaxed text-gray-500">
            Do jeito que deveria ser desde o começo.
          </p>
        </div>
      </section>

      {/* BLOCO 4 — FECHAMENTO + CTA */}
      <section className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-28 md:py-40 text-center">
          <h2 className="text-[36px] md:text-[56px] font-bold leading-[1.05] tracking-tight text-gray-900">
            Se é pra simplificar,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #4a1d05 0%, #c2410c 35%, #fb923c 55%, #7c2d12 100%)" }}
            >
              começa agora.
            </span>
          </h2>
          <p className="mt-6 text-[17px] md:text-[19px] text-gray-500">
            Leva menos de 2 minutos pra começar.
          </p>
          <Button
            size="lg"
            asChild
            className="mt-10 bg-orange-500 hover:bg-orange-600 text-white text-base px-8 h-12"
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
