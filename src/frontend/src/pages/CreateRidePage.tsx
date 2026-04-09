import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { useCreateRide } from "../hooks/useQueries";

const DESTINATIONS = [
  "Chennai Airport (MAA)",
  "Chennai Central Railway",
  "Katpadi Railway Station",
  "Vellore Bus Stand",
  "CMC Hospital",
  "Vellore Fort",
];

export default function CreateRidePage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated } = useAuth();
  const createRide = useCreateRide();

  const [destination, setDestination] = useState("");
  const [customDest, setCustomDest] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [fare, setFare] = useState("");
  const [seats, setSeats] = useState("4");
  const [showDestList, setShowDestList] = useState(false);

  const selectedDest = destination || customDest;
  const fareNum = Number(fare);
  const seatsNum = Number(seats);
  const perPerson =
    fareNum > 0 && seatsNum > 0 ? Math.ceil(fareNum / seatsNum) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (!selectedDest || !date || !time || fareNum <= 0 || seatsNum <= 0) {
      toast.error("Please fill in all fields");
      return;
    }

    const datetimeMs = new Date(`${date}T${time}`).getTime();
    const datetimeNs = BigInt(datetimeMs) * BigInt(1_000_000);

    const result = await createRide.mutateAsync({
      destination: selectedDest,
      datetime: datetimeNs,
      total_fare: BigInt(fareNum),
      seats_total: BigInt(seatsNum),
    });

    if (result.__kind__ === "ok") {
      toast.success("Ride posted successfully!");
      navigate({ to: "/" });
    } else {
      toast.error(result.err || "Failed to create ride");
    }
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
        Post a Ride
      </span>
    </div>
  );

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-5">
        {/* From */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">From</Label>
          <div className="h-11 rounded-xl bg-muted border border-border px-3 flex items-center">
            <span className="text-sm text-muted-foreground">
              VIT Main Gate, Vellore
            </span>
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-1.5 relative">
          <Label className="text-sm font-medium">To</Label>
          <button
            type="button"
            onClick={() => setShowDestList(!showDestList)}
            className="w-full h-11 rounded-xl border border-input bg-background px-3 flex items-center justify-between text-sm"
            data-ocid="btn-select-destination"
          >
            <span
              className={
                selectedDest ? "text-foreground" : "text-muted-foreground"
              }
            >
              {selectedDest || "Select destination"}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showDestList && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors duration-150 border-b border-border last:border-0"
                  onClick={() => {
                    setDestination(d);
                    setCustomDest("");
                    setShowDestList(false);
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <Input
            placeholder="Or type a custom destination"
            value={customDest}
            onChange={(e) => {
              setCustomDest(e.target.value);
              setDestination("");
            }}
            className="rounded-xl h-11 text-sm"
            data-ocid="input-custom-destination"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl h-11 text-sm"
              min={new Date().toISOString().split("T")[0]}
              required
              data-ocid="input-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl h-11 text-sm"
              required
              data-ocid="input-time"
            />
          </div>
        </div>

        {/* Fare */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Total Fare (₹)</Label>
          <Input
            type="number"
            placeholder="e.g. 400"
            value={fare}
            onChange={(e) => setFare(e.target.value)}
            min="1"
            className="rounded-xl h-11 text-sm"
            required
            data-ocid="input-fare"
          />
        </div>

        {/* Seats */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Available Seats</Label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeats(String(n))}
                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-smooth border ${
                  seats === String(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
                data-ocid={`btn-seats-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Per person preview */}
        {perPerson > 0 && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Per person cost
            </span>
            <span className="font-bold text-foreground text-lg">
              ₹{perPerson}
            </span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl font-semibold text-base"
          disabled={createRide.isPending}
          data-ocid="btn-post-ride"
        >
          {createRide.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Posting...
            </span>
          ) : (
            "Post Ride"
          )}
        </Button>
      </form>
    </Layout>
  );
}
