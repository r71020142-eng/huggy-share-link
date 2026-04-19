import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import burguerDoVale from "@/assets/partners/burguer-do-vale.png";

type Shot = { src: string; alt: string };

const SCREENSHOTS: Shot[] = [];

const PARTNERS: Shot[] = [
  { src: burguerDoVale, alt: "Burguer do Vale" },
];

export default function SocialProofSection() {
  const [openSrc, setOpenSrc] = useState<string | null>(null);

  return (
    <section id="prova-social" className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-24">
        {/* Header */}
        <div className="mb-12 max-w-2xl">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Prova social
          </span>
          <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Histórias reais de quem já usa.
          </h2>
          <p className="mt-3 text-[16px] text-gray-600">
            Prints de conversas, resultados e lojas que confiam no Anotô todo dia.
          </p>
        </div>

        {/* Screenshots grid */}
        {SCREENSHOTS.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {SCREENSHOTS.map((s, i) => (
              <button
                key={i}
                onClick={() => setOpenSrc(s.src)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-[13.5px] text-gray-500">
            Adicione seus prints em <code>src/assets/social-proof/</code> e
            registre-os no array <code>SCREENSHOTS</code> de
            <code>SocialProofSection.tsx</code>.
          </div>
        )}

        {/* Partners */}
        <div className="mt-20">
          <p className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Lojas que já usam o Anotô
          </p>
          {PARTNERS.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
              {PARTNERS.map((p, i) => (
                <img
                  key={i}
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="h-10 w-auto object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-12"
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-[13.5px] text-gray-500">
              Adicione as logos em <code>src/assets/partners/</code> e
              registre-as no array <code>PARTNERS</code>.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!openSrc} onOpenChange={(o) => !o && setOpenSrc(null)}>
        <DialogContent className="max-w-3xl border-0 bg-black p-0">
          {openSrc && (
            <img src={openSrc} alt="Print" className="h-auto w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
