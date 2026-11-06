// UI strings for every supported locale.
//
// `en` is the source of truth for the key set. `ar` is typed as
// Record<TranslationKey, string>, so a missing or extra key is a compile error.
// Placeholders use {name} and are filled by t(key, { name: ... }).
//
// DB-driven content (Meeqat, journey steps, boundaries) is NOT here — it comes
// from the API with *Ar fields and is chosen with pick().

export type Locale = 'en' | 'ar'

const en = {
  // ── Site / common ──
  'site.name': 'Journey to Hajj',
  'common.retry': 'Retry',
  'common.tryAgain': 'Try again',
  'common.loading': 'Loading…',

  // ── Language switch ──
  'lang.switchLabel': 'Switch language to Arabic',
  'lang.switchText': 'العربية',

  // ── Navbar ──
  'nav.home': 'Home',
  'nav.journey': 'The Journey',
  'nav.boundaries': 'Sacred Boundaries',
  'nav.meeqat': 'Meeqat Points',
  'nav.articles': 'Articles',
  'nav.toggleMenu': 'Toggle menu',

  // ── Footer ──
  'footer.credit': 'Created with reverence and respect.',

  // ── Home ──
  'home.metaDescription':
    'An interactive guide to the sacred pilgrimage of Hajj — explore the Meeqat points, sacred boundaries, and the step-by-step spiritual journey.',
  'home.heading': 'Embark on a Spiritual Journey',
  'home.intro':
    'Hajj is one of the five pillars of Islam, a sacred pilgrimage to Makkah that every Muslim who is physically and financially able must undertake at least once in their lifetime. Discover the profound spiritual experience, the historic sites, and the journey of millions of believers.',
  'hero.title': 'The Sacred Journey of Hajj',
  'hero.subtitle': 'Explore the spiritual pilgrimage that millions undertake each year',

  'entry.explore': 'Explore',
  'entry.journey.title': 'The Journey',
  'entry.journey.description':
    'Follow the complete narrative of Hajj, from preparation to the final farewell. Learn about each ritual, its significance, and the spiritual transformation pilgrims experience.',
  'entry.boundaries.title': 'Sacred Boundaries',
  'entry.boundaries.description':
    'Explore the Al-Haram boundary and the greater Makkah territory. Discover the sacred zones and their significance in the pilgrimage.',
  'entry.meeqat.title': 'Meeqat Points',
  'entry.meeqat.description':
    'Navigate the complete Meeqat locations with an interactive map showing the stations where pilgrims enter Ihram. Get directions and explore each location.',

  'stats.pilgrims.value': 'Over 2 Million',
  'stats.pilgrims.label': 'Pilgrims perform Hajj annually from around the world',
  'stats.duration.value': '5-6 Days',
  'stats.duration.label': 'The duration of the Hajj pilgrimage rituals',
  'stats.years.value': '1,400+ Years',
  'stats.years.label': 'Of continuous pilgrimage tradition since Prophet Muhammad ﷺ',

  // ── Journey ──
  'journey.metaTitle': 'The Journey of Hajj',
  'journey.metaDescription':
    'Follow the complete step-by-step narrative of Hajj — from intention and Ihram through the farewell Tawaf — with explanations of each major rite.',
  'journey.heroTitle': 'The Journey of Hajj',
  'journey.heroSubtitle':
    'Follow the step-by-step spiritual journey from intention to farewell Tawaf, understanding each major rite along the way.',
  'journey.overviewTitle': 'Overview of the Pilgrimage',
  'journey.overviewIntro':
    'This page gives a high-level narrative of the Hajj journey. It is not a fiqh ruling, but an educational overview to pair with the interactive maps in this site.',
  'journey.loadError': 'Failed to load journey steps. Is the backend running?',

  // ── Meeqat page ──
  'meeqatPage.metaTitle': 'Meeqat Points',
  'meeqatPage.metaDescription':
    'Explore the five Meeqat stations on an interactive map — the designated boundaries where pilgrims enter Ihram before approaching Makkah.',
  'meeqatPage.heroTitle': 'The Meeqat Points',
  'meeqatPage.heroSubtitle':
    'Designated stations where pilgrims enter the state of Ihram before entering Makkah',
  'meeqatPage.understandingTitle': 'Understanding the Meeqat',
  'meeqatPage.understandingBody':
    'The Meeqat (ميقات, pl. مواقيت) are the designated stations where pilgrims must enter the state of Ihram before proceeding to Makkah. They were established by the Prophet ﷺ for people coming from different directions, and every pilgrim — whether arriving by land, sea, or air — must pass through or align with one of these points.',
  'meeqatPage.directionsTitle': 'Directions to any Meeqat',
  'meeqatPage.directionsBefore': 'Tap any marker on the map above to open its details. The ',
  'meeqatPage.directionsAfter':
    ' button will open Google Maps with directions from your current location to that Meeqat.',
  'meeqatPage.dhulHulayfah.name': 'Dhul-Hulayfah',
  'meeqatPage.dhulHulayfah.for': 'Madinah and beyond',
  'meeqatPage.dhulHulayfah.distance': '~450 km',
  'meeqatPage.alJuhfah.name': 'Al-Juhfah',
  'meeqatPage.alJuhfah.for': 'Syria, Egypt, Morocco',
  'meeqatPage.alJuhfah.distance': '~187 km',
  'meeqatPage.qarnAlManazil.name': 'Qarn al-Manazil',
  'meeqatPage.qarnAlManazil.for': 'Najd region',
  'meeqatPage.qarnAlManazil.distance': '~94 km',
  'meeqatPage.yalamlam.name': 'Yalamlam',
  'meeqatPage.yalamlam.for': 'Yemen and South',
  'meeqatPage.yalamlam.distance': '~120 km',
  'meeqatPage.dhatIrq.name': "Dhat 'Irq",
  'meeqatPage.dhatIrq.for': 'Iraq and Northeast',
  'meeqatPage.dhatIrq.distance': '~94 km',
  'meeqatPage.forLabel': 'For:',
  'meeqatPage.distanceLabel': 'Distance:',
  'meeqatPage.fromMakkah': 'from Makkah',
  'meeqatPage.noteLabel': 'Note:',
  'meeqatPage.noteBody':
    'Pilgrims traveling by air typically enter Ihram before boarding their flight or at the designated facilities at King Abdulaziz International Airport in Jeddah. Consult a qualified scholar for the ruling specific to your route.',

  // ── Meeqat map ──
  'meeqatMap.loadError': 'Failed to load Meeqat data. Is the backend running?',
  'meeqatMap.loadingMap': 'Loading map…',
  'meeqatMap.hideRoutes': 'Hide Routes',
  'meeqatMap.showRoutes': 'Show Routes',
  'meeqatMap.hideArcs': 'Hide Arcs',
  'meeqatMap.showArcs': 'Show Arcs',
  'meeqatMap.makkahTitle': '🕋 Makkah al-Mukarramah',
  'meeqatMap.makkahText': 'The Holy City and destination of all Hajj pilgrims.',
  'meeqatMap.forLabel': 'For:',
  'meeqatMap.generalPilgrims': 'General pilgrims',
  'meeqatMap.navigate': 'Navigate',
  'meeqatMap.imageAlt': '{name} {n}',
  'meeqatMap.legendTitle': 'Meeqat Points Legend',
  'meeqatMap.legendMakkah': 'Makkah',
  'meeqatMap.legendTip': '💡 Click any marker for photos, details & directions',

  // ── Sacred Boundaries page ──
  'boundariesPage.metaTitle': 'Sacred Boundaries of Makkah',
  'boundariesPage.metaDescription':
    'Discover the Al-Haram sanctuary boundary and the sacred zones around Makkah — their significance, rulings, and geographic extent — on an interactive map.',
  'boundariesPage.heroTitle': 'Sacred Boundaries of Makkah',
  'boundariesPage.heroSubtitle':
    'Learn about the Al-Haram sanctuary and the wider area around Makkah that has special rulings and virtues.',
  'boundariesPage.heading': 'Understanding the Haram',
  'boundariesPage.paragraph1':
    'The city of Makkah and its surrounding sanctuary, known as Al-Haram, have been honored by Allah with special rulings and protection. Within these sacred boundaries, hunting game, cutting trees, and causing harm are strictly prohibited, emphasizing peace and reverence.',
  'boundariesPage.paragraph2':
    'Classical scholars describe specific boundary points around Makkah, often marked historically by stones or signs. Modern maps and signposts help pilgrims know when they are entering or leaving the Haram area.',
  'boundariesPage.loadError': 'Failed to load boundary information. Is the backend running?',
  'boundariesPage.cardNote':
    'This represents one reference point on the Haram boundary; the actual sanctuary line follows specific marked points and is not a perfect circle.',
  'boundariesPage.disclaimer':
    'This page is a conceptual illustration of the sacred boundaries, designed to complement the interactive Meeqat map. For precise fiqh details, pilgrims should refer to qualified scholars and official guidance.',
  'boundariesPage.legendTitle': 'Boundary Legend',
  'boundariesPage.legendItem':
    'Conceptual marker on the Haram boundary (not to scale or exact shape).',
  'boundariesPage.legendFooter':
    'The map above is an educational approximation. For precise fiqh boundaries, consult qualified scholars and official signage around Makkah.',

  // ── Haram boundary map ──
  'boundaryMap.loadError': 'Failed to load boundary data. Is the backend running?',
  'boundaryMap.loadingMap': 'Loading map…',
  'boundaryMap.masjidTitle': '🕋 Masjid al-Haram',
  'boundaryMap.masjidText': 'Approximate center point of the Haram sanctuary in Makkah.',
  'boundaryMap.pointFallback': 'Boundary Point',
  'boundaryMap.polygonTitle': 'Approximate Haram Boundary',
  'boundaryMap.polygonText':
    "This polygon is an educational approximation of the sanctuary boundary based on well-known points like at-Tan'im, Al-Ji'ranah, Idhat Liban, and Hudaybiyyah.",

  // ── Not found / errors ──
  'notFound.metaTitle': 'Page Not Found — Journey to Hajj',
  'notFound.metaDescription': 'The page you are looking for does not exist.',
  'notFound.heading': 'Page Not Found',
  'notFound.text': "The page you're looking for doesn't exist.",
  'notFound.home': 'Return Home',
  'unavailable.metaTitle': 'Page Not Available',
  'unavailable.metaDescription': 'This page is not available.',
  'unavailable.heading': "This page isn't available",
  'unavailable.text': 'If you were given a private link, please open it exactly as it was shared with you.',
  'articles.metaTitle': 'Articles',
  'articles.metaDescription': 'Articles on the pilgrimage of Hajj, in English and Arabic.',
  'articles.heroTitle': 'Articles',
  'articles.heroSubtitle': 'Reflections and guidance on the pilgrimage of Hajj',
  'articles.loadError': 'Failed to load articles. Is the backend running?',
  'articles.empty': 'No articles have been published yet.',
  'articles.read': 'Read article',
  'article.loadError': 'Failed to load this article.',
  'article.publishedOn': 'Published {date}',
  'error.app.title': 'Something went wrong',
  'error.app.text': 'An unexpected error occurred. Please try refreshing the page.',
  'error.map.text': 'The map encountered an error and could not render.',
  'error.map.fallbackMessage': 'An unexpected error occurred.',
} as const

export type TranslationKey = keyof typeof en

const ar: Record<TranslationKey, string> = {
  // ── Site / common ──
  'site.name': 'رحلة إلى الحج',
  'common.retry': 'إعادة المحاولة',
  'common.tryAgain': 'حاول مرة أخرى',
  'common.loading': 'جارٍ التحميل…',

  // ── Language switch ──
  'lang.switchLabel': 'التبديل إلى اللغة الإنجليزية',
  'lang.switchText': 'English',

  // ── Navbar ──
  'nav.home': 'الرئيسية',
  'nav.journey': 'رحلة الحج',
  'nav.boundaries': 'حدود الحرم',
  'nav.meeqat': 'المواقيت',
  'nav.articles': 'مقالات',
  'nav.toggleMenu': 'فتح القائمة أو إغلاقها',

  // ── Footer ──
  'footer.credit': 'أُعدّ هذا الموقع بخشوع واحترام.',

  // ── Home ──
  'home.metaDescription':
    'دليل تفاعلي لفريضة الحج — استكشف مواقيت الإحرام وحدود الحرم والرحلة الإيمانية خطوة بخطوة.',
  'home.heading': 'انطلق في رحلة إيمانية',
  'home.intro':
    'الحج أحد أركان الإسلام الخمسة، وهو قصد بيت الله الحرام في مكة المكرمة، يجب على كل مسلم مستطيع بدنيًا وماليًا أن يؤديه مرة واحدة على الأقل في عمره. اكتشف عمق هذه التجربة الروحية، والمواقع التاريخية، ورحلة ملايين المؤمنين.',
  'hero.title': 'رحلة الحج المباركة',
  'hero.subtitle': 'تعرّف على الرحلة الإيمانية التي يقصدها ملايين المسلمين كل عام',

  'entry.explore': 'استكشف',
  'entry.journey.title': 'رحلة الحج',
  'entry.journey.description':
    'تابع قصة الحج كاملة، من الاستعداد حتى طواف الوداع. تعرّف على كل نسك ومعناه، وعلى التحول الروحي الذي يعيشه الحجاج.',
  'entry.boundaries.title': 'حدود الحرم',
  'entry.boundaries.description':
    'استكشف حدود الحرم وما حول مكة المكرمة. تعرّف على المناطق المقدسة وأهميتها في رحلة الحج.',
  'entry.meeqat.title': 'المواقيت',
  'entry.meeqat.description':
    'تصفّح مواقيت الإحرام على خريطة تفاعلية تبيّن المواضع التي يحرم منها الحجاج. احصل على الاتجاهات واستكشف كل ميقات.',

  'stats.pilgrims.value': 'أكثر من 2 مليون',
  'stats.pilgrims.label': 'حاج يؤدون الحج كل عام من شتى أنحاء العالم',
  'stats.duration.value': '5-6 أيام',
  'stats.duration.label': 'مدة أداء مناسك الحج',
  'stats.years.value': 'أكثر من 1,400 سنة',
  'stats.years.label': 'من تقليد الحج المتواصل منذ عهد النبي محمد ﷺ',

  // ── Journey ──
  'journey.metaTitle': 'رحلة الحج',
  'journey.metaDescription':
    'تابع رحلة الحج كاملة خطوة بخطوة، من النية والإحرام حتى طواف الوداع، مع شرح لكل نسك من المناسك الرئيسية.',
  'journey.heroTitle': 'رحلة الحج',
  'journey.heroSubtitle':
    'تابع الرحلة الإيمانية خطوة بخطوة، من النية حتى طواف الوداع، مع فهم كل نسك من مناسك الحج.',
  'journey.overviewTitle': 'نظرة عامة على رحلة الحج',
  'journey.overviewIntro':
    'تقدّم هذه الصفحة سردًا موجزًا لرحلة الحج. وهي ليست فتوى فقهية، بل عرض تعليمي يُكمل الخرائط التفاعلية في هذا الموقع.',
  'journey.loadError': 'تعذّر تحميل خطوات الرحلة. هل الخادم يعمل؟',

  // ── Meeqat page ──
  'meeqatPage.metaTitle': 'مواقيت الإحرام',
  'meeqatPage.metaDescription':
    'استكشف المواقيت الخمسة على خريطة تفاعلية، وهي المواضع المحددة التي يحرم منها الحجاج قبل التوجه إلى مكة المكرمة.',
  'meeqatPage.heroTitle': 'مواقيت الإحرام',
  'meeqatPage.heroSubtitle':
    'المواضع المحددة التي يدخل منها الحجاج في الإحرام قبل دخول مكة المكرمة',
  'meeqatPage.understandingTitle': 'فهم المواقيت',
  'meeqatPage.understandingBody':
    'المواقيت (مفردها ميقات) هي المواضع المحددة التي يجب على الحاج أن يحرم منها قبل أن يتجاوزها إلى مكة المكرمة. وقد حدّدها النبي ﷺ لأهل الجهات المختلفة، ولا بد لكل حاج — سواء قدم برًا أو بحرًا أو جوًا — أن يمر بأحدها أو يحاذيه.',
  'meeqatPage.directionsTitle': 'الاتجاهات إلى أي ميقات',
  'meeqatPage.directionsBefore': 'اضغط على أي علامة في الخريطة أعلاه لعرض تفاصيلها. وسيفتح زر ',
  'meeqatPage.directionsAfter':
    ' خرائط Google بالاتجاهات من موقعك الحالي إلى ذلك الميقات.',
  'meeqatPage.dhulHulayfah.name': 'ذو الحليفة',
  'meeqatPage.dhulHulayfah.for': 'المدينة المنورة وما وراءها',
  'meeqatPage.dhulHulayfah.distance': 'نحو 450 كم',
  'meeqatPage.alJuhfah.name': 'الجحفة',
  'meeqatPage.alJuhfah.for': 'الشام ومصر والمغرب',
  'meeqatPage.alJuhfah.distance': 'نحو 187 كم',
  'meeqatPage.qarnAlManazil.name': 'قرن المنازل',
  'meeqatPage.qarnAlManazil.for': 'منطقة نجد',
  'meeqatPage.qarnAlManazil.distance': 'نحو 94 كم',
  'meeqatPage.yalamlam.name': 'يلملم',
  'meeqatPage.yalamlam.for': 'اليمن والجنوب',
  'meeqatPage.yalamlam.distance': 'نحو 120 كم',
  'meeqatPage.dhatIrq.name': 'ذات عرق',
  'meeqatPage.dhatIrq.for': 'العراق والشمال الشرقي',
  'meeqatPage.dhatIrq.distance': 'نحو 94 كم',
  'meeqatPage.forLabel': 'يخص:',
  'meeqatPage.distanceLabel': 'المسافة:',
  'meeqatPage.fromMakkah': 'من مكة',
  'meeqatPage.noteLabel': 'ملاحظة:',
  'meeqatPage.noteBody':
    'يُحرم المسافرون جوًا عادةً قبل ركوب الطائرة، أو في المرافق المخصصة بمطار الملك عبدالعزيز الدولي في جدة. ويُرجى سؤال أحد أهل العلم عن الحكم الخاص بمسارك.',

  // ── Meeqat map ──
  'meeqatMap.loadError': 'تعذّر تحميل بيانات المواقيت. هل الخادم يعمل؟',
  'meeqatMap.loadingMap': 'جارٍ تحميل الخريطة…',
  'meeqatMap.hideRoutes': 'إخفاء المسارات',
  'meeqatMap.showRoutes': 'إظهار المسارات',
  'meeqatMap.hideArcs': 'إخفاء الأقواس',
  'meeqatMap.showArcs': 'إظهار الأقواس',
  'meeqatMap.makkahTitle': '🕋 مكة المكرمة',
  'meeqatMap.makkahText': 'المدينة المقدسة ووجهة الحجاج جميعًا.',
  'meeqatMap.forLabel': 'يخص:',
  'meeqatMap.generalPilgrims': 'عموم الحجاج',
  'meeqatMap.navigate': 'الاتجاهات',
  'meeqatMap.imageAlt': '{name} {n}',
  'meeqatMap.legendTitle': 'دليل مواقيت الإحرام',
  'meeqatMap.legendMakkah': 'مكة',
  'meeqatMap.legendTip': '💡 اضغط على أي علامة لعرض الصور والتفاصيل والاتجاهات',

  // ── Sacred Boundaries page ──
  'boundariesPage.metaTitle': 'حدود الحرم المكي',
  'boundariesPage.metaDescription':
    'تعرّف على حدود الحرم والمناطق المقدسة حول مكة المكرمة — أهميتها وأحكامها وامتدادها الجغرافي — على خريطة تفاعلية.',
  'boundariesPage.heroTitle': 'حدود الحرم المكي',
  'boundariesPage.heroSubtitle':
    'تعرّف على الحرم المكي وما حول مكة المكرمة من مناطق لها أحكام وفضائل خاصة.',
  'boundariesPage.heading': 'فهم الحرم',
  'boundariesPage.paragraph1':
    'خصّ الله مكة المكرمة وما حولها من الحرم بأحكام وحماية خاصة. ويحرم داخل هذه الحدود المقدسة صيد الحيوانات وقطع الأشجار والإضرار، تأكيدًا للأمن والتعظيم.',
  'boundariesPage.paragraph2':
    'وقد ذكر العلماء المتقدمون مواضع محددة لحدود الحرم حول مكة، وكانت تُعلَّم قديمًا بالأنصاب والعلامات. وتساعد الخرائط واللوحات الحديثة الحجاج على معرفة دخولهم منطقة الحرم أو خروجهم منها.',
  'boundariesPage.loadError': 'تعذّر تحميل معلومات الحدود. هل الخادم يعمل؟',
  'boundariesPage.cardNote':
    'هذا تمثيل لنقطة مرجعية واحدة على حدود الحرم؛ فخط الحرم الفعلي يتبع علامات محددة وليس دائرة تامة.',
  'boundariesPage.disclaimer':
    'هذه الصفحة تصوّر مفاهيمي للحدود المقدسة، صُمّمت لتكمل خريطة المواقيت التفاعلية. وللاطلاع على التفاصيل الفقهية الدقيقة، يُرجع إلى أهل العلم والجهات الرسمية.',
  'boundariesPage.legendTitle': 'دليل الحدود',
  'boundariesPage.legendItem': 'علامة تقريبية على حدود الحرم (ليست بالمقياس ولا بالشكل الدقيق).',
  'boundariesPage.legendFooter':
    'الخريطة أعلاه تقريب تعليمي. وللاطلاع على حدود الحرم الدقيقة فقهيًا، يُرجع إلى أهل العلم وإلى اللوحات الرسمية حول مكة المكرمة.',

  // ── Haram boundary map ──
  'boundaryMap.loadError': 'تعذّر تحميل بيانات الحدود. هل الخادم يعمل؟',
  'boundaryMap.loadingMap': 'جارٍ تحميل الخريطة…',
  'boundaryMap.masjidTitle': '🕋 المسجد الحرام',
  'boundaryMap.masjidText': 'النقطة التقريبية لمركز الحرم المكي في مكة المكرمة.',
  'boundaryMap.pointFallback': 'نقطة حدودية',
  'boundaryMap.polygonTitle': 'الحدود التقريبية للحرم',
  'boundaryMap.polygonText':
    'هذا المضلع تقريب تعليمي لحدود الحرم، مبني على مواضع معروفة مثل التنعيم والجعرانة وإضاء لبن والحديبية.',

  // ── Not found / errors ──
  'notFound.metaTitle': 'الصفحة غير موجودة — رحلة إلى الحج',
  'notFound.metaDescription': 'الصفحة التي تبحث عنها غير موجودة.',
  'notFound.heading': 'الصفحة غير موجودة',
  'notFound.text': 'الصفحة التي تبحث عنها غير موجودة.',
  'notFound.home': 'العودة إلى الرئيسية',
  'unavailable.metaTitle': 'الصفحة غير متاحة',
  'unavailable.metaDescription': 'هذه الصفحة غير متاحة.',
  'unavailable.heading': 'هذه الصفحة غير متاحة',
  'unavailable.text': 'إن وصلك رابط خاص، فيُرجى فتحه كما وصلك تمامًا.',
  'articles.metaTitle': 'مقالات',
  'articles.metaDescription': 'مقالات عن شعيرة الحج، بالعربية والإنجليزية.',
  'articles.heroTitle': 'مقالات',
  'articles.heroSubtitle': 'تأملات وإرشادات حول شعيرة الحج',
  'articles.loadError': 'تعذّر تحميل المقالات. هل الخادم يعمل؟',
  'articles.empty': 'لم يُنشر أي مقال بعد.',
  'articles.read': 'اقرأ المقال',
  'article.loadError': 'تعذّر تحميل هذا المقال.',
  'article.publishedOn': 'نُشر في {date}',
  'error.app.title': 'حدث خطأ ما',
  'error.app.text': 'حدث خطأ غير متوقع. يُرجى تحديث الصفحة.',
  'error.map.text': 'واجهت الخريطة خطأً ولم تتمكن من العرض.',
  'error.map.fallbackMessage': 'حدث خطأ غير متوقع.',
}

export const translations: Record<Locale, Record<TranslationKey, string>> = { en, ar }
