import { Link } from "react-router-dom";
import { PageShell } from "../components/common/page-shell";

export function LoginPage() {
  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <PageShell title="Login" description="Sign in to your account.">
        <p className="text-sm text-slate-600">
          Auth UI will be implemented in Step 11. Go to{" "}
          <Link className="font-medium text-indigo-600 hover:text-indigo-500" to="/signup">
            Signup
          </Link>
          .
        </p>
      </PageShell>
    </div>
  );
}
