import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "../ui/RevealAnimation";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight, FaEye } from "react-icons/fa";

const GallerySection = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Photos Rayo Sport - Images optimisées (98.9% de réduction de taille)
  // Originales: 96.1MB → Optimisées: 1.1MB
  const galleryImages = [
    {
      id: 1,
      src: "/images/gallery/optimized/7I7A9374.jpg",
      alt: "7I7A9374 - Match Rayo Sport",
      category: "Matchs",
      description: "Action de jeu intense - Photo professionnelle Rayo Sport"
    },
    {
      id: 2,
      src: "/images/gallery/optimized/7I7A9381.jpg",
      alt: "7I7A9381 - Équipe Rayo Sport",
      category: "Équipes",
      description: "Formation d'équipe avant le coup d'envoi"
    },
    {
      id: 3,
      src: "/images/gallery/optimized/7I7A9414.jpg",
      alt: "7I7A9414 - Terrain Rayo Sport",
      category: "Terrains",
      description: "Vue panoramique du terrain de jeu"
    },
    {
      id: 4,
      src: "/images/gallery/optimized/7I7A9416.jpg",
      alt: "7I7A9416 - Action de match",
      category: "Matchs",
      description: "Moment fort d'un match Rayo Sport"
    },
    {
      id: 5,
      src: "/images/gallery/optimized/7I7A9421.jpg",
      alt: "7I7A9421 - Célébration Rayo Sport",
      category: "Célébrations",
      description: "Joie et célébration après un but"
    },
    {
      id: 6,
      src: "/images/gallery/optimized/7I7A9435.jpg",
      alt: "7I7A9435 - Communauté Rayo Sport",
      category: "Communauté",
      description: "L'esprit d'équipe de la communauté Rayo Sport"
    },
    {
      id: 7,
      src: "/images/gallery/optimized/7I7A9437.jpg",
      alt: "7I7A9437 - Technique de jeu",
      category: "Technique",
      description: "Démonstration technique lors d'un match"
    },
    {
      id: 8,
      src: "/images/gallery/optimized/7I7A9438.jpg",
      alt: "7I7A9438 - Ambiance Rayo Sport",
      category: "Ambiance",
      description: "L'atmosphère unique des matchs Rayo Sport"
    }
  ];

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    if (selectedImage === null) return;
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex].id);
  };

  const prevImage = () => {
    if (selectedImage === null) return;
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage);
    const prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    setSelectedImage(galleryImages[prevIndex].id);
  };

  const selectedImageData = galleryImages.find(img => img.id === selectedImage);

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <RevealAnimation>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gray-900">{t("gallery_title")}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("gallery_subtitle")}
            </p>
          </div>
        </RevealAnimation>

        {/* Grille de photos */}
        <RevealAnimation delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="text-sm font-medium text-rayoblue mb-1">
                      {image.category}
                    </div>
                    <p className="text-sm opacity-90">
                      {image.description}
                    </p>
                  </div>
                  
                  {/* Bouton voir */}
                  <button
                    onClick={() => openLightbox(image.id)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors duration-300"
                  >
                    <FaEye className="h-6 w-6 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </RevealAnimation>

        {/* Bouton voir plus */}
        <RevealAnimation delay={0.4}>
          <div className="text-center mt-12">
            <a
              href="https://drive.google.com/drive/folders/1Ct6LGKEcqz8jlKQdWJYP3K2H0R_oqHwI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rayoblue to-blue-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-rayoblue transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t("gallery_view_more")}
            </a>
          </div>
        </RevealAnimation>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && selectedImageData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Bouton fermer */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaTimes className="h-8 w-8" />
            </button>

            {/* Navigation précédent */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaChevronLeft className="h-8 w-8" />
            </button>

            {/* Navigation suivant */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaChevronRight className="h-8 w-8" />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-7xl max-h-[90vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImageData.src}
                alt={selectedImageData.alt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Info image */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-rayoblue font-medium mb-1">
                    {selectedImageData.category}
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {selectedImageData.alt}
                  </p>
                  <p className="text-sm opacity-90">
                    {selectedImageData.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection; 