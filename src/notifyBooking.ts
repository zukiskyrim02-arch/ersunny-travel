import { contact } from "./data";

/** Notify company inbox with booking details (FormSubmit, no backend required). */
export async function sendBookingNotification(
  payload: Record<string, string>,
): Promise<void> {
  const res = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(contact.email)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: payload._subject || "New Ersunny Travel booking",
        _template: "table",
        _captcha: "false",
        ...payload,
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Could not send confirmation email.");
  }
}
