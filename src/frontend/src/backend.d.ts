import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export type CreateRideResult = {
    __kind__: "ok";
    ok: RidePublic;
} | {
    __kind__: "err";
    err: string;
};
export type RideId = bigint;
export interface UserProfilePublic {
    id: string;
    name: string;
    hasPhoto: boolean;
    email: string;
    gender: GenderPreference;
    preferred_destination?: string;
}
export type SignUpResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface RidePublic {
    id: RideId;
    joined_users: Array<string>;
    destination: string;
    creator_id: string;
    creator_gender: GenderPreference;
    seats_total: bigint;
    total_fare: bigint;
    seats_filled: bigint;
    pending_requests: Array<string>;
    female_only: boolean;
    datetime: Timestamp;
    confirmed_users: Array<string>;
}
export type MessageId = bigint;
export type JoinResult = {
    __kind__: "ok";
    ok: RidePublic;
} | {
    __kind__: "err";
    err: string;
};
export interface ChatMessagePublic {
    id: MessageId;
    content: string;
    ride_id: RideId;
    sender_id: string;
    timestamp: Timestamp;
}
export type SaveMessageResult = {
    __kind__: "ok";
    ok: ChatMessagePublic;
} | {
    __kind__: "notMember";
    notMember: null;
} | {
    __kind__: "rideNotFound";
    rideNotFound: null;
};
export type AuthResult = {
    __kind__: "ok";
    ok: {
        userId: string;
        gender: GenderPreference;
    };
} | {
    __kind__: "err";
    err: string;
};
export enum GenderPreference {
    female = "female",
    male = "male",
    none = "none",
    lgbtq = "lgbtq"
}
export enum JoinRequestStatus {
    pending = "pending",
    rejected = "rejected",
    accepted = "accepted"
}
export enum WithdrawResult {
    ok = "ok",
    notJoined = "notJoined",
    rideNotFound = "rideNotFound"
}
export interface backendInterface {
    approveJoinRequest(ride_id: RideId, requester_id: string): Promise<{
        __kind__: "ok";
        ok: RidePublic;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createRide(destination: string, datetime: Timestamp, total_fare: bigint, seats_total: bigint, female_only: boolean): Promise<CreateRideResult>;
    forgotPassword(email: string): Promise<SignUpResult>;
    getAcceptedRequestNotifications(): Promise<Array<{
        ride_id: RideId;
        requester_id: string;
        ride_destination: string;
    }>>;
    getDestinationMatchNotifications(): Promise<bigint>;
    getGenderFilteredRides(gender: GenderPreference | null): Promise<Array<RidePublic>>;
    getJoinedRides(): Promise<Array<RidePublic>>;
    getMessages(ride_id: RideId): Promise<Array<ChatMessagePublic>>;
    getMyRequests(): Promise<Array<{
        status: JoinRequestStatus;
        ride_id: RideId;
    }>>;
    getMyRides(): Promise<Array<RidePublic>>;
    getPostedRides(): Promise<Array<RidePublic>>;
    getProfile(): Promise<UserProfilePublic | null>;
    getProfilePhoto(userId: string): Promise<{
        data: Uint8Array;
        mime: string;
    } | null>;
    getRideDetails(ride_id: RideId): Promise<RidePublic | null>;
    getRideRequests(ride_id: RideId): Promise<{
        __kind__: "ok";
        ok: Array<UserProfilePublic>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getRides(): Promise<Array<RidePublic>>;
    joinRide(ride_id: RideId): Promise<JoinResult>;
    login(email: string, passwordHash: string): Promise<AuthResult>;
    rejectJoinRequest(ride_id: RideId, requester_id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetPassword(email: string, otp: string, newPasswordHash: string): Promise<SignUpResult>;
    saveMessage(ride_id: RideId, content: string): Promise<SaveMessageResult>;
    sendJoinRequest(ride_id: RideId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendSignupOTP(email: string): Promise<SignUpResult>;
    setProfile(name: string, email: string, gender: GenderPreference, preferred_destination: string | null): Promise<UserProfilePublic>;
    setProfilePhoto(data: Uint8Array, mime: string): Promise<void>;
    signUp(email: string, passwordHash: string, gender: GenderPreference): Promise<SignUpResult>;
    verifyOTP(email: string, otp: string): Promise<boolean>;
    withdrawRide(ride_id: RideId): Promise<WithdrawResult>;
}
