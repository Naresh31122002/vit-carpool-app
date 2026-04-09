import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, MapPin, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { GenderPreference } from "../backend";
import type { RidePublic } from "../backend.d.ts";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  RequestStatus,
  useGenderFilteredRides,
  useMyPendingRequestsCount,
  useMyRequestStatus,
  useProfile,
  useRides,
} from "../hooks/useQueries";

function getRideBadge(ride: RidePublic): "full" | "urgent" | null {
  const seatsLeft = Number(ride.seats_total) - Number(ride.seats_filled);
  if (seatsLeft === 0) return "full";
  if (seatsLeft === 1) return "urgent";
  return null;
}

function RideCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function RequestStatusBadge({ rideId }: { rideId: bigint }) {
  const { data: status } = useMyRequestStatus(rideId);
  if (!status || status === RequestStatus.not_requested) return null;
  if (status === RequestStatus.pending) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700"
        data-ocid="badge-request-pending"
      >
        🟡 Pending
      </span>
    );
  }
  if (status === RequestStatus.accepted) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700"
        data-ocid="badge-request-accepted"
      >
        🟢 Accepted
      </span>
    );
  }
  if (status === RequestStatus.rejected) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-destructive/5 border-destructive/20 text-destructive"
        data-ocid="badge-request-rejected"
      >
        🔴 Declined
      </span>
    );
  }
  return null;
}

interface RideCardProps {
  ride: RidePublic;
  isCheapest?: boolean;
  isFemaleOnly?: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

function RideCard({
  ride,
  isCheapest,
  isFemaleOnly,
  isOwn,
  onClick,
}: RideCardProps) {
  const seatsLeft = Number(ride.seats_total) - Number(ride.seats_filled);
  const perPerson = Math.ceil(
    Number(ride.total_fare) / Number(ride.seats_total),
  );
  const badge = isCheapest ? "cheapest" : getRideBadge(ride);

  const dateStr = new Date(Number(ride.datetime) / 1_000_000).toLocaleString(
    "en-IN",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl border border-border p-4 card-hover shadow-card flex flex-col gap-3"
      data-ocid="ride-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Origin
          </span>
          {isFemaleOnly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/30">
              🚺 Female Only
            </span>
          )}
        </div>
        {badge && (
          <span
            className={
              badge === "cheapest"
                ? "badge-cheapest"
                : badge === "full"
                  ? "badge-full"
                  : "badge-urgent"
            }
          >
            {badge === "cheapest"
              ? "Cheapest"
              : badge === "full"
                ? "Full"
                : `${seatsLeft} seat left`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <MapPin className="w-4 h-4 text-primary" />
          <div className="w-0.5 h-4 bg-border" />
          <div className="w-2 h-2 rounded-full bg-secondary" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-foreground text-base leading-tight">
            VIT Main Gate → {ride.destination}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {dateStr}
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        <div>
          <p className="font-bold text-foreground text-base">
            ₹{Number(ride.total_fare)}
          </p>
          <p className="text-xs text-muted-foreground">
            ₹{perPerson} per person
          </p>
        </div>
        <div>
          <p className="font-bold text-foreground text-base">
            {seatsLeft > 0 ? seatsLeft : "0"} Seats
          </p>
          <p className="text-xs text-muted-foreground">
            {seatsLeft > 0 ? "Available" : "Full"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">
              {ride.creator_id.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {isOwn ? "Your Ride" : "Driver"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Ride · {dateStr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isOwn && <RequestStatusBadge rideId={ride.id} />}
          {seatsLeft > 0 && !isOwn && (
            <div className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0">
              Join Ride
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const { isAuthenticated, isInitializing, userId } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { data: pendingCount } = useMyPendingRequestsCount();
  const [search, setSearch] = useState("");

  const { data: profile } = useProfile();
  const isFemaleUser = profile?.gender === GenderPreference.female;

  const { data: allRides, isLoading: allLoading } = useRides();
  const { data: femaleRides, isLoading: femaleLoading } =
    useGenderFilteredRides(isFemaleUser ? GenderPreference.female : null);

  const rides = isFemaleUser ? femaleRides : allRides;
  const isLoading = isFemaleUser ? femaleLoading : allLoading;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const filteredRides = (rides ?? []).filter(
    (r) =>
      search === "" ||
      r.destination.toLowerCase().includes(search.toLowerCase()),
  );

  const availableRides = filteredRides.filter(
    (r) => Number(r.seats_total) > Number(r.seats_filled),
  );
  const cheapestFare =
    availableRides.length > 0
      ? Math.min(...availableRides.map((r) => Number(r.total_fare)))
      : null;

  const header = (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">V</span>
        </div>
        <span className="font-display font-bold text-foreground text-lg">
          VIT Cabs
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isFemaleUser && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30">
            🚺 Female-Only Feed
          </span>
        )}
        <button
          type="button"
          className="relative w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
          aria-label="Notifications"
          data-ocid="btn-notifications"
          onClick={() => navigate({ to: "/requests" })}
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {pendingCount !== undefined && Number(pendingCount) > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center leading-none">
              {Number(pendingCount) > 99 ? "99+" : Number(pendingCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Find a Ride"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-muted border-0 text-sm"
            data-ocid="input-search"
          />
        </div>

        {/* Ride List */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <>
              <RideCardSkeleton />
              <RideCardSkeleton />
              <RideCardSkeleton />
            </>
          ) : filteredRides.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-16 text-center"
              data-ocid="empty-rides"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
                🚗
              </div>
              <div>
                <p className="font-semibold text-foreground">No rides found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? "Try a different destination"
                    : isFemaleUser
                      ? "No female-posted rides available yet"
                      : "Be the first to post a ride!"}
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate({ to: "/create" })}
                data-ocid="btn-create-first-ride"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post a Ride
              </Button>
            </div>
          ) : (
            filteredRides.map((ride) => (
              <RideCard
                key={ride.id.toString()}
                ride={ride}
                isFemaleOnly={ride.creator_gender === GenderPreference.female}
                isOwn={ride.creator_id === userId}
                isCheapest={
                  cheapestFare !== null &&
                  Number(ride.total_fare) === cheapestFare &&
                  Number(ride.seats_total) > Number(ride.seats_filled)
                }
                onClick={() =>
                  navigate({
                    to: "/ride/$rideId",
                    params: { rideId: ride.id.toString() },
                  })
                }
              />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate({ to: "/create" })}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-smooth active:scale-95 z-40"
        aria-label="Create ride"
        data-ocid="fab-create-ride"
      >
        <Plus className="w-6 h-6" />
      </button>
    </Layout>
  );
}
