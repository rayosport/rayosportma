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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
          <RevealAnimation delay={0.2}>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1556056504-5c7696c4c28d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9vdGJhbGx8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60" 
                alt="Football match"
                className="w-full h-80 object-cover"
              />
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.4}>
            <div className="flex flex-col justify-center h-full">
              <h3 className="text-2xl font-bold mb-4 text-rayoblue">
                {t("about_mission_title")}
              </h3>
              <p className="text-gray-700 mb-6">
                {t("about_mission_text")}
              </p>
              <h3 className="text-2xl font-bold mb-4 text-rayoblue">
                {t("about_vision_title")}
              </h3>
              <p className="text-gray-700">
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