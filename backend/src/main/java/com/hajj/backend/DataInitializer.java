package com.hajj.backend;

import com.hajj.backend.model.*;
import com.hajj.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MeeqatRepository meeqatRepository;
    private final JourneyRepository journeyRepository;
    private final HaramBoundaryRepository haramBoundaryRepository;
    private final BoundaryPointRepository boundaryPointRepository;

    @Override
    public void run(String... args) {
        seedMeeqatPoints();
        seedJourneySteps();
        seedHaramBoundaries();
        seedBoundaryPoints();
    }

    private void seedMeeqatPoints() {
        meeqatRepository.saveAll(List.of(
            new MeeqatPoint(
                "dhul-hulayfah",
                "Dhul-Hulayfah (Abyar Ali)",
                24.41406002656528, 39.54286561840277,
                "North",
                "People from Madinah and regions to the north",
                "~450 km",
                "#e74c3c",
                "Near Masjid ash-Shajarah",
                "The Meeqat for pilgrims coming from Madinah, located near the famous Masjid ash-Shajarah where the Prophet \u0633 entered Ihram.",
                "",
                List.of("/images/dhul-hulayfah-1.jpg", "/images/dhul-hulayfah-2.jpg",
                        "/images/dhul-hulayfah-3.jpg", "/images/dhul-hulayfah-4.jpg")
            ),
            new MeeqatPoint(
                "al-juhfah",
                "Al-Juhfah (Rabigh)",
                22.70560101031339, 39.14643816586369,
                "Northwest",
                "People from Syria, Egypt, Morocco, and the west",
                "~187 km",
                "#3498db",
                "Near Rabigh city",
                "The Meeqat for pilgrims coming from the northwest, including Syria, Egypt, and North Africa.",
                "",
                List.of("/images/al-juhfah-1.jpg", "/images/al-juhfah-2.jpg",
                        "/images/al-juhfah-3.jpg", "/images/al-juhfah-4.jpg")
            ),
            new MeeqatPoint(
                "qarn-al-manazil",
                "Qarn al-Manazil (As-Sayl)",
                21.632843070547295, 40.42803494940863,
                "East",
                "People from Najd and regions to the east",
                "~94 km",
                "#f39c12",
                "As-Sayl al-Kabir",
                "The Meeqat for pilgrims coming from the Najd region and eastern areas, now known as As-Sayl al-Kabir.",
                "",
                List.of("/images/qarn-al-manazil-1.jpg", "/images/qarn-al-manazil-2.jpg",
                        "/images/qarn-al-manazil-3.jpg", "/images/qarn-al-manazil-4.jpg")
            ),
            new MeeqatPoint(
                "yalamlam",
                "Yalamlam (Sa'diyah)",
                20.517434830881925, 39.871136544178604,
                "South",
                "People from Yemen and regions to the south",
                "~120 km",
                "#9b59b6",
                "Near Sa'diyah",
                "The Meeqat for pilgrims coming from Yemen and southern regions.",
                "",
                List.of("/images/yalamlam-1.jpg", "/images/yalamlam-2.jpg",
                        "/images/yalamlam-3.jpg", "/images/yalamlam-4.jpg")
            ),
            new MeeqatPoint(
                "dhat-irq",
                "Dhat 'Irq",
                21.930162470128362, 40.425496742328555,
                "Northeast",
                "People from Iraq and regions to the northeast",
                "~94 km",
                "#27ae60",
                "Dhat 'Irq checkpoint",
                "The Meeqat for pilgrims coming from Iraq and northeastern regions.",
                "",
                List.of("/images/dhat-irq-1.jpg", "/images/dhat-irq-2.jpg",
                        "/images/dhat-irq-3.jpg", "/images/dhat-irq-4.jpg")
            )
        ));
    }

    private void seedJourneySteps() {
        journeyRepository.saveAll(List.of(
            new JourneyStep(null, 1,
                "Intention & Preparation",
                "The journey begins with sincere intention (niyyah), seeking Allah's pleasure alone. " +
                "Pilgrims prepare physically, mentally, and spiritually, learning the rites and ensuring their means are halal.",
                "border-primary", "text-primary"),
            new JourneyStep(null, 2,
                "Ihram & Meeqat",
                "Before crossing into the sacred boundary of Makkah, pilgrims enter the state of Ihram at one of the " +
                "Meeqat points. This is where the prohibitions of Ihram begin and the Talbiyah is recited.",
                "border-amber-500", "text-amber-600"),
            new JourneyStep(null, 3,
                "Arrival in Makkah & Tawaf al-Qudum",
                "Upon reaching Makkah, many pilgrims perform the arrival Tawaf around the Ka'bah, expressing love " +
                "and awe for the sacred House of Allah.",
                "border-blue-500", "text-blue-600"),
            new JourneyStep(null, 4,
                "Sa'i between Safa and Marwah",
                "Pilgrims walk between the hills of Safa and Marwah, remembering the devotion of Hajar " +
                "(may Allah be pleased with her) as she searched for water for her son Ismail.",
                "border-emerald-500", "text-emerald-600"),
            new JourneyStep(null, 5,
                "The Days of Mina, Arafah & Muzdalifah",
                "Pilgrims travel to Mina, then stand at Arafah on the 9th of Dhul-Hijjah, the pinnacle of Hajj. " +
                "After sunset they move to Muzdalifah, spending the night under the open sky.",
                "border-purple-500", "text-purple-600"),
            new JourneyStep(null, 6,
                "Stoning, Sacrifice & Tawaf al-Ifadah",
                "Pilgrims stone the Jamarat, offer the sacrifice, and perform Tawaf al-Ifadah in Makkah. " +
                "Many of the restrictions of Ihram are lifted after this stage.",
                "border-rose-500", "text-rose-600"),
            new JourneyStep(null, 7,
                "Farewell Tawaf",
                "Before departing Makkah, pilgrims perform a final Tawaf (Tawaf al-Wada'), bidding farewell " +
                "to the Sacred House and asking Allah to accept their Hajj.",
                "border-gray-600", "text-gray-800")
        ));
    }

    private void seedHaramBoundaries() {
        haramBoundaryRepository.saveAll(List.of(
            new HaramBoundary(null,
                "Masjid al-Haram",
                "The central sacred mosque in Makkah that surrounds the Ka'bah, the focal point of all Muslim prayer.",
                21.4225, 39.8262, 3.0, "#16a34a"),
            new HaramBoundary(null,
                "Al-Haram Boundary",
                "The wider sanctuary boundary around Makkah within which hunting and cutting trees is prohibited.",
                21.4225, 39.8262, 15.0, "#f97316")
        ));
    }

    private void seedBoundaryPoints() {
        boundaryPointRepository.saveAll(List.of(
            new BoundaryPoint(null, "\u0625\u0636\u0627\u0621 \u0644\u0628\u0646 (Idhat Liban)",    21.314,  39.8,    0),
            new BoundaryPoint(null, "\u062c\u0628\u0644 \u0639\u0631\u0641\u0627\u062a \u0630\u0627\u062a \u0633\u0644\u064a\u0645", 21.3667, 40.0017, 1),
            new BoundaryPoint(null, "\u0648\u0627\u062f\u064a \u0646\u062e\u0644\u0629",             21.6,    40.02,   2),
            new BoundaryPoint(null, "\u0627\u0644\u062c\u0639\u0631\u0627\u0646\u0629",              21.567,  39.95,   3),
            new BoundaryPoint(null, "\u0627\u0644\u062a\u0646\u0639\u064a\u0645",                   21.467978, 39.801154, 4),
            new BoundaryPoint(null, "\u0645\u0646\u0642\u0637\u0639 \u0627\u0644\u0623\u0639\u0634\u0627\u0634 \u0628\u0627\u0644\u062d\u062f\u064a\u0628\u064a\u0629", 21.442102, 39.625658, 5)
        ));
    }
}
