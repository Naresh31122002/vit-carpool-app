import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type GenderPreference,
  type WithdrawResult,
  createActor,
} from "../backend";
import type {
  ChatMessagePublic,
  CreateRideResult,
  JoinResult,
  RideId,
  RidePublic,
  SaveMessageResult,
  Timestamp,
  UserProfilePublic,
} from "../backend.d.ts";

// ---- Local type definitions for backend methods not yet in backend.d.ts ----

export const RequestStatus = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  not_requested: "not_requested",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export interface JoinRequestPublic {
  id: bigint;
  status: RequestStatus;
  ride_id: RideId;
  ride_datetime: bigint;
  requested_at: bigint;
  requester_id: string;
  requester_name: string;
  ride_destination: string;
}

export type JoinRequestResult =
  | { __kind__: "ok"; ok: JoinRequestPublic }
  | { __kind__: "alreadyRequested"; alreadyRequested: null }
  | { __kind__: "alreadyMember"; alreadyMember: null }
  | { __kind__: "unauthorized"; unauthorized: null }
  | { __kind__: "rideFull"; rideFull: null }
  | { __kind__: "rideNotFound"; rideNotFound: null };

export type ApproveRejectResult =
  | "ok"
  | "requestNotFound"
  | "unauthorized"
  | "rideFull"
  | "rideNotFound";

export interface RideRequestsGroup {
  destination: string;
  ride_id: RideId;
  requests: JoinRequestPublic[];
  datetime: bigint;
}

// ---- Actor helpers ----

function useBackendActor() {
  return useActor(createActor);
}

// Extended actor type for methods not yet in backendInterface
type ExtendedActor = {
  getMyRequestStatus: (ride_id: RideId) => Promise<RequestStatus>;
  sendJoinRequest: (ride_id: RideId) => Promise<JoinRequestResult>;
  getMyRideRequests: (ride_id: RideId) => Promise<JoinRequestPublic[]>;
  getRequestsForMyRides: () => Promise<RideRequestsGroup[]>;
  getMyPendingRequestsCount: () => Promise<bigint>;
  approveJoinRequest: (
    ride_id: RideId,
    requester_id: string,
  ) => Promise<ApproveRejectResult>;
  rejectJoinRequest: (
    ride_id: RideId,
    requester_id: string,
  ) => Promise<ApproveRejectResult>;
};

// ---- Queries ----

export function useRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic[]>({
    queryKey: ["rides"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRides();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useGenderFilteredRides(gender: GenderPreference | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic[]>({
    queryKey: ["rides", "filtered", gender],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGenderFilteredRides(gender);
    },
    enabled: !!actor && !isFetching && gender !== null && gender !== undefined,
    refetchInterval: 10000,
  });
}

export function useRideDetails(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic | null>({
    queryKey: ["ride", rideId?.toString()],
    queryFn: async () => {
      if (!actor || rideId == null) return null;
      return actor.getRideDetails(rideId);
    },
    enabled: !!actor && !isFetching && rideId != null,
  });
}

export function useMyRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic[]>({
    queryKey: ["myRides"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyRides();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostedRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic[]>({
    queryKey: ["postedRides"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as typeof actor & {
        getPostedRides: () => Promise<RidePublic[]>;
      };
      return a.getPostedRides();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useJoinedRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic[]>({
    queryKey: ["joinedRides"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as typeof actor & {
        getJoinedRides: () => Promise<RidePublic[]>;
      };
      return a.getJoinedRides();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMessages(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<ChatMessagePublic[]>({
    queryKey: ["messages", rideId?.toString()],
    queryFn: async () => {
      if (!actor || rideId == null) return [];
      return actor.getMessages(rideId);
    },
    enabled: !!actor && !isFetching && rideId != null,
    refetchInterval: 3000,
  });
}

export function useProfile() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<UserProfilePublic | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfilePhoto(userId: string | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<{ data: Uint8Array; mime: string } | null>({
    queryKey: ["profilePhoto", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getProfilePhoto(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useMyRequestStatus(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RequestStatus>({
    queryKey: ["requestStatus", rideId?.toString()],
    queryFn: async () => {
      if (!actor || rideId == null) return RequestStatus.not_requested;
      return (actor as typeof actor & ExtendedActor).getMyRequestStatus(rideId);
    },
    enabled: !!actor && !isFetching && rideId != null,
    refetchInterval: 10000,
  });
}

export function useMyRideRequests(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<JoinRequestPublic[]>({
    queryKey: ["rideRequests", rideId?.toString()],
    queryFn: async () => {
      if (!actor || rideId == null) return [];
      return (actor as typeof actor & ExtendedActor).getMyRideRequests(rideId);
    },
    enabled: !!actor && !isFetching && rideId != null,
    refetchInterval: 10000,
  });
}

export function useRequestsForMyRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RideRequestsGroup[]>({
    queryKey: ["requestsForMyRides"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as typeof actor & ExtendedActor).getRequestsForMyRides();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useMyPendingRequestsCount() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<bigint>({
    queryKey: ["pendingRequestsCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return (
        actor as typeof actor & ExtendedActor
      ).getMyPendingRequestsCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// ---- Mutations ----

export function useCreateRide() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    CreateRideResult,
    Error,
    {
      destination: string;
      datetime: Timestamp;
      total_fare: bigint;
      seats_total: bigint;
    }
  >({
    mutationFn: async ({ destination, datetime, total_fare, seats_total }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createRide(destination, datetime, total_fare, seats_total);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["postedRides"] });
    },
  });
}

export function useJoinRide() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<JoinResult, Error, RideId>({
    mutationFn: async (rideId) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinRide(rideId);
    },
    onSuccess: (_, rideId) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["joinedRides"] });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId.toString()] });
    },
  });
}

export function useSendJoinRequest() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<JoinRequestResult, Error, RideId>({
    mutationFn: async (rideId) => {
      if (!actor) throw new Error("Not connected");
      return (actor as typeof actor & ExtendedActor).sendJoinRequest(rideId);
    },
    onSuccess: (_, rideId) => {
      queryClient.invalidateQueries({
        queryKey: ["requestStatus", rideId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId.toString()] });
    },
  });
}

export function useWithdrawRide() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<WithdrawResult, Error, RideId>({
    mutationFn: async (rideId) => {
      if (!actor) throw new Error("Not connected");
      return actor.withdrawRide(rideId);
    },
    onSuccess: (_, rideId) => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["myRides"] });
      queryClient.invalidateQueries({ queryKey: ["joinedRides"] });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId.toString()] });
      queryClient.invalidateQueries({
        queryKey: ["requestStatus", rideId.toString()],
      });
    },
  });
}

export function useSendMessage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    ChatMessagePublic,
    Error,
    { rideId: RideId; content: string }
  >({
    mutationFn: async ({ rideId, content }) => {
      if (!actor) throw new Error("Not connected");
      const result: SaveMessageResult = await actor.saveMessage(
        rideId,
        content,
      );
      if ("ok" in result) return result.ok;
      if ("rideNotFound" in result) throw new Error("Ride not found");
      if ("notMember" in result)
        throw new Error("You are not a member of this ride");
      throw new Error("Failed to send message");
    },
    onSuccess: (_, { rideId }) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", rideId.toString()],
      });
    },
  });
}

export function useSetProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    UserProfilePublic,
    Error,
    { name: string; email: string; gender: GenderPreference }
  >({
    mutationFn: async ({ name, email, gender }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setProfile(name, email, gender);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useSetProfilePhoto() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { data: Uint8Array; mime: string }>({
    mutationFn: async ({ data, mime }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setProfilePhoto(data, mime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profilePhoto"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useApproveJoinRequest() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    ApproveRejectResult,
    Error,
    { rideId: RideId; requesterId: string }
  >({
    mutationFn: async ({ rideId, requesterId }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as typeof actor & ExtendedActor).approveJoinRequest(
        rideId,
        requesterId,
      );
    },
    onSuccess: (_, { rideId }) => {
      queryClient.invalidateQueries({ queryKey: ["requestsForMyRides"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      queryClient.invalidateQueries({
        queryKey: ["rideRequests", rideId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["rides"] });
    },
  });
}

export function useRejectJoinRequest() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    ApproveRejectResult,
    Error,
    { rideId: RideId; requesterId: string }
  >({
    mutationFn: async ({ rideId, requesterId }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as typeof actor & ExtendedActor).rejectJoinRequest(
        rideId,
        requesterId,
      );
    },
    onSuccess: (_, { rideId }) => {
      queryClient.invalidateQueries({ queryKey: ["requestsForMyRides"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      queryClient.invalidateQueries({
        queryKey: ["rideRequests", rideId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["ride", rideId.toString()] });
    },
  });
}
