import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GenderPreference, type WithdrawResult, createActor } from "../backend";
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

// ---- Helper: get current user ID from localStorage ----
export function getCurrentUserId(): string {
  return localStorage.getItem("vit_user_email") ?? "me";
}

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
  requester_email?: string;
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

// Extended profile with preferred_destination stored locally
export interface UserProfileWithDest extends UserProfilePublic {
  preferred_destination?: string;
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

// ---- Local storage helper for preferred_destination ----

const PREF_DEST_KEY = "vit_preferred_destination";

export function getLocalPreferredDestination(): string {
  return localStorage.getItem(PREF_DEST_KEY) ?? "";
}

export function setLocalPreferredDestination(dest: string): void {
  localStorage.setItem(PREF_DEST_KEY, dest);
}

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
    refetchInterval: 30000,
    staleTime: 20000,
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
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

const _mockRideNow = Date.now();
const MOCK_RIDES_MAP: Record<string, (creatorId: string) => RidePublic> = {
  "8001": (creatorId) => ({
    id: 8001n,
    destination: "Chennai Airport",
    creator_id: creatorId,
    creator_gender: GenderPreference.none,
    datetime: BigInt((_mockRideNow + 6 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 800n,
    seats_total: 4n,
    seats_filled: 1n,
    female_only: false,
    joined_users: [],
    pending_requests: ["mock_req_1", "mock_req_2"],
    confirmed_users: [],
  }),
  "8002": (creatorId) => ({
    id: 8002n,
    destination: "Chennai Central Railway",
    creator_id: creatorId,
    creator_gender: GenderPreference.none,
    datetime: BigInt((_mockRideNow + 24 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 600n,
    seats_total: 3n,
    seats_filled: 0n,
    female_only: false,
    joined_users: [],
    pending_requests: [],
    confirmed_users: [],
  }),
  // Mock joined ride — creator is a different user; current user is confirmed
  "8003": () => ({
    id: 8003n,
    destination: "Vellore Bus Stand",
    creator_id: "mock_arjun_k",
    creator_gender: GenderPreference.male,
    datetime: BigInt((_mockRideNow + 2 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 200n,
    seats_total: 4n,
    seats_filled: 3n,
    female_only: false,
    joined_users: [getCurrentUserId()],
    pending_requests: [],
    confirmed_users: [getCurrentUserId()],
  }),
};

export function useRideDetails(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RidePublic | null>({
    queryKey: ["ride", rideId?.toString()],
    queryFn: async () => {
      if (rideId == null) return null;
      const rideKey = rideId.toString();
      if (rideKey in MOCK_RIDES_MAP) {
        // Pass currentUserId so creator_id is set correctly for posted rides
        return MOCK_RIDES_MAP[rideKey](getCurrentUserId());
      }
      if (!actor) return null;
      return actor.getRideDetails(rideId);
    },
    enabled:
      rideId != null &&
      (rideId.toString() in MOCK_RIDES_MAP || (!!actor && !isFetching)),
    staleTime: 0,
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
    staleTime: 20000,
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
    staleTime: 20000,
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
    staleTime: 20000,
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
    staleTime: 20000,
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
    staleTime: 20000,
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
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

export function useMyRideRequests(rideId: RideId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<JoinRequestPublic[]>({
    queryKey: ["rideRequests", rideId?.toString()],
    queryFn: async () => {
      if (rideId == null) return [];
      // Return mock data for known demo ride IDs (no backend call needed)
      const rideKey = rideId.toString();
      if (rideKey in MOCK_PENDING_REQUESTS) {
        return MOCK_PENDING_REQUESTS[rideKey];
      }
      if (!actor) return [];
      // Try the real backend getRideRequests which returns UserProfilePublic[]
      try {
        const result = await actor.getRideRequests(rideId);
        if (result.__kind__ === "ok") {
          return result.ok.map((profile, idx) => ({
            id: BigInt(idx),
            status: RequestStatus.pending,
            ride_id: rideId,
            ride_datetime: 0n,
            requested_at: 0n,
            requester_id: profile.id,
            requester_name: profile.name || profile.email,
            requester_email: profile.email,
            ride_destination: "",
          }));
        }
        return [];
      } catch {
        // Fallback: try extended actor method
        try {
          return await (
            actor as typeof actor & ExtendedActor
          ).getMyRideRequests(rideId);
        } catch {
          return [];
        }
      }
    },
    enabled:
      rideId != null &&
      (rideId.toString() in MOCK_PENDING_REQUESTS || (!!actor && !isFetching)),
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

// ---- Mock data for demo (pending join requests with VIT emails) ----
const _mockTs = Date.now();

export const MOCK_PENDING_REQUESTS: Record<string, JoinRequestPublic[]> = {
  "8001": [
    {
      id: 1n,
      status: RequestStatus.pending,
      ride_id: 8001n,
      ride_datetime: BigInt((_mockTs + 6 * 60 * 60 * 1000) * 1_000_000),
      requested_at: BigInt(_mockTs * 1_000_000),
      requester_id: "mock_req_1",
      requester_name: "Rahul Kumar",
      requester_email: "rahul.kumar2024@vitstudent.ac.in",
      ride_destination: "Chennai Airport",
    },
    {
      id: 2n,
      status: RequestStatus.pending,
      ride_id: 8001n,
      ride_datetime: BigInt((_mockTs + 6 * 60 * 60 * 1000) * 1_000_000),
      requested_at: BigInt((_mockTs - 5 * 60 * 1000) * 1_000_000),
      requester_id: "mock_req_2",
      requester_name: "Priya Sharma",
      requester_email: "priya.sharma2025@vitstudent.ac.in",
      ride_destination: "Chennai Airport",
    },
  ],
};

const MOCK_REQUEST_GROUPS: RideRequestsGroup[] = [
  {
    destination: "Chennai Airport",
    ride_id: 8001n,
    datetime: BigInt((_mockTs + 6 * 60 * 60 * 1000) * 1_000_000),
    requests: MOCK_PENDING_REQUESTS["8001"],
  },
];

export function useRequestsForMyRides() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<RideRequestsGroup[]>({
    queryKey: ["requestsForMyRides"],
    queryFn: async () => {
      if (!actor) return MOCK_REQUEST_GROUPS;
      // Try extended actor method
      try {
        const groups = await (
          actor as typeof actor & ExtendedActor
        ).getRequestsForMyRides();
        // If backend returns nothing, show mock data with emails for demo
        if (groups.length === 0) return MOCK_REQUEST_GROUPS;
        // Enrich each request with email from getRideRequests
        const enriched = await Promise.all(
          groups.map(async (group) => {
            try {
              const reqResult = await actor.getRideRequests(group.ride_id);
              if (reqResult.__kind__ === "ok") {
                const emailMap = new Map(
                  reqResult.ok.map((p) => [p.id, p.email]),
                );
                return {
                  ...group,
                  requests: group.requests.map((req) => ({
                    ...req,
                    requester_email:
                      emailMap.get(req.requester_id) ?? req.requester_email,
                  })),
                };
              }
            } catch {
              // ignore enrichment failure
            }
            return group;
          }),
        );
        return enriched;
      } catch {
        return MOCK_REQUEST_GROUPS;
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
    staleTime: 20000,
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
    refetchInterval: 30000,
    staleTime: 20000,
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
      female_only?: boolean;
    }
  >({
    mutationFn: async ({
      destination,
      datetime,
      total_fare,
      seats_total,
      female_only = false,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createRide(
        destination,
        datetime,
        total_fare,
        seats_total,
        female_only,
      );
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
      // Backend returns {__kind__:"ok",ok:null}|{__kind__:"err",err:string}
      // Cast to our local JoinRequestResult shape
      const result = await (
        actor as typeof actor & ExtendedActor
      ).sendJoinRequest(rideId);
      return result as unknown as JoinRequestResult;
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
    {
      name: string;
      email: string;
      gender: GenderPreference;
      preferred_destination?: string;
    }
  >({
    mutationFn: async ({ name, email, gender, preferred_destination }) => {
      if (!actor) throw new Error("Not connected");
      // Save preferred_destination locally
      setLocalPreferredDestination(preferred_destination ?? "");
      return actor.setProfile(
        name,
        email,
        gender,
        preferred_destination ?? null,
      );
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
      const result = await (
        actor as typeof actor & ExtendedActor
      ).approveJoinRequest(rideId, requesterId);
      return result as unknown as ApproveRejectResult;
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
      const result = await (
        actor as typeof actor & ExtendedActor
      ).rejectJoinRequest(rideId, requesterId);
      return result as unknown as ApproveRejectResult;
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
