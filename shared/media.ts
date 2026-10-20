/** Site media slots. Image slots fall back to a poster frame if a video is assigned. */

export type MediaResourceType = "image" | "video";

export type MediaFit = "limit" | "fill";

export type MediaSlotDef = {
  id: string;
  /** Video may play in this slot. Other slots always render a still. */
  kind: "image" | "video";
  width: number;
  height?: number;
  fit: MediaFit;
};

export type MediaAsset = {
  id: string;
  publicId: string;
  resourceType: MediaResourceType;
  format: string;
  bytes: number;
  width: number;
  height: number;
  filename: string;
  createdAt: number;
  cloudName: string;
};

export const MEDIA_SLOTS: MediaSlotDef[] = [
  { id: "logo", kind: "image", width: 480, fit: "limit" },
  { id: "hero", kind: "video", width: 1920, fit: "limit" },
  { id: "heroMobile", kind: "image", width: 1080, fit: "limit" },
  { id: "serviceTransfer", kind: "image", width: 1200, fit: "limit" },
  { id: "serviceExcursions", kind: "image", width: 1200, fit: "limit" },
  { id: "quoteBand", kind: "image", width: 1600, fit: "limit" },
  { id: "contactHero", kind: "image", width: 1600, fit: "limit" },
  { id: "review-0", kind: "image", width: 240, height: 240, fit: "fill" },
  { id: "review-1", kind: "image", width: 240, height: 240, fit: "fill" },
  { id: "review-2", kind: "image", width: 240, height: 240, fit: "fill" },
];

const EXCURSION_SLOT = /^excursion:[a-z0-9-]{1,48}$/;

export function excursionSlotId(excursionId: string) {
  return `excursion:${excursionId}`;
}

export function isAssignableSlot(id: string) {
  return MEDIA_SLOTS.some((slot) => slot.id === id) || EXCURSION_SLOT.test(id);
}

export function slotDef(id: string): MediaSlotDef {
  return (
    MEDIA_SLOTS.find((slot) => slot.id === id) ?? {
      id,
      kind: "image",
      width: 1200,
      fit: "limit",
    }
  );
}
