import type { AppConfig } from "../store/config";

export function SitePanel({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (patch: Partial<AppConfig>) => void;
}) {
  const { contact, page } = config;

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Información del sitio</h1>
          <p>Contacto y textos opcionales del home / nosotros.</p>
        </div>
      </header>

      <div className="admin-block">
        <h2>Contacto</h2>
        <div className="admin-edit-card admin-edit-card--wide">
          <div className="admin-edit-card__row">
            <label>
              Email
              <input
                type="email"
                value={contact.email}
                onChange={(e) =>
                  onChange({ contact: { ...contact, email: e.target.value } })
                }
              />
            </label>
            <label>
              WhatsApp (visible)
              <input
                value={contact.whatsapp}
                onChange={(e) =>
                  onChange({
                    contact: { ...contact, whatsapp: e.target.value },
                  })
                }
              />
            </label>
            <label>
              WhatsApp dígitos (wa.me)
              <input
                value={contact.whatsappDigits}
                onChange={(e) =>
                  onChange({
                    contact: {
                      ...contact,
                      whatsappDigits: e.target.value.replace(/\D/g, ""),
                    },
                  })
                }
              />
            </label>
            <label>
              Ubicación
              <input
                value={contact.location}
                onChange={(e) =>
                  onChange({
                    contact: { ...contact, location: e.target.value },
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="admin-block">
        <h2>Textos opcionales (español)</h2>
        <p className="admin-lead">
          Si dejas un campo vacío, el sitio usa las traducciones i18n normales.
          Si lo llenas, ese texto reemplaza la versión en español del home /
          nosotros.
        </p>
        <div className="admin-edit-card admin-edit-card--wide">
          <label>
            Hero · eyebrow
            <input
              value={page.heroEyebrow}
              onChange={(e) =>
                onChange({ page: { ...page, heroEyebrow: e.target.value } })
              }
              placeholder="Ej. Traslados asequibles…"
            />
          </label>
          <label>
            Hero · título
            <input
              value={page.heroTitle}
              onChange={(e) =>
                onChange({ page: { ...page, heroTitle: e.target.value } })
              }
            />
          </label>
          <label>
            Hero · lead
            <textarea
              rows={3}
              value={page.heroLead}
              onChange={(e) =>
                onChange({ page: { ...page, heroLead: e.target.value } })
              }
            />
          </label>
          <label>
            Servicios · título
            <input
              value={page.servicesTitle}
              onChange={(e) =>
                onChange({ page: { ...page, servicesTitle: e.target.value } })
              }
            />
          </label>
          <label>
            Servicios · lead
            <textarea
              rows={2}
              value={page.servicesLead}
              onChange={(e) =>
                onChange({ page: { ...page, servicesLead: e.target.value } })
              }
            />
          </label>
          <label>
            Nosotros · misión
            <textarea
              rows={3}
              value={page.aboutMission}
              onChange={(e) =>
                onChange({ page: { ...page, aboutMission: e.target.value } })
              }
            />
          </label>
          <label>
            Nosotros · visión
            <textarea
              rows={3}
              value={page.aboutVision}
              onChange={(e) =>
                onChange({ page: { ...page, aboutVision: e.target.value } })
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}
