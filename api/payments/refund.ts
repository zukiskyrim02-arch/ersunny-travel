import { vercelHandler } from "../../server/vercelHandler.js";

const handle = vercelHandler("/api/payments/refund");
export default handle;
