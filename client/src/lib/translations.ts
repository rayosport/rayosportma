import { Language } from "./i18n";

export type TranslationRecord = Record<string, string>;

export const translations: Record<Language, TranslationRecord> = {
  fr: {
    // Navigation
    "nav_about": "À propos",
    "nav_how": "Comment ça marche",
    "nav_rules": "Formats & Règles",
    "nav_leaderboard": "Classement",
    "nav_faq": "FAQ",
    "nav_join": "Rejoindre",
    
    // Hero Section
    "hero_title": "Jouez au foot",
    "hero_title_highlight": "quand ça vous arrange !",
    "hero_subtitle": "Envie de foot sans engagement ? Réservez un match quand vous voulez !",
    "hero_cta_primary": "Rejoindre WhatsApp groups",
    "hero_cta_secondary": "Matchs à venir",
    "hero_players_text": "joueurs déjà inscrits",
    
    // About Section
    "about_title": "Qu'est-ce que Rayo Sport ?",
    "about_subtitle": "Une nouvelle façon de vivre le football communautaire au Maroc",
    "about_concept_title": "Notre Concept",
    "about_concept_text": "Rayo Sport est une plateforme communautaire qui organise des matchs de football 5vs5 et des rotations innovantes à 3 équipes dans les villes marocaines. Nous offrons une expérience premium avec des uniformes, des arbitres et des photos professionnelles.",
    "about_mission_title": "Notre Mission",
    "about_mission_text": "Devenir la plateforme n°1 pour le football communautaire au Maroc en créant des expériences inoubliables qui permettent aux joueurs de tous niveaux de briller sur le terrain.",
    "about_vision_title": "Notre Vision",
    "about_vision_text": "Créer un écosystème où le football devient plus qu'un simple jeu : une communauté active, une plateforme de progression et un lieu où des légendes locales naissent chaque semaine.",
    
    // How It Works Section
    "how_title": "Comment Ça Marche",
    "how_subtitle": "Rejoindre la communauté Rayo Sport est simple et amusant",
    "how_step1_title": "Rejoindre un groupe WhatsApp",
    "how_step1_description": "Intègre notre groupe WhatsApp local pour être informé des prochains matchs dans ta ville.",
    "how_step2_title": "Réserver un match",
    "how_step2_description": "Choisis ton créneau, paie ta place et prépare-toi à jouer.",
    "how_step3_title": "Jouer. Marquer. Briller.",
    "how_step3_description": "Profite d'une expérience premium avec des uniformes, des arbitres et un terrain de qualité.",
    "how_step4_title": "Recevoir ses stats et highlights",
    "how_step4_description": "Après le match, reçois tes statistiques, tes moments forts et ton classement mis à jour.",
    "how_cta_button": "Rejoindre maintenant",
    
    // Rules Section
    "rules_title": "Formats & Règles",
    "rules_subtitle": "Découvre les différents formats de jeu proposés par Rayo Sport",
    "rules_tab_standard": "Match Standard",
    "rules_tab_clash": "Rayo Clash",
    "rules_tab_rankings": "Classements",
    "rules_standard_title": "Match Standard (5vs5)",
    "rules_standard_1": "Deux équipes de 5 joueurs s'affrontent sur un terrain réduit",
    "rules_standard_2": "Durée totale : 60 minutes (2 x 30 minutes)",
    "rules_standard_3": "Remplacements illimités",
    "rules_standard_4": "Arbitre officiel et uniformes fournis",
    "rules_standard_5": "Statistiques individuelles et collectives enregistrées",
    "rules_clash_title": "Rayo Clash (3 équipes)",
    "rules_clash_1": "Format unique à 3 équipes qui s'affrontent en rotation",
    "rules_clash_2": "Matchs de 5 minutes, l'équipe perdante sort et laisse place à la 3ème équipe",
    "rules_clash_3": "Durée totale : 60 minutes",
    "rules_clash_4": "Système de points cumulatifs : 3 pts pour victoire, 1 pt pour égalité",
    "rules_clash_5": "Intensité maximale et tactique essentielle",

    "rules_rankings_title": "Système de Classement",
    "rules_rankings_1": "Tous les joueurs reçoivent une note de performance après chaque match",
    "rules_rankings_2": "Les statistiques incluent : buts, passes décisives, victoires, MVP",
    "rules_rankings_3": "Classement hebdomadaire et mensuel des meilleurs joueurs",
    "rules_rankings_4": "Système de badges pour récompenser les performances exceptionnelles",
    "rules_rankings_5": "Les joueurs élites sont invités à des événements spéciaux",
    
    // FAQ Section
    "faq_title": "Questions Fréquentes",
    "faq_subtitle": "Tout ce que tu dois savoir avant de rejoindre un match Rayo",
    "faq_q1": "Comment réserver ?",
    "faq_a1": "Rejoins notre groupe WhatsApp, consulte les matchs disponibles et confirme ta place en payant via les options proposées (généralement par mobile money).",
    "faq_q2": "Combien ça coûte ?",
    "faq_a2": "Le prix standard est de 50-70 MAD par joueur par match, ce qui inclut le terrain, l'arbitre, les uniformes et les photos professionnelles.",
    "faq_q3": "Dois-je ramener mes équipements ?",
    "faq_a3": "Apporte seulement tes chaussures de foot et une bouteille d'eau. Nous fournissons les maillots, les chasubles et tout le matériel nécessaire.",
    "faq_q4": "Puis-je venir si je ne suis pas bon ?",
    "faq_a4": "Absolument ! Nous accueillons tous les niveaux. Les équipes sont équilibrées et l'ambiance est toujours conviviale et respectueuse.",
    "faq_q5": "Y a-t-il une application Rayo Sport ?",
    "faq_a5": "Notre application est en développement. En attendant, toutes les réservations et communications se font via WhatsApp et Instagram.",
    "faq_q6": "Où se déroulent les matchs ?",
    "faq_a6": "Nous organisons des matchs dans plusieurs villes du Maroc : Casablanca, Rabat, Marrakech, Tanger, et bientôt d'autres. Les terrains sont soigneusement sélectionnés pour leur qualité.",
    "faq_more_questions": "Tu as d'autres questions ?",
    "faq_contact_link": "Contacte-nous sur WhatsApp",
    
    // Testimonials Section
    "testimonials_title": "Ce que disent nos joueurs",
    "testimonials_subtitle": "Découvrez les témoignages de notre communauté de joueurs passionnés",
    "testimonial_1_quote": "Rayo Sport a révolutionné ma façon de jouer au foot ! Les formats innovants comme Rayo Rush rendent chaque match imprévisible et excitant. L'organisation est top niveau !",
    "testimonial_1_name": "Abdelhak Samrani",
    "testimonial_1_role": "Joueur régulier depuis 3 mois",
    "testimonial_2_quote": "Le format 7vs7 de Rayo Classic permet un vrai jeu de possession. Les équipes équilibrées et l'ambiance conviviale font que je reviens chaque semaine. Merci l'équipe !",
    "testimonial_2_name": "Hamza Khyar",
    "testimonial_2_role": "Capitaine d'équipe",
    "testimonial_3_quote": "Rayo Battle avec 4 équipes, c'est du jamais vu ! L'intensité est folle et on progresse énormément. Les stats détaillées nous aident à analyser notre jeu.",
    "testimonial_3_name": "Youssef Zguioir",
    "testimonial_3_role": "Joueur compétitif",
    "testimonial_4_quote": "Les rotations à 3 équipes du Rayo Clash créent une dynamique unique. Plus de temps de banc, plus d'action ! L'expérience est vraiment premium.",
    "testimonial_4_name": "Abdelkbir A",
    "testimonial_4_role": "Joueur depuis le début",
    "testimonial_5_quote": "L'organisation parfaite, les uniformes de qualité, les arbitres professionnels... Rayo Sport a élevé le niveau du foot amateur au Maroc. Chapeau !",
    "testimonial_5_name": "Omar Erriche",
    "testimonial_5_role": "Joueur passionné",
    
    // CTA Section
    "cta_title": "Prêt à rejoindre le mouvement ?",
    "cta_subtitle": "Rejoins une communauté passionnée et vis une expérience de football unique",
    "cta_whatsapp": "Rejoindre sur WhatsApp",
    "cta_instagram": "Suivre sur Instagram",
    "cta_button_app": "Télécharger l'application (bientôt)",
    
    // WhatsApp Bubble
    "whatsapp_bubble_title": "🏆 Rayo Sport",
    "whatsapp_bubble_text": "Prêt à rejoindre la communauté ? Contactez-nous sur WhatsApp !",
    "whatsapp_bubble_button": "Contacter",
    "whatsapp_bubble_tooltip": "Contactez-nous",
    "whatsapp_bubble_message": "Salut ! Je suis intéressé par Rayo Sport. Pouvez-vous me donner plus d'informations ?",

    // Footer
    "footer_about": "Rayo Sport est la plateforme communautaire de football qui révolutionne l'expérience des matchs 5vs5 au Maroc avec des formats innovants, un suivi des performances et une expérience premium pour tous les joueurs.",
    "footer_quick_links": "Liens rapides",
    "footer_contact": "Contact",
    "footer_address": "Casablanca, Maroc",
    "footer_language": "Langue",
    "footer_rights": "Tous droits réservés.",
    "footer_privacy": "Politique de confidentialité",
    "footer_terms": "Conditions d'utilisation",
    
    // Placeholder
    "This section is under development. Check back soon!": "Cette section est en cours de développement. Revenez bientôt !",
  },
  ar: {
    // Navigation
    "nav_about": "من نحن",
    "nav_how": "كيف يعمل",
    "nav_rules": "الأنظمة والقوانين",
    "nav_leaderboard": "لوحة الصدارة",
    "nav_faq": "الأسئلة الشائعة",
    "nav_join": "انضم إلينا",
    
    // Hero Section
    "hero_title": "العب. تألق.",
    "hero_title_highlight": "كن أسطورة.",
    "hero_subtitle": "انضم إلى ثورة كرة القدم المجتمعية في المغرب مع مباريات 5 ضد 5 وبطولات بين 3 فرق.",
    "hero_cta_primary": "انضم إلى مجموعات WhatsApp",
    "hero_cta_secondary": "تحميل التطبيق",
    "hero_players_text": "لاعب مسجل بالفعل",
    
    // About Section
    "about_title": "ما هو رايو سبورت؟",
    "about_subtitle": "طريقة جديدة لعيش كرة القدم المجتمعية في المغرب",
    "about_concept_title": "مفهومنا",
    "about_concept_text": "رايو سبورت هي منصة مجتمعية تنظم مباريات كرة قدم 5 ضد 5 وتناوب مبتكر بين 3 فرق في المدن المغربية. نقدم تجربة متميزة مع زي موحد وحكام وصور احترافية.",
    "about_mission_title": "مهمتنا",
    "about_mission_text": "أن نصبح المنصة رقم 1 لكرة القدم المجتمعية في المغرب من خلال إنشاء تجارب لا تُنسى تتيح للاعبين من جميع المستويات التألق على أرض الملعب.",
    "about_vision_title": "رؤيتنا",
    "about_vision_text": "إنشاء نظام بيئي حيث تصبح كرة القدم أكثر من مجرد لعبة: مجتمع نشط، منصة للتقدم ومكان تولد فيه الأساطير المحلية كل أسبوع.",
    
    // How It Works Section
    "how_title": "كيف يعمل",
    "how_subtitle": "الانضمام إلى مجتمع رايو سبورت سهل وممتع",
    "how_step1_title": "انضم إلى مجموعة واتساب",
    "how_step1_description": "انضم إلى مجموعة الواتساب المحلية لدينا للبقاء على اطلاع بالمباريات القادمة في مدينتك.",
    "how_step2_title": "احجز مباراة",
    "how_step2_description": "اختر الوقت المناسب لك، ادفع مكانك واستعد للعب.",
    "how_step3_title": "العب. سجل. تألق.",
    "how_step3_description": "استمتع بتجربة متميزة مع زي موحد وحكام وملعب عالي الجودة.",
    "how_step4_title": "استلم إحصائياتك ولقطاتك البارزة",
    "how_step4_description": "بعد المباراة، استلم إحصائياتك ولحظاتك البارزة وتصنيفك المحدث.",
    "how_cta_button": "انضم الآن",
    
    // Rules Section
    "rules_title": "الأنظمة والقوانين",
    "rules_subtitle": "اكتشف أنماط اللعب المختلفة التي يقدمها رايو سبورت",
    "rules_tab_standard": "المباراة القياسية",
    "rules_tab_clash": "رايو كلاش",
    "rules_tab_rankings": "التصنيفات",
    "rules_standard_title": "المباراة القياسية (5 ضد 5)",
    "rules_standard_1": "فريقان من 5 لاعبين يتنافسان على ملعب مصغر",
    "rules_standard_2": "المدة الإجمالية: 60 دقيقة (2 × 30 دقيقة)",
    "rules_standard_3": "تبديلات غير محدودة",
    "rules_standard_4": "حكم رسمي وزي موحد مقدم",
    "rules_standard_5": "تسجيل الإحصائيات الفردية والجماعية",
    "rules_clash_title": "رايو كلاش (3 فرق)",
    "rules_clash_1": "نظام فريد لـ 3 فرق تتنافس بالتناوب",
    "rules_clash_2": "مباريات من 5 دقائق، الفريق الخاسر يخرج ويفسح المجال للفريق الثالث",
    "rules_clash_3": "المدة الإجمالية: 60 دقيقة",
    "rules_clash_4": "نظام النقاط التراكمية: 3 نقاط للفوز، نقطة واحدة للتعادل",
    "rules_clash_5": "كثافة قصوى واستراتيجية ضرورية",

    "rules_rankings_title": "نظام التصنيف",
    "rules_rankings_1": "يحصل جميع اللاعبين على تقييم للأداء بعد كل مباراة",
    "rules_rankings_2": "تشمل الإحصائيات: الأهداف، التمريرات الحاسمة، الانتصارات، أفضل لاعب",
    "rules_rankings_3": "تصنيف أسبوعي وشهري لأفضل اللاعبين",
    "rules_rankings_4": "نظام الشارات لمكافأة الأداء الاستثنائي",
    "rules_rankings_5": "دعوة اللاعبين النخبة إلى أحداث خاصة",
    
    // FAQ Section
    "faq_title": "الأسئلة الشائعة",
    "faq_subtitle": "كل ما تحتاج لمعرفته قبل الانضمام إلى مباراة رايو",
    "faq_q1": "كيف أحجز؟",
    "faq_a1": "انضم إلى مجموعة الواتساب الخاصة بنا، تحقق من المباريات المتاحة وأكد مكانك بالدفع عبر الخيارات المقترحة (عادة عبر الدفع بالهاتف المحمول).",
    "faq_q2": "كم تكلف المشاركة؟",
    "faq_a2": "السعر القياسي هو 50-70 درهم مغربي لكل لاعب لكل مباراة، وهذا يشمل الملعب والحكم والزي الموحد والصور الاحترافية.",
    "faq_q3": "هل يجب أن أحضر معداتي؟",
    "faq_a3": "أحضر فقط أحذية كرة القدم وزجاجة ماء. نحن نوفر القمصان والصدريات وجميع المعدات اللازمة.",
    "faq_q4": "هل يمكنني المشاركة إذا لم أكن ماهرًا؟",
    "faq_a4": "بالتأكيد! نحن نرحب بجميع المستويات. الفرق متوازنة والجو دائمًا ودي ومحترم.",
    "faq_q5": "هل هناك تطبيق لرايو سبورت؟",
    "faq_a5": "تطبيقنا قيد التطوير. في الوقت الحالي، تتم جميع الحجوزات والاتصالات عبر واتساب وانستغرام.",
    "faq_q6": "أين تقام المباريات؟",
    "faq_a6": "ننظم مباريات في العديد من المدن المغربية: الدار البيضاء، الرباط، مراكش، طنجة، وقريبًا غيرها. يتم اختيار الملاعب بعناية لجودتها.",
    "faq_more_questions": "هل لديك أسئلة أخرى؟",
    "faq_contact_link": "تواصل معنا على واتساب",
    
    // Testimonials Section
    "testimonials_title": "ما يقوله لاعبونا",
    "testimonials_subtitle": "اكتشف شهادات مجتمعنا من اللاعبين المتحمسين",
    "testimonial_1_quote": "رايو سبورت ثورة حقيقية في طريقة لعب كرة القدم! الأنماط المبتكرة مثل رايو راش تجعل كل مباراة مثيرة وغير متوقعة. التنظيم في أعلى مستوى!",
    "testimonial_1_name": "عبد الحق صمراني",
    "testimonial_1_role": "لاعب منتظم منذ 3 أشهر",
    "testimonial_2_quote": "نمط 7 ضد 7 في رايو كلاسيك يسمح بلعب حقيقي للكرة. الفرق المتوازنة والأجواء الودية تجعلني أعود كل أسبوع. شكراً للفريق!",
    "testimonial_2_name": "حمزة خيار",
    "testimonial_2_role": "قائد فريق",
    "testimonial_3_quote": "رايو باتل مع 4 فرق، هذا لم نره من قبل! الحماس جنوني ونتقدم كثيراً. الإحصائيات التفصيلية تساعدنا في تحليل لعبنا.",
    "testimonial_3_name": "يوسف زقيور",
    "testimonial_3_role": "لاعب تنافسي",
    "testimonial_4_quote": "التناوب مع 3 فرق في رايو كلاش يخلق ديناميكية فريدة. لا مزيد من وقت الاحتياط، مزيد من العمل! التجربة متميزة حقاً.",
    "testimonial_4_name": "عبد الكبير أ",
    "testimonial_4_role": "لاعب منذ البداية",
    "testimonial_5_quote": "التنظيم المثالي، الزي الموحد عالي الجودة، الحكام المحترفون... رايو سبورت رفع مستوى كرة القدم الهاوية في المغرب. قبعة!",
    "testimonial_5_name": "عمر إريش",
    "testimonial_5_role": "لاعب متحمس",
    
    // CTA Section
    "cta_title": "مستعد للانضمام إلى الحركة؟",
    "cta_subtitle": "انضم إلى مجتمع متحمس وعش تجربة كرة قدم فريدة",
    "cta_whatsapp": "انضم عبر واتساب",
    "cta_instagram": "تابعنا على انستغرام",
    "cta_button_app": "تحميل التطبيق (قريبًا)",
    
    // WhatsApp Bubble
    "whatsapp_bubble_title": "🏆 رايو سبورت",
    "whatsapp_bubble_text": "مستعد للانضمام إلى المجتمع؟ تواصل معنا على واتساب!",
    "whatsapp_bubble_button": "تواصل",
    "whatsapp_bubble_tooltip": "تواصل معنا",
    "whatsapp_bubble_message": "مرحبا! أنا مهتم برايو سبورت. هل يمكنكم إعطائي المزيد من المعلومات؟",
    
    // Footer
    "footer_about": "رايو سبورت هي منصة كرة القدم المجتمعية التي تعيد تشكيل تجربة مباريات 5 ضد 5 في المغرب من خلال أنماط مبتكرة، تتبع الأداء وتجربة متميزة لجميع اللاعبين.",
    "footer_quick_links": "روابط سريعة",
    "footer_contact": "اتصل بنا",
    "footer_address": "الدار البيضاء، المغرب",
    "footer_language": "اللغة",
    "footer_rights": "جميع الحقوق محفوظة.",
    "footer_privacy": "سياسة الخصوصية",
    "footer_terms": "شروط الاستخدام",
    
    // Placeholder
    "This section is under development. Check back soon!": "هذا القسم قيد التطوير. ترقبوا المزيد قريبًا!",
  }
};