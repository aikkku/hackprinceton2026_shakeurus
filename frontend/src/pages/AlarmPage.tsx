import { useCallback, useEffect, useState } from "react";
import {
  cancelSchedule,
  getSchedule,
  getSongs,
  scheduleAlarm,
  scheduleTimer,
  triggerAlarm,
  type ScheduleInfo,
  type SongInfo,
} from "../api";

/** Flat school-palette tile accents (no gradients). */
const TILE_BG: Record<string, string> = {
  "scuba.mp3": "#dbeafe",
  "gangnam_style.mp3": "#fce7f3",
  "low_cortisol.mp3": "#d9f99d",
  "woah.mp3": "#fef3c7",
  "lush_life.mp3": "#e9d5ff",
  "whip.mp3": "#fecaca",
};

type Tab = "alarm" | "timer" | "now";

export function AlarmPage() {
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("alarm");
  const [alarmTime, setAlarmTime] = useState("07:30");
  const [timerMin, setTimerMin] = useState(5);
  const [timerSec, setTimerSec] = useState(0);
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSongs = useCallback(async () => {
    try {
      const list = await getSongs();
      setSongs(list);
      setSelected((prev) => prev ?? (list[0]?.file ?? null));
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Could not load songs" });
    }
  }, []);

  const loadScheduleOnce = useCallback(async () => {
    try {
      const s = await getSchedule();
      setSchedule(s);
    } catch {
      /* optional: ignore if Pi offline */
    }
  }, []);

  useEffect(() => {
    void loadSongs();
  }, [loadSongs]);

  useEffect(() => {
    void loadScheduleOnce();
  }, [loadScheduleOnce]);

  const songFile = selected;

  async function onSetAlarm() {
    setLoading(true);
    setMsg(null);
    try {
      await scheduleAlarm(alarmTime, songFile);
      setMsg({ type: "ok", text: `Daily alarm set for ${alarmTime} (Pi local time)` });
      await loadScheduleOnce();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  async function onSetTimer() {
    const sec = Math.min(86400, Math.max(1, timerMin * 60 + timerSec));
    setLoading(true);
    setMsg(null);
    try {
      await scheduleTimer(sec, songFile);
      setMsg({ type: "ok", text: `Timer set for ${sec}s` });
      await loadScheduleOnce();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  async function onTriggerNow() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await triggerAlarm(songFile);
      if (r && "ok" in r && r.ok === false && r.reason) {
        setMsg({ type: "err", text: r.reason });
        return;
      }
      setMsg({ type: "ok", text: "Alarm triggered on your Pi" });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  async function onCancel() {
    setLoading(true);
    setMsg(null);
    try {
      await cancelSchedule();
      setMsg({ type: "ok", text: "Schedule cleared" });
      await loadScheduleOnce();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="page-title">ShakeUs</h1>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
        Pick a track, then set an alarm, timer, or trigger now. Runs on your Raspberry Pi.
      </p>

      {msg && <div className={`msg ${msg.type === "err" ? "err" : "ok"}`}>{msg.text}</div>}

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-label">Music for next alarm</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.75rem",
          }}
        >
          {songs.map((s) => {
            const active = selected === s.file;
            const bg = TILE_BG[s.file] || "#fff7ed";
            return (
              <button
                key={s.file}
                type="button"
                onClick={() => setSelected(s.file)}
                className="cartoon-card"
                style={{
                  padding: "1rem 0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  background: bg,
                  transform: active ? "translate(-2px, -2px)" : "none",
                  boxShadow: active ? "6px 6px 0 var(--border)" : "var(--shadow-cartoon)",
                  border: "3px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.95rem",
                    lineHeight: 1.25,
                    color: "var(--text)",
                    fontWeight: 600,
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.35rem" }}>
                  {s.pose_label ? `Pose: ${s.pose_label.replace(/_/g, " ")}` : "Freestyle movement"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div
        className="cartoon-card"
        style={{
          padding: "0.35rem",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.35rem",
          marginBottom: "1rem",
          background: "var(--bg-paper)",
        }}
      >
        {(
          [
            ["alarm", "Alarm"],
            ["timer", "Timer"],
            ["now", "Trigger now"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: "0.65rem 0.5rem",
              borderRadius: 12,
              border: "3px solid var(--border)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "0.82rem",
              background: tab === id ? "#ffd966" : "var(--bg)",
              color: "var(--text)",
              boxShadow: tab === id ? "2px 2px 0 var(--border)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "alarm" && (
        <section className="cartoon-card cartoon-card--tint" style={{ padding: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>
            Time (24h, Pi local time)
          </label>
          <input
            type="time"
            value={alarmTime}
            onChange={(e) => setAlarmTime(e.target.value)}
            className="input-school"
            style={{ marginBottom: "1rem" }}
          />
          <button type="button" disabled={loading} className="btn-primary" onClick={() => void onSetAlarm()}>
            Set daily alarm
          </button>
        </section>
      )}

      {tab === "timer" && (
        <section className="cartoon-card" style={{ padding: "1.25rem", background: "#fffbeb" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>Minutes</label>
              <input
                type="number"
                min={0}
                max={1439}
                value={timerMin}
                onChange={(e) => setTimerMin(Number(e.target.value))}
                className="input-school"
                style={{ marginTop: "0.35rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>Seconds</label>
              <input
                type="number"
                min={0}
                max={59}
                value={timerSec}
                onChange={(e) => setTimerSec(Number(e.target.value))}
                className="input-school"
                style={{ marginTop: "0.35rem" }}
              />
            </div>
          </div>
          <button type="button" disabled={loading} className="btn-secondary" onClick={() => void onSetTimer()}>
            Start timer
          </button>
        </section>
      )}

      {tab === "now" && (
        <section className="cartoon-card cartoon-card--tint" style={{ padding: "1.5rem", textAlign: "center" }}>
          <button
            type="button"
            disabled={loading}
            className="btn-primary"
            style={{ background: "#ffadad" }}
            onClick={() => void onTriggerNow()}
          >
            Trigger alarm now
          </button>
        </section>
      )}

      <section className="cartoon-card" style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "var(--bg-paper)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "0.85rem", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--muted)" }}>
            Pi schedule
          </h2>
          <button
            type="button"
            onClick={() => void onCancel()}
            disabled={loading || !schedule?.kind}
            style={{
              fontSize: "0.8rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 999,
              border: "3px solid var(--border)",
              background: "var(--bg)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--text)",
              cursor: loading || !schedule?.kind ? "not-allowed" : "pointer",
              opacity: loading || !schedule?.kind ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>
          {!schedule?.kind && <span style={{ color: "var(--muted)" }}>No active schedule</span>}
          {schedule?.kind === "alarm" && (
            <span>
              Daily at <strong style={{ color: "var(--accent-navy)" }}>{schedule.time}</strong>
              {schedule.song_file && (
                <>
                  {" "}
                  · {songs.find((x) => x.file === schedule.song_file)?.name ?? schedule.song_file}
                </>
              )}
            </span>
          )}
          {schedule?.kind === "timer" && (
            <span>
              Timer · <strong style={{ color: "var(--accent-red)" }}>{schedule.timer_remaining_sec ?? 0}s</strong> left
              {schedule.song_file && (
                <>
                  {" "}
                  · {songs.find((x) => x.file === schedule.song_file)?.name ?? schedule.song_file}
                </>
              )}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
