import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_FILLS = ["#5b7c99", "#c53030", "#6b8e23", "#d4a017", "#8b6f9e", "#c05621", "#2c5282"];

function last7Days() {
  const out: { label: string; seconds: number; full: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const full = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const seconds = 18 + ((i * 3) % 5) + Math.sin(i) * 2;
    out.push({ label, seconds: Math.round(seconds * 10) / 10, full });
  }
  return out;
}

const DATA = last7Days();
const LAST_WAKE = "7:42 AM";
const SCORE = 847;

export function StatsPage() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="page-title" style={{ marginBottom: "1.25rem" }}>
        Your stats
      </h1>

      <section
        className="cartoon-card"
        style={{
          padding: "1.25rem",
          marginBottom: "1.25rem",
          background: "var(--bg-paper)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img
            src="https://picsum.photos/seed/davidyen/120/120"
            alt=""
            width={96}
            height={96}
            style={{
              borderRadius: "50%",
              border: "3px solid var(--border)",
              boxShadow: "var(--shadow-cartoon)",
            }}
          />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              David Yen
            </div>
            <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem", fontWeight: 600 }}>
              Last wake-up
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "var(--accent-navy)",
              }}
            >
              {LAST_WAKE}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              padding: "0.75rem",
              borderRadius: 12,
              background: "#e8f0fe",
              border: "3px solid var(--border)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Score
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>{SCORE}</div>
          </div>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: 12,
              background: "var(--bg-red-tint)",
              border: "3px solid var(--border)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Streak
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>7 days</div>
          </div>
        </div>
      </section>

      <section className="cartoon-card" style={{ padding: "1rem 0.5rem 0.75rem", background: "var(--bg-paper)" }}>
        <h2 className="section-label" style={{ margin: "0 0 0.5rem 1rem" }}>
          Time to wake (last 7 days)
        </h2>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c4bbb0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b6560", fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6560", fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                unit="s"
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{ fill: "rgba(250, 246, 239, 0.9)" }}
                contentStyle={{
                  background: "#fffdf8",
                  border: "3px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--text)",
                  fontWeight: 600,
                }}
                labelFormatter={(label) => {
                  const row = DATA.find((d) => d.label === label);
                  return row?.full ?? String(label);
                }}
                formatter={(value: number) => [`${value} sec`, "Wake time"]}
              />
              <Bar dataKey="seconds" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {DATA.map((_, i) => (
                  <Cell key={i} fill={BAR_FILLS[i % BAR_FILLS.length]} stroke="#2d2a26" strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.8rem",
          color: "var(--muted)",
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        Demo data for showcase — not connected to your Pi.
      </p>
    </div>
  );
}
