import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { FaUsers, FaFutbol, FaTrophy, FaMoneyBillWave } from "react-icons/fa";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: <FaUsers className="text-4xl text-rayoblue mb-4" />,
      title: t("how_step1_title"),
      description: t("how_step1_description"),
    },
    {
      icon: <FaFutbol className="text-4xl text-rayoblue mb-4" />,
      title: t("how_step2_title"),
      description: t("how_step2_description"),
    },
    {
      icon: <FaTrophy className="text-4xl text-rayoblue mb-4" />,
      title: t("how_step3_title"),
      description: t("how_step3_description"),
    },
    {
      icon: <FaMoneyBillWave className="text-4xl text-rayoblue mb-4" />,
      title: t("how_step4_title"),
      description: t("how_step4_description"),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container">
        <RevealAnimation>
          <h2 className="section-title text-center">
            {t("how_title")}
          </h2>
          <p className="section-subtitle text-center">
            {t("how_subtitle")}
          </p>
        </RevealAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {steps.map((step, index) => (
            <RevealAnimation key={index} delay={0.2 + index * 0.1}>
              <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all text-center h-full flex flex-col">
                {step.icon}
                <h3 className="text-xl font-bold mb-3 flex-shrink-0">{step.title}</h3>
                <p className="text-gray-600 flex-grow">{step.description}</p>
              </div>
            </RevealAnimation>
          ))}
        </div>

        <RevealAnimation delay={0.6}>
          <div className="mt-16 text-center">
            <button className="btn-primary">
              {t("how_cta_button")}
            </button>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default HowItWorksSection;