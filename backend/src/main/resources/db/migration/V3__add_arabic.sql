-- ── Arabic content columns ────────────────────────────────────────────────
-- Every user-facing text column gets a nullable *_ar sibling. The frontend
-- falls back to the English column when the Arabic one is null or empty.

ALTER TABLE meeqat_point
    ADD COLUMN name_ar         VARCHAR(255),
    ADD COLUMN direction_ar    VARCHAR(50),
    ADD COLUMN for_pilgrims_ar VARCHAR(255),
    ADD COLUMN distance_ar     VARCHAR(20),
    ADD COLUMN modern_ar       VARCHAR(255),
    ADD COLUMN description_ar  TEXT;

ALTER TABLE journey_step
    ADD COLUMN title_ar       VARCHAR(255),
    ADD COLUMN description_ar TEXT;

ALTER TABLE haram_boundary
    ADD COLUMN name_ar        VARCHAR(255),
    ADD COLUMN description_ar TEXT;

ALTER TABLE boundary_point
    ADD COLUMN name_ar VARCHAR(255);

-- ── Schema documentation ──────────────────────────────────────────────────

COMMENT ON COLUMN meeqat_point.name_ar IS
    'Arabic name of the Meeqat station. Null or empty = UI falls back to name.';
COMMENT ON COLUMN meeqat_point.direction_ar IS
    'Arabic cardinal direction from Makkah. Null or empty = UI falls back to direction.';
COMMENT ON COLUMN meeqat_point.for_pilgrims_ar IS
    'Arabic description of who uses this Meeqat. Null or empty = UI falls back to for_pilgrims.';
COMMENT ON COLUMN meeqat_point.distance_ar IS
    'Arabic display string for the distance from Makkah (e.g. نحو 450 كم). Null or empty = UI falls back to distance.';
COMMENT ON COLUMN meeqat_point.modern_ar IS
    'Arabic modern city or landmark name. Null or empty = UI falls back to modern.';
COMMENT ON COLUMN meeqat_point.description_ar IS
    'Arabic description of the Meeqat. Null or empty = UI falls back to description.';

COMMENT ON COLUMN journey_step.title_ar IS
    'Arabic step title. Null or empty = UI falls back to title.';
COMMENT ON COLUMN journey_step.description_ar IS
    'Arabic step description. Null or empty = UI falls back to description.';

COMMENT ON COLUMN haram_boundary.name_ar IS
    'Arabic name of the boundary. Null or empty = UI falls back to name.';
COMMENT ON COLUMN haram_boundary.description_ar IS
    'Arabic description of the boundary. Null or empty = UI falls back to description.';

COMMENT ON COLUMN boundary_point.name_ar IS
    'Arabic name of the boundary landmark. boundary_point.name holds the English transliteration.';

-- ── Arabic seed data ──────────────────────────────────────────────────────

UPDATE meeqat_point SET
    name_ar         = 'ذو الحليفة (أبيار علي)',
    direction_ar    = 'الشمال',
    for_pilgrims_ar = 'أهل المدينة ومن مر بها من الجهة الشمالية',
    distance_ar     = 'نحو 450 كم',
    modern_ar       = 'بالقرب من مسجد الشجرة',
    description_ar  = 'ميقات أهل المدينة المنورة، ويقع بالقرب من مسجد الشجرة المعروف الذي أحرم منه النبي ﷺ.'
WHERE id = 'dhul-hulayfah';

UPDATE meeqat_point SET
    name_ar         = 'الجحفة (رابغ)',
    direction_ar    = 'الشمال الغربي',
    for_pilgrims_ar = 'أهل الشام ومصر والمغرب والجهة الغربية',
    distance_ar     = 'نحو 187 كم',
    modern_ar       = 'بالقرب من مدينة رابغ',
    description_ar  = 'ميقات الحجاج القادمين من الجهة الشمالية الغربية، ومنهم أهل الشام ومصر وشمال أفريقيا.'
WHERE id = 'al-juhfah';

UPDATE meeqat_point SET
    name_ar         = 'قرن المنازل (السيل الكبير)',
    direction_ar    = 'الشرق',
    for_pilgrims_ar = 'أهل نجد ومن مر بها من الجهة الشرقية',
    distance_ar     = 'نحو 94 كم',
    modern_ar       = 'السيل الكبير',
    description_ar  = 'ميقات الحجاج القادمين من نجد والمناطق الشرقية، ويُعرف اليوم باسم السيل الكبير.'
WHERE id = 'qarn-al-manazil';

UPDATE meeqat_point SET
    name_ar         = 'يلملم (السعدية)',
    direction_ar    = 'الجنوب',
    for_pilgrims_ar = 'أهل اليمن ومن مر بها من الجهة الجنوبية',
    distance_ar     = 'نحو 120 كم',
    modern_ar       = 'بالقرب من السعدية',
    description_ar  = 'ميقات الحجاج القادمين من اليمن والمناطق الجنوبية.'
WHERE id = 'yalamlam';

UPDATE meeqat_point SET
    name_ar         = 'ذات عرق',
    direction_ar    = 'الشمال الشرقي',
    for_pilgrims_ar = 'أهل العراق والجهة الشمالية الشرقية',
    distance_ar     = 'نحو 94 كم',
    modern_ar       = 'نقطة ذات عرق',
    description_ar  = 'ميقات الحجاج القادمين من العراق والمناطق الشمالية الشرقية.'
WHERE id = 'dhat-irq';

UPDATE journey_step SET
    title_ar       = 'النية والاستعداد',
    description_ar = 'تبدأ الرحلة بنية صادقة يُراد بها وجه الله وحده. ويستعد الحاج بدنيًا ونفسيًا وروحيًا، فيتعلم المناسك، ويحرص على أن تكون نفقته من مال حلال.'
WHERE step_number = 1;

UPDATE journey_step SET
    title_ar       = 'الإحرام والميقات',
    description_ar = 'قبل تجاوز حدود الحرم المكي، يدخل الحاج في الإحرام من أحد المواقيت. وهناك تبدأ محظورات الإحرام، ويُشرع في التلبية.'
WHERE step_number = 2;

UPDATE journey_step SET
    title_ar       = 'الوصول إلى مكة وطواف القدوم',
    description_ar = 'عند الوصول إلى مكة المكرمة، يؤدي كثير من الحجاج طواف القدوم حول الكعبة المشرفة، تعبيرًا عن المحبة والتعظيم لبيت الله الحرام.'
WHERE step_number = 3;

UPDATE journey_step SET
    title_ar       = 'السعي بين الصفا والمروة',
    description_ar = 'يسعى الحجاج بين جبلي الصفا والمروة، استحضارًا لسعي هاجر (رضي الله عنها) وهي تبحث عن الماء لابنها إسماعيل عليه السلام.'
WHERE step_number = 4;

UPDATE journey_step SET
    title_ar       = 'أيام منى وعرفة ومزدلفة',
    description_ar = 'يتوجه الحجاج إلى منى، ثم يقفون بعرفة في اليوم التاسع من ذي الحجة، وهو ذروة الحج. وبعد الغروب ينفرون إلى مزدلفة فيبيتون فيها تحت السماء المفتوحة.'
WHERE step_number = 5;

UPDATE journey_step SET
    title_ar       = 'رمي الجمرات والنحر وطواف الإفاضة',
    description_ar = 'يرمي الحجاج الجمرات، وينحرون الهدي، ثم يؤدون طواف الإفاضة بمكة المكرمة. وبعد هذه المرحلة يُرفع كثير من محظورات الإحرام.'
WHERE step_number = 6;

UPDATE journey_step SET
    title_ar       = 'طواف الوداع',
    description_ar = 'قبل مغادرة مكة المكرمة، يؤدي الحجاج طواف الوداع، مودعين البيت الحرام، وسائلين الله أن يتقبل حجهم.'
WHERE step_number = 7;

UPDATE haram_boundary SET
    name_ar        = 'المسجد الحرام',
    description_ar = 'المسجد المقدس في مكة المكرمة الذي يحيط بالكعبة المشرفة، قبلة المسلمين في صلاتهم.'
WHERE name = 'Masjid al-Haram';

UPDATE haram_boundary SET
    name_ar        = 'حدود الحرم',
    description_ar = 'حدود الحرم المحيطة بمكة المكرمة، ويحرم داخلها الصيد وقطع الشجر.'
WHERE name = 'Al-Haram Boundary';

-- boundary_point.name previously held mixed Arabic/English text. It now holds
-- an English transliteration; the Arabic moves to name_ar.
UPDATE boundary_point SET name_ar = 'إضاء لبن',                 name = 'Idhat Liban'                          WHERE order_index = 0;
UPDATE boundary_point SET name_ar = 'جبل عرفات ذات سليم',       name = 'Jabal Arafat (Dhat Salim)'            WHERE order_index = 1;
UPDATE boundary_point SET name_ar = 'وادي نخلة',                name = 'Wadi Nakhlah'                         WHERE order_index = 2;
UPDATE boundary_point SET name_ar = 'الجعرانة',                 name = 'Al-Ji''ranah'                         WHERE order_index = 3;
UPDATE boundary_point SET name_ar = 'التنعيم',                  name = 'At-Tan''im'                           WHERE order_index = 4;
UPDATE boundary_point SET name_ar = 'منقطع الأعشاش بالحديبية',  name = 'Munqata'' al-A''shash (Hudaybiyyah)'  WHERE order_index = 5;
