import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configuration pour l'optimisation
const config = {
  inputDir: './client/public/images/gallery/',  // Dossier des photos originales
  outputDir: './client/public/images/gallery/optimized/',  // Dossier de sortie
  quality: 85,  // Qualité JPEG (85 = excellent compromis)
  width: 1200,   // Largeur maximale pour la galerie
  height: 800   // Hauteur maximale
};

async function optimizeImages() {
  try {
    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    // Lire tous les fichiers du dossier d'entrée
    const files = fs.readdirSync(config.inputDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.includes('optimized')
    );

    console.log(`📸 ${imageFiles.length} images trouvées à optimiser...`);
    console.log(`📁 Dossier source: ${config.inputDir}`);
    console.log(`📁 Dossier destination: ${config.outputDir}`);

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    for (const file of imageFiles) {
      const inputPath = path.join(config.inputDir, file);
      const outputPath = path.join(config.outputDir, file.replace(/\.[^.]+$/i, '.jpg'));

      console.log(`🔄 Optimisation de ${file}...`);

      await sharp(inputPath)
        .resize(config.width, config.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: config.quality,
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);

      // Afficher la réduction de taille
      const originalSize = fs.statSync(inputPath).size;
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

      totalOriginalSize += originalSize;
      totalOptimizedSize += optimizedSize;

      console.log(`✅ ${file}: ${(originalSize/1024/1024).toFixed(1)}MB → ${(optimizedSize/1024).toFixed(0)}KB (-${reduction}%)`);
    }

    const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    
    console.log(`\n🎉 Optimisation terminée !`);
    console.log(`📊 Résumé:`);
    console.log(`   - ${imageFiles.length} images optimisées`);
    console.log(`   - Taille originale: ${(totalOriginalSize/1024/1024).toFixed(1)}MB`);
    console.log(`   - Taille optimisée: ${(totalOptimizedSize/1024).toFixed(0)}KB`);
    console.log(`   - Réduction totale: -${totalReduction}%`);
    console.log(`📁 Images sauvegardées dans: ${config.outputDir}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
  }
}

// Lancer l'optimisation
optimizeImages(); 