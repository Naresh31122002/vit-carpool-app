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
export interface RidePublic {
    id: RideId;
    joined_users: Array<string>;
    destination: string;
    creator_id: string;
    creator_gender: GenderPreference;
    seats_total: bigint;
    total_fare: bigint;
    seats_filled: bigint;
    datetime: Timestamp;
}
export type CreateRideResult = {
    __kind__: "ok";
    ok: RidePublic;
} | {
    __kind__: "err";
    err: string;
};
export type MessageId = bigint;
export type JoinResult = {
    __kind__: "ok";
    ok: RidePublic;
} | {
    __kind__: "err";
    err: string;
};
export type RideId = bigint;
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
export interface ChatMessagePublic {
    id: MessageId;
    content: string;
    ride_id: RideId;
    sender_id: string;
    timestamp: Timestamp;
}
export interface UserProfilePublic {
    id: string;
    name: string;
    hasPhoto: boolean;
    email: string;
    gender: GenderPreference;
}
export enum GenderPreference {
    female = "female",
    male = "male",
    none = "none"
}
export enum WithdrawResult {
    ok = "ok",
    notJoined = "notJoined",
    rideNotFound = "rideNotFound"
}
export interface backendInterface {
    createRide(destination: string, datetime: Timestamp, total_fare: bigint, seats_total: bigint): Promise<CreateRideResult>;
    getGenderFilteredRides(gender: GenderPreference | null): Promise<Array<RidePublic>>;
    getJoinedRides(): Promise<Array<RidePublic>>;
    getMessages(ride_id: RideId): Promise<Array<ChatMessagePublic>>;
    getMyRides(): Promise<Array<RidePublic>>;
    getPostedRides(): Promise<Array<RidePublic>>;
    getProfile(): Promise<UserProfilePublic | null>;
    getProfilePhoto(userId: string): Promise<{
        data: Uint8Array;
        mime: string;
    } | null>;
    getRideDetails(ride_id: RideId): Promise<RidePublic | null>;
    getRides(): Promise<Array<RidePublic>>;
    joinRide(ride_id: RideId): Promise<JoinResult>;
    saveMessage(ride_id: RideId, content: string): Promise<SaveMessageResult>;
    setProfile(name: string, email: string, gender: GenderPreference): Promise<UserProfilePublic>;
    setProfilePhoto(data: Uint8Array, mime: string): Promise<void>;
    withdrawRide(ride_id: RideId): Promise<WithdrawResult>;
}
