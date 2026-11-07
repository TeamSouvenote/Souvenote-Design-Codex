// Customer-facing names for the backend order statuses, shared by Delivery and
// Delivery confirmation. Wording approved by the owner 2026-11-06 (replaces the
// old "Mock checkout ..." developer labels). The status values themselves are
// the backend's and are unchanged.

export function deliveryStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "pending":
      return "Order created";
    case "checkout_started":
      return "Checkout started";
    case "paid_mock":
      return "Payment confirmed";
    case "fulfillment_started":
      return "Sending to print";
    case "fulfilled_mock":
      return "Sent to print";
    case "failed_mock":
      return "We couldn't send this to print";
    default:
      return "Ready to send";
  }
}

export function deliveryOrderNumber(orderId: string | null | undefined): string {
  return orderId ? `SVN-${orderId.slice(0, 8).toUpperCase()}` : "SVN-MOCK";
}
