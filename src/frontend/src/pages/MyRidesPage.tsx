import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, MapPin, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GenderPreference } from "../backend";
import type { RidePublic } from "../backend.d.ts";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  RequestStatus,
  getCurrentUserId,
  useJoinedRides,
  useMyRequestStatus,
  usePostedRides,
  useWithdrawRide,
} from "../hooks/useQueries";

type TabId = "posted" | "joined";

// ---- Mock rides for demo purposes ----
const now = Date.now();

const MOCK_POSTED_RIDES: RidePublic[] = [
  {
    id: 8001n,
    destination: "Chennai Airport",
    creator_id: getCurrentUserId(),
    creator_gender: GenderPreference.none,
    datetime: BigInt((now + 6 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 800n,
    seats_total: 4n,
    seats_filled: 1n,
    female_only: false,
    joined_users: [],
    pending_requests: ["mock_req_1"],
    confirmed_users: [],
  },
  {
    id: 8002n,
    destination: "Chennai Central Railway",
    creator_id: getCurrentUserId(),
    creator_gender: GenderPreference.none,
    datetime: BigInt((now + 24 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 600n,
    seats_total: 3n,
    seats_filled: 0n,
    female_only: false,
    joined_users: [],
    pending_requests: [],
    confirmed_users: [],
  },
];

const MOCK_JOINED_RIDES: RidePublic[] = [
  {
    id: 8003n,
    destination: "Vellore Bus Stand",
    creator_id: "mock_arjun_k",
    creator_gender: GenderPreference.male,
    datetime: BigInt((now + 2 * 60 * 60 * 1000) * 1_000_000),
    total_fare: 200n,
    seats_total: 4n,
    seats_filled: 3n,
    female_only: false,
    joined_users: ["me"],
    pending_requests: [],
    confirmed_users: ["me"],
  },
];

function RideItemSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// ---- Joined ride status badge (per-ride request status) ----
interface JoinedRideStatusProps {
  ride: RidePublic;
  isMock: boolean;
  onWithdraw: () => void;
  isWithdrawing: boolean;
  onView: () => void;
}

function JoinedRideRow({
  ride,
  isMock,
  onWithdraw,
  isWithdrawing,
  onView,
}: JoinedRideStatusProps) {
  const navigate = useNavigate();
  const seatsLeft = Number(ride.seats_total) - Number(ride.seats_filled);
  const isFull = seatsLeft === 0;
  const dateStr = new Date(Number(ride.datetime) / 1_000_000).toLocaleString(
    "en-IN",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  // Derive status from mock data: if confirmed_users contains 'me' → accepted
  // For real rides, use the hook
  const rideIdBigInt = isMock ? null : ride.id;
  const { data: fetchedStatus } = useMyRequestStatus(rideIdBigInt);

  // For mock ride 8003: confirmed_users has 'me' → treat as accepted
  const currentUserId = getCurrentUserId();
  let status: string;
  if (isMock) {
    if (
      ride.confirmed_users.includes("me") ||
      ride.confirmed_users.includes(currentUserId)
    ) {
      status = RequestStatus.accepted;
    } else if (
      ride.pending_requests.includes("me") ||
      ride.pending_requests.includes(currentUserId)
    ) {
      status = RequestStatus.pending;
    } else {
      status = RequestStatus.rejected;
    }
  } else {
    status = fetchedStatus ?? RequestStatus.pending;
  }

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3 w-full"
      style={{ overflow: "visible" }}
      data-ocid="my-ride-item"
    >
      {/* Ride info row */}
      <button
        type="button"
        onClick={onView}
        className="flex items-center gap-3 text-left w-full min-w-0"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm truncate">
              VIT → {ride.destination}
            </p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={isFull ? "badge-full" : "badge-cheapest"}>
            {isFull ? "Full" : `${seatsLeft} left`}
          </span>
          <span className="text-xs font-medium text-foreground">
            ₹{Number(ride.total_fare)}
          </span>
        </div>
      </button>

      {/* Status indicator */}
      {status === RequestStatus.accepted && (
        <>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 w-full"
            data-ocid="status-accepted"
          >
            <span className="text-sm flex-shrink-0">🟢</span>
            <span className="text-sm font-semibold text-emerald-700">
              Accepted — You're in!
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 rounded-xl font-semibold text-sm border-primary/40 text-primary hover:bg-primary/10"
            onClick={() =>
              navigate({
                to: "/chat/$rideId",
                params: { rideId: ride.id.toString() },
              })
            }
            data-ocid="btn-group-chat"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Open Group Chat
          </Button>
        </>
      )}

      {status === RequestStatus.rejected && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20 w-full"
          data-ocid="status-rejected"
        >
          <span className="text-sm flex-shrink-0">🔴</span>
          <span className="text-sm font-semibold text-destructive">
            You have been rejected from this ride
          </span>
        </div>
      )}

      {status === RequestStatus.pending && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 w-full"
          data-ocid="status-pending"
        >
          <span className="text-sm flex-shrink-0">🟡</span>
          <span className="text-sm font-semibold text-amber-700">
            Pending Approval
          </span>
        </div>
      )}

      {/* Withdraw button */}
      <button
        type="button"
        onClick={onWithdraw}
        disabled={isWithdrawing || isMock}
        className="w-full h-10 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center justify-center gap-2 transition-smooth active:scale-95 disabled:opacity-50 hover:bg-destructive/10 flex-shrink-0"
        data-ocid="btn-withdraw-my-ride"
      >
        {isWithdrawing ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
            Withdrawing...
          </>
        ) : (
          "Withdraw from Ride"
        )}
      </button>
    </div>
  );
}

// ---- Posted ride row (creator view — NO join button, only accept/reject in detail) ----
interface PostedRideRowProps {
  ride: RidePublic;
  isMock?: boolean;
  onView: () => void;
}

function PostedRideRow({ ride, isMock, onView }: PostedRideRowProps) {
  const seatsLeft = Number(ride.seats_total) - Number(ride.seats_filled);
  const isFull = seatsLeft === 0;
  const dateStr = new Date(Number(ride.datetime) / 1_000_000).toLocaleString(
    "en-IN",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );
  const hasPendingRequests = ride.pending_requests.length > 0;

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3"
      data-ocid="my-ride-item"
    >
      <button
        type="button"
        onClick={onView}
        className="flex items-center gap-3 text-left w-full"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm truncate">
              VIT → {ride.destination}
            </p>
            {isMock && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Your Ride
              </span>
            )}
            {hasPendingRequests && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {ride.pending_requests.length} request
                {ride.pending_requests.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={isFull ? "badge-full" : "badge-cheapest"}>
            {isFull ? "Full" : `${seatsLeft} left`}
          </span>
          <span className="text-xs font-medium text-foreground">
            ₹{Number(ride.total_fare)}
          </span>
        </div>
      </button>

      {/* Tap to manage requests hint */}
      {hasPendingRequests && (
        <button
          type="button"
          onClick={onView}
          className="w-full h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold flex items-center justify-center gap-2 transition-smooth active:scale-95 hover:bg-amber-100"
          data-ocid="btn-manage-requests"
        >
          Tap to Accept / Reject Requests
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  tab: TabId;
  onCreateRide: () => void;
}

function EmptyState({ tab, onCreateRide }: EmptyStateProps) {
  if (tab === "posted") {
    return (
      <div
        className="flex flex-col items-center gap-4 py-20 text-center"
        data-ocid="empty-posted-rides"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
          🚗
        </div>
        <div>
          <p className="font-semibold text-foreground">No rides posted yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a ride and offer seats to fellow VITians
          </p>
        </div>
        <Button
          className="rounded-xl"
          onClick={onCreateRide}
          data-ocid="btn-create-ride-empty"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post a Ride
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 py-20 text-center"
      data-ocid="empty-joined-rides"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
        🙋
      </div>
      <div>
        <p className="font-semibold text-foreground">No rides joined yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Browse the feed and hop into a ride with other VIT students
        </p>
      </div>
      <Button
        variant="outline"
        className="rounded-xl"
        onClick={onCreateRide}
        data-ocid="btn-browse-rides-empty"
      >
        Browse Rides
      </Button>
    </div>
  );
}

export default function MyRidesPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated, isInitializing } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("posted");

  const { data: postedRides, isLoading: isLoadingPosted } = usePostedRides();
  const { data: joinedRides, isLoading: isLoadingJoined } = useJoinedRides();
  const withdrawRide = useWithdrawRide();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleWithdraw = async (rideId: bigint) => {
    const result = await withdrawRide.mutateAsync(rideId);
    if (result === "ok") {
      toast.success("Withdrawn from ride successfully");
    } else if (result === "notJoined") {
      toast.error("You haven't joined this ride");
    } else {
      toast.error("Ride not found");
    }
  };

  const isLoading = activeTab === "posted" ? isLoadingPosted : isLoadingJoined;

  const realPosted = postedRides ?? [];
  const realJoined = joinedRides ?? [];

  type RideEntry = { ride: RidePublic; isMock: boolean };

  const displayPosted: RideEntry[] =
    !isLoadingPosted && realPosted.length === 0
      ? MOCK_POSTED_RIDES.map((r) => ({ ride: r, isMock: true }))
      : realPosted.map((r) => ({ ride: r, isMock: false }));

  const displayJoined: RideEntry[] =
    !isLoadingJoined && realJoined.length === 0
      ? MOCK_JOINED_RIDES.map((r) => ({ ride: r, isMock: true }))
      : realJoined.map((r) => ({ ride: r, isMock: false }));

  const header = (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display font-semibold text-foreground text-lg">
          My Rides
        </span>
        {activeTab === "posted" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8"
            onClick={() => navigate({ to: "/create" })}
            data-ocid="btn-new-ride"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Ride
          </Button>
        )}
      </div>

      <div className="flex border-b border-border">
        {(["posted", "joined"] as TabId[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 relative py-2.5 text-sm font-semibold transition-colors duration-200 ${activeTab === tab ? "text-sky-500" : "text-muted-foreground"}`}
            data-ocid={`tab-${tab}-rides`}
          >
            {tab === "posted" ? "Posted Rides" : "Joined Rides"}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sky-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <RideItemSkeleton />
            <RideItemSkeleton />
            <RideItemSkeleton />
          </div>
        ) : activeTab === "posted" ? (
          displayPosted.length === 0 ? (
            <EmptyState
              tab="posted"
              onCreateRide={() => navigate({ to: "/create" })}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {displayPosted.map(({ ride, isMock }) => (
                <PostedRideRow
                  key={ride.id.toString()}
                  ride={ride}
                  isMock={isMock}
                  onView={() =>
                    navigate({
                      to: "/ride/$rideId",
                      params: { rideId: ride.id.toString() },
                    })
                  }
                />
              ))}
            </div>
          )
        ) : displayJoined.length === 0 ? (
          <EmptyState tab="joined" onCreateRide={() => navigate({ to: "/" })} />
        ) : (
          <div className="flex flex-col gap-3">
            {displayJoined.map(({ ride, isMock }) => (
              <JoinedRideRow
                key={ride.id.toString()}
                ride={ride}
                isMock={isMock}
                onView={() =>
                  navigate({
                    to: "/ride/$rideId",
                    params: { rideId: ride.id.toString() },
                  })
                }
                onWithdraw={() => handleWithdraw(ride.id)}
                isWithdrawing={withdrawRide.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
