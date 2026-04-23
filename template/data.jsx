// Mock data for WallChange control panel
const WC_CLIENTS = [
  { id: "W-01A9", host: "dev-workstation-01", user: "thibault", os: "Arch Linux", version: "0.4.2", ip: "10.0.12.41", status: "online", locked: false, cpu: 23, ram: 41, uptime: "4d 12h", lastSeen: "now", session: "X11", screen: "2560×1440", effect: null, role: "admin" },
  { id: "W-02C3", host: "mac-studio-lab", user: "marie", os: "macOS 14.4", version: "0.4.2", ip: "10.0.12.42", status: "online", locked: true, cpu: 8, ram: 62, uptime: "1d 03h", lastSeen: "now", session: "Aqua", screen: "5120×2880", effect: "confetti", role: "user" },
  { id: "W-03F1", host: "win-desk-rd5", user: "paul", os: "Win 11 Pro", version: "0.4.1", ip: "10.0.12.43", status: "online", locked: false, cpu: 67, ram: 78, uptime: "9h 12m", lastSeen: "now", session: "DWM", screen: "1920×1080", effect: null, role: "user" },
  { id: "W-04B7", host: "ubuntu-srv-02", user: "root", os: "Ubuntu 22.04", version: "0.4.2", ip: "10.0.12.44", status: "online", locked: false, cpu: 4, ram: 19, uptime: "28d 06h", lastSeen: "now", session: "tty", screen: "headless", effect: null, role: "admin" },
  { id: "W-05E2", host: "intern-laptop-07", user: "lucas", os: "Win 10", version: "0.4.0", ip: "10.0.12.45", status: "online", locked: false, cpu: 52, ram: 71, uptime: "2h 44m", lastSeen: "now", session: "DWM", screen: "1366×768", effect: "nyan", role: "user" },
  { id: "W-06D4", host: "designer-imac", user: "camille", os: "macOS 13.6", version: "0.4.2", ip: "10.0.12.46", status: "online", locked: false, cpu: 12, ram: 54, uptime: "6d 18h", lastSeen: "now", session: "Aqua", screen: "4480×2520", effect: null, role: "user" },
  { id: "W-07A8", host: "kiosk-entry", user: "kiosk", os: "Debian 12", version: "0.4.2", ip: "10.0.12.47", status: "online", locked: true, cpu: 2, ram: 14, uptime: "62d 01h", lastSeen: "now", session: "X11", screen: "1920×1080", effect: null, role: "user" },
  { id: "W-08F5", host: "legacy-box-xp", user: "admin", os: "Win XP SP3", version: "0.3.1", ip: "10.0.12.48", status: "offline", locked: false, cpu: 0, ram: 0, uptime: "—", lastSeen: "2h ago", session: "—", screen: "1024×768", effect: null, role: "user" },
  { id: "W-09C6", host: "meeting-room-tv", user: "display", os: "Linux Mint", version: "0.4.2", ip: "10.0.12.49", status: "online", locked: false, cpu: 18, ram: 33, uptime: "3d 22h", lastSeen: "now", session: "X11", screen: "3840×2160", effect: "marquee", role: "user" },
  { id: "W-10B2", host: "laptop-remote-12", user: "sophie", os: "Fedora 40", version: "0.4.2", ip: "10.0.12.50", status: "offline", locked: false, cpu: 0, ram: 0, uptime: "—", lastSeen: "17m ago", session: "—", screen: "1920×1200", effect: null, role: "user" },
];

const WC_EFFECTS = [
  { id: "confetti", name: "Confetti", cat: "fun", icon: "✦", admin: false },
  { id: "fireworks", name: "Fireworks", cat: "fun", icon: "❋", admin: false },
  { id: "dvd", name: "DVD Bounce", cat: "fun", icon: "◇", admin: false },
  { id: "nyan", name: "Nyan Cat", cat: "fun", icon: "⌇", admin: false },
  { id: "matrix", name: "Matrix Rain", cat: "visual", icon: "⋮", admin: true },
  { id: "spotlight", name: "Spotlight", cat: "visual", icon: "○", admin: true },
  { id: "waves", name: "Ondes", cat: "visual", icon: "≋", admin: false },
  { id: "glitch", name: "Glitch", cat: "visual", icon: "✕", admin: true },
  { id: "snow", name: "Neige", cat: "fun", icon: "❄", admin: false },
  { id: "rain", name: "Pluie", cat: "fun", icon: "│", admin: false },
  { id: "fire", name: "Flammes", cat: "visual", icon: "△", admin: true },
  { id: "static", name: "Static TV", cat: "visual", icon: "▓", admin: true },
  { id: "orbit", name: "Orbit", cat: "visual", icon: "◎", admin: false },
  { id: "grid", name: "Grid Pulse", cat: "visual", icon: "⊞", admin: false },
  { id: "blackout", name: "Blackout", cat: "admin", icon: "■", admin: true },
  { id: "lock", name: "Lock Screen", cat: "admin", icon: "▢", admin: true },
];

const WC_LOGS = [
  { t: "21:47:32", client: "W-02C3", lvl: "INFO", msg: "effect.start confetti (duration=15s)" },
  { t: "21:47:29", client: "W-05E2", lvl: "INFO", msg: "effect.start nyan (broadcast from W-01A9)" },
  { t: "21:47:14", client: "W-09C6", lvl: "INFO", msg: "marquee.update text=\"RÉUNION 14H\"" },
  { t: "21:46:58", client: "W-03F1", lvl: "WARN", msg: "cpu.threshold 67% > 60%" },
  { t: "21:46:41", client: "W-02C3", lvl: "INFO", msg: "session.lock user_action" },
  { t: "21:46:12", client: "W-10B2", lvl: "ERR ", msg: "ws.disconnect reason=timeout" },
  { t: "21:45:58", client: "W-07A8", lvl: "INFO", msg: "wallpaper.set src=uploads/kiosk-brand-2026.jpg" },
  { t: "21:45:31", client: "W-04B7", lvl: "INFO", msg: "shell.exec systemctl status nginx" },
  { t: "21:45:02", client: "W-06D4", lvl: "INFO", msg: "screenshot.capture 4480×2520 @ 2.1MB" },
  { t: "21:44:47", client: "W-01A9", lvl: "INFO", msg: "agent.heartbeat rtt=12ms" },
  { t: "21:44:19", client: "W-05E2", lvl: "WARN", msg: "ram.threshold 71% > 70%" },
  { t: "21:43:58", client: "W-08F5", lvl: "ERR ", msg: "agent.crash segfault signal=11" },
  { t: "21:43:41", client: "W-03F1", lvl: "INFO", msg: "cover.display src=uploads/notice.png" },
  { t: "21:43:12", client: "W-02C3", lvl: "INFO", msg: "particles.start type=waves density=0.6" },
  { t: "21:42:55", client: "W-09C6", lvl: "INFO", msg: "screen.invert toggle=true" },
  { t: "21:42:31", client: "W-01A9", lvl: "INFO", msg: "shell.open reverse port=4444" },
  { t: "21:42:04", client: "W-04B7", lvl: "INFO", msg: "agent.heartbeat rtt=8ms" },
  { t: "21:41:47", client: "W-06D4", lvl: "INFO", msg: "wallpaper.set src=url:https://cdn.../bg.jpg" },
  { t: "21:41:22", client: "W-07A8", lvl: "WARN", msg: "session.idle 62 days" },
  { t: "21:40:58", client: "W-03F1", lvl: "INFO", msg: "effect.stop fireworks" },
];

const WC_STATS = {
  online: 8, offline: 2, total: 10,
  uptime: "99.94%",
  msgsPerSec: 47,
  bytesIn: "2.4 MB/s",
  bytesOut: "814 KB/s",
  effectsActive: 3,
  shellsOpen: 1,
  screenshotsToday: 23,
  commandsToday: 412,
  latencyAvg: "14ms",
  latencyP99: "38ms",
};

// 60-point sparkline (messages / second over last 60s)
const WC_SPARK_MSGS = [42,45,41,48,52,49,47,44,46,51,55,53,49,47,45,48,50,52,55,58,54,51,49,47,45,48,50,52,49,47,44,46,48,51,54,57,59,56,53,50,48,46,49,52,55,58,54,51,48,46,44,47,49,52,55,53,49,47,45,47];
const WC_SPARK_CPU = [18,22,19,21,25,28,24,22,20,19,23,27,31,29,25,22,20,18,21,24,27,30,33,36,32,28,25,22,20,18,21,24,27,30,28,25,22,20,19,21,24,27,25,22,20,18,21,24,27,30,28,25,22,20,19,22,25,28,25,23];

Object.assign(window, { WC_CLIENTS, WC_EFFECTS, WC_LOGS, WC_STATS, WC_SPARK_MSGS, WC_SPARK_CPU });
