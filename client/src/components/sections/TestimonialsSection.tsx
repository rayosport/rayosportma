import { useState } from "react";
import { useTranslation } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import AnimatedLine from "../ui/AnimatedLine";
import SectionTransition from "../ui/SectionTransition";
import { motion, AnimatePresence } from "framer-motion";

const TestimonialsSection = () => {
  const t = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: t("Le système Rayosport a complètement transformé mes entraînements. Les analyses en temps réel m'ont permis d'améliorer ma technique et d'atteindre de nouveaux records personnels."),
      name: t("Sophie Martin"),
      role: t("Athlète semi-professionnelle"),
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
    },
    {
      quote: t("En tant qu'entraîneur, Rayosport m'a fourni des données précieuses sur les performances de mon équipe. L'interface intuitive rend l'analyse accessible à tous."),
      name: t("Thomas Dubois"),
      role: t("Entraîneur sportif"),
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.5,
    },
    {
      quote: t("La durabilité des produits Rayosport est impressionnante. Après deux ans d'utilisation intensive, ils fonctionnent toujours parfaitement. Un investissement qui en vaut vraiment la peine."),
      name: t("Amina Benali"),
      role: t("Triathlète"),
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      rating: 5,
    },
  ];

  const changeTestimonial = (index: number) => {
    if (index < 0) {
      setCurrentIndex(testimonials.length - 1);
    } else if (index >= testimonials.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(index);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`star-${i}`}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg
          key="half-star"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-star-${i}`}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <SectionTransition>
      <section className="py-20 bg-neutral-100 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <RevealAnimation>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">{t("Témoignages")}</h2>
              <AnimatedLine className="mx-auto" />
              <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
                {t("Ce que nos clients disent de l'expérience Rayosport.")}
              </p>
            </RevealAnimation>
          </div>
          
          <div className="testimonials-slider overflow-hidden relative">
            <RevealAnimation>
              <div className="relative h-[400px] md:h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                  >
                    <div className="max-w-3xl mx-auto">
                      <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="flex">
                            {renderStars(testimonials[currentIndex].rating)}
                          </div>
                        </div>
                        <p className="text-neutral-700 mb-6 italic text-lg">
                          "{testimonials[currentIndex].quote}"
                        </p>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-neutral-200 rounded-full overflow-hidden">
                            <img
                              src={testimonials[currentIndex].avatar}
                              alt={testimonials[currentIndex].name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-bold">{testimonials[currentIndex].name}</h4>
                            <p className="text-sm text-neutral-500">{testimonials[currentIndex].role}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <button
                className="absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10"
                onClick={() => changeTestimonial(currentIndex - 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              
              <button
                className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors z-10"
                onClick={() => changeTestimonial(currentIndex + 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </RevealAnimation>
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-primary" : "bg-neutral-300"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </SectionTransition>
  );
};

export default TestimonialsSection;
