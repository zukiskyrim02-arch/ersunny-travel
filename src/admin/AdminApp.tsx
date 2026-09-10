import { useEffect, useMemo, useState } from "react";
import "../admin.css";
import {
  defaultConfig,
  getConfig,
  isAdminAuthed,
  saveConfig,
  setAdminAuthed,
  type AppConfig,
} from "../store/config";
import { useAppConfig, useReservations } from "../store/hooks";
import { logoSrc } from "../assets";
import { AdminLogin } from "./AdminLogin";
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
import { AzulPanel } from "./AzulPanel";
import {
  ExternalIcon,
  LogoutIcon,
  MenuIcon,
  TabIcon,
} from "./navIcons";

export function AdminApp() {
  const [authed, setAuthed] = useState(() => isAdminAuthed());
  const [tab, setTab] = useState<AdminTab>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const liveConfig = useAppConfig();
  const reservations = useReservations();
  const [draft, setDraft] = useState<AppConfig>(() => getConfig());
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    setDraft(liveConfig);
  }, [liveConfig]);

  const groupedTabs = useMemo(() => {
    const groups = ["ops", "catalog", "settings"] as const;
    return groups.map((group) => ({
      group,
      label: ADMIN_GROUP_LABELS[group],
      items: ADMIN_TABS.filter((item) => item.group === group),
    }));
  }, []);

  const activeTab = ADMIN_TABS.find((t) => t.id === tab);

  function persist(next: AppConfig) {
    setDraft(next);
    saveConfig(next);
    setSavedMsg("Guardado");
    window.setTimeout(() => setSavedMsg(""), 1800);
  }

  function patch(partial: Partial<AppConfig>) {
    persist({ ...draft, ...partial });
  }

  if (!authed) {
    return <AdminLogin onOk={() => setAuthed(true)} />;
  }

  return (
    <div className={`admin${navOpen ? " is-nav-open" : ""}`}>
      <aside className="admin__sidebar">
        <div className="admin__brand-row">
          <img src={logoSrc()} alt="" width={44} height={44} />
          <div>
            <p className="admin__brand">Ersunny Admin</p>
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
                  onClick={() => {
                    setTab(item.id);
                    setNavOpen(false);
                  }}
                >
                  <span className="admin__nav-icon" aria-hidden>
                    <TabIcon id={item.id} />
                  </span>
                  <span className="admin__nav-copy">
                    <span className="admin__nav-title">{item.label}</span>
                    <small>{item.hint}</small>
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
              setAdminAuthed(false);
              setAuthed(false);
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
          <div className="admin__chrome-copy">
            <p className="admin__chrome-kicker">Administración</p>
            <strong>{activeTab?.label ?? "Admin"}</strong>
          </div>
          <div className="admin__chrome-meta">
            {savedMsg ? (
              <span className="admin-ok">{savedMsg}</span>
            ) : (
              <span className="admin__chrome-hint">Cambios locales</span>
            )}
          </div>
        </header>

        <main className="admin__main">
          {tab === "overview" && (
            <OverviewPanel
              config={draft}
              reservations={reservations}
              onReset={() => setDraft(defaultConfig())}
            />
          )}
          {tab === "reservations" && <ReservationsPanel />}
          {tab === "vehicles" && (
            <VehiclesPanel
              vehicles={draft.vehicles}
              onChange={(vehicles) => patch({ vehicles })}
            />
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
          {tab === "site" && <SitePanel config={draft} onChange={patch} />}
          {tab === "azul" && (
            <AzulPanel
              value={draft.azul}
              onChange={(azul) => patch({ azul })}
            />
          )}
        </main>
      </div>
    </div>
  );
}
