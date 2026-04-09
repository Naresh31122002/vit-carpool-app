import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  type JoinRequestPublic,
  type RideRequestsGroup,
  useApproveJoinRequest,
  useMyPendingRequestsCount,
  useRejectJoinRequest,
  useRequestsForMyRides,
} from "../hooks/useQueries";

function RequestCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: JoinRequestPublic;
  rideId: bigint;
  onApproved: () => void;
  onRejected: () => void;
}

function RequestCard({
  request,
  rideId,
  onApproved,
  onRejected,
}: RequestCardProps) {
  const approve = useApproveJoinRequest();
  const reject = useRejectJoinRequest();
  const initials = request.requester_name
    ? request.requester_name.slice(0, 2).toUpperCase()
    : request.requester_id.slice(0, 2).toUpperCase();

  const handleApprove = async () => {
    const result = await approve.mutateAsync({
      rideId,
      requesterId: request.requester_id,
    });
    if (result === "ok") {
      toast.success("Request approved!");
      onApproved();
    } else if (result === "rideFull") {
      toast.error("Ride is full");
    } else if (result === "unauthorized") {
      toast.error("You are not authorized to approve this request");
    } else {
      toast.error("Could not approve request");
    }
  };

  const handleReject = async () => {
    const result = await reject.mutateAsync({
      rideId,
      requesterId: request.requester_id,
    });
    if (result === "ok") {
      toast.success("Request rejected");
      onRejected();
    } else if (result === "unauthorized") {
      toast.error("You are not authorized to reject this request");
    } else {
      toast.error("Could not reject request");
    }
  };

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3"
      data-ocid="request-card"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {request.requester_name || request.requester_id}
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            Requested to join
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={approve.isPending || reject.isPending}
          className="flex-1 h-9 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-smooth active:scale-95 disabled:opacity-50"
          data-ocid="btn-approve-request"
        >
          {approve.isPending ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Approve
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={approve.isPending || reject.isPending}
          className="flex-1 h-9 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 transition-smooth active:scale-95 disabled:opacity-50 hover:bg-destructive/10"
          data-ocid="btn-reject-request"
        >
          {reject.isPending ? (
            <span className="w-3.5 h-3.5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Reject
        </button>
      </div>
    </div>
  );
}

interface RideGroupProps {
  group: RideRequestsGroup;
}

function RideGroup({ group }: RideGroupProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dateStr = new Date(Number(group.datetime) / 1_000_000).toLocaleString(
    "en-IN",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  const activeRequests = group.requests.filter(
    (r) => !dismissed.has(r.requester_id),
  );
  if (activeRequests.length === 0) return null;

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            VIT → {group.destination}
          </p>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
      </div>
      {activeRequests.map((req) => (
        <RequestCard
          key={req.requester_id}
          request={req}
          rideId={group.ride_id}
          onApproved={() => dismiss(req.requester_id)}
          onRejected={() => dismiss(req.requester_id)}
        />
      ))}
    </div>
  );
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: groups, isLoading } = useRequestsForMyRides();
  const { data: pendingCount } = useMyPendingRequestsCount();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const totalPending = pendingCount !== undefined ? Number(pendingCount) : 0;

  const header = (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"
        aria-label="Back"
        data-ocid="btn-back-requests"
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <span className="font-display font-semibold text-foreground text-lg">
          Ride Requests
        </span>
        {totalPending > 0 && (
          <span className="ml-2 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
            {totalPending}
          </span>
        )}
      </div>
    </div>
  );

  const hasAnyRequests = groups?.some((g) => g.requests.length > 0);

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      <div className="px-4 py-4 flex flex-col gap-5">
        {isLoading ? (
          <>
            <RequestCardSkeleton />
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </>
        ) : !hasAnyRequests ? (
          <div
            className="flex flex-col items-center gap-3 py-20 text-center"
            data-ocid="empty-requests"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              🔔
            </div>
            <div>
              <p className="font-semibold text-foreground">
                No pending requests
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                When students request to join your rides, they'll appear here
              </p>
            </div>
          </div>
        ) : (
          (groups ?? []).map((group) => (
            <RideGroup key={group.ride_id.toString()} group={group} />
          ))
        )}
      </div>
    </Layout>
  );
}
