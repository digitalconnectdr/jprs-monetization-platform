import { brand } from "@platform/shared";

export default function HomePage() {
  return (
    <main style={{ padding: "3rem", maxWidth: 640 }}>
      <h1>{brand.name}</h1>
      <p>{brand.tagline}</p>
      <p style={{ color: "#666" }}>
        Fase 1 en curso — bootstrap técnico. Ver <code>docs/PHASE_STATUS.md</code>.
      </p>
    </main>
  );
}
