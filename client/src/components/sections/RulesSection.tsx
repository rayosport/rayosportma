import React, { useEffect } from 'react';
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { 
  FaFutbol, 
  FaClock, 
  FaHandPaper, 
  FaUserShield, 
  FaTshirt, 
  FaRunning, 
  FaStar, 
  FaExclamationTriangle 
} from "react-icons/fa";

const RulesSection = () => {
  const { language } = useLanguage();
  
  console.log('📋 RulesSection: Current language is:', language);
  console.log('📋 RulesSection: Language type check:', typeof language, language === 'ar');
  console.log('📋 RulesSection: Language trimmed equals ar:', language?.toString().trim() === 'ar');

  // Contenu en fonction de la langue
  const content = (language?.toString().trim() === 'ar') ? {
    title: "قواعد اللعبة",
    subtitle: "هل أنت جاهز لتسجيل هدف والبقاء في الملعب؟",
    gameFormat: {
      title: "⚔️ صيغة اللعب: رايو كلاش",
      rules: [
        "3 فرق في كل جلسة",
        "تستمر كل مباراة 5 دقائق أو تنتهي عندما يسجل فريق 3 أهداف",
        "الفريق الخاسر يخرج، ويدخل الفريق الثالث",
        "في حالة التعادل، يبقى آخر فريق وصل",
        "لا يوجد حارس مرمى",
        "لا توجد ركلات جزاء",
        "لا يوجد تسلل"
      ]
    },
    gameRules: {
      title: "⚽ قواعد اللعب",
      rules: [
        "يجب تسجيل جميع الأهداف من منتصف الملعب أو أبعد",
        "يتم استئناف اللعب (رمية تماس، خطأ، ركنية) بالقدم",
        "يمكن التسجيل من ركلة ركنية، ولكن ليس من رمية تماس",
        "بعد الهدف، يُستأنف اللعب من المنتصف، على بعد متر واحد من الخط",
        "إذا منعت يد أو خطأ متعمد هدفاً واضحاً → يُحتسب الهدف مباشرة"
      ]
    },
    killerGoal: {
      title: "💥 الهدف القاتل",
      rules: [
        "إذا كان الهدف الأول في المباراة هو تسديدة طائرة من لمسة واحدة (على تمريرة هوائية بدون ارتداد)، تتوقف المباراة فوراً ويفوز الفريق."
      ]
    },
    fairPlay: {
      title: "🧤 السلوك واللعب النظيف",
      rules: [
        "احترام اللاعبين الآخرين، القائد، والأجواء",
        "لن يتم التسامح مع أي إهانة أو عنف أو سلوك غير رياضي",
        "الكثير من الغيابات دون إبلاغ = بطاقة حمراء (عقوبات محتملة)"
      ]
    },
    equipment: {
      title: "👟 المعدات",
      rules: [
        "ملابس رياضية إلزامية",
        "أحذية مناسبة للعشب الاصطناعي (⚠️ لا مسامير ملولبة)",
        "يتم توفير الكرات والصدريات",
        "غرف تبديل الملابس والاستحمام متوفرة حسب الملعب"
      ]
    },
    punctuality: {
      title: "⏰ الانضباط",
      rules: [
        "احضر قبل 10 إلى 15 دقيقة من بداية المباراة",
        "في حالة التأخر أو الغياب دون إشعار، يمكن إعطاء مكانك للاعب آخر"
      ]
    },
    captain: {
      title: "🧑‍⚖️ القائد",
      rules: [
        "يشرف على كل مباراة قائد رايو",
        "هو المسؤول عن احترام القواعد، وحسن سير اللعبة، وتسجيل الإحصائيات",
        "يجب احترام قراراته دون جدال"
      ]
    },
    finalCta: "هل أنت جاهز للتألق؟",
    finalTagline: "العب. سجل. ابق في الملعب."
  } : {
    title: "Règles du jeu",
    subtitle: "Es-tu prêt à marquer et rester sur le terrain ?",
    gameFormat: {
      title: "⚔️ Format de jeu : Rayo Clash",
      rules: [
        "3 équipes par session",
        "Chaque match dure 5 minutes ou se termine dès qu'une équipe marque 3 buts",
        "L'équipe perdante sort, la troisième équipe entre",
        "En cas d'égalité, c'est la dernière équipe arrivée qui reste",
        "Pas de gardien",
        "Pas de penalty",
        "Pas de hors-jeu"
      ]
    },
    gameRules: {
      title: "⚽ Règles de jeu",
      rules: [
        "Tous les buts doivent être marqués depuis la moitié de terrain ou plus loin",
        "Les remises en jeu (touche, faute, corner) se font au pied",
        "On peut marquer sur corner, mais pas sur touche",
        "Après un but, le jeu reprend depuis le centre, à moins de 1 mètre de la ligne",
        "Si une main ou faute volontaire empêche un but clair → but accordé directement"
      ]
    },
    killerGoal: {
      title: "💥 But Killer",
      rules: [
        "Si le premier but d'un match est une volée en une touche (sur une passe aérienne sans rebond), le match s'arrête immédiatement et l'équipe gagne."
      ]
    },
    fairPlay: {
      title: "🧤 Comportement & Fair Play",
      rules: [
        "Respect des autres joueurs, du capitaine, et de l'ambiance",
        "Aucune insulte, violence ou comportement antisportif ne sera toléré",
        "Trop d'absences sans prévenir = carton rouge (sanctions possibles)"
      ]
    },
    equipment: {
      title: "👟 Équipement",
      rules: [
        "Tenue de sport obligatoire",
        "Chaussures adaptées au gazon synthétique (⚠️ pas de crampons vissés)",
        "Chasubles et ballons sont fournis",
        "Vestiaires et douches disponibles selon les terrains"
      ]
    },
    punctuality: {
      title: "⏰ Ponctualité",
      rules: [
        "Arrive 10 à 15 minutes avant le début du match",
        "En cas de retard ou d'absence sans prévenir, ta place peut être donnée à un autre joueur"
      ]
    },
    captain: {
      title: "🧑‍⚖️ Le Capitaine",
      rules: [
        "Chaque match est encadré par un Capitaine Rayo",
        "Il est responsable du respect des règles, du bon déroulement du jeu, et de la prise de stats",
        "Ses décisions sont à respecter sans contestation"
      ]
    },
    finalCta: "Prêt à briller ?",
    finalTagline: "Joue. Marque. Reste sur le terrain."
  };
  
  console.log('📋 RulesSection: Selected content title:', content.title);
  console.log('📋 RulesSection: Is Arabic?', language === 'ar');

  useEffect(() => {
    console.log('🔄 RulesSection: useEffect triggered, language changed to:', language);
    console.log('🔄 RulesSection: Content will be:', language === 'ar' ? 'Arabic' : 'French');
  }, [language]);

  // Composant pour chaque règle avec son icône
  const RuleCard = ({ title, rules, icon }: { title: string, rules: string[], icon: JSX.Element }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start mb-4">
        <div className="mr-4 text-rayoblue text-2xl mt-1">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <ul className="space-y-2 text-gray-700 pl-10">
        {rules.map((rule, index) => (
          <li key={index} className="flex items-start">
            <span className="inline-block w-4 h-4 rounded-full bg-rayoblue mr-3 mt-1.5 flex-shrink-0"></span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section id="rules" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container">
        <RevealAnimation>
          <h2 className="section-title text-center">{content.title}</h2>
          <p className="section-subtitle text-center mb-12">{content.subtitle}</p>
        </RevealAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <RevealAnimation delay={0.1}>
            <RuleCard 
              title={content.gameFormat.title} 
              rules={content.gameFormat.rules} 
              icon={<FaFutbol />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.2}>
            <RuleCard 
              title={content.gameRules.title} 
              rules={content.gameRules.rules} 
              icon={<FaRunning />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.3}>
            <RuleCard 
              title={content.killerGoal.title} 
              rules={content.killerGoal.rules} 
              icon={<FaStar />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.4}>
            <RuleCard 
              title={content.fairPlay.title} 
              rules={content.fairPlay.rules} 
              icon={<FaHandPaper />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.5}>
            <RuleCard 
              title={content.equipment.title} 
              rules={content.equipment.rules} 
              icon={<FaTshirt />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.6}>
            <RuleCard 
              title={content.punctuality.title} 
              rules={content.punctuality.rules} 
              icon={<FaClock />} 
            />
          </RevealAnimation>
          
          <RevealAnimation delay={0.7}>
            <RuleCard 
              title={content.captain.title} 
              rules={content.captain.rules} 
              icon={<FaUserShield />} 
            />
          </RevealAnimation>
        </div>

        <RevealAnimation delay={0.8}>
          <div className="text-center bg-rayoblue text-white p-10 rounded-xl max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">{content.finalCta}</h3>
            <p className="text-xl font-semibold">{content.finalTagline}</p>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default RulesSection;