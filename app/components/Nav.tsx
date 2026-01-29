import Link from "next/link";

export default function Nav() {
  return (
    <nav
      style={{
        padding: 16,
        borderBottom: "1px solid #e5e5e5",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/team">Team</Link>
        <Link href="/news">Competition News</Link>
        <Link href="/timetable">Timetable</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/members">Members Area</Link>

        <div style={{ marginLeft: "auto" }}>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
