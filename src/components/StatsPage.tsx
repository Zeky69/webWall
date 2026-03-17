import { useEffect, useMemo, useState } from 'react';
import { Image, BarChart3, Hash, HardDrive, Users, Trophy, Activity, Clock } from 'lucide-react';
import { api, BASE_URL } from '../services/api';
import type {
  ImageStatsResponse,
  ImageStatEntry,
  FeatureLeaderboardUser,
  FeatureLeaderboardEntry,
  FeatureRecentEvent,
} from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`;
};

const formatDate = (ts?: number) => {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
};

const buildImageUrl = (path: string) => `${BASE_URL}/${path.replace(/^\/+/, '')}`;

interface StatsPageProps {
  isAuthenticated: boolean;
}

export function StatsPage({ isAuthenticated }: StatsPageProps) {
  const [stats, setStats] = useState<ImageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getImageStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const topImages = useMemo(() => stats?.top_images ?? [], [stats]);
  const allImages = useMemo(() => stats?.images ?? [], [stats]);
  const featureStats = useMemo(() => stats?.feature_stats, [stats]);
  const topUsers = useMemo(() => featureStats?.leaderboards?.top_users ?? [], [featureStats]);
  const topFeatures = useMemo(() => featureStats?.leaderboards?.top_features ?? [], [featureStats]);
  const recentEvents = useMemo(() => {
    const events = featureStats?.recent_events ?? [];
    return [...events].reverse().slice(0, 25);
  }, [featureStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Statistiques des images</h2>
          <p className="text-sm text-muted-foreground">Déduplication par hash SHA-256 et suivi complet des uploads.</p>
        </div>
        <Button onClick={fetchStats} disabled={loading}>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total uploads</CardDescription>
            <CardTitle className="text-3xl">{stats?.summary.total_uploads ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Images uniques</CardDescription>
            <CardTitle className="text-3xl">{stats?.summary.total_unique_images ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Doublons détectés</CardDescription>
            <CardTitle className="text-3xl">{stats?.summary.total_duplicate_uploads ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Volume total</CardDescription>
            <CardTitle className="text-3xl">{formatBytes(stats?.summary.total_bytes_uploaded ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Taille moyenne</CardDescription>
            <CardTitle className="text-3xl">{formatBytes(Math.round(stats?.summary.average_upload_size ?? 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Taux de doublon</CardDescription>
            <CardTitle className="text-3xl">{((stats?.summary.duplicate_ratio ?? 0) * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-4 w-4" /> Statistiques globales des fonctionnalités</CardTitle>
          <CardDescription>Suivi complet des actions envoyées: tout est persisté côté serveur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total commandes</p>
              <p className="text-2xl font-bold">{featureStats?.summary.total_commands ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
              <p className="text-2xl font-bold">{featureStats?.summary.unique_users ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Fonctionnalités utilisées</p>
              <p className="text-2xl font-bold">{featureStats?.summary.feature_kinds ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Événements mémorisés</p>
              <p className="text-2xl font-bold">{featureStats?.summary.recent_events_count ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Trophy className="h-4 w-4" /> Leaderboard utilisateurs</CardTitle>
            <CardDescription>Classement des utilisateurs avec le plus d'actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune action utilisateur enregistrée.</p>
            ) : (
              topUsers.map((entry: FeatureLeaderboardUser, index) => (
                <div key={`${entry.user}-${index}`} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">#{index + 1} {entry.user}</div>
                    <div className="text-muted-foreground">{entry.total_commands} actions</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Dernière commande: {entry.last_command ?? '-'} • Vu: {formatDate(entry.last_seen_at)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-4 w-4" /> Top fonctionnalités</CardTitle>
            <CardDescription>Fonctionnalités les plus utilisées sur toutes les actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune fonctionnalité comptabilisée.</p>
            ) : (
              topFeatures.map((entry: FeatureLeaderboardEntry, index) => (
                <div key={`${entry.feature}-${index}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="font-medium">#{index + 1} {entry.feature}</div>
                  <div className="text-muted-foreground">{entry.count}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-4 w-4" /> Activité récente</CardTitle>
          <CardDescription>Dernières commandes exécutées et stockées en base stats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement récent.</p>
          ) : (
            recentEvents.map((event: FeatureRecentEvent, index) => (
              <div key={`${event.timestamp}-${event.user}-${index}`} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{event.user} → {event.command}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{event.details || '-'}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-4 w-4" /> Top images envoyées</CardTitle>
          <CardDescription>Classement par nombre d'envois (même image détectée par hash).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {topImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée pour le moment.</p>
          ) : (
            topImages.map((item: ImageStatEntry, index) => (
              <div key={item.hash} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <span>#{index + 1}</span>
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono">{item.hash.slice(0, 16)}...</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {item.upload_count} envois</span>
                  <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> {formatBytes(item.size_bytes)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Image className="h-4 w-4" /> Galerie des images réelles uniques</CardTitle>
          <CardDescription>{allImages.length} image(s) stockée(s) de manière unique (même contenu = une seule copie).</CardDescription>
        </CardHeader>
        <CardContent>
          {allImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune image uploadée.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {allImages.map((image) => (
                <div key={image.hash} className="rounded-md border bg-card/40 p-3">
                  <img
                    src={buildImageUrl(image.stored_path)}
                    alt={image.original_name || image.hash}
                    className="mb-3 h-40 w-full rounded-md border object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{image.original_name}</p>
                    <p className="font-mono">{image.hash}</p>
                    <p>{image.upload_count} envois • {formatBytes(image.size_bytes)}</p>
                    <p>Vu le: {formatDate(image.last_seen_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
