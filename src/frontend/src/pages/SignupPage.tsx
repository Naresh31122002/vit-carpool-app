import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { Car, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { GenderPreference, createActor } from "../backend";
import { storeEmailSession } from "../hooks/useAuth";

function simpleHash(str: string): string {
  return btoa(encodeURIComponent(str));
}

type Gender = "male" | "female" | "lgbtq";
type Step = 1 | 2 | 3;

const GENDER_OPTIONS: {
  value: Gender;
  label: string;
  emoji: string;
  accent: string;
  border: string;
  bg: string;
  text: string;
}[] = [
  {
    value: "male",
    label: "Male",
    emoji: "♂️",
    accent: "ring-blue-400",
    border: "border-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  {
    value: "female",
    label: "Female",
    emoji: "♀️",
    accent: "ring-rose-400",
    border: "border-rose-400",
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
  {
    value: "lgbtq",
    label: "LGBTQ+",
    emoji: "🏳️‍🌈",
    accent: "ring-purple-400",
    border: "border-purple-400",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
];

const genderToBackend: Record<Gender, GenderPreference> = {
  male: GenderPreference.male,
  female: GenderPreference.female,
  lgbtq: GenderPreference.lgbtq,
};

const STEP_LABELS: Record<Step, string> = {
  1: "Verify Email",
  2: "Enter OTP",
  3: "Create Account",
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2
  const [demoOtp, setDemoOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [step2Loading, setStep2Loading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step3Loading, setStep3Loading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!email.endsWith("@vitstudent.ac.in")) {
      setEmailError("Must use your @vitstudent.ac.in email");
      return;
    }
    if (!actor) return;
    setEmailError("");
    setStep1Loading(true);
    try {
      const result = await actor.sendSignupOTP(email);
      if ("__kind__" in result && result.__kind__ === "ok") {
        const match = result.ok.match(/\d{6}/);
        setDemoOtp(match ? match[0] : result.ok);
        setStep(2);
      } else if ("__kind__" in result && result.__kind__ === "err") {
        setEmailError(result.err);
      } else {
        setEmailError("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setEmailError(msg || "Failed to send OTP. Please try again.");
    } finally {
      setStep1Loading(false);
    }
  };

  // ── Step 2: Resend OTP ────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (!actor) return;
    setOtpError("");
    setStep2Loading(true);
    try {
      const result = await actor.sendSignupOTP(email);
      if ("__kind__" in result && result.__kind__ === "ok") {
        const match = result.ok.match(/\d{6}/);
        setDemoOtp(match ? match[0] : result.ok);
        setEnteredOtp("");
      } else if ("__kind__" in result && result.__kind__ === "err") {
        setOtpError(result.err);
      }
    } catch {
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setStep2Loading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.length < 6) {
      setOtpError("Please enter the 6-digit OTP");
      return;
    }
    if (!actor) return;
    setOtpError("");
    setStep2Loading(true);
    try {
      const valid = await actor.verifyOTP(email, enteredOtp);
      if (valid) {
        setStep(3);
      } else {
        setOtpError("Invalid OTP. Please check and try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setOtpError(msg || "Verification failed. Please try again.");
    } finally {
      setStep2Loading(false);
    }
  };

  // ── Step 3: Create Account ────────────────────────────────────────────────
  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "At least 6 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (!gender) errs.gender = "Please select your gender";
    return errs;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep3();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!actor || !gender) return;
    setStep3Loading(true);
    setApiError("");
    try {
      const result = await actor.signUp(
        email,
        simpleHash(password),
        genderToBackend[gender],
      );
      if ("ok" in result && result.ok !== undefined) {
        storeEmailSession(email, gender);
        navigate({ to: "/" });
      } else if ("err" in result && result.err !== undefined) {
        setApiError(result.err);
      } else {
        setApiError("Registration failed. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setApiError(msg || "Registration failed. Please try again.");
    } finally {
      setStep3Loading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-2xl text-foreground">
              VIT Cabs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Join the VIT student carpool network
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-card rounded-2xl border border-border shadow-card p-6 flex flex-col gap-5">
          {/* Step Progress */}
          <div className="flex items-center justify-center gap-1">
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === s
                      ? "bg-primary text-primary-foreground shadow-md scale-110"
                      : step > s
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-8 transition-colors duration-300 ${
                      step > s ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-muted-foreground font-medium">
              {STEP_LABELS[step]}
            </span>
          </div>

          {/* ── STEP 1: Verify Email ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="font-display font-semibold text-xl text-foreground">
                  Verify Your VIT Email
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  We'll send an OTP to confirm you're a VIT student
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="signup-email" className="text-sm font-medium">
                  VIT Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="yourname@vitstudent.ac.in"
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={() => {
                      if (email && !email.endsWith("@vitstudent.ac.in"))
                        setEmailError("Must use @vitstudent.ac.in");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSendOtp();
                    }}
                    data-ocid="input-email"
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>

              <Button
                className="w-full h-12 rounded-xl font-semibold text-base"
                onClick={() => void handleSendOtp()}
                disabled={step1Loading}
                data-ocid="btn-send-otp"
              >
                {step1Loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          )}

          {/* ── STEP 2: Enter OTP ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="font-display font-semibold text-xl text-foreground">
                  Enter OTP
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  OTP sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              {/* Demo OTP amber box */}
              <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-start gap-2 text-amber-700 font-semibold text-sm">
                  <span>📋</span>
                  <span>
                    Demo Mode — OTP: In the real app, this would be sent to your
                    VIT email
                  </span>
                </div>
                <div className="text-center text-3xl font-mono font-bold tracking-widest text-amber-800 py-2">
                  {demoOtp}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="otp-input" className="text-sm font-medium">
                  Enter the 6-digit OTP
                </Label>
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="● ● ● ● ● ●"
                  className="h-14 rounded-xl text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/\D/g, ""));
                    if (otpError) setOtpError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleVerifyOtp();
                  }}
                  data-ocid="input-otp"
                />
                {otpError && (
                  <p className="text-xs text-destructive">{otpError}</p>
                )}
              </div>

              <Button
                className="w-full h-12 rounded-xl font-semibold text-base"
                onClick={() => void handleVerifyOtp()}
                disabled={step2Loading}
                data-ocid="btn-verify-otp"
              >
                {step2Loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <div className="flex items-center justify-center gap-1 text-sm">
                <span className="text-muted-foreground">
                  Didn't receive it?
                </span>
                <button
                  type="button"
                  className="text-primary font-semibold hover:underline disabled:opacity-50"
                  onClick={() => void handleResendOtp()}
                  disabled={step2Loading}
                  data-ocid="btn-resend-otp"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Create Account ───────────────────────────────────── */}
          {step === 3 && (
            <form
              onSubmit={(e) => void handleCreateAccount(e)}
              className="flex flex-col gap-4"
            >
              <div className="text-center">
                <h2 className="font-display font-semibold text-xl text-foreground">
                  Create Account
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Set your password and complete your profile
                </p>
              </div>

              {/* Locked email display */}
              <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 h-12">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground font-medium truncate flex-1">
                  {email}
                </span>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                  ✓ Verified
                </span>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPw ? "text" : "password"}
                    placeholder="At least 6 characters"
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
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="signup-confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className="pl-10 pr-10 h-12 rounded-xl"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => {
                      if (confirmPassword && password !== confirmPassword)
                        setFieldErrors((p) => ({
                          ...p,
                          confirmPassword: "Passwords do not match",
                        }));
                      else
                        setFieldErrors((p) =>
                          Object.fromEntries(
                            Object.entries(p).filter(
                              ([k]) => k !== "confirmPassword",
                            ),
                          ),
                        );
                    }}
                    data-ocid="input-confirm-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    aria-label={
                      showConfirmPw ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Gender Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">I identify as</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((opt) => {
                    const selected = gender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setGender(opt.value);
                          setFieldErrors((p) =>
                            Object.fromEntries(
                              Object.entries(p).filter(([k]) => k !== "gender"),
                            ),
                          );
                        }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                          selected
                            ? `${opt.border} ${opt.bg} ${opt.text} font-semibold ring-2 ${opt.accent} ring-offset-1`
                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                        data-ocid={`btn-gender-${opt.value}`}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.gender && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              {apiError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
                  {apiError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base"
                disabled={step3Loading}
                data-ocid="btn-signup"
              >
                {step3Loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
