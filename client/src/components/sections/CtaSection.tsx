import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";

const CtaSection = () => {
  const { t } = useLanguage();

  return (
    <section id="cta" className="py-20 bg-rayoblue">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center text-white">
          <RevealAnimation>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("cta_title")}
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {t("cta_subtitle")}
            </p>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-rayoblue font-bold rounded-md hover:bg-opacity-90 transition-all transform hover:-translate-y-1 hover:shadow-lg">
                {t("cta_button_primary")}
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-md hover:bg-white hover:text-rayoblue transition-all transform hover:-translate-y-1 hover:shadow-lg">
                {t("cta_button_secondary")}
              </button>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;