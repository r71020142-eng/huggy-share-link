import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import burguerDoVale from "@/assets/partners/burguer-do-vale.png";
import deliveryDaLu from "@/assets/partners/delivery-da-lu.png";
import kakauPizza from "@/assets/partners/kakau-pizza.png";
import faustinoCarnes from "@/assets/partners/faustino-carnes.png";
import feedbackBurguerDoVale from "@/assets/social-proof/burguer-do-vale-feedback.png";
import feedbackKakauPizza from "@/assets/social-proof/kakau-pizza-feedback.png";

type Shot = { src: string; alt: string };

const SCREENSHOTS: Shot[] = [
  { src: feedbackBurguerDoVale, alt: "Feedback do Burguer do Vale no WhatsApp" },
  { src: feedbackKakauPizza, alt: "Feedback da Kakau Pizza no WhatsApp" },
];

const PARTNERS: Shot[] = [
  { src: burguerDoVale, alt: "Burguer do Vale" },
  { src: deliveryDaLu, alt: "Delivery da Lu" },
  { src: kakauPizza, alt: "Kakau Pizza" },
  { src: faustinoCarnes, alt: "Faustino Casa de Carnes" },
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
            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-10 md:gap-x-16"
              style={{ perspective: "1000px" }}
            >
              {PARTNERS.map((p, i) => (
                <div
                  key={i}
                  className="group relative transition-transform duration-500 ease-out [transform-style:preserve-3d] hover:[transform:rotateX(12deg)_rotateY(-14deg)_translateZ(20px)]"
                >
                  {/* base shadow */}
                  <div
                    aria-hidden
                    className="absolute inset-2 -z-10 rounded-2xl bg-black/30 blur-xl opacity-50 transition-all duration-500 group-hover:opacity-80 group-hover:blur-2xl group-hover:translate-y-3"
                  />
                  {/* glossy backplate */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-100 p-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/5 transition-shadow duration-500 group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,1)]">
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      className="h-20 w-20 md:h-24 md:w-24 object-contain rounded-xl"
                    />
                    {/* highlight sweep */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </div>
                </div>
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
