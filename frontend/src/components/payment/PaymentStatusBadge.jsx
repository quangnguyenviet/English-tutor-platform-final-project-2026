import Badge from "../ui/Badge";
import { STATUS_META } from "../../lib/paymentModel";

export default function PaymentStatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "—", tone: "slate" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
