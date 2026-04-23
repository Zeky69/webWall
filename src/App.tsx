import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { api } from "./services/api";
import { CommandCenter } from "./v1/CommandCenter";
import { LoginPanel } from "./v1/LoginPanel";

export default function App() {
  const [authed, setAuthed] = useState(!!api.getToken());

  useEffect(() => {
    const onLost = () => setAuthed(false);
    window.addEventListener("wallchange:auth-lost", onLost);
    return () => window.removeEventListener("wallchange:auth-lost", onLost);
  }, []);

  const handleLogout = () => {
    api.logout();
    sessionStorage.removeItem("wallchange_user");
    setAuthed(false);
  };

  return (
    <>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--wc-panel)",
            color: "var(--wc-fg)",
            border: "1px solid var(--wc-border)",
            fontFamily: "var(--wc-mono)",
            fontSize: 12,
          },
        }}
      />
      {authed ? (
        <CommandCenter onLogout={handleLogout} />
      ) : (
        <LoginPanel onLogin={() => setAuthed(true)} />
      )}
    </>
  );
}
