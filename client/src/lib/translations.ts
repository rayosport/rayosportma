import { Language } from "./i18n";

export type TranslationRecord = Record<string, string>;

export const translations: Record<Language, TranslationRecord> = {
  ar: {
    // Navigation
    "nav_home": "الرئيسية",
    "nav_football": "كرة القدم",
    "nav_padel": "البادل",
    "nav_kids": "الأطفال",
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
    
    // Gallery Section
    "gallery_title": "معرض الصور",
    "gallery_subtitle": "اكتشف تجربة رايو سبورت بالصور: المباريات والفرق والملاعب واللحظات المميزة من مجتمعنا",
    "gallery_view_more": "عرض جميع الصور",
    
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
    
    // Player Stats
    "no_game_played_this_month": "لم يتم لعب أي مباراة هذا الشهر",
  },
  
  en: {
    // Navigation
    "nav_home": "Home",
    "nav_football": "Football",
    "nav_padel": "Padel",
    "nav_kids": "Kids",
    "nav_about": "About",
    "nav_how": "How it works",
    "nav_rules": "Formats & Rules",
    "nav_leaderboard": "Leaderboard",
    "nav_faq": "FAQ",
    "nav_join": "Join",
    
    // Hero Section
    "hero_title": "Play football",
    "hero_title_highlight": "when it suits you!",
    "hero_subtitle": "Want football without commitment? Book a match whenever you want!",
    "hero_cta_primary": "Join WhatsApp groups",
    "hero_cta_secondary": "Upcoming matches",
    "hero_players_text": "players already registered",
    
    // About Section
    "about_title": "What is Rayo Sport?",
    "about_subtitle": "A new way to experience community football in Morocco",
    "about_concept_title": "Our Concept",
    "about_concept_text": "Rayo Sport is a community platform that organizes 5vs5 football matches and innovative 3-team rotations in Moroccan cities. We offer a premium experience with uniforms, referees and professional photos.",
    "about_mission_title": "Our Mission",
    "about_mission_text": "Become the #1 platform for community football in Morocco by creating unforgettable experiences that allow players of all levels to shine on the field.",
    "about_vision_title": "Our Vision",
    "about_vision_text": "Create an ecosystem where football becomes more than just a game: an active community, a progression platform and a place where local legends are born every week.",
    
    // How It Works Section
    "how_title": "How It Works",
    "how_subtitle": "Joining the Rayo Sport community is simple and fun",
    "how_step1_title": "Join a WhatsApp group",
    "how_step1_description": "Join our local WhatsApp group to be informed of upcoming matches in your city.",
    "how_step2_title": "Book a match",
    "how_step2_description": "Choose your slot, pay your place and get ready to play.",
    "how_step3_title": "Play. Score. Shine.",
    "how_step3_description": "Enjoy a premium experience with uniforms, referees and quality field.",
    "how_step4_title": "Receive stats and highlights",
    "how_step4_description": "After the match, receive your statistics, highlights and updated ranking.",
    "how_cta_button": "Join now",
    
    // Rules Section
    "rules_title": "Formats & Rules",
    "rules_subtitle": "Discover our different game formats and rules",
    "rules_classic_title": "Rayo Classic",
    "rules_classic_description": "Traditional 5vs5 or 7vs7 matches with balanced teams",
    "rules_rush_title": "Rayo Rush",
    "rules_rush_description": "3 teams, 5-minute matches, loser is out",
    "rules_battle_title": "Rayo Battle",
    "rules_battle_description": "4 teams, intense competition format",
    "rules_rankings_title": "Ranking System",
    "rules_rankings_1": "All players receive a performance rating after each match",
    "rules_rankings_2": "Statistics include: goals, assists, wins, MVP",
    "rules_rankings_3": "Weekly and monthly ranking of best players",
    "rules_rankings_4": "Badge system to reward exceptional performances",
    "rules_rankings_5": "Elite players are invited to special events",
    
    // FAQ Section
    "faq_title": "Frequently Asked Questions",
    "faq_subtitle": "Everything you need to know before joining a Rayo match",
    "faq_q1": "How to book?",
    "faq_a1": "Join our WhatsApp group, check available matches and confirm your spot by paying through the proposed options (usually by mobile money).",
    "faq_q2": "How much does it cost?",
    "faq_a2": "The standard price is 50-70 MAD per player per match, which includes the field, referee, uniforms and professional photos.",
    "faq_q3": "Do I need to bring my equipment?",
    "faq_a3": "Just bring your football shoes and a water bottle. We provide jerseys, bibs and all necessary equipment.",
    "faq_q4": "Can I come if I'm not good?",
    "faq_a4": "Absolutely! We welcome all levels. Teams are balanced and the atmosphere is always friendly and respectful.",
    "faq_q5": "Is there a Rayo Sport app?",
    "faq_a5": "Our app is in development. In the meantime, all bookings and communications are done via WhatsApp and Instagram.",
    "faq_q6": "Where do the matches take place?",
    "faq_a6": "We organize matches in several cities in Morocco: Casablanca, Rabat, Marrakech, Tangier, and soon others. Fields are carefully selected for their quality.",
    "faq_more_questions": "Have other questions?",
    "faq_contact_link": "Contact us on WhatsApp",
    
    // Testimonials Section
    "testimonials_title": "What our players say",
    "testimonials_subtitle": "Discover the testimonials from our community of passionate players",
    
    // CTA Section
    "cta_title": "Ready to join us?",
    "cta_subtitle": "Join the Rayo Sport community and participate in our sports activities!",
    "cta_button": "Join WhatsApp",
    "cta_button_secondary": "View our activities",
    
    // Placeholder
    "This section is under development. Check back soon!": "This section is under development. Check back soon!",
    
    // Player Stats
    "no_game_played_this_month": "No game played this month",
  },
  
  es: {
    // Navigation
    "nav_home": "Inicio",
    "nav_football": "Fútbol",
    "nav_padel": "Padel",
    "nav_kids": "Kids",
    "nav_about": "Acerca de",
    "nav_how": "Cómo funciona",
    "nav_rules": "Formatos y Reglas",
    "nav_leaderboard": "Clasificación",
    "nav_faq": "FAQ",
    "nav_join": "Unirse",
    
    // Hero Section
    "hero_title": "Juega fútbol",
    "hero_title_highlight": "cuando te convenga!",
    "hero_subtitle": "¿Quieres fútbol sin compromiso? ¡Reserva un partido cuando quieras!",
    "hero_cta_primary": "Unirse a grupos WhatsApp",
    "hero_cta_secondary": "Próximos partidos",
    "hero_players_text": "jugadores ya registrados",
    
    // About Section
    "about_title": "¿Qué es Rayo Sport?",
    "about_subtitle": "Una nueva forma de vivir el fútbol comunitario en Marruecos",
    "about_concept_title": "Nuestro Concepto",
    "about_concept_text": "Rayo Sport es una plataforma comunitaria que organiza partidos de fútbol 5vs5 y rotaciones innovadoras de 3 equipos en las ciudades marroquíes. Ofrecemos una experiencia premium con uniformes, árbitros y fotos profesionales.",
    "about_mission_title": "Nuestra Misión",
    "about_mission_text": "Convertirnos en la plataforma #1 para el fútbol comunitario en Marruecos creando experiencias inolvidables que permitan a jugadores de todos los niveles brillar en el campo.",
    "about_vision_title": "Nuestra Visión",
    "about_vision_text": "Crear un ecosistema donde el fútbol se convierta en algo más que un simple juego: una comunidad activa, una plataforma de progresión y un lugar donde nacen leyendas locales cada semana.",
    
    // How It Works Section
    "how_title": "Cómo Funciona",
    "how_subtitle": "Unirse a la comunidad Rayo Sport es simple y divertido",
    "how_step1_title": "Unirse a un grupo WhatsApp",
    "how_step1_description": "Únete a nuestro grupo WhatsApp local para estar informado de los próximos partidos en tu ciudad.",
    "how_step2_title": "Reservar un partido",
    "how_step2_description": "Elige tu horario, paga tu lugar y prepárate para jugar.",
    "how_step3_title": "Jugar. Marcar. Brillar.",
    "how_step3_description": "Disfruta de una experiencia premium con uniformes, árbitros y campo de calidad.",
    "how_step4_title": "Recibir estadísticas y highlights",
    "how_step4_description": "Después del partido, recibe tus estadísticas, momentos destacados y clasificación actualizada.",
    "how_cta_button": "Unirse ahora",
    
    // Rules Section
    "rules_title": "Formatos y Reglas",
    "rules_subtitle": "Descubre nuestros diferentes formatos de juego y reglas",
    "rules_classic_title": "Rayo Classic",
    "rules_classic_description": "Partidos tradicionales 5vs5 o 7vs7 con equipos equilibrados",
    "rules_rush_title": "Rayo Rush",
    "rules_rush_description": "3 equipos, partidos de 5 minutos, el perdedor sale",
    "rules_battle_title": "Rayo Battle",
    "rules_battle_description": "4 equipos, formato de competición intensa",
    "rules_rankings_title": "Sistema de Clasificación",
    "rules_rankings_1": "Todos los jugadores reciben una calificación de rendimiento después de cada partido",
    "rules_rankings_2": "Las estadísticas incluyen: goles, asistencias, victorias, MVP",
    "rules_rankings_3": "Clasificación semanal y mensual de los mejores jugadores",
    "rules_rankings_4": "Sistema de insignias para recompensar actuaciones excepcionales",
    "rules_rankings_5": "Los jugadores de élite son invitados a eventos especiales",
    
    // FAQ Section
    "faq_title": "Preguntas Frecuentes",
    "faq_subtitle": "Todo lo que necesitas saber antes de unirte a un partido Rayo",
    "faq_q1": "¿Cómo reservar?",
    "faq_a1": "Únete a nuestro grupo WhatsApp, consulta los partidos disponibles y confirma tu lugar pagando a través de las opciones propuestas (generalmente por dinero móvil).",
    "faq_q2": "¿Cuánto cuesta?",
    "faq_a2": "El precio estándar es de 50-70 MAD por jugador por partido, que incluye el campo, árbitro, uniformes y fotos profesionales.",
    "faq_q3": "¿Necesito traer mi equipo?",
    "faq_a3": "Solo trae tus zapatos de fútbol y una botella de agua. Proporcionamos camisetas, petos y todo el equipo necesario.",
    "faq_q4": "¿Puedo venir si no soy bueno?",
    "faq_a4": "¡Absolutamente! Damos la bienvenida a todos los niveles. Los equipos están equilibrados y el ambiente es siempre amigable y respetuoso.",
    "faq_q5": "¿Hay una aplicación Rayo Sport?",
    "faq_a5": "Nuestra aplicación está en desarrollo. Mientras tanto, todas las reservas y comunicaciones se hacen vía WhatsApp e Instagram.",
    "faq_q6": "¿Dónde se realizan los partidos?",
    "faq_a6": "Organizamos partidos en varias ciudades de Marruecos: Casablanca, Rabat, Marrakech, Tánger, y pronto otras. Los campos son cuidadosamente seleccionados por su calidad.",
    "faq_more_questions": "¿Tienes otras preguntas?",
    "faq_contact_link": "Contáctanos en WhatsApp",
    
    // Testimonials Section
    "testimonials_title": "Lo que dicen nuestros jugadores",
    "testimonials_subtitle": "Descubre los testimonios de nuestra comunidad de jugadores apasionados",
    
    // CTA Section
    "cta_title": "¿Listo para unirte?",
    "cta_subtitle": "¡Únete a la comunidad Rayo Sport y participa en nuestras actividades deportivas!",
    "cta_button": "Unirse a WhatsApp",
    "cta_button_secondary": "Ver nuestras actividades",
    
    // Football Page
    "football_hero_loading": "Cargando...",
    "football_hero_active_players": "Jugadores Activos",
    "football_hero_where_every_player": "Donde cada jugador encuentra su lugar",
    "football_hero_beginner_or_pro": "Principiante o Pro • Junior o Senior • Hombres y Mujeres",
    "football_hero_cities": "Ciudades",
    "football_hero_matches_per_month": "Partidos/Mes",
    "football_hero_available": "Disponible",
    "football_hero_play_now": "Jugar Ahora",
    "football_hero_leaderboard": "Clasificación",
    "football_hero_previous_games": "Partidos Anteriores",
    "football_city_players": "Jugadores",
    "football_city_matches_per_week": "Partidos/Semana",
    "football_city_next_match": "Próximo partido",
    "football_city_loading": "Cargando...",
    "football_city_available": "Disponible",
    "football_city_full": "Completo",
    "football_city_need_players": "Necesita más jugadores",
    "football_city_no_match": "Sin partido",
    "football_city_waitlist": "Lista de espera",
    "football_city_join": "Unirse",
    "football_city_more_info": "Más información",
    "football_city_top_players": "🏆 Top 3 Jugadores",
    "football_city_loading_players": "Cargando...",
    "football_city_no_players_found": "No se encontraron jugadores",
    "football_city_men": "Hombres",
    "football_city_women": "Mujeres",
    
    // Placeholder
    "This section is under development. Check back soon!": "Esta sección está en desarrollo. ¡Vuelve pronto!",
    
    // Player Stats
    "no_game_played_this_month": "No se jugó ningún partido este mes",
  },
  fr: {
    // Navigation
    "nav_home": "Accueil",
    "nav_football": "Football",
    "nav_padel": "Padel",
    "nav_kids": "Kids",
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
    "rules_subtitle": "Découvrez nos différents formats de jeu et règles",
    "rules_classic_title": "Rayo Classic",
    "rules_classic_description": "Matchs traditionnels 5vs5 ou 7vs7 avec équipes équilibrées",
    "rules_rush_title": "Rayo Rush",
    "rules_rush_description": "3 équipes, matchs de 5 minutes, le perdant sort",
    "rules_battle_title": "Rayo Battle",
    "rules_battle_description": "4 équipes, format de compétition intense",
    "rules_rankings_title": "Système de Classement",
    "rules_rankings_1": "Tous les joueurs reçoivent une note de performance après chaque match",
    "rules_rankings_2": "Les statistiques incluent : buts, passes décisives, victoires, MVP",
    "rules_rankings_3": "Classement hebdomadaire et mensuel des meilleurs joueurs",
    "rules_rankings_4": "Système de badges pour récompenser les performances exceptionnelles",
    "rules_rankings_5": "Les joueurs d'élite sont invités à des événements spéciaux",
    
    // FAQ Section
    "faq_title": "Questions Fréquentes",
    "faq_subtitle": "Tout ce que vous devez savoir avant de rejoindre un match Rayo",
    "faq_q1": "Comment réserver ?",
    "faq_a1": "Rejoignez notre groupe WhatsApp, consultez les matchs disponibles et confirmez votre place en payant via les options proposées (généralement par mobile money).",
    "faq_q2": "Combien ça coûte ?",
    "faq_a2": "Le prix standard est de 50-70 MAD par joueur par match, incluant le terrain, l'arbitre, les uniformes et les photos professionnelles.",
    "faq_q3": "Dois-je apporter mon équipement ?",
    "faq_a3": "Apportez juste vos chaussures de foot et une bouteille d'eau. Nous fournissons les maillots, les chasubles et tout l'équipement nécessaire.",
    "faq_q4": "Puis-je venir si je ne suis pas bon ?",
    "faq_a4": "Absolument ! Nous accueillons tous les niveaux. Les équipes sont équilibrées et l'ambiance est toujours amicale et respectueuse.",
    "faq_q5": "Y a-t-il une app Rayo Sport ?",
    "faq_a5": "Notre application est en développement. En attendant, toutes les réservations et communications se font via WhatsApp et Instagram.",
    "faq_q6": "Où se déroulent les matchs ?",
    "faq_a6": "Nous organisons des matchs dans plusieurs villes marocaines : Casablanca, Rabat, Marrakech, Tanger, et bientôt d'autres. Les terrains sont soigneusement sélectionnés pour leur qualité.",
    "faq_more_questions": "D'autres questions ?",
    "faq_contact_link": "Contactez-nous sur WhatsApp",
    
    // Testimonials Section
    "testimonials_title": "Ce que disent nos joueurs",
    "testimonials_subtitle": "Découvrez les témoignages de notre communauté de joueurs passionnés",
    
    // CTA Section
    "cta_title": "Prêt à nous rejoindre ?",
    "cta_subtitle": "Rejoignez la communauté Rayo Sport et participez à nos activités sportives !",
    "cta_button": "Rejoindre WhatsApp",
    "cta_button_secondary": "Voir nos activités",
    
    // Football Page
    "football_hero_loading": "Chargement...",
    "football_hero_active_players": "Joueurs Actifs",
    "football_hero_where_every_player": "Où chaque joueur trouve sa place",
    "football_hero_beginner_or_pro": "Débutant ou Pro • Junior ou Senior • Hommes & Femmes",
    "football_hero_cities": "Villes",
    "football_hero_matches_per_month": "Matchs/Mois",
    "football_hero_available": "Disponible",
    "football_hero_play_now": "Jouer Maintenant",
    "football_hero_leaderboard": "Classement",
    "football_hero_previous_games": "Previous Games",
    "football_city_players": "Joueurs",
    "football_city_matches_per_week": "Matchs/Semaine",
    "football_city_next_match": "Prochain match",
    "football_city_loading": "Chargement...",
    "football_city_available": "Disponible",
    "football_city_full": "Complet",
    "football_city_need_players": "Besoin d'autres joueurs",
    "football_city_no_match": "Aucun match",
    "football_city_waitlist": "Waitlist",
    "football_city_join": "Rejoindre",
    "football_city_more_info": "Plus d'infos",
    "football_city_top_players": "🏆 Top 5 Joueurs",
    "football_city_loading_players": "Chargement...",
    "football_city_no_players_found": "Aucun joueur trouvé",
    "football_city_men": "Hommes",
    "football_city_women": "Femmes",
    
    // Placeholder
    "This section is under development. Check back soon!": "Cette section est en développement. Revenez bientôt !",
    
    // Player Stats
    "no_game_played_this_month": "Aucun match joué ce mois-ci",
  }
};