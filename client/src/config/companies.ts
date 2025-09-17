export const COMPANIES = {
  "demo-entreprise": {
    name: "Démo Entreprise",
    shortName: "Démo Entreprise",
    logo: "/logos/demo-entreprise.png", // À ajouter plus tard
    colors: {
      primary: "#6366f1",    // Violet tech moderne
      secondary: "#10b981",  // Vert tech
      accent: "#f59e0b"      // Orange innovation
    },
    csvSuffix: "_DEMO", // Pour l'avenir, utilise les CSV généraux pour le moment
    contact: {
      whatsapp: "https://chat.whatsapp.com/DEMO_RAYO",
      email: "rayo@demo-entreprise.com",
      phone: "+212 5XX-XXX-XXX"
    },
    description: "Exemple concret d'intégration Rayo Entreprise pour une startup tech innovante. Découvrez comment nous organisons des programmes sportifs adaptés aux équipes tech modernes.",
    sector: "Technologie & Innovation",
    location: "Casablanca Tech City",
    established: "2024",
    totalEmployees: "150+",
    sportsPrograms: [
      "Rayo Classic 5vs5",
      "Rayo Classic 7vs7", 
      "Tournois dev vs design",
      "Team Building sportif",
      "Défis inter-équipes"
    ]
  },
  "nemo": {
    name: "Nemo Technology",
    shortName: "Nemo Technology",
    logo: "/logos/nemo.png",
    colors: {
      primary: "#1e40af",    // Bleu Nemo
      secondary: "#059669",  // Vert secondaire
      accent: "#f59e0b"      // Orange accent
    },
    csvSuffix: "_NEMO",
    customDataSources: {
      upcomingMatches: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFyx6wEcQHksxKCP0bxSmvjurCngzeq0QS4t8yaAFQptqkTtgWbr59CAw-wsPS-J4a8qv74vpsxkl4/pub?gid=216631647&output=csv",
      pastGames: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFyx6wEcQHksxKCP0bxSmvjurCngzeq0QS4t8yaAFQptqkTtgWbr59CAw-wsPS-J4a8qv74vpsxkl4/pub?gid=876296498&output=csv",
      leaderboard: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFyx6wEcQHksxKCP0bxSmvjurCngzeq0QS4t8yaAFQptqkTtgWbr59CAw-wsPS-J4a8qv74vpsxkl4/pub?gid=1779046147&output=csv"
    },
    contact: {
      whatsapp: "https://chat.whatsapp.com/NEMO_RAYO",
      email: "rayo@nemo.ma",
      phone: "+212 6XX-XXX-XXX"
    },
    description: "Programme sportif corporate avec Nemo pour promouvoir la cohésion d'équipe et le bien-être des collaborateurs à travers le sport.",
    sector: "Technologie & Innovation",
    location: "Casablanca",
    established: "2024",
    totalEmployees: "100+",
    sportsPrograms: [
      "Rayo Classic 5vs5",
      "Rayo Classic 7vs7",
      "Tournois inter-équipes",
      "Challenge annuel Nemo"
    ]
  }
};

export const getCompany = (code: string) => {
  return COMPANIES[code as keyof typeof COMPANIES] || null;
};

export const getAllCompanies = () => {
  return Object.entries(COMPANIES).map(([code, data]) => ({
    code,
    ...data
  }));
};