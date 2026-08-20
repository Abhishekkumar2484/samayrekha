import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <TimelineMark />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SamayRekha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every government exam deadline, in one place
            </p>
          </div>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}

function TimelineMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <line x1="5" y1="17" x2="27" y2="17" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx="8" cy="17" r="4" fill="#C0392B" />
      <circle cx="16" cy="17" r="3.4" fill="#D9A521" />
      <circle cx="24" cy="17" r="2.8" fill="#B8C2CE" />
    </svg>
  );
}
