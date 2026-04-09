import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessagePublic } from "../backend.d.ts";
import { Layout } from "../components/Layout";
import { SectionLoader } from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import {
  useMessages,
  useMyRides,
  useRideDetails,
  useSendMessage,
} from "../hooks/useQueries";

function formatTime(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageBubbleProps {
  message: ChatMessagePublic;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div className="flex flex-col gap-1 max-w-[78%]">
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground px-2">
            {message.sender_id.slice(0, 8)}...
          </span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border text-foreground rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>
        <span
          className={`text-[10px] text-muted-foreground px-2 ${isOwn ? "text-right" : ""}`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const params = useParams({ strict: false });
  const { userId, isAuthenticated } = useAuth();
  const { data: myRides } = useMyRides();
  const sendMessage = useSendMessage();

  const rideId = params.rideId ? BigInt(params.rideId) : null;
  const { data: messages, isLoading } = useMessages(rideId);
  const { data: rideDetails } = useRideDetails(rideId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !rideId) return;
    const content = text.trim();
    setText("");
    await sendMessage.mutateAsync({ rideId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If no ride selected, show ride list
  if (!rideId) {
    const header = (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">V</span>
        </div>
        <span className="font-display font-semibold text-foreground text-lg">
          Chats
        </span>
      </div>
    );

    return (
      <Layout activeRoute={routerState.location.pathname} header={header}>
        <div className="px-4 py-4">
          {!myRides || myRides.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="text-4xl">💬</div>
              <p className="font-semibold text-foreground">No ride chats yet</p>
              <p className="text-sm text-muted-foreground">
                Join or create a ride to start chatting
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground font-medium">
                Your Rides
              </p>
              {myRides.map((ride) => (
                <button
                  key={ride.id.toString()}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/chat/$rideId",
                      params: { rideId: ride.id.toString() },
                    })
                  }
                  className="w-full text-left bg-card rounded-2xl border border-border p-4 card-hover"
                  data-ocid="chat-ride-item"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-sm">💬</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        VIT → {ride.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(ride.seats_filled)}/{Number(ride.seats_total)}{" "}
                        passengers
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  const rideInfo = myRides?.find((r) => r.id === rideId);

  // Check if user is still a member (in joined_users or creator)
  const isMember =
    rideDetails?.joined_users.includes(userId ?? "") ||
    rideDetails?.creator_id === userId;

  // rideDetails loaded but user is not a member = they withdrew
  const hasWithdrawn =
    rideDetails !== undefined && rideDetails !== null && !isMember;

  const header = (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => navigate({ to: "/chat" })}
        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
        aria-label="Go back"
        data-ocid="btn-back-chat"
      >
        <ArrowLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">
          {rideInfo ? `VIT → ${rideInfo.destination}` : "Ride Chat"}
        </p>
        <p className="text-xs text-muted-foreground">Group chat</p>
      </div>
    </div>
  );

  // If user has withdrawn from this ride, block access
  if (hasWithdrawn) {
    return (
      <Layout
        activeRoute={routerState.location.pathname}
        header={header}
        showNav={false}
      >
        <div
          className="flex flex-col items-center gap-4 py-24 px-6 text-center"
          data-ocid="withdrawn-state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            🚪
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">
              You have left this ride
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Rejoin the ride to access the group chat
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/ride/$rideId",
                params: { rideId: params.rideId! },
              })
            }
            className="text-primary text-sm font-semibold underline underline-offset-2"
            data-ocid="btn-back-to-ride"
          >
            View Ride Details
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      activeRoute={routerState.location.pathname}
      header={header}
      showNav={false}
    >
      <div className="flex flex-col h-[calc(100svh-64px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/20">
          {isLoading ? (
            <SectionLoader />
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="text-3xl">👋</div>
              <p className="text-sm text-muted-foreground">
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id.toString()}
                message={msg}
                isOwn={msg.sender_id === userId}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-card border-t border-border flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[44px] max-h-[120px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-ocid="input-message"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-smooth active:scale-95"
            aria-label="Send message"
            data-ocid="btn-send-message"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
