"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/auth.scss";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <Link href="/" className="auth-logo">
          NoteFixr <MoreVertical size={18} />
        </Link>
        <p className="auth-subtitle">Create your account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
