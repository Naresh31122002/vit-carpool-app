import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Car, Shield } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { isAuthenticated, isInitializing, login, status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg">
            <Car className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-3xl text-foreground">
              VIT Cabs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Carpool smarter, travel together
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-card p-6 flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-display font-semibold text-xl text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in with your VIT student account
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                VIT Students Only
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This app is exclusively for VIT Vellore students. Use your
                @vitstudent.ac.in identity.
              </p>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-semibold text-base"
            onClick={login}
            disabled={isInitializing || status === "logging-in"}
            data-ocid="btn-login"
          >
            {status === "logging-in" ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing in...
              </span>
            ) : isInitializing ? (
              "Initializing..."
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure, decentralized authentication powered by Internet Computer
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { emoji: "🚗", label: "Find Rides" },
            { emoji: "💬", label: "Group Chat" },
            { emoji: "💰", label: "Split Fare" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-card rounded-xl border border-border p-3 text-center"
            >
              <div className="text-2xl mb-1">{f.emoji}</div>
              <p className="text-xs font-medium text-muted-foreground">
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
