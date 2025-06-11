import { useTranslation } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import AnimatedLine from "../ui/AnimatedLine";
import ParallaxImage from "../ui/ParallaxImage";
import SectionTransition from "../ui/SectionTransition";
import { useCounter } from "@/hooks/use-counter";

const ConceptSection = () => {
  const t = useTranslation();
  const counter = useCounter(85);

  const conceptFeatures = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t("Performance optimisée"),
      description: t("Nos solutions sont conçues pour améliorer vos performances athlétiques grâce à des analyses avancées et un équipement de pointe."),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      title: t("Modularité complète"),
      description: t("Une approche entièrement adaptable qui s'ajuste à vos besoins spécifiques, quel que soit votre niveau ou discipline."),
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t("Développement durable"),
      description: t("Une conception respectueuse de l'environnement avec des matériaux recyclés et une empreinte carbone minimale."),
    },
  ];

  return (
    <SectionTransition>
      <section id="concept" className="py-20 bg-neutral-100 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <RevealAnimation>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("Notre Concept")}</h2>
              <AnimatedLine className="mx-auto" />
              <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
                {t("Une approche révolutionnaire qui associe technologie, performance et design pour créer une expérience sportive unique.")}
              </p>
            </RevealAnimation>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <RevealAnimation delay={0.1}>
                <ParallaxImage
                  src="https://images.unsplash.com/photo-1517963628607-235ccdd5476c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                  alt="Rayosport concept"
                  className="w-full h-auto rounded-lg shadow-xl"
                  speed={0.05}
                />
                <div className="absolute -top-6 -right-6 bg-primary text-white p-6 rounded-lg shadow-lg hidden md:block">
                  <RevealAnimation delay={0.2}>
                    <p className="text-3xl font-bold">{counter}%</p>
                    <p className="text-sm">{t("% de satisfaction")}</p>
                  </RevealAnimation>
                </div>
              </RevealAnimation>
            </div>
            
            <div>
              <RevealAnimation delay={0.2}>
                <h3 className="text-3xl font-bold mb-6 text-primary">{t("L'essence de Rayosport")}</h3>
                <p className="text-lg mb-6 text-neutral-700">
                  {t("Rayosport représente une fusion parfaite entre innovation technologique et excellence sportive. Notre concept redéfinit les limites de la performance tout en offrant une expérience utilisateur incomparable.")}
                </p>
                
                <div className="grid grid-cols-1 gap-6 mt-8">
                  {conceptFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start hover:scale-105 transition-transform duration-300 h-full">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="ml-4 flex-grow">
                        <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                        <p className="text-neutral-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RevealAnimation>
            </div>
          </div>
        </div>
      </section>
    </SectionTransition>
  );
};

export default ConceptSection;
