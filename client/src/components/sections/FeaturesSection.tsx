import { useTranslation } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import AnimatedLine from "../ui/AnimatedLine";
import SectionTransition from "../ui/SectionTransition";

const FeaturesSection = () => {
  const t = useTranslation();

  const features = [
    {
      title: t("Intelligence Adaptative"),
      description: t("Nos systèmes apprennent de vos performances et s'adaptent automatiquement pour optimiser vos entraînements."),
    },
    {
      title: t("Écosystème Connecté"),
      description: t("Une intégration transparente entre tous nos produits pour une expérience unifiée et des données centralisées."),
    },
    {
      title: t("Analyse Prédictive"),
      description: t("Anticipez les risques de blessures et optimisez votre progression grâce à nos algorithmes avancés."),
    },
    {
      title: t("Design Ergonomique"),
      description: t("Conçu pour s'intégrer naturellement à votre routine sportive sans perturber vos mouvements."),
    },
  ];

  return (
    <SectionTransition>
      <section id="features" className="py-20 bg-secondary text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <RevealAnimation>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("Caractéristiques Principales")}</h2>
              <AnimatedLine className="mx-auto bg-primary" />
              <p className="text-xl text-neutral-200 max-w-3xl mx-auto">
                {t("Ce qui distingue Rayosport et en fait le choix préféré des athlètes professionnels.")}
              </p>
            </RevealAnimation>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <RevealAnimation delay={0.1}>
                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80"
                    alt="Rayosport features video"
                    className="w-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-white font-medium">
                      {t("Découvrez comment Rayosport transforme l'expérience sportive")}
                    </p>
                  </div>
                </div>
              </RevealAnimation>
            </div>
            
            <div className="space-y-8">
              <RevealAnimation delay={0.2}>
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start border-l-4 border-primary pl-6 hover:bg-white/5 p-4 rounded-r-lg transition-colors"
                  >
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-neutral-300">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </RevealAnimation>
            </div>
          </div>
        </div>
      </section>
    </SectionTransition>
  );
};

export default FeaturesSection;
