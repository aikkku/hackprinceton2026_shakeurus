const apiBase = (): string => "https://seahorse-app-74te5.ondigitalocean.app";

async function parseError(res: Response): Promise<string> {
  const t = await res.text();
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) return JSON.stringify(j.detail);
  } catch {
    /* ignore */
  }
  return t || res.statusText;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}${path}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.headers || {}),
  };
  if (init?.body && !(headers as Record<string, string>)["Content-Type"]) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const r = await fetch(url, { ...init, headers });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok) {
    throw new Error(await parseError(r));
  }
  if (ct.includes("application/json")) {
    return (await r.json()) as T;
  }
  return (await r.text()) as T;
}

export type SongInfo = {
  name: string;
  file: string;
  pose_label: string | null;
};

export type ScheduleInfo = {
  kind: "alarm" | "timer" | null;
  song_file: string | null;
  time?: string | null;
  timer_remaining_sec?: number | null;
};

export function getSongs() {
  return api<SongInfo[]>("/api/songs");
}

export function triggerAlarm(songFile?: string | null) {
  const body =
    songFile != null && songFile !== ""
      ? JSON.stringify({ song_file: songFile })
      : undefined;
  return api<{ ok: boolean; reason?: string; song?: string }>("/api/trigger", {
    method: "POST",
    body,
  });
}

export function scheduleAlarm(time: string, songFile?: string | null) {
  return api("/api/schedule/alarm", {
    method: "POST",
    body: JSON.stringify({
      time,
      song_file: songFile || null,
    }),
  });
}

export function scheduleTimer(seconds: number, songFile?: string | null) {
  return api("/api/schedule/timer", {
    method: "POST",
    body: JSON.stringify({
      seconds,
      song_file: songFile || null,
    }),
  });
}

export function cancelSchedule() {
  return api("/api/schedule/cancel", { method: "POST" });
}

export function getSchedule() {
  return api<ScheduleInfo>("/api/schedule");
}
