import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Camera, LogOut, Mail, MapPin, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GenderPreference } from "../backend";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  getLocalPreferredDestination,
  setLocalPreferredDestination,
  useGetProfilePhoto,
  useProfile,
  useSetProfile,
  useSetProfilePhoto,
} from "../hooks/useQueries";

export default function ProfilePage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { isAuthenticated, isInitializing, logout, userId } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const setProfileMutation = useSetProfile();
  const setPhotoMutation = useSetProfilePhoto();
  const { data: photoData } = useGetProfilePhoto(
    profile?.hasPhoto ? (userId ?? null) : null,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<GenderPreference>(GenderPreference.none);
  const [prefDest, setPrefDest] = useState("");
  const [editing, setEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
      setGender(profile.gender);
    }
    // Load preferred destination from localStorage
    setPrefDest(getLocalPreferredDestination());
  }, [profile]);

  // Build blob URL from photo data
  useEffect(() => {
    if (photoData) {
      const blob = new Blob([photoData.data.buffer as ArrayBuffer], {
        type: photoData.mime,
      });
      const url = URL.createObjectURL(blob);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [photoData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!email.endsWith("@vitstudent.ac.in")) {
      toast.error("Please use your @vitstudent.ac.in email");
      return;
    }
    await setProfileMutation.mutateAsync({
      name: name.trim(),
      email: email.trim(),
      gender,
      preferred_destination: prefDest,
    });
    // Also persist locally (mutation already does it but ensure it's fresh)
    setLocalPreferredDestination(prefDest);
    toast.success("Profile updated!");
    setEditing(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    await setPhotoMutation.mutateAsync({ data, mime: file.type });
    toast.success("Photo updated!");
  };

  const savedDest = getLocalPreferredDestination();

  const header = (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="font-display font-semibold text-foreground text-lg">
        Profile
      </span>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="flex items-center gap-1.5 text-destructive text-sm font-medium"
        data-ocid="btn-logout"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <Layout activeRoute={routerState.location.pathname} header={header}>
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Avatar with photo upload */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary font-bold text-2xl">
                  {profile?.name
                    ? profile.name[0].toUpperCase()
                    : userId
                      ? userId.slice(0, 2).toUpperCase()
                      : "?"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={setPhotoMutation.isPending}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-md active:scale-95 transition-smooth disabled:opacity-50"
              aria-label="Upload photo"
              data-ocid="btn-upload-photo"
            >
              {setPhotoMutation.isPending ? (
                <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              data-ocid="input-photo"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display font-semibold text-foreground text-lg">
                {profile?.name || "VIT Student"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {userId ? `${userId.slice(0, 16)}...` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Profile form */}
        <div className="bg-card rounded-2xl border border-border p-5">
          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Full Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="rounded-xl h-11"
                  required
                  data-ocid="input-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  VIT Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@vitstudent.ac.in"
                  className="rounded-xl h-11"
                  required
                  data-ocid="input-email"
                />
                <p className="text-xs text-muted-foreground">
                  Must be @vitstudent.ac.in
                </p>
              </div>

              {/* Preferred Destination */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Preferred Destination
                </Label>
                <Input
                  value={prefDest}
                  onChange={(e) => setPrefDest(e.target.value)}
                  placeholder="e.g. Chennai Airport, Railway Station..."
                  className="rounded-xl h-11"
                  data-ocid="input-preferred-destination"
                />
                <p className="text-xs text-muted-foreground">
                  Get notified when someone posts a ride to this destination
                </p>
              </div>

              <div className="flex gap-2">
                {profile && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setEditing(false);
                      setName(profile.name);
                      setEmail(profile.email);
                      setGender(profile.gender);
                      setPrefDest(getLocalPreferredDestination());
                    }}
                    data-ocid="btn-cancel-edit"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1 rounded-xl"
                  disabled={setProfileMutation.isPending}
                  data-ocid="btn-save-profile"
                >
                  {setProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {profile?.name && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {profile.name}
                      </p>
                    </div>
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Preferred Destination
                    </p>
                    <p
                      className={`text-sm font-medium ${savedDest ? "text-foreground" : "text-muted-foreground italic"}`}
                    >
                      {savedDest || "Not set"}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => setEditing(true)}
                data-ocid="btn-edit-profile"
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Female preference info card */}
        {profile?.gender === GenderPreference.female && (
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-secondary mb-0.5">
              🚺 Female-Only Feed Active
            </p>
            <p className="text-xs text-muted-foreground">
              Your ride feed only shows rides posted by female students.
            </p>
          </div>
        )}

        {/* VIT badge */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-primary">
            🎓 VIT Vellore Student
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified through Internet Identity
          </p>
        </div>
      </div>
    </Layout>
  );
}
