"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Loader2, MapPin, Search } from "lucide-react";
import { INDIAN_STATES, INTEREST_CATEGORIES } from "@/lib/constants";
import { saveOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [state, setState] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredStates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  function toggleInterest(id: string) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function handleFinish() {
    if (!state) return;
    setError(null);
    startTransition(async () => {
      const result = await saveOnboarding(state, interests);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/discover");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-4">
        {step === 2 && (
          <Button variant="ghost" size="icon" onClick={() => setStep(1)} aria-label="Back">
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">Step {step} of 2</p>
          <h1 className="text-base font-semibold text-foreground">
            {step === 1 ? "Select your state" : "Select your interests"}
          </h1>
        </div>
        <div className="flex gap-1.5">
          <span
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              step >= 1 ? "bg-primary" : "bg-muted"
            )}
          />
          <span
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              step >= 2 ? "bg-primary" : "bg-muted"
            )}
          />
        </div>
      </header>

      {step === 1 ? (
        <div className="flex flex-1 flex-col px-4 pt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            We&apos;ll show exams and notifications relevant to your state.
          </p>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search states..."
              className="h-11 pl-9"
            />
          </div>

          <div className="-mx-4 flex-1 overflow-y-auto px-4 pb-28">
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
              {filteredStates.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setState(s)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                    state === s ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    {s}
                  </span>
                  {state === s && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              ))}
              {filteredStates.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No states found
                </p>
              )}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background px-4 py-4">
            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={!state}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 pt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Pick as many categories as you like — we&apos;ll show you matching exams.
          </p>

          <div className="grid grid-cols-1 gap-3 pb-28">
            {INTEREST_CATEGORIES.map((cat) => {
              const selected = interests.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleInterest(cat.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{cat.label}</span>
                    <span className="block text-xs text-muted-foreground">{cat.hint}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selected ? "border-primary bg-primary" : "border-border"
                    )}
                  >
                    {selected && <Check className="size-3.5 text-primary-foreground" />}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background px-4 py-4">
            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={interests.length === 0 || isPending}
              onClick={handleFinish}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Get started"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
