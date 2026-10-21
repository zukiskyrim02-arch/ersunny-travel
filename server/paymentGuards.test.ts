import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { cardnetOrderMatches, isCardnetApproved } from "./cardnet.ts";
import {
  approvalFromBrowserReturn,
  acceptedChargeUsd,
  canChargeStoredPrice,
  paymentAllowsAnyOrigin,
  shouldMarkReservationPaid,
} from "./paymentGuards.ts";
import { SECURITY_HEADERS } from "./securityHeaders.ts";
import { formatDisplayDate, formatDisplayTime } from "../shared/datetime.ts";

test("only Cardnet response code 00 is an approval", () => {
  assert.equal(isCardnetApproved({ ResponseCode: "00" }), true);
  assert.equal(isCardnetApproved({ ResponseCode: "05" }), false);
  assert.equal(isCardnetApproved({ ResponseCode: "0" }), false);
  assert.equal(isCardnetApproved({ Approved: "ok", Status: "success" }), false);
  assert.equal(
    isCardnetApproved({ Transaction: { ResponseCode: "00" } }),
    true,
  );
});

test("a different amount does not open a card session", () => {
  assert.equal(canChargeStoredPrice(120, 120), true);
  assert.equal(canChargeStoredPrice(120, 119.99), false);
  assert.equal(canChargeStoredPrice(null, 120), false);
  assert.equal(acceptedChargeUsd(130, 130, 61.45), 130);
  assert.equal(acceptedChargeUsd(130, 7988.5, 61.45), 130);
  assert.equal(acceptedChargeUsd(130, 90, 61.45), null);
  assert.equal(acceptedChargeUsd(null, 130, 61.45), null);
});

test("returning to the success page is not a payment", () => {
  assert.equal(approvalFromBrowserReturn(), false);
  assert.equal(
    shouldMarkReservationPaid({
      providerApproved: false,
      orderMatches: true,
      amountMatches: true,
    }),
    false,
  );
  assert.equal(
    shouldMarkReservationPaid({
      providerApproved: true,
      orderMatches: false,
      amountMatches: true,
    }),
    false,
  );
  assert.equal(
    shouldMarkReservationPaid({
      providerApproved: true,
      orderMatches: true,
      amountMatches: true,
    }),
    true,
  );
});

test("Cardnet order id must match the signed reservation", () => {
  assert.equal(
    cardnetOrderMatches({ OrdenID: "EXC-TEST01" }, "EXC-TEST01"),
    true,
  );
  assert.equal(
    cardnetOrderMatches({ OrdenID: "EXC-OTHER" }, "EXC-TEST01"),
    false,
  );
  assert.equal(cardnetOrderMatches({}, "EXC-TEST01"), false);
});

test("Cardnet routes do not allow every origin", () => {
  assert.equal(paymentAllowsAnyOrigin(), false);
  const session = fs.readFileSync(new URL("../api/cardnet/session.ts", import.meta.url), "utf8");
  const verify = fs.readFileSync(new URL("../api/cardnet/verify.ts", import.meta.url), "utf8");
  assert.equal(session.includes("Access-Control-Allow-Origin"), false);
  assert.equal(verify.includes("Access-Control-Allow-Origin"), false);
});

test("booking dates use an English month and 12-hour time", () => {
  assert.equal(formatDisplayDate("2026-10-22"), "22 October 2026");
  assert.equal(formatDisplayDate("2026-01-05"), "5 January 2026");
  assert.equal(formatDisplayTime("07:30"), "07:30 AM");
  assert.equal(formatDisplayTime("19:05"), "07:05 PM");
  assert.equal(formatDisplayTime("00:00"), "12:00 AM");
  assert.equal(formatDisplayTime("12:00"), "12:00 PM");
  assert.equal(formatDisplayTime("7:30 pm"), "07:30 PM");
  assert.equal(formatDisplayTime("To be confirmed"), "To be confirmed");
});

test("booking notices do not use the FormSubmit table", () => {
  const src = fs.readFileSync(new URL("../src/notifyBooking.ts", import.meta.url), "utf8");
  assert.equal(src.includes("formsubmit.co"), false);
  assert.equal(src.includes("_template"), false);
});

test("vercel.json publishes the security headers", () => {
  const vercel = JSON.parse(
    fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  ) as { headers: { headers: { key: string; value: string }[] }[] };
  assert.deepEqual(vercel.headers[0].headers, SECURITY_HEADERS);
  const csp = SECURITY_HEADERS.find((header) => header.key === "Content-Security-Policy");
  assert.ok(csp?.value.includes("frame-ancestors 'none'"));
  assert.equal(
    SECURITY_HEADERS.find((header) => header.key === "X-Frame-Options")?.value,
    "DENY",
  );
});
