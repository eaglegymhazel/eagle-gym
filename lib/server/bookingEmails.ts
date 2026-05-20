import "server-only";

type BirthdayPartyConfirmationEmailInput = {
  toEmail: string;
  accountName: string;
  birthdayChildName: string;
  birthdayChildDateOfBirth: string | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  totalAmountPence: number;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T12:00:00Z`));
}

function formatDateOfBirth(dateValue: string | null): string {
  if (!dateValue) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateValue}T12:00:00Z`));
}

function formatTime(timeValue: string): string {
  const [hourRaw, minuteRaw] = timeValue.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  const date = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(date)
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
}

export async function sendBirthdayPartyConfirmationEmail(
  input: BirthdayPartyConfirmationEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim() || process.env.CONTACT_FROM_EMAIL?.trim();

  if (!resendApiKey || !from) {
    return { ok: false, error: "Booking email is not configured." };
  }

  const birthdayChildName = input.birthdayChildName.trim() || "Birthday child";
  const formattedDate = formatDate(input.slotDate);
  const formattedTime = `${formatTime(input.startTime)}-${formatTime(input.endTime)}`;
  const formattedAmount = formatCurrency(input.totalAmountPence);
  const subject = `Birthday party booking confirmed for ${formattedDate}`;

  const text = [
    `Hello ${input.accountName || "there"},`,
    "",
    "Your birthday party booking has been confirmed.",
    "",
    `Birthday child: ${birthdayChildName}`,
    `Date of birth: ${formatDateOfBirth(input.birthdayChildDateOfBirth)}`,
    `Party date: ${formattedDate}`,
    `Party time: ${formattedTime}`,
    `Amount paid: ${formattedAmount}`,
    "",
    "If you need to update your booking or ask any questions before the party, please contact Eagle Gymnastics Academy through the website contact page.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a25;">
      <h1 style="margin: 0 0 12px; font-size: 24px; color: #143271;">Birthday party booking confirmed</h1>
      <p style="margin: 0 0 16px;">Hello ${escapeHtml(input.accountName || "there")},</p>
      <p style="margin: 0 0 20px;">Your birthday party booking has been confirmed. Here are your booking details:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Birthday child</td>
          <td style="padding: 8px 0;">${escapeHtml(birthdayChildName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Date of birth</td>
          <td style="padding: 8px 0;">${escapeHtml(formatDateOfBirth(input.birthdayChildDateOfBirth))}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Party date</td>
          <td style="padding: 8px 0;">${escapeHtml(formattedDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Party time</td>
          <td style="padding: 8px 0;">${escapeHtml(formattedTime)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Amount paid</td>
          <td style="padding: 8px 0;">${escapeHtml(formattedAmount)}</td>
        </tr>
      </table>
      <p style="margin: 0;">If you need to update your booking or ask any questions before the party, please contact Eagle Gymnastics Academy through the website contact page.</p>
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
      to: [input.toEmail],
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
      "Unable to send booking confirmation email.";
    return { ok: false, error: errorMessage };
  }

  return { ok: true };
}
