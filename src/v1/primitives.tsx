import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";
import type { Client } from "../services/api";

export const mono: CSSProperties = { fontFamily: "var(--wc-mono)" };
export const sans: CSSProperties = { fontFamily: "var(--wc-sans)" };

export type Status = "online" | "offline" | "warn";

export const WCDot = ({ status, size = 8 }: { status: Status; size?: number }) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background:
        status === "online"
          ? "var(--wc-ok)"
          : status === "offline"
          ? "var(--wc-muted)"
          : "var(--wc-warn)",
      boxShadow: status === "online" ? "0 0 6px var(--wc-ok)" : "none",
      animation: status === "online" ? "wc-pulse 2s ease-in-out infinite" : "none",
    }}
  />
);

export const WCBar = ({
  value,
  color = "var(--wc-accent)",
  height = 4,
  bg = "var(--wc-panel-2)",
}: { value: number; color?: string; height?: number; bg?: string }) => (
  <div style={{ width: "100%", height, background: bg, position: "relative" }}>
    <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", background: color }} />
  </div>
);

export const WCKV = ({
  label,
  value,
  sub,
  accent,
}: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 10, color: "var(--wc-muted)", textTransform: "uppercase", letterSpacing: "0.08em", ...mono }}>
      {label}
    </div>
    <div style={{ fontSize: 20, color: accent || "var(--wc-fg)", fontWeight: 500, lineHeight: 1.1, marginTop: 2, ...mono }}>
      {value}
    </div>
    {sub != null && (
      <div style={{ fontSize: 10, color: "var(--wc-muted)", marginTop: 2, ...mono }}>{sub}</div>
    )}
  </div>
);

export const WCKey = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontSize: 10,
      padding: "2px 6px",
      border: "1px solid var(--wc-border)",
      background: "var(--wc-panel-2)",
      color: "var(--wc-fg-2)",
      borderRadius: 3,
      marginLeft: 4,
      ...mono,
    }}
  >
    {children}
  </span>
);

export const WCSectionHead = ({
  title,
  sub,
  right,
}: { title: string; sub?: ReactNode; right?: ReactNode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 16px",
      borderBottom: "1px solid var(--wc-border)",
      borderTop: "1px solid var(--wc-border)",
      background: "var(--wc-panel-2)",
      fontSize: 10,
      letterSpacing: "0.08em",
      color: "var(--wc-muted)",
      textTransform: "uppercase",
      ...mono,
    }}
  >
    <div>
      <span style={{ color: "var(--wc-fg)" }}>{title}</span>
      {sub != null && <span> · {sub}</span>}
    </div>
    <div>{right}</div>
  </div>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
};

export const WCBtn = ({ primary, danger, active, style, children, ...rest }: BtnProps) => {
  const base: CSSProperties = {
    background: active || primary ? "var(--wc-accent)" : "transparent",
    color: active || primary ? "var(--wc-bg)" : danger ? "var(--wc-err)" : "var(--wc-fg)",
    border: `1px solid ${active || primary ? "var(--wc-accent)" : danger ? "var(--wc-err)" : "var(--wc-border)"}`,
    padding: "6px 12px",
    fontSize: 11,
    cursor: rest.disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.05em",
    opacity: rest.disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    ...mono,
    ...style,
  };
  return (
    <button {...rest} style={base}>
      {children}
    </button>
  );
};

export const WCSparkline = ({
  data,
  color = "var(--wc-accent)",
  height = 28,
  width = 120,
  fill = true,
}: { data: number[]; color?: string; height?: number; width?: number; fill?: boolean }) => {
  if (!data.length) {
    return <svg width={width} height={height} />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = "M " + pts.join(" L ");
  const area = path + ` L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.2} />
    </svg>
  );
};

export const WCLvl = ({ lvl }: { lvl: string }) => {
  const trimmed = lvl.trim().toUpperCase();
  const c = trimmed === "ERR" || trimmed === "ERROR" ? "var(--wc-err)" : trimmed === "WARN" ? "var(--wc-warn)" : "var(--wc-muted2)";
  return <span style={{ color: c, fontSize: 10, ...mono }}>{trimmed.padEnd(4, " ")}</span>;
};

export const WCScreenThumb = ({
  client,
  w = 160,
  h = 90,
  effect = null,
  imgSrc,
}: { client: Client; w?: number; h?: number; effect?: string | null; imgSrc?: string | null }) => {
  const offline = !client;
  const locked = !!client?.locked;
  return (
    <div
      style={{
        width: w,
        height: h,
        background: "var(--wc-panel-2)",
        backgroundImage: imgSrc
          ? `url(${imgSrc})`
          : "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 8px)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid var(--wc-border)",
        position: "relative",
        overflow: "hidden",
        fontSize: 9,
        color: "var(--wc-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.05em",
        ...mono,
      }}
    >
      {!imgSrc && (offline ? (
        <span style={{ opacity: 0.5 }}>NO SIGNAL</span>
      ) : locked ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, lineHeight: 1, marginBottom: 4 }}>▢</div>
          <div style={{ fontSize: 8 }}>LOCKED</div>
        </div>
      ) : effect ? (
        <span style={{ color: "var(--wc-accent)", textTransform: "uppercase" }}>FX · {effect}</span>
      ) : (
        <span style={{ opacity: 0.6 }}>NO PREVIEW</span>
      ))}
      {!offline && !locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 49%, var(--wc-accent-soft) 50%, transparent 51%)",
            opacity: 0.3,
            animation: "wc-scan 3s linear infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export const WCBox = ({
  children,
  style,
  dashed,
  padding = 14,
}: { children?: ReactNode; style?: CSSProperties; dashed?: boolean; padding?: number }) => (
  <div
    style={{
      border: `1px ${dashed ? "dashed" : "solid"} var(--wc-border)`,
      padding,
      background: "var(--wc-panel)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const WCLabel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      fontSize: 10,
      color: "var(--wc-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: 8,
      ...mono,
      ...style,
    }}
  >
    {children}
  </div>
);
