import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { Car, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import { storeEmailSession } from "../hooks/useAuth";

function simpleHash(str: string): string {
  return btoa(encodeURIComponent(str));
}

type ForgotStep = 1 | 2 | 3;

export default function LoginPage() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpStep, setFpStep] = useState<ForgotStep>(1);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpDemoOtp, setFpDemoOtp] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem("vit_session_token")) navigate({ to: "/" });
  }, [navigate]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    else if (!email.endsWith("@vitstudent.ac.in"))
      errs.email = "Must use your @vitstudent.ac.in email";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!actor) return;
    setSubmitting(true);
    setApiError("");
    try {
      const result = await actor.login(email, simpleHash(password));
      if ("ok" in result && result.ok !== undefined) {
        storeEmailSession(email, String(result.ok.gender));
        navigate({ to: "/" });
      } else if ("err" in result && result.err !== undefined) {
        setApiError(result.err);
      } else {
        setApiError("Login failed. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setApiError(message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openForgot = () => {
    setForgotOpen(true);
    setFpStep(1);
    setFpEmail("");
    setFpOtp("");
    setFpDemoOtp("");
    setFpNewPw("");
    setFpConfirmPw("");
    setFpError("");
    setFpSuccess(false);
  };

  const clearFieldError = (field: string) =>
    setErrors((p) =>
      Object.fromEntries(Object.entries(p).filter(([k]) => k !== field)),
    );

  const handleFpStep1 = async () => {
    if (!fpEmail.endsWith("@vitstudent.ac.in")) {
      setFpError("Must use a @vitstudent.ac.in email");
      return;
    }
    if (!actor) return;
    setFpLoading(true);
    setFpError("");
    try {
      const result = await actor.forgotPassword(fpEmail);
      if ("ok" in result && result.ok !== undefined) {
        const match = result.ok.match(/\d{6}/);
        setFpDemoOtp(match ? match[0] : result.ok);
        setFpStep(2);
      } else if ("err" in result && result.err !== undefined) {
        setFpError(result.err);
      } else {
        setFpError("Request failed. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setFpError(message || "Request failed. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpStep2 = async () => {
    if (!fpOtp) {
      setFpError("Enter the OTP");
      return;
    }
    if (!actor) return;
    setFpLoading(true);
    setFpError("");
    try {
      const valid = await actor.verifyOTP(fpEmail, fpOtp);
      if (valid) setFpStep(3);
      else setFpError("Invalid OTP. Please check and try again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setFpError(message || "Verification failed. Try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpStep3 = async () => {
    if (!fpNewPw) {
      setFpError("Enter a new password");
      return;
    }
    if (fpNewPw !== fpConfirmPw) {
      setFpError("Passwords do not match");
      return;
    }
    if (!actor) return;
    setFpLoading(true);
    setFpError("");
    try {
      const result = await actor.resetPassword(
        fpEmail,
        fpOtp,
        simpleHash(fpNewPw),
      );
      if ("ok" in result && result.ok !== undefined) {
        setFpSuccess(true);
        setTimeout(() => setForgotOpen(false), 2000);
      } else if ("err" in result && result.err !== undefined) {
        setFpError(result.err);
      } else {
        setFpError("Reset failed. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setFpError(message || "Reset failed. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

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

        {/* Login Card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-card p-6 flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-display font-semibold text-xl text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in with your VIT student account
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">
                VIT Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="yourname@vitstudent.ac.in"
                  className="pl-10 h-12 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    if (email && !email.endsWith("@vitstudent.ac.in"))
                      setErrors((p) => ({
                        ...p,
                        email: "Must use @vitstudent.ac.in",
                      }));
                    else clearFieldError("email");
                  }}
                  data-ocid="input-email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-0.5">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-ocid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-0.5">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="button"
              className="text-sm text-primary font-medium text-right hover:underline self-end"
              onClick={openForgot}
            >
              Forgot Password?
            </button>

            {apiError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-base"
              disabled={submitting}
              data-ocid="btn-login"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Feature chips */}
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

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-6"
          role="presentation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setForgotOpen(false);
          }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            aria-label="Reset Password"
            className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-foreground">
                {fpSuccess ? "Password Reset!" : "Reset Password"}
              </h3>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {fpSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <p className="text-center text-foreground font-medium">
                  Password reset successfully!
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  You can now log in with your new password.
                </p>
              </div>
            ) : (
              <>
                {/* Step indicators */}
                <div className="flex items-center gap-1">
                  {([1, 2, 3] as ForgotStep[]).map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          fpStep === s
                            ? "bg-primary text-primary-foreground"
                            : fpStep > s
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {fpStep > s ? "✓" : s}
                      </div>
                      {s < 3 && (
                        <div
                          className={`h-0.5 w-8 ${fpStep > s ? "bg-green-500" : "bg-muted"}`}
                        />
                      )}
                    </div>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {fpStep === 1
                      ? "Enter Email"
                      : fpStep === 2
                        ? "Enter OTP"
                        : "New Password"}
                  </span>
                </div>

                {fpStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your registered VIT email to receive an OTP.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">VIT Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="yourname@vitstudent.ac.in"
                          className="pl-10 h-12 rounded-xl"
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          data-ocid="input-fp-email"
                        />
                      </div>
                    </div>
                    {fpError && (
                      <p className="text-xs text-destructive">{fpError}</p>
                    )}
                    <Button
                      className="w-full h-12 rounded-xl font-semibold"
                      onClick={handleFpStep1}
                      disabled={fpLoading}
                    >
                      {fpLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                )}

                {fpStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex items-start gap-2 text-amber-700 font-semibold text-sm">
                        <span>📋</span>
                        <span>
                          Demo OTP — In the real app, this would be sent to your
                          VIT email
                        </span>
                      </div>
                      <div className="text-center text-3xl font-mono font-bold tracking-widest text-amber-800 py-2">
                        {fpDemoOtp}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">Enter OTP</Label>
                      <Input
                        type="text"
                        placeholder="6-digit OTP"
                        className="h-12 rounded-xl text-center text-xl font-mono tracking-widest"
                        maxLength={6}
                        value={fpOtp}
                        onChange={(e) =>
                          setFpOtp(e.target.value.replace(/\D/g, ""))
                        }
                        data-ocid="input-fp-otp"
                      />
                    </div>
                    {fpError && (
                      <p className="text-xs text-destructive">{fpError}</p>
                    )}
                    <Button
                      className="w-full h-12 rounded-xl font-semibold"
                      onClick={handleFpStep2}
                      disabled={fpLoading}
                    >
                      {fpLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                )}

                {fpStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Enter and confirm your new password.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">
                        New Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="New password"
                        className="h-12 rounded-xl"
                        value={fpNewPw}
                        onChange={(e) => setFpNewPw(e.target.value)}
                        data-ocid="input-fp-newpw"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">
                        Confirm Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        className="h-12 rounded-xl"
                        value={fpConfirmPw}
                        onChange={(e) => setFpConfirmPw(e.target.value)}
                        data-ocid="input-fp-confirmpw"
                      />
                    </div>
                    {fpError && (
                      <p className="text-xs text-destructive">{fpError}</p>
                    )}
                    <Button
                      className="w-full h-12 rounded-xl font-semibold"
                      onClick={handleFpStep3}
                      disabled={fpLoading}
                    >
                      {fpLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
