import { useEffect, useMemo, useState } from "react";
import "../admin.css";
import {
  defaultConfig,
  getConfig,
  saveConfig,
  type AppConfig,
} from "../store/config";
import { useAppConfig, useReservations } from "../store/hooks";
import { useI18n } from "../i18n/I18nProvider";
import { useLogoSrc } from "../media/library";
import { AdminLogin } from "./AdminLogin";
import { adminCopy } from "./copy";
import {
  ADMIN_GROUP_LABELS,
  ADMIN_TABS,
  type AdminTab,
} from "./types";
import { OverviewPanel } from "./OverviewPanel";
import { ReservationsPanel } from "./ReservationsPanel";
import { VehiclesPanel } from "./VehiclesPanel";
import { ZonesPanel } from "./ZonesPanel";
import { ExcursionsPanel } from "./ExcursionsPanel";
import { SitePanel } from "./SitePanel";
import { PaymentsPanel } from "./PaymentsPanel";
import { FlightsPanel } from "./FlightsPanel";
import { flightsEnabled } from "../../shared/features";
import { MediaPanel } from "./MediaPanel";
import {
  ExternalIcon,
  LogoutIcon,
  MenuIcon,
  TabIcon,
} from "./navIcons";

export function AdminApp() {
  const { locale } = useI18n();
  const copy = adminCopy(locale);
  const logo = useLogoSrc();
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [finder, setFinder] = useState("");
  const liveConfig = useAppConfig();
  const reservations = useReservations();
  const [draft, setDraft] = useState<AppConfig>(() => getConfig());
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setDraft(liveConfig);
  }, [liveConfig]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean };
        if (!cancelled) setAuth(data.ok ? "in" : "out");
      })
      .catch(() => {
        if (!cancelled) setAuth("out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedTabs = useMemo(() => {
    const groups = ["ops", "catalog", "settings"] as const;
    return groups.map((group) => ({
      group,
      label: ADMIN_GROUP_LABELS[group],
      items: ADMIN_TABS.filter((item) => item.group === group),
    }));
  }, []);

  function persist(next: AppConfig) {
    setDraft(next);
    saveConfig(next);
    setSavedMsg("Guardado");
    window.setTimeout(() => setSavedMsg(""), 1800);
  }

  function patch(partial: Partial<AppConfig>) {
    persist({ ...draft, ...partial });
  }

  if (auth === "loading") {
    return <div className="admin-loading">{copy.loading}</div>;
  }

  if (auth === "out") {
    return <AdminLogin onOk={() => setAuth("in")} />;
  }

  return (
    <div className={`admin${navOpen ? " is-nav-open" : ""}`}>
      <aside className="admin__sidebar">
        <div className="admin__brand-row">
          <img src={logo} alt="" width={44} height={44} />
          <div>
            <p className="admin__brand">Ersunny</p>
            <small>Panel de control</small>
          </div>
        </div>

        <nav aria-label="Secciones admin">
          {groupedTabs.map((section) => (
            <div key={section.group} className="admin__nav-group">
              <p className="admin__nav-label">{section.label}</p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={tab === item.id ? "is-active" : ""}
                  title={item.hint}
                  onClick={() => {
                    setTab(item.id);
                    setNavOpen(false);
                  }}
                >
                  <span className="admin__nav-icon" aria-hidden>
                    <TabIcon id={item.id} />
                  </span>
                  <span className="admin__nav-title">
                    {item.id === "media" && locale !== "es" ? "Gallery" : item.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin__sidebar-foot">
          {savedMsg && (
            <p className="admin-ok admin-ok--sidebar">{savedMsg}</p>
          )}
          <a href="/" className="admin__foot-link">
            <ExternalIcon />
            <span>Ver sitio público</span>
          </a>
          <button
            type="button"
            className="admin__foot-link admin__foot-link--danger"
            onClick={() => {
              void fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              }).finally(() => setAuth("out"));
            }}
          >
            <LogoutIcon />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {navOpen && (
        <button
          type="button"
          className="admin__scrim"
          aria-label="Cerrar menú"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div className="admin__main-wrap">
        <header className="admin__chrome">
          <button
            type="button"
            className="admin__menu-btn"
            aria-label="Abrir menú"
            onClick={() => setNavOpen(true)}
          >
            <MenuIcon />
          </button>
          <form
            className="admin__search"
            onSubmit={(event) => {
              event.preventDefault();
              setTab("reservations");
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={finder}
              onChange={(event) => setFinder(event.target.value)}
              placeholder="Buscar reservas, clientes, destinos…"
              aria-label="Buscar reservas"
            />
          </form>
          <div className="admin__chrome-side">
            {savedMsg && <span className="admin-ok">{savedMsg}</span>}
            <div className="admin__user">
              <span className="admin__user-badge" aria-hidden>
                AD
              </span>
              <span>
                <strong>Administrador</strong>
                <small>Ersunny Travel</small>
              </span>
            </div>
          </div>
        </header>

        <main className="admin__main">
          {tab === "overview" && (
            <OverviewPanel
              config={draft}
              reservations={reservations}
              onReset={() => setDraft(defaultConfig())}
              onOpen={setTab}
            />
          )}
          {tab === "reservations" && (
            <ReservationsPanel query={finder} onQuery={setFinder} />
          )}
          {flightsEnabled && tab === "flights" && <FlightsPanel />}
          {tab === "vehicles" && (
            <VehiclesPanel config={draft} onChange={patch} />
          )}
          {tab === "zones" && (
            <ZonesPanel config={draft} onChange={patch} />
          )}
          {tab === "excursions" && (
            <ExcursionsPanel
              excursions={draft.excursions}
              onChange={(excursions) => patch({ excursions })}
            />
          )}
          {tab === "media" && <MediaPanel />}
          {tab === "site" && <SitePanel config={draft} onChange={patch} />}
          {tab === "payments" && <PaymentsPanel />}
        </main>
      </div>
    </div>
  );
}
