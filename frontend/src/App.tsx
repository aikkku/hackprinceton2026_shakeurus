import { NavLink, Route, Routes } from "react-router-dom";
import { AlarmPage } from "./pages/AlarmPage";
import { StatsPage } from "./pages/StatsPage";

export default function App() {
  return (
    <>
      <main style={{ padding: "1rem clamp(0.75rem, 4vw, 1.5rem) 0" }}>
        <Routes>
          <Route path="/" element={<AlarmPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
      <nav className="bottom-nav" aria-label="Primary">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : undefined)} end>
          Alarm
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Stats
        </NavLink>
      </nav>
    </>
  );
}
