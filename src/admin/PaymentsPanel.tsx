import { FIREBASE_INFO } from "../firebase";
import { PAYPAL_CLIENT_ID } from "../payments/paypal";

function mask(value: string): string {
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function PaymentsPanel() {
  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Pagos y conexiones</h1>
          <p>
            Métodos activos en el sitio y estado de Firebase y Cloudinary.
            Las claves secretas viven en variables de entorno del servidor,
            nunca en este panel.
          </p>
        </div>
      </header>

      <div className="admin-block">
        <h2>Métodos de pago en la web</h2>
        <dl className="admin-dl">
          <div>
            <dt>Tarjeta (3-D Secure)</dt>
            <dd>
              Activo — checkout seguro del servidor (<code>/api/cardnet/*</code>).
              Al cliente solo se le muestra “Pagar con tarjeta”, sin marca.
            </dd>
          </div>
          <div>
            <dt>Captcha</dt>
            <dd>Activo — reCAPTCHA antes de pagar con tarjeta o PayPal.</dd>
          </div>
          <div>
            <dt>PayPal</dt>
            <dd>
              Activo (Live) · Client ID <code>{mask(PAYPAL_CLIENT_ID)}</code> ·
              solo saldo/billetera PayPal, USD.
            </dd>
          </div>
          <div>
            <dt>Azul / APAP en la web</dt>
            <dd>Retirado — ya no se ofrece en la página de pago.</dd>
          </div>
        </dl>
        <p className="admin-note">
          Ambiente y comercio de tarjeta se cambian con las variables{" "}
          <code>CARDNET_ENV</code>, <code>CARDNET_MERCHANT_*</code> y{" "}
          <code>CARDNET_CURRENCY_CODE</code> en <code>.env</code> / Vercel.
        </p>
      </div>

      <div className="admin-block">
        <h2>Firebase Realtime Database</h2>
        <dl className="admin-dl">
          <div>
            <dt>Proyecto</dt>
            <dd>{FIREBASE_INFO.projectId}</dd>
          </div>
          <div>
            <dt>Base de datos</dt>
            <dd>
              <code>{FIREBASE_INFO.databaseURL}</code>
            </dd>
          </div>
          <div>
            <dt>Sincroniza</dt>
            <dd>
              Reservas (<code>reservations/</code>) y configuración del sitio (
              <code>config/</code>), con copia local de respaldo.
            </dd>
          </div>
          <div>
            <dt>Reglas</dt>
            <dd>
              Archivo <code>database.rules.json</code> del repo (pegar en
              Firebase → Realtime Database → Reglas).
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-block">
        <h2>Cloudinary (fotos y videos)</h2>
        <dl className="admin-dl">
          <div>
            <dt>Biblioteca</dt>
            <dd>
              Admin → <strong>Medios</strong>. Ahí se suben las fotos y los
              videos y se asignan a cada apartado.
            </dd>
          </div>
          <div>
            <dt>Excursiones</dt>
            <dd>
              Admin → Excursiones → <strong>Subir foto (Cloudinary)</strong>{" "}
              guarda la imagen de respaldo de esa excursión.
            </dd>
          </div>
        </dl>
        <p className="admin-note">
          Correos de confirmación: plantilla nueva de Ersunny Travel al
          reservar, al pagar y al asignar la hora de pickup.
        </p>
      </div>
    </section>
  );
}
