/** Shared public/admin/API contract for reusable health camps. Dates and times use Asia/Kolkata. */
export type CampStatus = "open" | "upcoming" | "closed" | "full";

export interface CampSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  venueName: string;
  venueAddress: string;
  firstSessionDate: string; // YYYY-MM-DD
  lastSessionDate: string; // YYYY-MM-DD
  status: CampStatus;
}

export interface CampSlot {
  id: string;
  startTime: string; // HH:mm, Asia/Kolkata
  endTime: string; // HH:mm, Asia/Kolkata
  remaining: number; // server-calculated; not displayed on the public page
  status: "open" | "closed" | "full";
}

export interface CampSession {
  id: string;
  date: string; // YYYY-MM-DD, Asia/Kolkata
  opensAt: string; // HH:mm
  closesAt: string; // HH:mm
  slots: CampSlot[];
}

export interface CampDetail extends CampSummary {
  instructions: string[];
  sessions: CampSession[];
}

export interface CampListResponse { camps: CampSummary[] }
export interface CampDetailResponse { camp: CampDetail }
export interface CampAvailabilityResponse { sessions: CampSession[] }

export interface CampBookingRequest {
  campId: string;
  sessionId: string;
  slotId: string;
  patientName: string;
  mobile: string;
  consent: true;
  submissionKey: string; // UUID generated once for this booking attempt
}

export interface CampBookingConfirmation {
  campName: string;
  date: string; // YYYY-MM-DD, Asia/Kolkata
  arrivalStartTime: string; // HH:mm
  arrivalEndTime: string; // HH:mm
  token: string;
  venueName: string;
  venueAddress: string;
  bookingReference: string; // opaque, no patient data
}

export interface CampBookingSuccess {
  status: "confirmed";
  confirmation: CampBookingConfirmation;
}

export type CampApiErrorCode =
  | "VALIDATION_ERROR" | "CAMP_NOT_FOUND" | "REGISTRATION_CLOSED"
  | "SLOT_FULL" | "SLOT_CLOSED" | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";

export interface CampApiError {
  error: { code: CampApiErrorCode; message: string };
}

export type AdminCampLifecycle = "draft" | "published" | "closed" | "cancelled";
export interface AdminCampSlot {
  id?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  active: boolean;
  bookedCount?: number;
}
export interface AdminCampBreak { startTime: string; endTime: string }
export interface AdminCampSession {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  active: boolean;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  breaks: AdminCampBreak[];
  slots: AdminCampSlot[];
}
export interface AdminCampConfig {
  id?: string;
  title: string;
  slug: string;
  description: string;
  instructions: string[];
  venueName: string;
  venueAddress: string;
  imageUrl: string | null;
  tokenPrefix: string; // Three admin-chosen place letters, e.g. BHW
  lifecycle: AdminCampLifecycle;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  datesReviewed: boolean;
  sessions: AdminCampSession[];
}

/** Proposed Part 2/3 endpoints: GET /api/camps, GET /api/camps/:slug,
 * GET /api/camps/:slug/availability, POST /api/camps/:slug/bookings.
 * All public GETs return only published camps; POST is atomic and idempotent.
 */
