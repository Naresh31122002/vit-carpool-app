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

function FemaleOnlyToggle({
  enabled,
  onChange,
  disabled = false,
  onDisabledClick,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}) {
  return (
    <div
      className={`border rounded-2xl p-4 flex flex-col gap-2 ${
        disabled
          ? "bg-muted/40 border-border opacity-60"
          : "bg-pink-50 border-pink-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">👩</span>
          <span
            className={`text-sm font-semibold ${
              disabled ? "text-muted-foreground" : "text-pink-800"
            }`}
          >
            Female Only Ride
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) {
              onDisabledClick?.();
            } else {
              onChange(!enabled);
            }
          }}
          data-ocid="toggle-female-only"
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
            disabled
              ? "bg-muted cursor-not-allowed"
              : enabled
                ? "bg-pink-500"
                : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-200 ${
              enabled && !disabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      <p
        className={`text-xs ${disabled ? "text-muted-foreground" : "text-pink-600"}`}
      >
        {disabled
          ? "This option is only available for female users."
          : "Only female students can join this ride."}
      </p>
    </div>
  );
}

// ---- 12-hour AM/PM time picker ----
interface AmPmTimePickerProps {
  value: string; // internal 24-hour "HH:MM" for backend compatibility
  onChange: (val: string) => void;
}

function AmPmTimePicker({ value, onChange }: AmPmTimePickerProps) {
  const parseValue = (
    v: string,
  ): { hour: string; minute: string; ampm: "AM" | "PM" } => {
    if (!v) return { hour: "9", minute: "00", ampm: "AM" };
    const [hStr, mStr] = v.split(":");
    const h24 = Number.parseInt(hStr, 10);
    const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return { hour: String(h12), minute: mStr || "00", ampm };
  };

  const { hour, minute, ampm } = parseValue(value);

  const buildValue = (h: string, m: string, ap: "AM" | "PM"): string => {
    const hNum = Number.parseInt(h, 10);
    let h24 = hNum;
    if (ap === "AM" && hNum === 12) h24 = 0;
    else if (ap === "PM" && hNum !== 12) h24 = hNum + 12;
    return `${String(h24).padStart(2, "0")}:${m}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = [
    "00",
    "05",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
  ];

  return (
    <fieldset
      className="flex items-center gap-2"
      data-ocid="time-picker"
      aria-label="Time picker"
    >
      {/* Hour selector */}
      <div className="relative flex-1">
        <select
          value={hour}
          onChange={(e) => onChange(buildValue(e.target.value, minute, ampm))}
          className="w-full h-11 rounded-xl border border-input bg-background px-3 pr-8 text-sm appearance-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          data-ocid="select-hour"
          aria-label="Hour"
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      <span className="text-foreground font-semibold text-sm flex-shrink-0">
        :
      </span>

      {/* Minute selector */}
      <div className="relative flex-1">
        <select
          value={minute}
          onChange={(e) => onChange(buildValue(hour, e.target.value, ampm))}
          className="w-full h-11 rounded-xl border border-input bg-background px-3 pr-8 text-sm appearance-none text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          data-ocid="select-minute"
          aria-label="Minute"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* AM/PM toggle */}
      <div className="flex rounded-xl overflow-hidden border border-input h-11 flex-shrink-0">
        {(["AM", "PM"] as const).map((ap) => (
          <button
            key={ap}
            type="button"
            onClick={() => onChange(buildValue(hour, minute, ap))}
            className={`w-12 h-full text-sm font-semibold transition-colors duration-150 ${
              ampm === ap
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            data-ocid={`btn-ampm-${ap.toLowerCase()}`}
          >
            {ap}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

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
  const [time, setTime] = useState("09:00"); // default 9:00 AM
  const [fare, setFare] = useState("");
  const [seats, setSeats] = useState("4");
  const [showDestList, setShowDestList] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [showFemaleOnlyMsg, setShowFemaleOnlyMsg] = useState(false);

  const storedGender = localStorage.getItem("vit_user_gender");
  const isFemaleUser = storedGender === "female";

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
      female_only: femaleOnly,
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
        <div className="flex flex-col gap-3">
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
            <AmPmTimePicker value={time} onChange={setTime} />
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

        {/* Female Only toggle — visible to all, disabled for non-female users */}
        <div>
          <FemaleOnlyToggle
            enabled={femaleOnly}
            onChange={setFemaleOnly}
            disabled={!isFemaleUser}
            onDisabledClick={() => setShowFemaleOnlyMsg(true)}
          />
          {showFemaleOnlyMsg && !isFemaleUser && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              The Female Only Ride option is only available for female users.
            </p>
          )}
        </div>

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
