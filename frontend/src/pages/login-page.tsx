import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorState } from "../components/common/error-state";
import { PageShell } from "../components/common/page-shell";
import { useAuth } from "../features/auth/use-auth";
import { getApiErrorMessage } from "../lib/api/error";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <PageShell title="Login" description="Sign in to your account.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          {error ? <ErrorState message={error} /> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-slate-600">
          New user?{" "}
          <Link className="font-medium text-indigo-600 hover:text-indigo-500" to="/signup">
            Create account
          </Link>
          .
        </p>
      </PageShell>
    </div>
  );
}
