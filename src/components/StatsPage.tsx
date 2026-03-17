import { useEffect, useMemo, useState } from 'react';
import { Image, BarChart3, Hash, HardDrive, Users, Activity, Clock, Sparkles, CalendarDays, PieChart } from 'lucide-react';
import { api, BASE_URL } from '../services/api';
import type {
  ImageStatsResponse,
  ImageStatEntry,
  FeatureRecentEvent,
} from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

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

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const buildImageUrl = (path: string) => `${BASE_URL}/${path.replace(/^\/+/, '')}`;

const percentage = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function HorizontalBarChart({ title, description, data, maxItems = 8 }: {
  title: string;
  description: string;
  data: BarDatum[];
  maxItems?: number;
}) {
  const rows = data.slice(0, maxItems);
  const maxValue = rows.reduce((currentMax, item) => Math.max(currentMax, item.value), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas assez de données.</p>
        ) : (
          rows.map((item) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate pr-3">{item.label}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{formatNumber(item.value)}{item.hint ? ` · ${item.hint}` : ''}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary/60">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${clamp(width)}%` }} />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function ActivityByDayChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = data.reduce((m, entry) => Math.max(m, entry.count), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-4 w-4" /> Activité journalière</CardTitle>
        <CardDescription>Volume de commandes par jour (fenêtre récente).</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {data.map((entry) => {
              const height = max > 0 ? Math.max(8, (entry.count / max) * 72) : 8;
              return (
                <div key={entry.day} className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground mb-2 truncate">{entry.day}</div>
                  <div className="h-20 flex items-end">
                    <div className="w-full rounded-sm bg-primary/80" style={{ height: `${height}px` }} />
                  </div>
                  <div className="text-xs mt-2 text-right text-muted-foreground">{entry.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsPageProps {
  isAuthenticated: boolean;
}

export function StatsPage({ isAuthenticated }: StatsPageProps) {
  const [stats, setStats] = useState<ImageStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(20);

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
  const topPcs = useMemo(() => featureStats?.leaderboards?.top_pcs ?? [], [featureStats]);
  const topHostnames = useMemo(() => featureStats?.leaderboards?.top_hostnames ?? [], [featureStats]);
  const topUserPcPairs = useMemo(
    () => [...(featureStats?.leaderboards?.top_user_pc_pairs ?? [])].sort((a, b) => b.count - a.count),
    [featureStats],
  );
  const topUserFavoritePcs = useMemo(
    () => [...(featureStats?.leaderboards?.top_user_favorite_pcs ?? [])].sort((a, b) => b.count - a.count),
    [featureStats],
  );
  const recentEvents = useMemo(() => {
    const events = featureStats?.recent_events ?? [];
    return [...events].reverse();
  }, [featureStats]);

  const eventsTotalPages = useMemo(() => Math.max(1, Math.ceil(recentEvents.length / eventsPerPage)), [recentEvents.length, eventsPerPage]);

  const pagedEvents = useMemo(() => {
    const start = (eventsPage - 1) * eventsPerPage;
    return recentEvents.slice(start, start + eventsPerPage);
  }, [eventsPage, eventsPerPage, recentEvents]);

  useEffect(() => {
    if (eventsPage > eventsTotalPages) {
      setEventsPage(eventsTotalPages);
    }
  }, [eventsPage, eventsTotalPages]);

  const totalCommands = featureStats?.summary.total_commands ?? 0;
  const uniqueUsers = featureStats?.summary.unique_users ?? 0;
  const totalRequestsSent = featureStats?.summary.total_requests_sent ?? featureStats?.dispatch?.total_requests_sent ?? 0;
  const totalRequestsDelivered = featureStats?.summary.total_requests_delivered ?? featureStats?.dispatch?.total_requests_delivered ?? 0;
  const failedRequests = featureStats?.summary.failed_requests ?? featureStats?.dispatch?.failed_requests ?? 0;
  const wildcardRequests = featureStats?.summary.wildcard_requests ?? featureStats?.dispatch?.wildcard_requests ?? 0;
  const requestSuccessRate = totalRequestsSent > 0 ? percentage(totalRequestsDelivered, totalRequestsSent) : 0;
  const uniqueStorageBytes = useMemo(() => allImages.reduce((sum, image) => sum + (image.size_bytes || 0), 0), [allImages]);
  const dedupSavedBytes = Math.max(0, (stats?.summary.total_bytes_uploaded ?? 0) - uniqueStorageBytes);
  const duplicateRatePct = (stats?.summary.duplicate_ratio ?? 0) * 100;
  const uploadsPerUnique = stats && stats.summary.total_unique_images > 0
    ? stats.summary.total_uploads / stats.summary.total_unique_images
    : 0;
  const commandsPerUser = uniqueUsers > 0 ? totalCommands / uniqueUsers : 0;
  const topFeatureShare = totalCommands > 0 && topFeatures.length > 0
    ? percentage(topFeatures[0].count, totalCommands)
    : 0;

  const favoriteHour = useMemo(() => {
    if (recentEvents.length === 0) return { hour: '-', count: 0 };
    const buckets = new Array<number>(24).fill(0);
    recentEvents.forEach((event) => {
      const hour = new Date(event.timestamp * 1000).getHours();
      buckets[hour] += 1;
    });
    let maxHour = 0;
    for (let hour = 1; hour < 24; hour++) {
      if (buckets[hour] > buckets[maxHour]) maxHour = hour;
    }
    return { hour: `${String(maxHour).padStart(2, '0')}:00`, count: buckets[maxHour] };
  }, [recentEvents]);

  const activityByDay = useMemo(() => {
    const map = new Map<string, number>();
    recentEvents.forEach((event) => {
      const day = new Date(event.timestamp * 1000).toLocaleDateString();
      map.set(day, (map.get(day) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([day, count]) => ({ day, count }))
      .slice(0, 14)
      .reverse();
  }, [recentEvents]);

  const userBars = useMemo<BarDatum[]>(() => topUsers.map((entry) => ({
    label: entry.user,
    value: entry.total_commands,
    hint: entry.last_command || 'n/a',
  })), [topUsers]);

  const featureBars = useMemo<BarDatum[]>(() => topFeatures.map((entry) => ({
    label: entry.feature,
    value: entry.count,
    hint: `${percentage(entry.count, totalCommands).toFixed(1)}%`,
  })), [topFeatures, totalCommands]);

  const imageBars = useMemo<BarDatum[]>(() => topImages.map((entry) => ({
    label: entry.original_name || `${entry.hash.slice(0, 10)}...`,
    value: entry.upload_count,
    hint: formatBytes(entry.size_bytes),
  })), [topImages]);

  const pcBars = useMemo<BarDatum[]>(() => topPcs.map((entry) => ({
    label: entry.machine || entry.hostname || entry.target_id,
    value: entry.total_requests,
    hint: `${entry.total_deliveries} livrées`,
  })), [topPcs]);

  const hostnameBars = useMemo<BarDatum[]>(() => topHostnames.map((entry) => ({
    label: entry.hostname,
    value: entry.count,
    hint: 'demandes',
  })), [topHostnames]);

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total uploads</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(stats?.summary.total_uploads ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Commandes totales</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(totalCommands)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Utilisateurs actifs</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(uniqueUsers)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Heure la plus active</CardDescription>
            <CardTitle className="text-3xl">{favoriteHour.hour}</CardTitle>
            <CardDescription>{formatNumber(favoriteHour.count)} actions</CardDescription>
          </CardHeader>
        </Card>
      </div>

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Économie stockage (dedup)</CardDescription>
            <CardTitle className="text-2xl">{formatBytes(dedupSavedBytes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Uploads / image unique</CardDescription>
            <CardTitle className="text-2xl">{uploadsPerUnique.toFixed(2)}x</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Commandes / utilisateur</CardDescription>
            <CardTitle className="text-2xl">{commandsPerUser.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Part de la top feature</CardDescription>
            <CardTitle className="text-2xl">{topFeatureShare.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Requêtes envoyées</CardDescription>
            <CardTitle className="text-2xl">{formatNumber(totalRequestsSent)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Requêtes livrées (PC en ligne)</CardDescription>
            <CardTitle className="text-2xl">{formatNumber(totalRequestsDelivered)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Échecs de livraison</CardDescription>
            <CardTitle className="text-2xl">{formatNumber(failedRequests)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Taux de réussite des requêtes</CardDescription>
            <CardTitle className="text-2xl">{requestSuccessRate.toFixed(1)}%</CardTitle>
            <CardDescription>Wildcard: {formatNumber(wildcardRequests)}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><PieChart className="h-4 w-4" /> Répartition images uniques vs doublons</CardTitle>
          <CardDescription>Visualisation rapide de la qualité de déduplication.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div
              className="h-36 w-36 rounded-full border"
              style={{
                background: `conic-gradient(hsl(var(--primary)) 0% ${clamp(duplicateRatePct)}%, hsl(var(--muted)) ${clamp(duplicateRatePct)}% 100%)`,
              }}
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm bg-primary" /> Doublons: {duplicateRatePct.toFixed(1)}%</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm bg-muted" /> Uniques: {(100 - duplicateRatePct).toFixed(1)}%</div>
              <div className="text-muted-foreground">Taille physique stockée: {formatBytes(uniqueStorageBytes)} · Volume total uploadé: {formatBytes(stats?.summary.total_bytes_uploaded ?? 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <HorizontalBarChart
          title="Leaderboard utilisateurs"
          description="Top utilisateurs par volume d’actions."
          data={userBars}
          maxItems={10}
        />

        <HorizontalBarChart
          title="Top fonctionnalités"
          description="Fonctionnalités les plus utilisées avec part relative."
          data={featureBars}
          maxItems={12}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActivityByDayChart data={activityByDay} />
        <HorizontalBarChart
          title="Top images (popularité)"
          description="Images les plus rediffusées, utile pour repérer les favoris."
          data={imageBars}
          maxItems={8}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <HorizontalBarChart
          title="Top PC demandés"
          description="Quels PC sont les plus demandés par les utilisateurs."
          data={pcBars}
          maxItems={10}
        />
        <HorizontalBarChart
          title="Top hostnames demandés"
          description="Classement des machines par hostname sur les requêtes reçues."
          data={hostnameBars}
          maxItems={10}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top user → PC (paires)</CardTitle>
            <CardDescription>Les couples utilisateur/PC les plus fréquents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUserPcPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas de données user→PC pour l’instant.</p>
            ) : (
              topUserPcPairs.slice(0, 15).map((entry, index) => (
                <div key={`${entry.user}-${entry.target_id}-${index}`} className="rounded-md border p-3 text-sm flex items-center justify-between gap-3">
                  <div className="font-medium">#{index + 1} {entry.user} → {entry.machine || entry.target_id}</div>
                  <div className="text-muted-foreground">{formatNumber(entry.count)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PC favoris par utilisateur</CardTitle>
            <CardDescription>Pour chaque utilisateur: le PC le plus ciblé.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topUserFavoritePcs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de préférences utilisateur.</p>
            ) : (
              topUserFavoritePcs.slice(0, 15).map((entry, index) => (
                <div key={`${entry.user}-${entry.target_id}-${index}`} className="rounded-md border p-3 text-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">#{index + 1} {entry.user}</div>
                    <div className="text-xs text-muted-foreground">PC favori: {entry.machine || entry.target_id}</div>
                  </div>
                  <div className="text-muted-foreground">{formatNumber(entry.count)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-4 w-4" /> Activité récente (paginée)</CardTitle>
          <CardDescription>Navigation par pages pour rester fluide même avec beaucoup d’événements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <p className="text-xs text-muted-foreground">
              {recentEvents.length === 0 ? '0 événement' : `Page ${eventsPage}/${eventsTotalPages} · ${formatNumber(recentEvents.length)} événements`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEventsPerPage(10)}>10 / page</Button>
              <Button variant="outline" size="sm" onClick={() => setEventsPerPage(20)}>20 / page</Button>
              <Button variant="outline" size="sm" onClick={() => setEventsPerPage(50)}>50 / page</Button>
            </div>
          </div>

          {pagedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement récent.</p>
          ) : (
            pagedEvents.map((event: FeatureRecentEvent, index) => (
              <div key={`${event.timestamp}-${event.user}-${index}`} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{event.user} → {event.command} {event.command === (topFeatures[0]?.feature ?? '') ? <Sparkles className="inline h-3.5 w-3.5 text-yellow-500" /> : null}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{event.details || '-'}</div>
              </div>
            ))
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={eventsPage <= 1} onClick={() => setEventsPage(1)}>Début</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={eventsPage <= 1} onClick={() => setEventsPage((current) => Math.max(1, current - 1))}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={eventsPage >= eventsTotalPages} onClick={() => setEventsPage((current) => Math.min(eventsTotalPages, current + 1))}>Suivant</Button>
            </div>
            <Button variant="outline" size="sm" disabled={eventsPage >= eventsTotalPages} onClick={() => setEventsPage(eventsTotalPages)}>Fin</Button>
          </div>
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
