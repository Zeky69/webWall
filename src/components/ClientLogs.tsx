import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { BASE_URL, api } from "../services/api";
import { Terminal, Layout, RotateCw, Mouse, Zap, RefreshCw, Image, ScrollText, Sparkles, Trash2, X, Code, PartyPopper, Flashlight, Type, Waves, Disc, Rocket } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Input } from "./ui/input";

interface ClientLogsProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientLogs({ clientId, isOpen, onClose }: ClientLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<string[]>([]);
  const [commandInput, setCommandInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      const randomId = Math.random().toString(36).substring(7);
      const wsUrl = BASE_URL.replace(/^http/, 'ws') + `/admin-watcher-${randomId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setStatus("connecting");
      bufferRef.current = []; 

      ws.onopen = () => {
        setStatus("connected");
        const token = api.getToken();
        ws.send(JSON.stringify({ type: "auth_admin", token: token }));
        ws.send(JSON.stringify({ type: "subscribe", target: clientId }));
      };

      ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "auth_success") {
                bufferRef.current.push(">>> Authenticated successfully");
            } else if (data.type === "log" && data.data) {
                // Split multi-line logs
                const lines = data.data.split('\n');
                lines.forEach((line: string) => {
                    if (line.trim()) bufferRef.current.push(line);
                });
            } else {
                 bufferRef.current.push(JSON.stringify(data));
            }
        } catch (e) {
            bufferRef.current.push(event.data);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
      };

      ws.onerror = (error) => {
        console.error("WS Error", error);
        setStatus("error");
        bufferRef.current.push(">>> Connection error");
      };

      const interval = setInterval(() => {
        if (bufferRef.current.length > 0) {
            setLogs(prev => {
                const newLogs = [...prev, ...bufferRef.current];
                bufferRef.current = []; 
                return newLogs.slice(-1000); // Keep last 1000 lines
            });
        }
      }, 100);

      return () => {
        clearInterval(interval);
        ws.close();
      };
    } else {
        setLogs([]);
        setStatus("disconnected");
    }
  }, [isOpen, clientId]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleAction = async (action: () => Promise<any>, label: string) => {
    try {
      await action();
      toast.success(label);
    } catch (error: any) {
      toast.error(error.message || "Failed");
    }
  };

  const formatLogLine = (line: string) => {
    if (line.includes("mongoose.c")) return <span className="text-zinc-600">{line}</span>;
    if (line.startsWith(">>>")) return <span className="text-yellow-500 font-bold">{line}</span>;
    if (line.includes("Message reçu") || line.includes("Commande")) return <span className="text-blue-400 font-semibold">{line}</span>;
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("erreur") || line.includes("err 0") === false && line.includes("err")) return <span className="text-red-500 font-bold">{line}</span>;
    if (line.includes("success") || line.includes("établie") || line.includes("sauvegardé")) return <span className="text-green-500">{line}</span>;
    return <span className="text-zinc-300">{line}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col bg-zinc-950 border-zinc-800 p-0 gap-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-zinc-100 font-mono text-base">
                {clientId}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                {status.toUpperCase()}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Logs Area */}
          <div className="flex-1 flex flex-col bg-black min-w-0">
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {logs.map((log, i) => (
                <div key={i} className="break-all whitespace-pre-wrap hover:bg-zinc-900/30 px-1 rounded">
                  {formatLogLine(log)}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            
            {/* Quick Command Input (Optional) */}
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/30 flex gap-2">
               <span className="text-green-500 font-mono py-2 pl-2">$</span>
               <Input 
                 className="bg-transparent border-0 font-mono text-zinc-300 focus-visible:ring-0 h-auto py-2"
                 placeholder="Type a command..."
                 value={commandInput}
                 onChange={(e) => setCommandInput(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter' && commandInput) {
                        // Implement custom command sending if needed, or just clear for now
                        setCommandInput("");
                    }
                 }}
               />
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="w-64 border-l border-zinc-800 bg-zinc-900/30 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Display</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.showDesktop(clientId), "Desktop")}>
                  <Layout className="h-3.5 w-3.5 mr-2" /> Desktop
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.reverseScreen(clientId), "Reverse")}>
                  <RotateCw className="h-3.5 w-3.5 mr-2" /> Reverse
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pranks</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.clones(clientId), "Clones")}>
                  <Mouse className="h-3.5 w-3.5 mr-2" /> Clones
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.drunk(clientId), "Drunk")}>
                  <Zap className="h-3.5 w-3.5 mr-2" /> Drunk
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.faketerminal(clientId), "Terminal")}>
                  <Code className="h-3.5 w-3.5 mr-2" /> Terminal
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.confetti(clientId), "Confetti")}>
                  <PartyPopper className="h-3.5 w-3.5 mr-2" /> Confetti
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.spotlight(clientId), "Spotlight")}>
                  <Flashlight className="h-3.5 w-3.5 mr-2" /> Spotlight
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => {
                  const text = prompt("Texte à afficher :", "HELLO WORLD");
                  if (text !== null) handleAction(() => api.textscreen(clientId, text), "Text Screen");
                }}>
                  <Type className="h-3.5 w-3.5 mr-2" /> Text Screen
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.wavescreen(clientId), "Wave Screen")}>
                  <Waves className="h-3.5 w-3.5 mr-2" /> Wave Screen
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.dvdbounce(clientId), "DVD Bounce")}>
                  <Disc className="h-3.5 w-3.5 mr-2" /> DVD Bounce
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.fireworks(clientId), "Fireworks")}>
                  <Rocket className="h-3.5 w-3.5 mr-2" /> Fireworks
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Content</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                  <Image className="h-3.5 w-3.5 mr-2" /> Send Wallpaper
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                  <ScrollText className="h-3.5 w-3.5 mr-2" /> Send Marquee
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 mr-2" /> Send Particles
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">System</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" onClick={() => handleAction(() => api.triggerUpdate(clientId), "Update")}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" /> Force Update
                </Button>
                <Button variant="outline" size="sm" className="justify-start bg-red-950/30 border-red-900/50 hover:bg-red-900/50 text-red-400" onClick={() => setLogs([])}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Clear Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

