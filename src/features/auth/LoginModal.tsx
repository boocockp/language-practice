import { useEffect, useState } from "react";
import { Button, Dialog, Field, Input } from "@cloudflare/kumo";
import { useAuth } from "../../contexts/AuthContext";

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form state when modal is opened so previous errors and step don't persist
  useEffect(() => {
    if (open) {
      setError(null);
      setStep("signIn");
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("flow", step);
    try {
      await signIn("password", formData);
      onOpenChange(false);
    } catch {
      setError("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="sm" className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <Dialog.Title id="login-dialog-title">
            {step === "signIn" ? "Sign in" : "Sign up"}
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            render={(props) => (
              <Button {...props} variant="secondary" aria-label="Close">
                Close
              </Button>
            )}
          />
        </div>
        <Dialog.Description id="login-dialog-description">
          {step === "signIn"
            ? "Enter your email and password to sign in."
            : "Create an account with your email and password."}
        </Dialog.Description>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              aria-describedby="login-dialog-description"
            />
          </Field>
          <Field label="Password" required>
            <Input
              name="password"
              type="password"
              autoComplete={step === "signIn" ? "current-password" : "new-password"}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              minLength={8}
            />
          </Field>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              aria-describedby="login-dialog-title"
            >
              {step === "signIn" ? "Sign in" : "Sign up"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
            >
              {step === "signIn" ? "Sign up instead" : "Sign in instead"}
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
