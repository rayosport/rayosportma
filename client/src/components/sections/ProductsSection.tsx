import { useTranslation } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import AnimatedLine from "../ui/AnimatedLine";
import SectionTransition from "../ui/SectionTransition";

const ProductsSection = () => {
  const t = useTranslation();

  const products = [
    {
      image: "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      title: t("RayoRun Pro"),
      description: t("Équipement de course haute performance avec analyse de foulée intégrée et retour en temps réel."),
      delay: 0,
    },
    {
      image: "https://images.unsplash.com/photo-1672906674627-dee705b77d99?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      title: t("RayoTrack System"),
      description: t("Système de suivi complet pour les entraînements collectifs avec données synchronisées."),
      delay: 0.1,
    },
    {
      image: "https://images.unsplash.com/photo-1615117600767-f3496ecf1d5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1501&q=80",
      title: t("RayoRecover"),
      description: t("Solution de récupération avancée avec technologie de stimulation musculaire et analyse des données."),
      delay: 0.2,
    },
  ];

  return (
    <SectionTransition>
      <section id="products" className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <RevealAnimation>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("Nos Produits")}</h2>
              <AnimatedLine className="mx-auto" />
              <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
                {t("Découvrez notre gamme de produits innovants conçus pour transformer votre expérience sportive.")}
              </p>
            </RevealAnimation>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <RevealAnimation key={index} delay={product.delay}>
                <div className="bg-neutral-100 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 h-full flex flex-col">
                  <div className="h-60 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                    <p className="text-neutral-600 mb-4 flex-grow">{product.description}</p>
                    <a href="#" className="text-primary font-semibold flex items-center mt-auto">
                      <span>{t("En savoir plus")}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </RevealAnimation>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <RevealAnimation>
              <a
                href="#"
                className="inline-block bg-secondary text-white px-8 py-3 rounded-md font-semibold hover:bg-opacity-90 transition-all transform hover:-translate-y-1 hover:shadow-lg"
              >
                {t("Voir tous les produits")}
              </a>
            </RevealAnimation>
          </div>
        </div>
      </section>
    </SectionTransition>
  );
};

export default ProductsSection;
