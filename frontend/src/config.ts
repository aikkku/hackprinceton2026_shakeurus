/**
 * Public URLs for documentation — real values come from env at build time.
 * See ../../LINKS.md in the website folder for where to set FRONTEND / BACKEND / SHAKEUS.
 */
export const envApiBase = (): string => {
  const v = import.meta.env.VITE_API_BASE_URL;
  return (typeof v === "string" ? v : "").replace(/\/$/, "");
};
