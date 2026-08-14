import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StyleProfile = {
  preferredColor: string;
  preferredFit: "relaxed" | "regular" | "tailored";
  preferredOccasion: "everyday" | "work" | "evening" | "active";
};

const defaultProfile: StyleProfile = {
  preferredColor: "",
  preferredFit: "regular",
  preferredOccasion: "everyday",
};

export function StyleProfileCard() {
  const [profile, setProfile] = useState<StyleProfile>(defaultProfile);
  const { data: savedProfile } = trpc.styleProfile.get.useQuery(undefined, { retry: false });
  const saveMutation = trpc.styleProfile.save.useMutation({
    onError: () => toast.error("Could not save your style profile"),
  });

  useEffect(() => {
    if (savedProfile) setProfile(savedProfile);
  }, [savedProfile]);

  const update = (patch: Partial<StyleProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveMutation.mutate(next);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Your style profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">Optional preferences used to make catalog suggestions more relevant. They are saved to your account.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="style-color">Favorite color</Label>
          <Input id="style-color" value={profile.preferredColor} onChange={(event) => update({ preferredColor: event.target.value })} placeholder="e.g. navy" />
        </div>
        <div className="space-y-2">
          <Label>Preferred fit</Label>
          <Select value={profile.preferredFit} onValueChange={(value) => update({ preferredFit: value as StyleProfile["preferredFit"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="relaxed">Relaxed</SelectItem><SelectItem value="regular">Regular</SelectItem><SelectItem value="tailored">Tailored</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Typical occasion</Label>
          <Select value={profile.preferredOccasion} onValueChange={(value) => update({ preferredOccasion: value as StyleProfile["preferredOccasion"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="everyday">Everyday</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="evening">Evening</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
