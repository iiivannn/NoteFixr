"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/auth.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/notes/new");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <p className="auth-logo">NoteFixr</p>
        <p className="auth-subtitle">Sign in to your account</p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/notes/new" })}
          className="btn-google"
        >
          Continue with Google
        </button>

        <div className="divider">or</div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p>
          Don&apos;t have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}
