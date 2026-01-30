export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name || "").trim();
  const message = String(body?.message || "").trim();

  if (!name || !message) {
    return Response.json(
      { error: "Name and message are required." },
      { status: 400 }
    );
  }

  // For now: no email provider configured.
  // Later: send email or store in DB/Sanity here.
  return Response.json({ ok: true }, { status: 200 });
}
