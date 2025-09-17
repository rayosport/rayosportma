export const UNIVERSITIES = {
  um6ss: {
    name: "Université Mohammed VI des Sciences de la Santé",
    shortName: "UM6SS",
    logo: "/logos/um6ss.jpg",
    colors: {
      primary: "#2563eb",    // Bleu UM6SS
      secondary: "#059669",  // Vert secondaire
      accent: "#dc2626"      // Rouge accent
    },
    csvSuffix: "_UM6SS", // Pour l'avenir, utilise les CSV généraux pour le moment
    contact: {
      whatsapp: "https://chat.whatsapp.com/UM6SS_RAYO",
      email: "rayo@um6ss.ac.ma",
      phone: "+212 5XX-XXX-XXX"
    },
    description: "Partenariat exclusif avec l'Université Mohammed VI des Sciences de la Santé pour l'organisation de matchs internes dédiés à tous les étudiants de l'université.",
    campus: "Casablanca",
    established: "2024",
    totalStudents: "2000+",
    sportsPrograms: [
      "Rayo Classic 5vs5",
      "Rayo Classic 7vs7", 
      "Tournois étudiants",
      "Championnats inter-promotions"
    ]
  }
};

export const getUniversity = (code) => {
  return UNIVERSITIES[code] || null;
};

export const getAllUniversities = () => {
  return Object.entries(UNIVERSITIES).map(([code, data]) => ({
    code,
    ...data
  }));
};