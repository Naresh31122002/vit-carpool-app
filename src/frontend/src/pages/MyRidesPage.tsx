import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { RidePublic } from "../backend.d.ts";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  useJoinedRides,
  usePostedRides,
  useWithdrawRide,
} from "../hooks/useQueries";

type TabId = "posted" | "joined";

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

interface RideRowProps {
  ride: RidePublic;
  tab: TabId;
  onView: () => void;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}

function RideRow({
  ride,
  tab,
  onView,
  onWithdraw,
  isWithdrawing,
}: RideRowProps) {
  const seatsLeft = Number(ride.seats_total) - Number(ride.seats_filled);
  const isFull = seatsLeft === 0;
  const dateStr = new Date(Number(ride.datetime) / 1_000_000).toLocaleString(
    "en-IN",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

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
          <p className="font-semibold text-foreground text-sm truncate">
            VIT → {ride.destination}
          </p>
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

      {tab === "joined" && (
        <button
          type="button"
          onClick={onWithdraw}
          disabled={isWithdrawing}
          className="w-full h-9 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center justify-center gap-2 transition-smooth active:scale-95 disabled:opacity-50 hover:bg-destructive/10"
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
  const rides = activeTab === "posted" ? postedRides : joinedRides;

  const header = (
    <div className="flex flex-col">
      {/* Title row */}
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

      {/* Tab bar */}
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
        ) : !rides || rides.length === 0 ? (
          <EmptyState
            tab={activeTab}
            onCreateRide={() =>
              activeTab === "posted"
                ? navigate({ to: "/create" })
                : navigate({ to: "/" })
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rides.map((ride) => (
              <RideRow
                key={ride.id.toString()}
                ride={ride}
                tab={activeTab}
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
