export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Eagle Gymnastics Academy TEST</h1>
      <p style={{ marginBottom: 16 }}>
        Welcome. This is the new website (in progress).
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href="/book-recreational"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Book Recreational
        </a>

        <a
          href="/book-competition"
          style={{
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Book Competition
        </a>
      </div>
    </main>
  );
}
