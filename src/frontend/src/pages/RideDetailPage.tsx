import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GenderPreference } from "../backend";
import { Layout } from "../components/Layout";
import { SectionLoader } from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import {
  RequestStatus,
  useApproveJoinRequest,
  useMyRequestStatus,
  useMyRideRequests,
  useRejectJoinRequest,
  useRideDetails,
  useSendJoinRequest,
  useWithdrawRide,
} from "../hooks/useQueries";

function JoinRequestModal({
  onCancel,
  onConfirm,
  isPending,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
      role="presentation"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-card rounded-t-3xl p-6 flex flex-col gap-4 shadow-2xl"
        tabIndex={-1}
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 text-center pb-1">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl mb-1">
            🚗
          </div>
          <h2
            id="modal-title"
            className="font-display font-bold text-foreground text-xl"
          >
            Request to Join Ride
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your request will be sent to the ride creator for approval.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <Button
            className="w-full h-12 rounded-xl font-semibold text-base"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="btn-send-request-confirm"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              "Send Request"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-medium"
            onClick={onCancel}
            disabled={isPending}
            data-ocid="btn-send-request-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RideDetailPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { rideId } = useParams({ from: "/ride/$rideId" });
  const { userId, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const sendJoinRequest = useSendJoinRequest();
  const withdrawRide = useWithdrawRide();
  const approveRequest = useApproveJoinRequest();
  const rejectRequest = useRejectJoinRequest();

  const rideIdBigInt = rideId ? BigInt(rideId) : null;
  const { data: ride, isLoading } = useRideDetails(rideIdBigInt);
  const isCreator = ride?.creator_id === userId;
  const { data: requestStatus } = useMyRequestStatus(
    !isCreator ? rideIdBigInt : null,
  );
  const { data: pendingRequests = [] } = useMyRideRequests(
    isCreator ? rideIdBigInt : null,
  );

  const seatsLeft = ride
    ? Number(ride.seats_total) - Number(ride.seats_filled)
    : 0;
  const perPerson = ride
    ? Math.ceil(Number(ride.total_fare) / Number(ride.seats_total))
    : 0;
  const hasJoined = ride?.joined_users.includes(userId ?? "") ?? false;
  const isFull = seatsLeft === 0;

  const dateStr = ride
    ? new Date(Number(ride.datetime) / 1_000_000).toLocaleString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleSendRequest = async () => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (!rideIdBigInt) return;
    const result = await sendJoinRequest.mutateAsync(rideIdBigInt);
    setShowModal(false);
    if (result.__kind__ === "ok") {
      toast.success("Request sent! Waiting for approval.");
    } else if (result.__kind__ === "alreadyRequested") {
      toast.info("You've already sent a request for this ride.");
    } else if (result.__kind__ === "alreadyMember") {
      toast.info("You're already a member of this ride.");
    } else if (result.__kind__ === "rideFull") {
      toast.error("This ride is full.");
    } else {
      toast.error("Could not send request. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    if (!rideIdBigInt) return;
    const result = await withdrawRide.mutateAsync(rideIdBigInt);
    if (result === "ok") {
      toast.success("You've withdrawn from the ride");
      navigate({ to: "/" });
    } else if (result === "notJoined") {
      toast.error("You haven't joined this ride");
    } else {
      toast.error("Ride not found");
    }
  };

  const handleApprove = async (requesterId: string) => {
    if (!rideIdBigInt) return;
    await approveRequest.mutateAsync({ rideId: rideIdBigInt, requesterId });
    toast.success("Request approved");
  };

  const handleReject = async (requesterId: string) => {
    if (!rideIdBigInt) return;
    await rejectRequest.mutateAsync({ rideId: rideIdBigInt, requesterId });
    toast.success("Request rejected");
  };

  const header = (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
        aria-label="Go back"
        data-ocid="btn-back"
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="font-display font-semibold text-foreground text-lg">
        Ride Details
      </span>
    </div>
  );

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      {isLoading ? (
        <SectionLoader />
      ) : !ride ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center px-4">
          <p className="text-muted-foreground">Ride not found.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Route card */}
          <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
            {ride.creator_gender === GenderPreference.female && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30">
                  🚺 Female-Only Ride
                </span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <MapPin className="w-4 h-4 text-primary" />
                <div className="w-0.5 h-8 bg-border" />
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              </div>
              <div className="flex flex-col gap-3 min-w-0">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    From
                  </p>
                  <p className="font-semibold text-foreground text-base">
                    VIT Main Gate
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    To
                  </p>
                  <p className="font-semibold text-foreground text-base">
                    {ride.destination}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-bold text-foreground text-lg">
                  ₹{Number(ride.total_fare)}
                </p>
                <p className="text-xs text-muted-foreground">Total fare</p>
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">
                  ₹{perPerson}
                </p>
                <p className="text-xs text-muted-foreground">Per person</p>
              </div>
              <div>
                <p
                  className={`font-bold text-lg ${isFull ? "text-destructive" : "text-foreground"}`}
                >
                  {seatsLeft}/{Number(ride.seats_total)}
                </p>
                <p className="text-xs text-muted-foreground">Seats left</p>
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Departure
            </p>
            <p className="font-semibold text-foreground">{dateStr}</p>
          </div>

          {/* Seats progress */}
          <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Passengers
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {Number(ride.seats_filled)}/{Number(ride.seats_total)} joined
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-smooth"
                style={{
                  width: `${(Number(ride.seats_filled) / Number(ride.seats_total)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Pending Requests — visible only to ride creator */}
          {isCreator && (
            <div
              className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3"
              data-ocid="section-pending-requests"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Pending Requests
                  </span>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {pendingRequests.length} pending
                  </span>
                )}
              </div>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No pending requests
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingRequests.map((req) => {
                    const initials = req.requester_name
                      ? req.requester_name.slice(0, 2).toUpperCase()
                      : req.requester_id.slice(0, 2).toUpperCase();
                    const isApprovingThis =
                      approveRequest.isPending &&
                      approveRequest.variables?.requesterId ===
                        req.requester_id;
                    const isRejectingThis =
                      rejectRequest.isPending &&
                      rejectRequest.variables?.requesterId === req.requester_id;
                    return (
                      <div
                        key={req.id.toString()}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border"
                        data-ocid="request-card"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary text-xs font-bold">
                            {initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {req.requester_name ||
                              `${req.requester_id.slice(0, 12)}…`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested to join
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.requester_id)}
                            disabled={isApprovingThis || isRejectingThis}
                            aria-label="Approve request"
                            data-ocid="btn-approve-request"
                            className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {isApprovingThis ? (
                              <span className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.requester_id)}
                            disabled={isApprovingThis || isRejectingThis}
                            aria-label="Reject request"
                            data-ocid="btn-reject-request"
                            className="w-8 h-8 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                          >
                            {isRejectingThis ? (
                              <span className="w-3.5 h-3.5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Confirmed Members */}
          {ride.joined_users.length > 0 && (
            <div
              className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3"
              data-ocid="section-confirmed-members"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-sm font-semibold text-foreground">
                  Confirmed Members
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 ml-auto">
                  {ride.joined_users.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {ride.joined_users.map((uid) => (
                  <div
                    key={uid}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30"
                    data-ocid="member-row"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <span className="text-secondary text-xs font-bold">
                        {uid.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-foreground truncate min-w-0">
                      {uid.length > 20 ? `${uid.slice(0, 12)}…` : uid}
                    </span>
                    <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pb-2">
            {/* Non-creator join/request status controls */}
            {!isCreator &&
              !hasJoined &&
              (requestStatus === RequestStatus.not_requested ||
              requestStatus === undefined ? (
                isFull ? (
                  <div className="w-full h-12 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                    <span className="text-destructive text-sm font-semibold">
                      Ride is Full
                    </span>
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 rounded-xl font-semibold text-base"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate({ to: "/login" });
                        return;
                      }
                      setShowModal(true);
                    }}
                    data-ocid="btn-join-ride"
                  >
                    Join Ride
                  </Button>
                )
              ) : requestStatus === RequestStatus.pending ? (
                <div
                  className="w-full h-12 rounded-xl border flex items-center justify-center gap-2 bg-amber-50 border-amber-200"
                  data-ocid="status-pending"
                >
                  <span className="text-sm">🟡</span>
                  <span className="text-sm font-semibold text-amber-700">
                    Pending Approval
                  </span>
                </div>
              ) : requestStatus === RequestStatus.rejected ? (
                <div
                  className="w-full h-12 rounded-xl border flex items-center justify-center gap-2 bg-destructive/5 border-destructive/20"
                  data-ocid="status-rejected"
                >
                  <span className="text-sm">🔴</span>
                  <span className="text-sm font-semibold text-destructive">
                    Request Declined
                  </span>
                </div>
              ) : null)}

            {/* Chat — accessible to joined members and creator */}
            {(hasJoined || isCreator) && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                onClick={() =>
                  navigate({
                    to: "/chat/$rideId",
                    params: { rideId: rideId },
                  })
                }
                data-ocid="btn-open-chat"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Open Group Chat
              </Button>
            )}

            {/* Withdraw — only for joined non-creator users */}
            {hasJoined && !isCreator && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                onClick={handleWithdraw}
                disabled={withdrawRide.isPending}
                data-ocid="btn-withdraw-ride"
              >
                {withdrawRide.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                    Withdrawing...
                  </span>
                ) : (
                  "Withdraw from Ride"
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Join Request Confirmation Modal */}
      {showModal && (
        <JoinRequestModal
          onCancel={() => setShowModal(false)}
          onConfirm={handleSendRequest}
          isPending={sendJoinRequest.isPending}
        />
      )}
    </Layout>
  );
}
