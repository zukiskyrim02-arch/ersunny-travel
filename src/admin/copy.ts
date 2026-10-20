export type AdminCopy = {
  loading: string;
  title: string;
  lead: string;
  email: string;
  emailRequired: string;
  sendCode: string;
  sending: string;
  sent: string;
  code: string;
  codeRequired: string;
  enter: string;
  checking: string;
  resend: string;
  changeEmail: string;
  back: string;
  mediaTitle: string;
  mediaLead: string;
  upload: string;
  uploading: string;
  library: string;
  emptyLibrary: string;
  sections: string;
  sectionsLead: string;
  unassigned: string;
  delete: string;
  deleting: string;
  videoStill: string;
  assigned: string;
  fallback: string;
  tooBig: string;
  cloudinaryMissing: string;
  sessionExpired: string;
  errors: Record<string, string>;
  slots: Record<string, { label: string; hint: string }>;
};

const errorsEs: Record<string, string> = {
  invalid_email: "Escribe un correo válido.",
  not_configured:
    "El envío de códigos no está configurado. Faltan RESEND_API_KEY, RESEND_FROM, ADMIN_EMAILS y SESSION_SECRET en el servidor.",
  rate_limited: "Espera unos minutos antes de pedir otro código.",
  send_failed: "No se pudo enviar el correo. Revisa Resend e inténtalo de nuevo.",
  store_failed: "No se pudo guardar el código. Revisa la conexión con Firebase.",
  invalid_code: "El código es incorrecto o ya caducó.",
  unauthorized: "La sesión expiró. Vuelve a entrar.",
  cloudinary_missing:
    "Cloudinary no está configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
  firebase_missing:
    "Firebase admin no está configurado. Hace falta la cuenta de servicio para guardar el catálogo.",
  catalog_failed: "No se pudo guardar la biblioteca en Cloudinary. Inténtalo de nuevo.",
  upload_failed: "Cloudinary no confirmó el archivo.",
  invalid_asset: "Ese archivo no está en la biblioteca.",
  invalid_slot: "Ese apartado no existe.",
  generic: "Algo salió mal. Inténtalo de nuevo.",
};

const errorsEn: Record<string, string> = {
  invalid_email: "Enter a valid email.",
  not_configured:
    "Email codes are not configured yet. Set RESEND_API_KEY, RESEND_FROM, ADMIN_EMAILS, and SESSION_SECRET on the server.",
  rate_limited: "Wait a few minutes before requesting another code.",
  send_failed: "The email could not be sent. Check Resend and try again.",
  store_failed: "The code could not be saved. Check the Firebase connection.",
  invalid_code: "That code is incorrect or has expired.",
  unauthorized: "Your session expired. Sign in again.",
  cloudinary_missing:
    "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
  firebase_missing:
    "Firebase admin is not configured. A service account is required to store the catalog.",
  catalog_failed: "The library could not be saved in Cloudinary. Try again.",
  upload_failed: "Cloudinary did not confirm the file.",
  invalid_asset: "That file is not in the library.",
  invalid_slot: "That section does not exist.",
  generic: "Something went wrong. Try again.",
};

const slotsEs: AdminCopy["slots"] = {
  logo: { label: "Logotipo", hint: "Cabecera, menú y pie" },
  hero: { label: "Portada principal", hint: "Imagen o video del inicio" },
  heroMobile: { label: "Portada móvil", hint: "Inicio en pantallas estrechas" },
  serviceTransfer: { label: "Traslados", hint: "Foto de la tarjeta de traslados" },
  serviceExcursions: {
    label: "Excursiones (inicio)",
    hint: "Foto de la tarjeta de excursiones",
  },
  quoteBand: { label: "Banda de reserva", hint: "Fondo de la sección de cotizar" },
  contactHero: { label: "Contacto", hint: "Imagen de la página de contacto" },
  "review-0": { label: "Testimonio Maria", hint: "Retrato" },
  "review-1": { label: "Testimonio Carlos", hint: "Retrato" },
  "review-2": { label: "Testimonio Emma", hint: "Retrato" },
};

const slotsEn: AdminCopy["slots"] = {
  logo: { label: "Logo", hint: "Header, menu and footer" },
  hero: { label: "Home hero", hint: "Cover image or video" },
  heroMobile: { label: "Mobile hero", hint: "Cover on narrow screens" },
  serviceTransfer: { label: "Transfers", hint: "Photo on the transfers card" },
  serviceExcursions: {
    label: "Excursions (home)",
    hint: "Photo on the excursions card",
  },
  quoteBand: { label: "Quote band", hint: "Background behind the booking form" },
  contactHero: { label: "Contact", hint: "Contact page image" },
  "review-0": { label: "Review Maria", hint: "Portrait" },
  "review-1": { label: "Review Carlos", hint: "Portrait" },
  "review-2": { label: "Review Emma", hint: "Portrait" },
};

const es: AdminCopy = {
  loading: "Comprobando sesión…",
  title: "Panel de administración",
  lead: "Te enviamos un código de un solo uso al correo autorizado.",
  email: "Correo",
  emailRequired: "Escribe el correo del administrador.",
  sendCode: "Enviar código",
  sending: "Enviando…",
  sent: "Si este correo está autorizado, enviamos un código. Caduca en 10 minutos.",
  code: "Código de 6 dígitos",
  codeRequired: "Escribe el código de 6 dígitos.",
  enter: "Entrar al panel",
  checking: "Comprobando…",
  resend: "Reenviar código",
  changeEmail: "Usar otro correo",
  back: "← Volver al sitio público",
  mediaTitle: "Medios",
  mediaLead:
    "Sube fotos y videos a Cloudinary y asígnalos a cada apartado. Si un apartado queda vacío, el sitio sigue usando la imagen de respaldo.",
  upload: "Subir imagen o video",
  uploading: "Subiendo…",
  library: "Biblioteca",
  emptyLibrary: "Todavía no hay archivos. Sube el primero para asignarlo.",
  sections: "Apartados del sitio",
  sectionsLead:
    "Elige qué archivo aparece en cada sección. Los videos se reproducen en la portada; en el resto se usa un fotograma.",
  unassigned: "Sin asignar (usar respaldo)",
  delete: "Eliminar",
  deleting: "Eliminando…",
  videoStill: "Video: en este apartado se muestra un fotograma.",
  assigned: "Asignado",
  fallback: "Respaldo del sitio",
  tooBig: "El archivo supera 80 MB.",
  cloudinaryMissing:
    "Cloudinary no está configurado. Añade CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el servidor. La biblioteca no puede subir archivos hasta entonces.",
  sessionExpired: "La sesión expiró. Recarga e inicia sesión otra vez.",
  errors: errorsEs,
  slots: slotsEs,
};

const en: AdminCopy = {
  loading: "Checking session…",
  title: "Admin panel",
  lead: "We email a one-time code to an allowed address.",
  email: "Email",
  emailRequired: "Enter the admin email.",
  sendCode: "Send code",
  sending: "Sending…",
  sent: "If this email is allowed, we sent a code. It expires in 10 minutes.",
  code: "6-digit code",
  codeRequired: "Enter the 6-digit code.",
  enter: "Enter the panel",
  checking: "Checking…",
  resend: "Resend code",
  changeEmail: "Use a different email",
  back: "← Back to the public site",
  mediaTitle: "Media",
  mediaLead:
    "Upload photos and videos to Cloudinary and assign them to each section. Empty sections keep the built-in fallback image.",
  upload: "Upload image or video",
  uploading: "Uploading…",
  library: "Library",
  emptyLibrary: "No files yet. Upload one to assign it.",
  sections: "Site sections",
  sectionsLead:
    "Choose which file appears in each section. Videos play on the home hero; other sections use a still frame.",
  unassigned: "Unassigned (use fallback)",
  delete: "Delete",
  deleting: "Deleting…",
  videoStill: "Video: this section shows a still frame.",
  assigned: "Assigned",
  fallback: "Site fallback",
  tooBig: "The file is larger than 80 MB.",
  cloudinaryMissing:
    "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server before uploading.",
  sessionExpired: "Your session expired. Reload and sign in again.",
  errors: errorsEn,
  slots: slotsEn,
};

export function adminCopy(locale: string): AdminCopy {
  return locale === "es" ? es : en;
}

export function adminError(copy: AdminCopy, code: string) {
  return copy.errors[code] || copy.errors.generic;
}
