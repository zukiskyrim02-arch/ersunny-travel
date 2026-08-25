export type Zone = "Punta Cana" | "Bávaro" | "Macao";

export type VehicleId = "sedan" | "suv" | "van";

export const airportLabel = "Aeropuerto Punta Cana (PUJ)";

export const contact = {
  email: "contact@ersunnytravel.com",
  whatsapp: null as string | null,
  whatsappLabel: "Próximamente",
};

export const bankPayment = {
  bank: "APAP",
  accountType: "Ahorro",
  accountNumber: "1036829162",
  holder: "ERSUNNY TRAVEL",
  rnc: "133-64000-7",
};

export const about = {
  mission:
    "Facilitar experiencias inolvidables a nuestros clientes mediante un servicio de transporte turístico seguro, confiable y cómodo, acompañado de excursiones que resalten la belleza y cultura de cada destino, contribuyendo así al disfrute y conocimiento del patrimonio natural y cultural de cada lugar.",
  vision:
    "Ser la empresa líder en transporte turístico y excursiones, reconocida por nuestra excelencia en servicio al cliente, compromiso con la seguridad y el respeto por el medio ambiente, expandiendo nuestra oferta a nuevos destinos globales y estableciendo estándares de calidad en la industria del turismo.",
  values: [
    {
      title: "Compromiso con la seguridad",
      copy: "Priorizamos la seguridad de nuestros pasajeros y empleados en todo momento.",
    },
    {
      title: "Excelencia en el servicio",
      copy: "Nos esforzamos por superar las expectativas de nuestros clientes, proporcionando un servicio amable, profesional y eficiente.",
    },
    {
      title: "Sostenibilidad ambiental",
      copy: "Promovemos prácticas sostenibles en todas nuestras operaciones para preservar los recursos naturales y reducir nuestro impacto ambiental.",
    },
    {
      title: "Integridad y ética",
      copy: "Actuamos con honestidad, transparencia y ética en todas nuestras relaciones comerciales y decisiones empresariales.",
    },
    {
      title: "Innovación y mejora continua",
      copy: "Buscamos constantemente nuevas formas de mejorar nuestros servicios y procesos, adaptándonos a las necesidades cambiantes del mercado y tecnológicas.",
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
    a: "We accept credit cards, PayPal, and bank transfers (APAP).",
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
  { id: "sedan", name: "Sedán premium", capacity: "1–3 pasajeros", basePrice: 45 },
  { id: "suv", name: "SUV confort", capacity: "1–5 pasajeros", basePrice: 65 },
  { id: "van", name: "Van privada", capacity: "6–10 pasajeros", basePrice: 95 },
];

export const zoneSurcharge: Record<Zone, number> = {
  "Punta Cana": 0,
  Bávaro: 5,
  Macao: 15,
};

export const destinations = [
  {
    zone: "Punta Cana" as Zone,
    blurb: "Resorts icónicos frente al Caribe, a minutos del aeropuerto.",
    time: "25–40 min",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    zone: "Bávaro" as Zone,
    blurb: "Playas de arena blanca y la franja hotelera más vibrante.",
    time: "35–50 min",
    image:
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    zone: "Macao" as Zone,
    blurb: "Costa salvaje, olas y resorts boutique más al norte.",
    time: "45–60 min",
    image:
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=80",
  },
];

export const fleet = [
  {
    label: "Privado",
    title: "Sedán premium",
    copy: "Ideal para parejas o viajes cortos con maletas ligeras.",
    points: ["Aire acondicionado", "Wi‑Fi a bordo", "Agua de cortesía"],
  },
  {
    label: "Familiar",
    title: "SUV confort",
    copy: "Espacio extra para familias y equipaje de vacaciones largas.",
    points: ["Hasta 5 pasajeros", "Asientos infantiles bajo pedido", "Conductor local"],
  },
  {
    label: "Grupo",
    title: "Van privada",
    copy: "Traslado exclusivo para grupos o amigos que viajan juntos.",
    points: ["Hasta 10 pasajeros", "Puerta a puerta", "Seguimiento de vuelo"],
  },
];

export const steps = [
  {
    title: "Agenda tu traslado",
    copy: "Completa origen, destino, personas y horario en la web.",
  },
  {
    title: "Paga de inmediato",
    copy: "Te redirigimos a los datos bancarios APAP con tu número de reserva.",
  },
  {
    title: "Confirma tu recogida",
    copy: "Usa el rastreador con tu número de reserva para ver la hora de pick-up.",
  },
];

export const excursions = [
  {
    id: "saona",
    title: "Isla Saona",
    duration: "Día completo",
    blurb: "Arena blanca, aguas turquesa y almuerzo buffet en paraíso caribeño.",
    image:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Catamarán o speedboat", "Piscina natural", "Almuerzo incluido"],
  },
  {
    id: "catalina",
    title: "Isla Catalina",
    duration: "Día completo",
    blurb: "Snorkel en arrecife, playa virgen y ambiente relajado cerca de Bayahibe.",
    image:
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Snorkel", "Playa privada", "Transporte hotel"],
  },
  {
    id: "santo-domingo",
    title: "Santo Domingo City Tour",
    duration: "Día completo",
    blurb: "Zona Colonial, historia y cultura de la primera ciudad del Nuevo Mundo.",
    image:
      "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Catedral Primada", "Calle Las Damas", "Guía local"],
  },
  {
    id: "scape-park",
    title: "Scape Park · Hoyo Azul",
    duration: "Medio día / día",
    blurb: "Cenote Hoyo Azul, tirolesas y aventura en Cap Cana.",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Hoyo Azul", "Aventura", "Ideal familias"],
  },
  {
    id: "catamaran",
    title: "Catamarán Party",
    duration: "Medio día",
    blurb: "Música, bar a bordo y snorkel en la costa de Punta Cana.",
    image:
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Open bar", "Snorkel", "Ambiente festivo"],
  },
  {
    id: "monkeyland",
    title: "Monkeyland & Exotic Park",
    duration: "Medio día",
    blurb: "Interacción con primates y naturaleza en un entorno controlado.",
    image:
      "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Familias", "Naturaleza", "Pickup hotel"],
  },
];
