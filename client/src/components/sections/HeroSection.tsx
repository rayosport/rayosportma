import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import AnimatedLine from "@/components/ui/AnimatedLine";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-jetblack overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute opacity-30 right-0 bottom-0 w-3/4 md:w-1/2 h-full">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MzJ8fGZvb3RiYWxsfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60" 
            alt="Football"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-jetblack via-jetblack/80 to-transparent"></div>
        </div>
      </div>
      
      {/* Animated lines */}
      <AnimatedLine className="absolute left-[15%] top-[20%]" bg="bg-rayoblue" />
      <AnimatedLine className="absolute right-[10%] top-[30%]" bg="bg-neongreen" />
      <AnimatedLine className="absolute left-[5%] bottom-[20%]" bg="bg-rayored" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto md:mx-0">
          <RevealAnimation>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              {t("hero_title")} <span className="text-rayoblue">{t("hero_title_highlight")}</span>
            </h1>
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              {t("hero_subtitle")}
            </p>
          </RevealAnimation>
          
          <RevealAnimation delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary">
                {t("hero_cta_primary")}
              </button>
              <button className="btn-outline">
                {t("hero_cta_secondary")}
              </button>
            </div>
          </RevealAnimation>
          
          <RevealAnimation delay={0.6}>
            <div className="mt-12 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                    <img 
                      src={`https://i.pravatar.cc/100?img=${i+10}`}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="ml-4">
                <p className="text-white font-medium">
                  <span className="text-rayoblue font-bold">+2,500</span> {t("hero_community_text")}
                </p>
              </div>
            </div>
          </RevealAnimation>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;