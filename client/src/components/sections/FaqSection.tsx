import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import RevealAnimation from "@/components/ui/RevealAnimation";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  FaFutbol, 
  FaMapMarkedAlt, 
  FaCity, 
  FaBrain, 
  FaMobileAlt, 
  FaShoePrints,
  FaCalendarTimes,
  FaMoneyBillWave,
  FaRedo,
  FaChild,
  FaUserFriends,
  FaFootballBall,
  FaLocationArrow,
  FaBuilding,
  FaTshirt,
  FaHandshake,
  FaWhatsapp
} from "react-icons/fa";

// Types pour les questions FAQ
interface FaqItem {
  id: string;
  icon: JSX.Element;
  question: string;
  answer: string | JSX.Element;
}

// Type pour le retour de la fonction getFaqContent
interface FaqContent {
  general: FaqItem[];
  gameplay: FaqItem[];
  logistics: FaqItem[];
  business: FaqItem[];
  [key: string]: FaqItem[]; // Index signature pour permettre l'accès dynamique
}

const FaqSection = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("general");

  // Définir les catégories de FAQ avec des valeurs directes en fonction de la langue
  const { language } = useLanguage();
  
  // Catégories en fonction de la langue
  const getCategoryLabels = () => {
    if (language === 'ar') {
      return {
        general: "عام",
        gameplay: "طريقة اللعب",
        logistics: "الخدمات اللوجستية",
        business: "التعاون"
      };
    } else {
      return {
        general: "Général",
        gameplay: "Gameplay",
        logistics: "Logistique",
        business: "Collaboration"
      };
    }
  };
  
  const categoryLabels = getCategoryLabels();
  
  const categories = [
    { id: "general", label: categoryLabels.general },
    { id: "gameplay", label: categoryLabels.gameplay },
    { id: "logistics", label: categoryLabels.logistics },
    { id: "business", label: categoryLabels.business }
  ];

  // Fonction pour obtenir les questions et réponses dans la langue appropriée
  const getFaqContent = (): FaqContent => {
    if (language === 'ar') {
      return {
        general: [
          {
            id: "what-is-rayo",
            icon: <FaFutbol className="text-rayoblue" />,
            question: "ما هو رايو سبورت؟",
            answer: "رايو سبورت هي منصة مجتمعية تعيد ابتكار كرة القدم الحضرية في المغرب. ننظم مباريات 5 ضد 5 وشكلًا فريدًا يسمى رايو كلاش (3 فرق، مباريات من 5 دقائق، الخاسر يخرج) على ملاعب ثابتة في الدار البيضاء والمناطق المحيطة بها. هدفنا هو تقديم تجربة ممتعة ومتاحة وتنافسية لجميع المتحمسين، بغض النظر عن مستواهم."
          },
          {
            id: "city-availability",
            icon: <FaMapMarkedAlt className="text-rayoblue" />,
            question: "هل رايو سبورت متوفر في مدينتي؟",
            answer: "بدأنا في الدار البيضاء ونتوسع تدريجيًا في جميع أنحاء المنطقة (دار بوعزة، بوسكورة، عين السبع، إلخ). إذا كنت تريد أن يصل رايو بالقرب منك، اتصل بنا أو اقترح ملعبًا تعرفه."
          },
          {
            id: "small-fields",
            icon: <FaCity className="text-rayoblue" />,
            question: "لماذا على ملاعب صغيرة؟",
            answer: "نريد أن تكون كرة القدم سهلة المنال. تسمح الملاعب الصغيرة بتحسين المساحة في المدينة، ويجعل الشكل المصغر اللعبة أسرع وأكثر تقنية وشمولاً."
          },
          {
            id: "skill-level",
            icon: <FaBrain className="text-rayoblue" />,
            question: "ما المستوى المطلوب للعب؟",
            answer: "نرحب بجميع المستويات! تصنف مجموعاتنا أحيانًا حسب المستوى (مبتدئ، متوسط، متقدم). إذا لم تكن قد لعبت من قبل أو إذا كنت لاعبًا محترفًا، ستجد مكانك. لا تتردد في الاتصال بنا إذا كان لديك شك."
          }
        ],
        gameplay: [
          {
            id: "games-format",
            icon: <FaFootballBall className="text-rayoblue" />,
            question: "كيف تبدو مباريات رايو سبورت؟",
            answer: "تستمر كل جلسة 60 دقيقة، مع العديد من المباريات التي تستمر 5 دقائق. هناك 3 فرق من 5 لاعبين. بعد كل مباراة، يخرج الفريق الخاسر ويدخل فريق آخر. المباريات منظمة، مضبوطة الإيقاع، ومصورة. تغادر مع إحصائيات، صور، وأحيانًا حتى لقطات فيديو بارزة!"
          },
          {
            id: "bring-items",
            icon: <FaShoePrints className="text-rayoblue" />,
            question: "ماذا يجب أن أحضر؟",
            answer: (
              <div>
                <p>نحن نعتني بكل شيء: كرات، صدريات، معدات. عليك فقط أن تأتي مع:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>ملابس رياضية</li>
                  <li>أحذية رياضية أو أحذية للعشب الاصطناعي (لا مسامير معدنية)</li>
                  <li>روحك المرحة!</li>
                </ul>
              </div>
            )
          },
          {
            id: "minimum-age",
            icon: <FaChild className="text-rayoblue" />,
            question: "ما هو الحد الأدنى للسن للعب؟",
            answer: "المباريات مخصصة للبالغين (18+)، لكننا نقبل الشباب من سن 15 سنة فما فوق بشرط تقديم إذن خطي من الوالدين."
          }
        ],
        logistics: [
          {
            id: "book-game",
            icon: <FaMobileAlt className="text-rayoblue" />,
            question: "كيف أحجز مكانًا لمباراة؟",
            answer: "انضم إلى مجموعة الواتساب الخاصة بنا أو احجز مباشرة عبر تطبيق الهاتف المحمول الخاص بنا (قريبًا). يتم نشر المواعيد كل أسبوع، والأماكن تنفد بسرعة!"
          },
          {
            id: "cant-attend",
            icon: <FaCalendarTimes className="text-rayoblue" />,
            question: "ماذا لو لم أستطع الحضور؟",
            answer: "أخبرنا في أقرب وقت ممكن حتى نتمكن من عرض مكانك على لاعب آخر. المباريات أفضل عندما يكون الجميع حاضرين!"
          },
          {
            id: "cost",
            icon: <FaMoneyBillWave className="text-rayoblue" />,
            question: "كم تكلف؟",
            answer: "المباراة الأولى مجانية! بعد ذلك، يمكنك الدفع لكل جلسة أو الاشتراك في اشتراك شهري. يتم أيضًا تقديم خصومات أو مباريات مجانية إذا قمت بدعوة أصدقائك للانضمام إلينا."
          },
          {
            id: "refund",
            icon: <FaRedo className="text-rayoblue" />,
            question: "هل يمكنني استرداد المال؟",
            answer: "في حالة إلغاء المباراة (بسبب المطر، إغلاق الملعب...)، يتم رد أموالك تلقائيًا. بالنسبة للحالات الأخرى، اتصل بفريقنا."
          }
        ],
        business: [
          {
            id: "organize-games",
            icon: <FaUserFriends className="text-rayoblue" />,
            question: "هل يمكنني المساعدة في تنظيم المباريات؟",
            answer: "نعم! نحن نوظف قادة رايو لاستقبال اللاعبين، وإدارة المعدات، وتنشيط المباريات. إنها مهمة مدفوعة الأجر. اتصل بنا إذا كنت مهتمًا."
          },
          {
            id: "ideal-field",
            icon: <FaLocationArrow className="text-rayoblue" />,
            question: "كيف يبدو ملعب رايو سبورت المثالي؟",
            answer: "ملعب 5 ضد 5 من نوع City Foot، مع عشب اصطناعي، غرف تبديل ملابس ودوشات. نختار أماكن يسهل الوصول إليها، جيدة الصيانة، ومناسبة لنمط لعبنا. إذا كنت تعرف ملعبًا جيدًا، اكتب لنا!"
          },
          {
            id: "found-field",
            icon: <FaFootballBall className="text-rayoblue" />,
            question: "لقد وجدت ملعبًا جيدًا! هل يمكننا اللعب فيه؟",
            answer: "رائع! أرسل لنا المعلومات (صور، موقع). إذا كان الملعب مناسبًا، يمكننا تنظيم مباريات بسرعة."
          },
          {
            id: "own-field",
            icon: <FaBuilding className="text-rayoblue" />,
            question: "أمتلك ملعبًا. هل يمكننا التعاون؟",
            answer: "نعم! إذا كنت تدير أو تمتلك مساحة (ملعب خاص، مركز رياضي، إلخ)، فنحن منفتحون على الشراكات. اكتب لنا!"
          },
          {
            id: "merchandise",
            icon: <FaTshirt className="text-rayoblue" />,
            question: "أين يمكنني العثور على منتجات رايو سبورت؟",
            answer: "ستكون الملابس والهدايا والمواد الحصرية متاحة قريبًا للأعضاء. ابق على اتصال على موقعنا وتطبيقنا!"
          },
          {
            id: "brand-collab",
            icon: <FaHandshake className="text-rayoblue" />,
            question: "هل يمكنني التعاون مع رايو سبورت مع علامتي التجارية؟",
            answer: "نعم، نحن منفتحون على التعاون والرعاة. سواء كنت علامة تجارية رياضية، محلية أو وطنية، اتصل بنا للمشاركة في إنشاء تفعيل حول الرياضة الحضرية."
          }
        ]
      };
    } else {
      return {
        general: [
          {
            id: "what-is-rayo",
            icon: <FaFutbol className="text-rayoblue" />,
            question: "Qu'est-ce que Rayo Sport ?",
            answer: "Rayo Sport est une plateforme communautaire qui réinvente le football urbain au Maroc. Nous organisons des matchs 5vs5 et un format unique appelé Rayo Clash (3 équipes, matchs de 5 minutes, le perdant sort) sur des terrains fixes à Casablanca et ses régions. Notre objectif est d'offrir une expérience fun, accessible et compétitive à tous les passionnés, quel que soit leur niveau."
          },
          {
            id: "city-availability",
            icon: <FaMapMarkedAlt className="text-rayoblue" />,
            question: "Rayo Sport est-il disponible dans ma ville ?",
            answer: "Nous avons démarré à Casablanca et nous nous étendons progressivement dans toute la région (Dar Bouazza, Bouskoura, Ain Sebaâ, etc.). Si tu veux que Rayo arrive près de chez toi, contacte-nous ou propose un terrain que tu connais."
          },
          {
            id: "small-fields",
            icon: <FaCity className="text-rayoblue" />,
            question: "Pourquoi sur des petits terrains ?",
            answer: "Nous voulons que le football soit facilement accessible. Les petits terrains permettent d'optimiser l'espace en ville, et le format réduit rend le jeu plus rapide, plus technique et plus inclusif."
          },
          {
            id: "skill-level",
            icon: <FaBrain className="text-rayoblue" />,
            question: "Quel niveau faut-il pour jouer ?",
            answer: "Tous les niveaux sont bienvenus ! Nos groupes sont parfois classés par niveau (débutant, intermédiaire, avancé). Si tu n'as jamais joué ou si tu es un joueur confirmé, tu trouveras ta place. N'hésite pas à nous contacter si tu as un doute."
          }
        ],
        gameplay: [
          {
            id: "games-format",
            icon: <FaFootballBall className="text-rayoblue" />,
            question: "À quoi ressemblent les matchs Rayo Sport ?",
            answer: "Chaque session dure 60 minutes, avec plusieurs matchs de 5 minutes. Il y a 3 équipes de 5 joueurs. Après chaque match, l'équipe perdante sort et une autre entre en jeu. Les matchs sont encadrés, rythmés, et filmés. Vous repartez avec des statistiques, des photos, et parfois même des moments forts vidéo !"
          },
          {
            id: "bring-items",
            icon: <FaShoePrints className="text-rayoblue" />,
            question: "Que dois-je apporter ?",
            answer: (
              <div>
                <p>Nous nous occupons de tout : ballons, chasubles, équipements. Tu dois juste venir avec :</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>une tenue de sport</li>
                  <li>des baskets ou chaussures pour gazon synthétique (pas de crampons métalliques)</li>
                  <li>ta bonne humeur !</li>
                </ul>
              </div>
            )
          },
          {
            id: "minimum-age",
            icon: <FaChild className="text-rayoblue" />,
            question: "Quel est l'âge minimum pour jouer ?",
            answer: "Les matchs sont réservés aux adultes (18+), mais nous acceptons les jeunes à partir de 15 ans sous réserve d'une autorisation parentale écrite."
          }
        ],
        logistics: [
          {
            id: "book-game",
            icon: <FaMobileAlt className="text-rayoblue" />,
            question: "Comment réserver une place pour un match ?",
            answer: "Rejoins notre groupe WhatsApp ou réserve directement via notre application mobile (bientôt disponible). Les créneaux sont publiés chaque semaine, et les places partent vite !"
          },
          {
            id: "cant-attend",
            icon: <FaCalendarTimes className="text-rayoblue" />,
            question: "Et si je ne peux pas venir ?",
            answer: "Préviens-nous dès que possible pour qu'on puisse proposer ta place à un autre joueur. Les matchs sont meilleurs quand tout le monde est là !"
          },
          {
            id: "cost",
            icon: <FaMoneyBillWave className="text-rayoblue" />,
            question: "Combien ça coûte ?",
            answer: "Le premier match est gratuit ! Ensuite, tu peux payer à la séance ou souscrire à un abonnement mensuel. Des réductions ou des matchs gratuits sont aussi offerts si tu invites tes amis à nous rejoindre."
          },
          {
            id: "refund",
            icon: <FaRedo className="text-rayoblue" />,
            question: "Puis-je être remboursé ?",
            answer: "En cas d'annulation du match (pluie, terrain fermé...), tu es automatiquement remboursé. Pour d'autres cas, contacte notre équipe."
          }
        ],
        business: [
          {
            id: "organize-games",
            icon: <FaUserFriends className="text-rayoblue" />,
            question: "Puis-je aider à organiser des matchs ?",
            answer: "Oui ! Nous recrutons des Capitaines Rayo pour accueillir les joueurs, gérer le matériel et animer les matchs. C'est une mission rémunérée. Contacte-nous si tu es intéressé(e)."
          },
          {
            id: "ideal-field",
            icon: <FaLocationArrow className="text-rayoblue" />,
            question: "À quoi ressemble un terrain Rayo Sport idéal ?",
            answer: "Un terrain 5vs5 de type City Foot, avec gazon synthétique, vestiaires et douches. Nous sélectionnons des lieux accessibles, bien entretenus, et adaptés à notre format de jeu. Si tu connais un bon terrain, écris-nous !"
          },
          {
            id: "found-field",
            icon: <FaFootballBall className="text-rayoblue" />,
            question: "J'ai trouvé un bon terrain ! On peut y jouer ?",
            answer: "Super ! Envoie-nous les infos (photos, localisation). Si le terrain convient, on pourra organiser des matchs rapidement."
          },
          {
            id: "own-field",
            icon: <FaBuilding className="text-rayoblue" />,
            question: "Je possède un terrain. Peut-on collaborer ?",
            answer: "Oui ! Si tu gères ou possèdes un espace (terrain privé, centre sportif, etc.), nous sommes ouverts aux partenariats. Écris-nous !"
          },
          {
            id: "merchandise",
            icon: <FaTshirt className="text-rayoblue" />,
            question: "Où puis-je trouver des produits Rayo Sport ?",
            answer: "Des tenues, goodies et articles exclusifs seront bientôt disponibles pour les membres. Reste connecté sur notre site et notre appli !"
          },
          {
            id: "brand-collab",
            icon: <FaHandshake className="text-rayoblue" />,
            question: "Puis-je collaborer avec Rayo Sport avec ma marque ?",
            answer: "Oui, nous sommes ouverts aux collaborations et sponsors. Que vous soyez une marque sportive, locale ou nationale, contactez-nous pour co-créer une activation autour du sport urbain."
          }
        ]
      };
    }
  };
  
  // Questions FAQ par catégorie
  const faqItems: FaqContent = getFaqContent();

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container">
        <RevealAnimation>
          <h2 className="section-title text-center">
            {language === 'ar' ? "الأسئلة الشائعة" : "Questions fréquentes"}
          </h2>
          <p className="section-subtitle text-center">
            {language === 'ar' 
              ? "كل ما تحتاج لمعرفته عن رايو سبورت" 
              : "Tout ce que tu dois savoir sur Rayo Sport"}
          </p>
        </RevealAnimation>

        {/* Sélecteur de catégories */}
        <RevealAnimation delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-rayoblue text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </RevealAnimation>

        {/* Les questions FAQ */}
        <div className="max-w-3xl mx-auto mt-8">
          <RevealAnimation delay={0.2}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems[activeCategory]?.map((item: FaqItem) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center text-left">
                      <div className="mr-4 text-xl">{item.icon}</div>
                      <span className="font-medium">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0 text-gray-600">
                    <div className="pl-10">{item.answer}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealAnimation>
        </div>

        {/* CTA */}
        <RevealAnimation delay={0.3}>
          <div className="mt-14 text-center">
            <p className="text-lg mb-4">
              {language === 'ar' ? "هل لديك أسئلة أخرى؟" : "Tu as d'autres questions ?"}
            </p>
            <a 
              href="https://wa.me/212649076758" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center"
            >
              <FaWhatsapp className="mr-2 text-xl" />
              {language === 'ar' ? "تواصل معنا على واتساب" : "Contacte-nous sur WhatsApp"}
            </a>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default FaqSection;