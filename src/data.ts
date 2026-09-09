export type Zone = "Punta Cana" | "Bávaro" | "Macao";

export type VehicleId = "sedan" | "suv" | "van";

export const airportLabel = "Punta Cana Airport (PUJ)";

export const contact = {
  email: "contact@ersunnytravel.com",
  whatsapp: "+1 809 671 0965",
  whatsappDigits: "18096710965",
};

export const bankPayment = {
  bank: "APAP",
  accountType: "Savings",
  accountNumber: "1036829162",
  holder: "ERSUNNY TRAVEL",
  rnc: "133-64000-7",
};

export const about = {
  mission:
    "To create unforgettable experiences for our customers through safe, reliable, and comfortable tourist transportation, complemented by excursions that showcase the beauty and culture of each destination and help travelers enjoy and discover its natural and cultural heritage.",
  vision:
    "To be the leading tourist transportation and excursion company, recognized for excellence in customer service, commitment to safety, and respect for the environment, while expanding to new destinations worldwide and setting quality standards in the tourism industry.",
  values: [
    {
      title: "Commitment to safety",
      copy: "We prioritize the safety of our passengers and employees at all times.",
    },
    {
      title: "Service excellence",
      copy: "We strive to exceed our customers' expectations by providing friendly, professional, and efficient service.",
    },
    {
      title: "Environmental sustainability",
      copy: "We promote sustainable practices throughout our operations to preserve natural resources and reduce our environmental impact.",
    },
    {
      title: "Integrity and ethics",
      copy: "We act with honesty, transparency, and integrity in all our business relationships and decisions.",
    },
    {
      title: "Innovation and continuous improvement",
      copy: "We constantly seek new ways to improve our services and processes, adapting to changing market needs and technological advances.",
    },
  ],
};

export const faqs = [
  {
    q: "How do I book a transfer to and from the airport?",
    a: "You can book a transfer through our website or by contacting our customer service team via email or WhatsApp.",
  },
  {
    q: "What happens with my transportation if my flight is cancelled?",
    a: "If your flight is cancelled, please contact our customer service team immediately to reschedule your transfer with the new flight information.",
  },
  {
    q: "What will happen with my transportation if I cannot travel because I am sick?",
    a: "If you cannot travel due to illness, please reach out as soon as possible, and we will work on rescheduling or canceling your transfer as needed.",
  },
  {
    q: "What payment options do I have?",
    a: "We accept credit cards via Pago Azul, and bank transfers (APAP) as an alternative.",
  },
  {
    q: "How do I find Ersunny Travel at the airport?",
    a: "Our driver will be waiting for you at the airport exit area with your full name on a tablet. Look for our friendly driver in his identified uniform.",
  },
  {
    q: "What should I take into consideration before I arrive in the Dominican Republic?",
    a: "Make sure to have your travel documents ready, such as your passport, e-ticket, and transfer confirmation details.",
  },
  {
    q: "How can I know my pickup time on my departure transfer?",
    a: "The pickup time will be sent to you via email or WhatsApp at least 48 hours before your scheduled transfer. You can also confirm it anytime with your reservation number in the pickup tracker.",
  },
  {
    q: "Can my kids make the excursions listed on your webpage?",
    a: "Yes, most of the excursions are family-friendly. Specific age and height requirements are listed for each activity.",
  },
  {
    q: "What should I do if I need to modify my reservation?",
    a: "Contact our support team as soon as possible to modify your reservation. Changes are subject to availability. We recommend making any change at least 24 hours in advance.",
  },
];

export const hotelsByZone: Record<Zone, string[]> = {
  "Punta Cana": [
    "Hard Rock Hotel & Casino Punta Cana",
    "Barceló Bávaro Palace",
    "Catalonia Royal Bavaro",
    "Dreams Royal Beach Punta Cana",
    "Hotel Riu Palace Punta Cana",
    "Grand Palladium Punta Cana",
  ],
  Bávaro: [
    "Iberostar Selection Bávaro",
    "Meliá Caribe Beach",
    "Secrets Royal Beach Punta Cana",
    "Paradisus Palma Real",
    "Occidental Caribe",
    "Bahia Principe Grand Punta Cana",
  ],
  Macao: [
    "Nickelodeon Hotels & Resorts Punta Cana",
    "Dreams Onyx Resort & Spa",
    "Excellence Punta Cana",
    "Royalton Splash Punta Cana",
    "Breathless Punta Cana Resort & Spa",
    "TRS Yucatán Hotel",
  ],
};

export const vehicles: {
  id: VehicleId;
  name: string;
  capacity: string;
  basePrice: number;
}[] = [
  { id: "sedan", name: "Premium sedan", capacity: "1–3 passengers", basePrice: 45 },
  { id: "suv", name: "Comfort SUV", capacity: "1–5 passengers", basePrice: 65 },
  { id: "van", name: "Private van", capacity: "6–10 passengers", basePrice: 95 },
];

export const zoneSurcharge: Record<Zone, number> = {
  "Punta Cana": 0,
  Bávaro: 5,
  Macao: 15,
};

export const destinations = [
  {
    zone: "Punta Cana" as Zone,
    blurb: "Iconic Caribbean beachfront resorts just minutes from the airport.",
    time: "25–40 min",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    zone: "Bávaro" as Zone,
    blurb: "White-sand beaches and the area's most vibrant hotel district.",
    time: "35–50 min",
    image:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    zone: "Macao" as Zone,
    blurb: "A wild coastline, rolling waves, and boutique resorts farther north.",
    time: "45–60 min",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80",
  },
];

export const fleet = [
  {
    label: "Private",
    title: "Premium sedan",
    copy: "Ideal for couples or short trips with light luggage.",
    points: ["Air conditioning", "Onboard Wi-Fi", "Complimentary water"],
  },
  {
    label: "Family",
    title: "Comfort SUV",
    copy: "Extra room for families and luggage on longer vacations.",
    points: ["Up to 5 passengers", "Child seats upon request", "Local driver"],
  },
  {
    label: "Group",
    title: "Private van",
    copy: "Exclusive transfer for groups or friends traveling together.",
    points: ["Up to 10 passengers", "Door-to-door service", "Flight tracking"],
  },
];

export const steps = [
  {
    title: "Schedule your transfer",
    copy: "Enter your origin, destination, passenger count, and schedule online.",
  },
  {
    title: "Pay right away",
    copy: "We redirect you to Pago Azul for secure card payment.",
  },
  {
    title: "Confirm your pickup",
    copy: "Use the tracker with your reservation number to view your pickup time.",
  },
];

export const excursions = [
  {
    id: "saona",
    title: "Saona Island",
    duration: "Full day",
    price: 65,
    blurb: "White sand, turquoise water and buffet lunch in a Caribbean paradise.",
    image:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Catamaran or speedboat", "Natural pool", "Lunch included"],
  },
  {
    id: "catalina",
    title: "Catalina Island",
    duration: "Full day",
    price: 65,
    blurb: "Reef snorkeling, virgin beach and a relaxed vibe near Bayahibe.",
    image:
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Snorkel", "Private beach", "Hotel pickup"],
  },
  {
    id: "scape-park",
    title: "Scape Park",
    duration: "Half day",
    price: 85,
    blurb: "Hoyo Azul cenote, zip lines and adventure in Cap Cana.",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Hoyo Azul", "Adventure", "Family friendly"],
  },
  {
    id: "buggies",
    title: "Buggies",
    duration: "Half day",
    price: 55,
    blurb: "Off-road fun through countryside trails, cenotes and local villages.",
    image:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Off-road", "Cenotes", "Photo stops"],
  },
  {
    id: "santo-domingo",
    title: "Santo Domingo",
    duration: "Full day",
    price: 75,
    blurb: "Colonial Zone, history and culture of the first city of the New World.",
    image:
      "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Cathedral", "Calle Las Damas", "Local guide"],
  },
  {
    id: "catamaran",
    title: "Catamaran Party",
    duration: "Half day",
    price: 60,
    blurb: "Music, onboard bar and snorkel along the Punta Cana coast.",
    image:
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Open bar", "Snorkel", "Party vibe"],
  },
];
