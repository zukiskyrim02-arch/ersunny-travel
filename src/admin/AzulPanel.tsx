import type { AzulConfig } from "../payments/azul";
import { azulPaymentUrl } from "../payments/azul";

export function AzulPanel({
  value,
  onChange,
}: {
  value: AzulConfig;
  onChange: (v: AzulConfig) => void;
}) {
  function patch(partial: Partial<AzulConfig>) {
    onChange({ ...value, ...partial });
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h1>Pago Azul</h1>
          <p>
            Credenciales de la Página de Pagos AZUL (Banco Popular). Afiliación
            en{" "}
            <a href="https://www.azul.com.do" target="_blank" rel="noreferrer">
              azul.com.do
            </a>
            .
          </p>
        </div>
      </header>

      <div className="admin-edit-card admin-edit-card--wide">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          Habilitar cobros con Pago Azul
        </label>

        <div className="admin-edit-card__row">
          <label>
            Ambiente
            <select
              value={value.env}
              onChange={(e) =>
                patch({ env: e.target.value as AzulConfig["env"] })
              }
            >
              <option value="test">Pruebas</option>
              <option value="production">Producción</option>
            </select>
          </label>
          <label>
            Merchant ID
            <input
              value={value.merchantId}
              onChange={(e) => patch({ merchantId: e.target.value })}
            />
          </label>
          <label>
            Merchant Name
            <input
              value={value.merchantName}
              onChange={(e) => patch({ merchantName: e.target.value })}
            />
          </label>
          <label>
            Merchant Type
            <input
              value={value.merchantType}
              onChange={(e) => patch({ merchantType: e.target.value })}
            />
          </label>
        </div>

        <div className="admin-edit-card__row">
          <label>
            Currency Code
            <input
              value={value.currencyCode}
              onChange={(e) => patch({ currencyCode: e.target.value })}
            />
          </label>
          <label>
            ITBIS
            <input
              value={value.itbis}
              onChange={(e) => patch({ itbis: e.target.value })}
            />
          </label>
          <label>
            AuthKey
            <input
              type="password"
              value={value.authKey}
              onChange={(e) => patch({ authKey: e.target.value })}
              autoComplete="off"
            />
          </label>
        </div>

        <p className="admin-note">
          URL: <code>{azulPaymentUrl(value.env)}</code>
          <br />
          En un sitio estático el AuthKey queda en el navegador. Idealmente
          muévelo a un backend cuando lo tengas.
        </p>
      </div>
    </section>
  );
}
