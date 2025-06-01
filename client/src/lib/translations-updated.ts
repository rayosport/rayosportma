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
    "hero_title": "Joue. Brille.",
    "hero_title_highlight": "Deviens une Légende.",
    "hero_subtitle": "Rejoins la révolution du football communautaire au Maroc avec des matchs 5vs5 et des tournois à 3 équipes.",
    "hero_cta_primary": "Rejoindre un match",
    "hero_cta_secondary": "Télécharger l'app",
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
    "faq_category_general": "Général",
    "faq_category_gameplay": "Gameplay",
    "faq_category_logistics": "Logistique",
    "faq_category_business": "Collaboration",
    
    // FAQ Général
    "faq_what_is_question": "Qu'est-ce que Rayo Sport ?",
    "faq_what_is_answer": "Rayo Sport est une plateforme communautaire qui réinvente le football urbain au Maroc. Nous organisons des matchs 5vs5 et un format unique appelé Rayo Clash (3 équipes, matchs de 5 minutes, le perdant sort) sur des terrains fixes à Casablanca et ses régions. Notre objectif est d'offrir une expérience fun, accessible et compétitive à tous les passionnés, quel que soit leur niveau.",
    "faq_city_question": "Rayo Sport est-il disponible dans ma ville ?",
    "faq_city_answer": "Nous avons démarré à Casablanca et nous nous étendons progressivement dans toute la région (Dar Bouazza, Bouskoura, Ain Sebaâ, etc.). Si tu veux que Rayo arrive près de chez toi, contacte-nous ou propose un terrain que tu connais.",
    "faq_fields_question": "Pourquoi sur des petits terrains ?",
    "faq_fields_answer": "Nous voulons que le football soit facilement accessible. Les petits terrains permettent d'optimiser l'espace en ville, et le format réduit rend le jeu plus rapide, plus technique et plus inclusif.",
    "faq_skill_question": "Quel niveau faut-il pour jouer ?",
    "faq_skill_answer": "Tous les niveaux sont bienvenus ! Nos groupes sont parfois classés par niveau (débutant, intermédiaire, avancé). Si tu n'as jamais joué ou si tu es un joueur confirmé, tu trouveras ta place. N'hésite pas à nous contacter si tu as un doute.",
    
    // FAQ Gameplay
    "faq_games_question": "À quoi ressemblent les matchs Rayo Sport ?",
    "faq_games_answer": "Chaque session dure 60 minutes, avec plusieurs matchs de 5 minutes. Il y a 3 équipes de 5 joueurs. Après chaque match, l'équipe perdante sort et une autre entre en jeu. Les matchs sont encadrés, rythmés, et filmés. Vous repartez avec des statistiques, des photos, et parfois même des moments forts vidéo !",
    "faq_bring_question": "Que dois-je apporter ?",
    "faq_bring_answer_intro": "Nous nous occupons de tout : ballons, chasubles, équipements. Tu dois juste venir avec :",
    "faq_bring_item1": "une tenue de sport",
    "faq_bring_item2": "des baskets ou chaussures pour gazon synthétique (pas de crampons métalliques)",
    "faq_bring_item3": "ta bonne humeur !",
    "faq_age_question": "Quel est l'âge minimum pour jouer ?",
    "faq_age_answer": "Les matchs sont réservés aux adultes (18+), mais nous acceptons les jeunes à partir de 15 ans sous réserve d'une autorisation parentale écrite.",
    
    // FAQ Logistique
    "faq_book_question": "Comment réserver une place pour un match ?",
    "faq_book_answer": "Rejoins notre groupe WhatsApp ou réserve directement via notre application mobile (bientôt disponible). Les créneaux sont publiés chaque semaine, et les places partent vite !",
    "faq_cant_attend_question": "Et si je ne peux pas venir ?",
    "faq_cant_attend_answer": "Préviens-nous dès que possible pour qu'on puisse proposer ta place à un autre joueur. Les matchs sont meilleurs quand tout le monde est là !",
    "faq_cost_question": "Combien ça coûte ?",
    "faq_cost_answer": "Le premier match est gratuit ! Ensuite, tu peux payer à la séance ou souscrire à un abonnement mensuel. Des réductions ou des matchs gratuits sont aussi offerts si tu invites tes amis à nous rejoindre.",
    "faq_refund_question": "Puis-je être remboursé ?",
    "faq_refund_answer": "En cas d'annulation du match (pluie, terrain fermé...), tu es automatiquement remboursé. Pour d'autres cas, contacte notre équipe.",
    
    // FAQ Business
    "faq_organize_question": "Puis-je aider à organiser des matchs ?",
    "faq_organize_answer": "Oui ! Nous recrutons des Capitaines Rayo pour accueillir les joueurs, gérer le matériel et animer les matchs. C'est une mission rémunérée. Contacte-nous si tu es intéressé(e).",
    "faq_ideal_field_question": "À quoi ressemble un terrain Rayo Sport idéal ?",
    "faq_ideal_field_answer": "Un terrain 5vs5 de type City Foot, avec gazon synthétique, vestiaires et douches. Nous sélectionnons des lieux accessibles, bien entretenus, et adaptés à notre format de jeu. Si tu connais un bon terrain, écris-nous !",
    "faq_found_field_question": "J'ai trouvé un bon terrain ! On peut y jouer ?",
    "faq_found_field_answer": "Super ! Envoie-nous les infos (photos, localisation). Si le terrain convient, on pourra organiser des matchs rapidement.",
    "faq_own_field_question": "Je possède un terrain. Peut-on collaborer ?",
    "faq_own_field_answer": "Oui ! Si tu gères ou possèdes un espace (terrain privé, centre sportif, etc.), nous sommes ouverts aux partenariats. Écris-nous !",
    "faq_merchandise_question": "Où puis-je trouver des produits Rayo Sport ?",
    "faq_merchandise_answer": "Des tenues, goodies et articles exclusifs seront bientôt disponibles pour les membres. Reste connecté sur notre site et notre appli !",
    "faq_brand_collab_question": "Puis-je collaborer avec Rayo Sport avec ma marque ?",
    "faq_brand_collab_answer": "Oui, nous sommes ouverts aux collaborations et sponsors. Que vous soyez une marque sportive, locale ou nationale, contactez-nous pour co-créer une activation autour du sport urbain.",
    
    "faq_more_questions": "Tu as d'autres questions ?",
    "faq_contact_us": "Contacte-nous sur WhatsApp",
    
    // CTA Section
    "cta_title": "Prêt à rejoindre le mouvement ?",
    "cta_subtitle": "Rejoins une communauté passionnée et vis une expérience de football unique",
    "cta_whatsapp": "Rejoindre sur WhatsApp",
    "cta_instagram": "Suivre sur Instagram",
    "cta_button_app": "Télécharger l'application (bientôt)",
    
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
    "hero_cta_primary": "انضم إلى مباراة",
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
    "faq_category_general": "عام",
    "faq_category_gameplay": "طريقة اللعب",
    "faq_category_logistics": "الخدمات اللوجستية",
    "faq_category_business": "التعاون",
    
    // FAQ Général
    "faq_what_is_question": "ما هو رايو سبورت؟",
    "faq_what_is_answer": "رايو سبورت هي منصة مجتمعية تعيد ابتكار كرة القدم الحضرية في المغرب. ننظم مباريات 5 ضد 5 وشكلًا فريدًا يسمى رايو كلاش (3 فرق، مباريات من 5 دقائق، الخاسر يخرج) على ملاعب ثابتة في الدار البيضاء والمناطق المحيطة بها. هدفنا هو تقديم تجربة ممتعة ومتاحة وتنافسية لجميع المتحمسين، بغض النظر عن مستواهم.",
    "faq_city_question": "هل رايو سبورت متوفر في مدينتي؟",
    "faq_city_answer": "بدأنا في الدار البيضاء ونتوسع تدريجيًا في جميع أنحاء المنطقة (دار بوعزة، بوسكورة، عين السبع، إلخ). إذا كنت تريد أن يصل رايو بالقرب منك، اتصل بنا أو اقترح ملعبًا تعرفه.",
    "faq_fields_question": "لماذا على ملاعب صغيرة؟",
    "faq_fields_answer": "نريد أن تكون كرة القدم سهلة المنال. تسمح الملاعب الصغيرة بتحسين المساحة في المدينة، ويجعل الشكل المصغر اللعبة أسرع وأكثر تقنية وشمولاً.",
    "faq_skill_question": "ما المستوى المطلوب للعب؟",
    "faq_skill_answer": "نرحب بجميع المستويات! تصنف مجموعاتنا أحيانًا حسب المستوى (مبتدئ، متوسط، متقدم). إذا لم تكن قد لعبت من قبل أو إذا كنت لاعبًا محترفًا، ستجد مكانك. لا تتردد في الاتصال بنا إذا كان لديك شك.",
    
    // FAQ Gameplay
    "faq_games_question": "كيف تبدو مباريات رايو سبورت؟",
    "faq_games_answer": "تستمر كل جلسة 60 دقيقة، مع العديد من المباريات التي تستمر 5 دقائق. هناك 3 فرق من 5 لاعبين. بعد كل مباراة، يخرج الفريق الخاسر ويدخل فريق آخر. المباريات منظمة، مضبوطة الإيقاع، ومصورة. تغادر مع إحصائيات، صور، وأحيانًا حتى لقطات فيديو بارزة!",
    "faq_bring_question": "ماذا يجب أن أحضر؟",
    "faq_bring_answer_intro": "نحن نعتني بكل شيء: كرات، صدريات، معدات. عليك فقط أن تأتي مع:",
    "faq_bring_item1": "ملابس رياضية",
    "faq_bring_item2": "أحذية رياضية أو أحذية للعشب الاصطناعي (لا مسامير معدنية)",
    "faq_bring_item3": "روحك المرحة!",
    "faq_age_question": "ما هو الحد الأدنى للسن للعب؟",
    "faq_age_answer": "المباريات مخصصة للبالغين (18+)، لكننا نقبل الشباب من سن 15 سنة فما فوق بشرط تقديم إذن خطي من الوالدين.",
    
    // FAQ Logistique
    "faq_book_question": "كيف أحجز مكانًا لمباراة؟",
    "faq_book_answer": "انضم إلى مجموعة الواتساب الخاصة بنا أو احجز مباشرة عبر تطبيق الهاتف المحمول الخاص بنا (قريبًا). يتم نشر المواعيد كل أسبوع، والأماكن تنفد بسرعة!",
    "faq_cant_attend_question": "ماذا لو لم أستطع الحضور؟",
    "faq_cant_attend_answer": "أخبرنا في أقرب وقت ممكن حتى نتمكن من عرض مكانك على لاعب آخر. المباريات أفضل عندما يكون الجميع حاضرين!",
    "faq_cost_question": "كم تكلف؟",
    "faq_cost_answer": "المباراة الأولى مجانية! بعد ذلك، يمكنك الدفع لكل جلسة أو الاشتراك في اشتراك شهري. يتم أيضًا تقديم خصومات أو مباريات مجانية إذا قمت بدعوة أصدقائك للانضمام إلينا.",
    "faq_refund_question": "هل يمكنني استرداد المال؟",
    "faq_refund_answer": "في حالة إلغاء المباراة (بسبب المطر، إغلاق الملعب...)، يتم رد أموالك تلقائيًا. بالنسبة للحالات الأخرى، اتصل بفريقنا.",
    
    // FAQ Business
    "faq_organize_question": "هل يمكنني المساعدة في تنظيم المباريات؟",
    "faq_organize_answer": "نعم! نحن نوظف قادة رايو لاستقبال اللاعبين، وإدارة المعدات، وتنشيط المباريات. إنها مهمة مدفوعة الأجر. اتصل بنا إذا كنت مهتمًا.",
    "faq_ideal_field_question": "كيف يبدو ملعب رايو سبورت المثالي؟",
    "faq_ideal_field_answer": "ملعب 5 ضد 5 من نوع City Foot، مع عشب اصطناعي، غرف تبديل ملابس ودوشات. نختار أماكن يسهل الوصول إليها، جيدة الصيانة، ومناسبة لنمط لعبنا. إذا كنت تعرف ملعبًا جيدًا، اكتب لنا!",
    "faq_found_field_question": "لقد وجدت ملعبًا جيدًا! هل يمكننا اللعب فيه؟",
    "faq_found_field_answer": "رائع! أرسل لنا المعلومات (صور، موقع). إذا كان الملعب مناسبًا، يمكننا تنظيم مباريات بسرعة.",
    "faq_own_field_question": "أمتلك ملعبًا. هل يمكننا التعاون؟",
    "faq_own_field_answer": "نعم! إذا كنت تدير أو تمتلك مساحة (ملعب خاص، مركز رياضي، إلخ)، فنحن منفتحون على الشراكات. اكتب لنا!",
    "faq_merchandise_question": "أين يمكنني العثور على منتجات رايو سبورت؟",
    "faq_merchandise_answer": "ستكون الملابس والهدايا والمواد الحصرية متاحة قريبًا للأعضاء. ابق على اتصال على موقعنا وتطبيقنا!",
    "faq_brand_collab_question": "هل يمكنني التعاون مع رايو سبورت مع علامتي التجارية؟",
    "faq_brand_collab_answer": "نعم، نحن منفتحون على التعاون والرعاة. سواء كنت علامة تجارية رياضية، محلية أو وطنية، اتصل بنا للمشاركة في إنشاء تفعيل حول الرياضة الحضرية.",
    
    "faq_more_questions": "هل لديك أسئلة أخرى؟",
    "faq_contact_us": "تواصل معنا على واتساب",
    
    // CTA Section
    "cta_title": "مستعد للانضمام إلى الحركة؟",
    "cta_subtitle": "انضم إلى مجتمع متحمس وعش تجربة كرة قدم فريدة",
    "cta_whatsapp": "انضم عبر واتساب",
    "cta_instagram": "تابعنا على انستغرام",
    "cta_button_app": "تحميل التطبيق (قريبًا)",
    
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