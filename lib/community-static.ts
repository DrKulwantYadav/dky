import type { Initiative, InitiativeDetail, InitiativeMedia } from "@/lib/community";

// Temporary public content. A published Supabase record with the same slug takes precedence.
// Keep unverified camp dates, services, attendance and coverage out of this file.
export type StaticInitiative = InitiativeDetail & { dateLabel: string; yearLabel: string };

const heartId = "static-heart-health-september-2026";
const liverId = "static-fatty-liver-fibroscan-2026";
const createdAt = "2026-10-04T00:00:00.000Z";

function localMedia(
  initiativeId: string,
  name: string,
  altText: string,
  caption: string,
  groupLabel: string,
  sortOrder: number,
  isCover = false,
  height = 960,
): InitiativeMedia {
  return {
    id: `${initiativeId}-${sortOrder}`,
    initiative_id: initiativeId,
    public_id: `static:${name}`,
    secure_url: `/community-initiatives/${name}`,
    resource_type: "image",
    width: 1280,
    height,
    format: "jpeg",
    bytes: null,
    caption,
    alt_text: altText,
    group_label: groupLabel,
    sort_order: sortOrder,
    is_cover: isCover,
    created_at: createdAt,
  };
}

const heartMedia = [
  localMedia(heartId, "heart-month-lamp-rotary.jpeg", "A doctor and Rotary Club members lighting a ceremonial lamp at Gopinath Hospital", "Opening moments at the heart-health programme at Gopinath Hospital.", "At Gopinath Hospital", 0, true, 720),
  localMedia(heartId, "heart-month-rotary-welcome.jpeg", "Rotary Club of Bhiwadi members welcoming a doctor at the heart-health programme", "A warm welcome from the Rotary Club of Bhiwadi.", "At Gopinath Hospital", 1, false, 720),
  localMedia(heartId, "heart-month-lamp-gopinath.jpeg", "Community members and hospital team gathered around a ceremonial lamp at Gopinath Hospital", "The hospital team and community came together for heart-health awareness.", "Community moments", 2),
  localMedia(heartId, "heart-month-community-team.jpeg", "Rotary and Gopinath Hospital team members holding potted plants during a community event", "A moment with the team and community partners.", "Community moments", 3),
];

export const staticInitiatives: StaticInitiative[] = [
  {
    id: heartId,
    title: "September Heart Health Initiative 2026",
    slug: "heart-health-september-2026",
    summary: "A month of free ECG and health check-up camps with Gopinath Hospital and the Rotary Club of Bhiwadi.",
    purpose: "Heart-health awareness is most useful when people can also speak to a medical team and take a practical first step. Throughout September, I coordinated free ECG and health check-up camps with Gopinath Hospital and the Rotary Club of Bhiwadi to bring screening and guidance closer to our community. The Sunday camps were joined by special camps at Aashiyana Utsav and Aashiyana Town.",
    highlights: "We concluded the month on **29 September, World Heart Day**, with an awareness programme at Gopinath Hospital. I spoke about everyday heart-health habits, precautions before screening and ways to reduce heart-disease risk. Rotarian R. C. Jain shared the history and significance of World Heart Day. District Governor Rotarian C.A. Brajmohan Agrawal encouraged regular check-ups, a balanced diet and exercise.\n\nRotary Club of Bhiwadi President Rotarian Harish Paliwal welcomed guests and thanked Rotarian Dr. Neeraj Agrawal and the complete Gopinath Hospital team for their work throughout the month. I am grateful to every person who helped make the camps possible.",
    topic: "Heart Health",
    status: "Completed",
    start_date: null,
    end_date: null,
    dateLabel: "September 2026 · World Heart Day programme on 29 September",
    yearLabel: "2026",
    venue: "Gopinath Hospital, Bhiwadi, Rajasthan; special camps at Aashiyana Utsav and Aashiyana Town",
    cover_media_id: heartMedia[0].id,
    original_campaign_url: "https://www.drkulwantyadav.com/world-heart-day-free-ecg-camp",
    registration_url: null,
    appointment_url: "/book-appointment",
    seo_title: "September Heart Health Initiative 2026 | Dr. Kulwant Yadav",
    seo_description: "Highlights from the September 2026 heart-health camps with Gopinath Hospital and the Rotary Club of Bhiwadi.",
    is_published: true,
    published_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    media: heartMedia,
    services: [
      { id: `${heartId}-ecg`, initiative_id: heartId, title: "Free ECG examinations", description: "Provided during the month-long heart-health campaign.", is_delivered: true, sort_order: 0 },
      { id: `${heartId}-checks`, initiative_id: heartId, title: "Health check-ups", description: "Offered at the Sunday camps and special community camps.", is_delivered: true, sort_order: 1 },
      { id: `${heartId}-blood`, initiative_id: heartId, title: "Blood tests", description: "Provided at a special blood-testing camp during the campaign.", is_delivered: true, sort_order: 2 },
    ],
    statistics: [
      { id: `${heartId}-ecg-count`, initiative_id: heartId, label: "ECG examinations", value: "408", is_public: true, sort_order: 0 },
      { id: `${heartId}-blood-count`, initiative_id: heartId, label: "Patients who received blood tests", value: "78", is_public: true, sort_order: 1 },
    ],
    coverage: [],
  },
  {
    id: liverId,
    title: "Fatty Liver & FibroScan Camp — 2026",
    slug: "fatty-liver-fibroscan-camp-2026",
    summary: "A community screening initiative focused on fatty-liver awareness and FibroScan assessment at Gopinath Hospital, Bhiwadi.",
    purpose: "Fatty-liver disease can be easy to miss because it may have few or no symptoms. A medical assessment can help people understand their individual risk, and elastography such as FibroScan can help clinicians assess liver stiffness, which may indicate scarring. This is general health information, not a report of tests or outcomes from this camp. [Learn about fatty-liver assessment from the National Institute of Diabetes and Digestive and Kidney Diseases](https://www.niddk.nih.gov/health-information/liver-disease/nafld-nash/diagnosis).",
    highlights: "Verified camp dates, delivered services and attendance figures will be added when available.",
    topic: "Liver Health",
    status: "Completed",
    start_date: null,
    end_date: null,
    dateLabel: "2026 · Exact camp date to be confirmed",
    yearLabel: "2026",
    venue: "Gopinath Hospital, Bhiwadi, Rajasthan",
    cover_media_id: `${liverId}-0`,
    original_campaign_url: null,
    registration_url: null,
    appointment_url: "/book-appointment",
    seo_title: "Fatty Liver & FibroScan Camp 2026 | Dr. Kulwant Yadav",
    seo_description: "Community fatty-liver awareness and FibroScan initiative at Gopinath Hospital, Bhiwadi. Verified camp details will be added.",
    is_published: true,
    published_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    media: [{ ...localMedia(liverId, "liver-health-illustration", "Illustration representing liver health; not a photograph of the camp", "Illustration for liver-health awareness; camp photographs will be added after verification.", "Liver health illustration", 0, true), secure_url: "/carousel-fatty-liver.png", width: 504, height: 504, format: "png" }],
    services: [],
    statistics: [],
    coverage: [],
  },
];

export function staticInitiative(slug: string) {
  return staticInitiatives.find(item => item.slug === slug) || null;
}

export function isStaticInitiative(item: Initiative): item is StaticInitiative {
  return item.id.startsWith("static-");
}
