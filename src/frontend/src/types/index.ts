export type {
  RidePublic,
  ChatMessagePublic,
  UserProfilePublic,
  CreateRideResult,
  JoinResult,
  RideId,
  Timestamp,
  MessageId,
  GenderPreference,
  WithdrawResult,
} from "../backend.d.ts";

export type {
  JoinRequestPublic,
  JoinRequestResult,
  ApproveRejectResult,
  RideRequestsGroup,
} from "../hooks/useQueries";

export { RequestStatus } from "../hooks/useQueries";

export type RideBadge = "full" | "cheapest" | "urgent" | null;

export interface RideWithBadge {
  ride: import("../backend.d.ts").RidePublic;
  badge: RideBadge;
  seatsLeft: number;
  perPersonFare: number;
}

// Extended profile type with preferred_destination
export interface UserProfileExtended {
  id: string;
  name: string;
  hasPhoto: boolean;
  email: string;
  gender: import("../backend.d.ts").GenderPreference;
  preferred_destination?: string;
}
