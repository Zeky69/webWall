import { useState } from "react";
import { api } from "../services/api";
import type { Client } from "../services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Check, ScrollText, Send, Upload, Users } from "lucide-react";
import { toast } from "sonner";

interface BroadcastDialogProps {
  clients: Client[];
}

export function BroadcastDialog({ clients }: BroadcastDialogProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [marqueeUrl, setMarqueeUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const toggleClient = (id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const handleBroadcastWallpaper = async () => {
    if (!wallpaperUrl || selectedClients.length === 0) return;
    setIsSending(true);
    
    try {
      if (selectedClients.length === clients.length) {
        // Broadcast to all
        await api.changeWallpaper('*', wallpaperUrl);
        toast.success(`Wallpaper sent to all clients`);
      } else {
        // Send individually
        let successCount = 0;
        let failCount = 0;

        for (const clientId of selectedClients) {
          try {
            await api.changeWallpaper(clientId, wallpaperUrl);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
            failCount++;
          }
        }

        if (successCount > 0) toast.success(`Wallpaper sent to ${successCount} clients`);
        if (failCount > 0) toast.error(`Failed to send to ${failCount} clients`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast wallpaper");
    } finally {
      setIsSending(false);
      setWallpaperUrl("");
    }
  };

  const handleBroadcastMarquee = async () => {
    if (!marqueeUrl || selectedClients.length === 0) return;
    setIsSending(true);
    
    try {
      if (selectedClients.length === clients.length) {
        // Broadcast to all
        await api.marquee('*', marqueeUrl);
        toast.success(`Marquee sent to all clients`);
      } else {
        // Send individually
        let successCount = 0;
        let failCount = 0;

        for (const clientId of selectedClients) {
          try {
            await api.marquee(clientId, marqueeUrl);
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${clientId}`, error);
            failCount++;
          }
        }

        if (successCount > 0) toast.success(`Marquee sent to ${successCount} clients`);
        if (failCount > 0) toast.error(`Failed to send to ${failCount} clients`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to broadcast marquee");
    } finally {
      setIsSending(false);
      setMarqueeUrl("");
    }
  };

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedClients.length === 0) return;

    setIsSending(true);
    try {
      const url = await api.uploadFile(file);
      
      if (selectedClients.length === clients.length) {
        // Broadcast to all
        await api.changeWallpaper('*', url);
        toast.success(`Wallpaper uploaded and sent to all clients`);
      } else {
        // Send individually
        let successCount = 0;
        let failCount = 0;

        for (const clientId of selectedClients) {
          try {
            await api.changeWallpaper(clientId, url);
            successCount++;
          } catch (error) {
             console.error(`Failed to send to ${clientId}`, error);
             failCount++;
          }
        }
        
        if (successCount > 0) toast.success(`Wallpaper uploaded and sent to ${successCount} clients`);
        if (failCount > 0) toast.error(`Failed to send to ${failCount} clients`);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to upload wallpaper");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0">
          <Users className="h-4 w-4 mr-2" />
          Broadcast
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Broadcast to Clients</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full overflow-hidden pt-4">
          {/* Client Selection Sidebar */}
          <div className="w-1/3 border-r pr-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Select Clients</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={toggleAll}>
                {selectedClients.length === clients.length ? "None" : "All"}
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {clients.map(client => (
                <div 
                  key={client.id}
                  onClick={() => toggleClient(client.id)}
                  className={`
                    flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors
                    ${selectedClients.includes(client.id) ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}
                  `}
                >
                  <div className={`
                    h-4 w-4 rounded border flex items-center justify-center
                    ${selectedClients.includes(client.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}
                  `}>
                    {selectedClients.includes(client.id) && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium">{client.id}</span>
                    {client.hostname && <span className="text-[10px] text-muted-foreground truncate">{client.hostname}</span>}
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-xs">No clients connected</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              {selectedClients.length} selected
            </div>
          </div>

          {/* Actions Area */}
          <div className="flex-1 pl-2">
            <Tabs defaultValue="wallpaper" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
                <TabsTrigger value="marquee">Marquee</TabsTrigger>
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
                    <Button size="icon" onClick={handleBroadcastWallpaper} disabled={isSending || selectedClients.length === 0}>
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
                  <Input type="file" className="hidden" accept="image/*" onChange={handleUploadWallpaper} disabled={isSending || selectedClients.length === 0} />
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
                    <Button size="icon" onClick={handleBroadcastMarquee} disabled={isSending || selectedClients.length === 0}>
                      <ScrollText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
