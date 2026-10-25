export const META_PIXEL_ID = "910648428703706";

export function trackCampRegisterClick() {
  window.fbq?.("trackSingleCustom", META_PIXEL_ID, "CampRegisterClick");
}

export function trackCampRegistrationConfirmed() {
  window.fbq?.("trackSingle", META_PIXEL_ID, "Lead");
}
