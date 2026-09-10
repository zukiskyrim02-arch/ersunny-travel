import { logoSrc } from "./assets";
import { useI18n } from "./i18n/I18nProvider";
import { useAppConfig } from "./store/hooks";

type SiteFooterProps = {
  onOpenTracker?: () => void;
  showPayColumn?: boolean;
};

export function SiteFooter({
  onOpenTracker,
  showPayColumn = false,
}: SiteFooterProps) {
  const { t } = useI18n();
  const { contact } = useAppConfig();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" id="contacto">
      <div className="container site-footer__grid">
        <div>
          <a href="/" className="site-footer__logo" aria-label={t("nav.logoAria")}>
            <img
              src={logoSrc()}
              alt="Ersunny Travel"
              width={160}
              height={160}
            />
          </a>
          <p>{t("footer.tagline")}</p>
        </div>
        <div>
          <p className="site-footer__heading">{t("footer.services")}</p>
          <a href="/#cotizar">{t("nav.transfers")}</a>
          <a href="/excursions">{t("nav.excursions")}</a>
          <a href="/about">{t("footer.about")}</a>
          <a href="/contact">{t("footer.contact")}</a>
        </div>
        <div>
          <p className="site-footer__heading">{t("footer.information")}</p>
          <a href="/about/faq">{t("footer.faqs")}</a>
          {onOpenTracker ? (
            <button type="button" onClick={onOpenTracker}>
              {t("nav.pickupStatus")}
            </button>
          ) : (
            <a href="/#cotizar">{t("nav.pickupStatus")}</a>
          )}
        </div>
        {showPayColumn ? (
          <div>
            <p className="site-footer__heading">{t("footer.pay")}</p>
            <a href="/payment">{t("footer.paymentForm")}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a
              href={`https://wa.me/${contact.whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("footer.whatsappPrefix")} {contact.whatsapp}
            </a>
          </div>
        ) : (
          <div>
            <p className="site-footer__heading">{t("footer.contact")}</p>
            <a
              href={`https://wa.me/${contact.whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
            >
              {contact.whatsapp}
            </a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <p>{contact.location || t("footer.location")}</p>
          </div>
        )}
      </div>
      <div className="container site-footer__bottom">
        <p>{t("footer.copyright", { year })}</p>
      </div>
    </footer>
  );
}
