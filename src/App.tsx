import { useEffect, useState } from 'react';
import { api } from './services/api';
import type { Client } from './services/api';
import { ClientCard } from './components/ClientCard';
import { BroadcastBar } from './components/BroadcastBar';
import { Login } from './components/Login';
import { Toaster } from 'sonner';
import { Button } from './components/ui/button';
import { RefreshCw, Users, LayoutDashboard, Settings, LogOut, Menu, CheckSquare } from 'lucide-react';
import { ModeToggle } from './components/mode-toggle';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!api.getToken());
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const list = await api.listClients();
      setClients(list);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersion = async () => {
    try {
      const v = await api.getVersion();
      setVersion(v);
    } catch (error) {
      console.error("Failed to fetch version", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchVersion();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchClients, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedClients([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode]);

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setClients([]);
  };

  const toggleSelectionMode = (e?: React.MouseEvent) => {
    if (e?.ctrlKey || e?.metaKey) {
      // Ctrl+click: enable selection mode and select all
      setIsSelectionMode(true);
      setSelectedClients(clients.map(c => c.id));
    } else {
      setIsSelectionMode(!isSelectionMode);
      setSelectedClients([]);
    }
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  if (!isAuthenticated) {
    return (
        <>
            <Toaster position="top-right" />
            <Login onLogin={() => setIsAuthenticated(true)} />
        </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">WallChange</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <Button variant="secondary" className="w-full justify-start gap-3 font-medium">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 font-medium text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Server Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Online v{version || "..."}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <ModeToggle />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-md">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold">WallChange</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Scrollable Content */}
        <main 
          className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
          onClick={(e) => {
            if (isSelectionMode && e.target === e.currentTarget) {
              setIsSelectionMode(false);
              setSelectedClients([]);
            }
          }}
        >
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground p-8 md:p-12 shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back!</h2>
                  <p className="text-primary-foreground/80 text-lg max-w-md">
                    You have <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">{clients.length}</span> active clients connected to the network.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={fetchClients} 
                    disabled={loading} 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Network
                  </Button>

                  <Button 
                    onClick={(e) => toggleSelectionMode(e)} 
                    className={`
                      border-0 backdrop-blur-sm transition-colors
                      ${isSelectionMode ? 'bg-white text-primary hover:bg-white/90' : 'bg-white/20 hover:bg-white/30 text-white'}
                    `}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {isSelectionMode ? 'Cancel Selection' : 'Select Clients'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Clients Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Active Sessions</h3>
              </div>

              {clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-3xl bg-card/30">
                  <div className="bg-secondary/50 p-4 rounded-full mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No clients found</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Waiting for incoming connections...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                  {clients.map((client) => (
                    <ClientCard 
                      key={client.id} 
                      client={client} 
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedClients.includes(client.id)}
                      onToggleSelect={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          if (!isSelectionMode) setIsSelectionMode(true);
                          toggleClientSelection(client.id);
                        } else if (isSelectionMode) {
                          toggleClientSelection(client.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Broadcast Bar */}
        {isSelectionMode && selectedClients.length > 0 && (
          <BroadcastBar 
            selectedCount={selectedClients.length} 
            totalCount={clients.length}
            onClearSelection={() => setSelectedClients([])}
            onSelectAll={selectAllClients}
            selectedIds={selectedClients}
          />
        )}
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
