import { useState } from "react";
import { api } from "../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Image as ImageIcon, ScrollText, Send, Upload, X, CheckSquare, Layout, RotateCw, RefreshCw, Sparkles, Mouse, Zap } from "lucide-react";
import { toast } from "sonner";

interface BroadcastBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  selectedIds: string[];
}

export function BroadcastBar({ selectedCount, totalCount, onClearSelection, onSelectAll, selectedIds }: BroadcastBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("wallpaper");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [marqueeUrl, setMarqueeUrl] = useState("");
  const [particlesUrl, setParticlesUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleBroadcastWallpaper = async () => {
    if (!wallpaperUrl) return;
    setIsSending(true);
    
    try {
      if (selectedCount === totalCount) {
        await api.changeWallpaper('*', wallpaperUrl);
        toast.success(`Wallpaper sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.changeWallpaper(clientId, wallpaperUrl);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Wallpaper sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      setWallpaperUrl("");
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast wallpaper");
    } finally {
      setIsSending(false);
    }
  };

  const handleBroadcastMarquee = async () => {
    if (!marqueeUrl) return;
    setIsSending(true);
    
    try {
      if (selectedCount === totalCount) {
        await api.marquee('*', marqueeUrl);
        toast.success(`Marquee sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.marquee(clientId, marqueeUrl);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Marquee sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      setMarqueeUrl("");
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast marquee");
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        // Use * to send to all clients directly
        await api.uploadWallpaper('*', file);
        toast.success(`Wallpaper uploaded and sent to all clients`);
      } else {
        // Send to first client to upload, then use * won't work so we send individually
        // We need to upload to first client, which also sets the wallpaper there
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.uploadWallpaper(clientId, file);
            successCount++;
          } catch (error) {
             console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Wallpaper uploaded and sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload wallpaper");
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadMarquee = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        // Use * to send to all clients directly via upload API with type=marquee
        await api.uploadMarquee('*', file);
        toast.success(`Marquee uploaded and sent to all clients`);
      } else {
        // Send to each selected client individually
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.uploadMarquee(clientId, file);
            successCount++;
          } catch (error) {
             console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Marquee uploaded and sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload marquee");
    } finally {
      setIsSending(false);
    }
  };

  const handleBroadcastParticles = async () => {
    if (!particlesUrl) return;
    setIsSending(true);
    
    try {
      if (selectedCount === totalCount) {
        await api.particles('*', particlesUrl);
        toast.success(`Particles sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.particles(clientId, particlesUrl);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Particles sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      setParticlesUrl("");
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast particles");
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadParticles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.uploadParticles('*', file);
        toast.success(`Particles uploaded and sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.uploadParticles(clientId, file);
            successCount++;
          } catch (error) {
             console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Particles uploaded and sent to ${successCount} clients`);
      }
      setIsDialogOpen(false);
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload particles");
    } finally {
      setIsSending(false);
    }
  };

  const handleReverse = async () => {
    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.reverseScreen('*');
        toast.success(`Reverse sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.reverseScreen(clientId);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Reverse sent to ${successCount} clients`);
      }
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast reverse");
    } finally {
      setIsSending(false);
    }
  };

  const handleShowDesktop = async () => {
    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.showDesktop('*');
        toast.success(`Show desktop sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.showDesktop(clientId);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Show desktop sent to ${successCount} clients`);
      }
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast show desktop");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdate = async () => {
    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.triggerUpdate('*');
        toast.success(`Update sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.triggerUpdate(clientId);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Update sent to ${successCount} clients`);
      }
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast update");
    } finally {
      setIsSending(false);
    }
  };

  const handleClones = async () => {
    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.clones('*');
        toast.success(`Clones sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.clones(clientId);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Clones sent to ${successCount} clients`);
      }
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast clones");
    } finally {
      setIsSending(false);
    }
  };

  const handleDrunk = async () => {
    setIsSending(true);
    try {
      if (selectedCount === totalCount) {
        await api.drunk('*');
        toast.success(`Drunk mode sent to all clients`);
      } else {
        let successCount = 0;
        for (const clientId of selectedIds) {
          try {
            await api.drunk(clientId);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
          }
        }
        if (successCount > 0) toast.success(`Drunk mode sent to ${successCount} clients`);
      }
      onClearSelection();
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast drunk mode");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-foreground/90 backdrop-blur-md text-background rounded-full shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 border border-white/10">
        <div className="flex items-center gap-2 px-3 border-r border-background/20">
          <span className="font-bold text-sm">{selectedCount}</span>
          <span className="text-xs opacity-80">selected</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={onSelectAll}
        >
          <CheckSquare className="h-3 w-3 mr-2" />
          {selectedCount === totalCount ? "Deselect All" : "Select All"}
        </Button>

        <div className="h-4 w-px bg-background/20 mx-1" />

        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 text-xs bg-background text-foreground hover:bg-background/90"
          onClick={() => { setActiveTab("wallpaper"); setIsDialogOpen(true); }}
        >
          <ImageIcon className="h-3 w-3 mr-2" />
          Wallpaper
        </Button>

        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 text-xs bg-background text-foreground hover:bg-background/90"
          onClick={() => { setActiveTab("marquee"); setIsDialogOpen(true); }}
        >
          <ScrollText className="h-3 w-3 mr-2" />
          Marquee
        </Button>

        <Button 
          variant="secondary" 
          size="sm" 
          className="h-8 text-xs bg-background text-foreground hover:bg-background/90"
          onClick={() => { setActiveTab("particles"); setIsDialogOpen(true); }}
        >
          <Sparkles className="h-3 w-3 mr-2" />
          Particles
        </Button>

        <div className="h-4 w-px bg-background/20 mx-1" />

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={handleShowDesktop}
          disabled={isSending}
        >
          <Layout className="h-3 w-3 mr-2" />
          Desktop
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={handleReverse}
          disabled={isSending}
        >
          <RotateCw className="h-3 w-3 mr-2" />
          Reverse
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={handleClones}
          disabled={isSending}
        >
          <Mouse className="h-3 w-3 mr-2" />
          Clones
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={handleDrunk}
          disabled={isSending}
        >
          <Zap className="h-3 w-3 mr-2" />
          Drunk
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs hover:bg-white/10 hover:text-white text-background"
          onClick={handleUpdate}
          disabled={isSending}
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Update
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-red-500/20 hover:text-red-400 text-background/50 ml-1"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Broadcast to {selectedCount} Client{selectedCount > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
              <TabsTrigger value="marquee">Marquee</TabsTrigger>
              <TabsTrigger value="particles">Particles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallpaper" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={wallpaperUrl}
                    onChange={(e) => setWallpaperUrl(e.target.value)}
                  />
                  <Button size="icon" onClick={handleBroadcastWallpaper} disabled={isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or upload</span>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </div>
                <Input type="file" className="hidden" accept="image/*" onChange={handleUploadWallpaper} disabled={isSending} />
              </label>
            </TabsContent>

            <TabsContent value="marquee" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Marquee Text/URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Text or Image URL" 
                    value={marqueeUrl}
                    onChange={(e) => setMarqueeUrl(e.target.value)}
                  />
                  <Button size="icon" onClick={handleBroadcastMarquee} disabled={isSending}>
                    <ScrollText className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or upload</span>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </div>
                <Input type="file" className="hidden" accept="image/*" onChange={handleUploadMarquee} disabled={isSending} />
              </label>
            </TabsContent>

            <TabsContent value="particles" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Particle Image URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={particlesUrl}
                    onChange={(e) => setParticlesUrl(e.target.value)}
                  />
                  <Button size="icon" onClick={handleBroadcastParticles} disabled={isSending}>
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or upload</span>
                </div>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload particle image</p>
                  <p className="text-xs text-muted-foreground mt-1">Will be resized to 48x48</p>
                </div>
                <Input type="file" className="hidden" accept="image/*" onChange={handleUploadParticles} disabled={isSending} />
              </label>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
