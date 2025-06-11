import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";

const AboutSection = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container">
        <RevealAnimation>
          <h2 className="section-title text-center">
            {t("about_title")}
          </h2>
          <p className="section-subtitle text-center">
            {t("about_subtitle")}
          </p>
        </RevealAnimation>

        <div className="flex flex-col md:flex-row gap-8 mt-12">
          <RevealAnimation delay={0.2}>
            <div className="bg-gray-50 rounded-lg p-8 shadow-md hover:shadow-xl transition-all flex-1 flex flex-col">
              <h3 className="text-2xl font-bold mb-4 text-rayoblue">
                {t("about_concept_title")}
              </h3>
              <p className="text-gray-700 flex-grow">
                {t("about_concept_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <div className="bg-gray-50 rounded-lg p-8 shadow-md hover:shadow-xl transition-all flex-1 flex flex-col">
              <h3 className="text-2xl font-bold mb-4 text-rayoblue">
                {t("about_mission_title")}
              </h3>
              <p className="text-gray-700 flex-grow">
                {t("about_mission_text")}
              </p>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.4}>
            <div className="bg-gray-50 rounded-lg p-8 shadow-md hover:shadow-xl transition-all flex-1 flex flex-col">
              <h3 className="text-2xl font-bold mb-4 text-rayoblue">
                {t("about_vision_title")}
              </h3>
              <p className="text-gray-700 flex-grow">
                {t("about_vision_text")}
              </p>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;