export type DeliveryAnalyticsEvent =
  | "delivery_viewed"
  | "delivery_download_clicked"
  | "delivery_file_downloaded"
  | "delivery_share_started"
  | "delivery_share_link_created"
  | "delivery_share_link_copied"
  | "delivery_share_link_revoked"
  | "delivery_complement_started"
  | "delivery_complement_submitted"
  | "delivery_close_started"
  | "delivery_case_closed"
  | "shared_delivery_viewed"
  | "shared_delivery_download_clicked";

export function trackDeliveryEvent(
  event: DeliveryAnalyticsEvent,
  payload: Record<string, string | number | boolean | undefined> = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("labora:analytics", {
      detail: {
        event,
        module: "delivery",
        ...payload,
      },
    }),
  );
}
