export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const message = String(body?.message || "").trim();
  const website = String(body?.website || "").trim();

  if (website) {
    return Response.json({ ok: true }, { status: 200 });
  }

  if (!name || !email || !message) {
    return Response.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!resendApiKey || !from || !to) {
    return Response.json(
      { error: "Contact email is not configured." },
      { status: 500 }
    );
  }

  const subject = `Customer Inquiry from ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a25;">
      <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin: 0 0 16px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
      <div style="white-space: pre-wrap;">${escapeHtml(message)}</div>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      text,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const payload = (await resendResponse.json().catch(() => null)) as
      | { message?: string; error?: { message?: string } }
      | null;
    const errorMessage =
      payload?.message ||
      payload?.error?.message ||
      "Unable to send your message right now.";

    return Response.json({ error: errorMessage }, { status: 502 });
  }

  return Response.json({ ok: true }, { status: 200 });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
