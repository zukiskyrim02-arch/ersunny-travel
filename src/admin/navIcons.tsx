import type { ReactNode } from "react";
import type { AdminTab } from "./types";

type IconProps = { className?: string };

function IconBase({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function TabIcon({ id, className }: { id: AdminTab } & IconProps) {
  switch (id) {
    case "overview":
      return (
        <IconBase className={className}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </IconBase>
      );
    case "reservations":
      return (
        <IconBase className={className}>
          <path d="M8 7h8M8 12h8M8 17h5" />
          <rect x="4" y="3" width="16" height="18" rx="2" />
        </IconBase>
      );
    case "vehicles":
      return (
        <IconBase className={className}>
          <path d="M3 14h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4Z" />
          <path d="M5 14 6.5 8.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 14" />
        </IconBase>
      );
    case "zones":
      return (
        <IconBase className={className}>
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </IconBase>
      );
    case "excursions":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="m16.2 8-2.4 6.2L8 16.2 10.4 10 16.2 8Z" />
        </IconBase>
      );
    case "site":
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </IconBase>
      );
    case "azul":
      return (
        <IconBase className={className}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </IconBase>
      );
    default:
      return null;
  }
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </IconBase>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M10 17H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />
      <path d="m15 16 4-4-4-4" />
      <path d="M19 12H10" />
    </IconBase>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}
