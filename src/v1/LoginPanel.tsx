import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { api } from "../services/api";
import { WCBtn, mono } from "./primitives";

export function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass) return;
    setBusy(true);
    try {
      const r = await api.login(user.trim(), pass);
      if (r.token) {
        sessionStorage.setItem("wallchange_user", user.trim());
        toast.success("connexion OK");
        onLogin();
      } else {
        toast.error("identifiants invalides");
      }
    } catch (err: any) {
      toast.error(err?.message || "échec connexion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="wc-root"
      style={{
        width: "100%",
        height: "100vh",
        background: "var(--wc-bg)",
        color: "var(--wc-fg)",
        display: "grid",
        gridTemplateRows: "44px 1fr 28px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 10,
          borderBottom: "1px solid var(--wc-border)",
          background: "var(--wc-panel)",
          height: 44,
        }}
      >
        <div style={{ width: 14, height: 14, background: "var(--wc-accent)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 3, background: "var(--wc-bg)" }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", ...mono }}>WALLCHANGE</div>
        <div style={{ fontSize: 10, color: "var(--wc-muted)", marginLeft: "auto", ...mono }}>auth requise</div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div
          style={{
            width: "min(420px, 100%)",
            border: "1px solid var(--wc-border)",
            background: "var(--wc-panel)",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 10, color: "var(--wc-muted)", letterSpacing: "0.15em", marginBottom: 4, ...mono }}>
            SESSION · LOGIN
          </div>
          <div style={{ fontSize: 20, marginBottom: 20, fontWeight: 500 }}>Panel de contrôle</div>

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--wc-muted)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                  ...mono,
                }}
              >
                utilisateur
              </div>
              <input
                className="wc-input"
                value={user}
                onChange={e => setUser(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--wc-muted)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                  ...mono,
                }}
              >
                mot de passe
              </div>
              <input
                className="wc-input"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
              <div style={{ fontSize: 10, color: "var(--wc-muted)", ...mono }}>
                wallchange.codeky.fr
              </div>
              <div style={{ marginLeft: "auto" }}>
                <WCBtn primary type="submit" disabled={busy}>
                  {busy ? "…" : "Connexion ↵"}
                </WCBtn>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--wc-border)",
          background: "var(--wc-panel-2)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontSize: 10,
          color: "var(--wc-muted)",
          height: 28,
          ...mono,
        }}
      >
        <span>● STANDBY</span>
        <span>en attente d'authentification</span>
      </div>
    </div>
  );
}
