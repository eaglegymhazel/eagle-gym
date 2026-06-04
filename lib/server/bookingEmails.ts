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

export type RecreationalClassEmailItem = {
  name: string;
  weekday: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  monthlyPrice: number | null;
};

type RecreationalClassBookingConfirmationEmailInput = {
  toEmail: string;
  accountName: string;
  childName: string;
  classes: RecreationalClassEmailItem[];
  monthlyTotal: number | null;
};

type ClassBookingConfirmationEmailInput = RecreationalClassBookingConfirmationEmailInput & {
  programmeLabel: "Recreational" | "Competition";
};

export type SummerCampEmailItem = {
  label: string;
  startTime: string | null;
  endTime: string | null;
};

type SummerCampBookingConfirmationEmailInput = {
  toEmail: string;
  accountName: string;
  childName: string;
  campTitle: string;
  dates: SummerCampEmailItem[];
  totalAmountPence: number | null;
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

function formatOptionalTime(timeValue: string | null): string {
  if (!timeValue) return "";
  return formatTime(timeValue);
}

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  const start = formatOptionalTime(startTime);
  const end = formatOptionalTime(endTime);
  if (start && end) return `${start}-${end}`;
  return start || "Time TBC";
}

function getContactUsUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return "/contact";
  return `${appUrl.replace(/\/+$/, "")}/contact`;
}

function buildContactButtonHtml(contactUrl: string): string {
  return `
    <div style="margin-top: 20px;">
      <a
        href="${escapeHtml(contactUrl)}"
        style="display: inline-block; border-radius: 999px; background: #6c35c3; padding: 12px 20px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none;"
      >
        Contact Us
      </a>
    </div>
  `;
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
  const contactUrl = getContactUsUrl();

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
    `Contact us: ${contactUrl}`,
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
      ${buildContactButtonHtml(contactUrl)}
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

async function sendClassBookingConfirmationEmail(
  input: ClassBookingConfirmationEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim() || process.env.CONTACT_FROM_EMAIL?.trim();

  if (!resendApiKey || !from) {
    return { ok: false, error: "Booking email is not configured." };
  }

  const childName = input.childName.trim() || "Selected child";
  const programmeName = `${input.programmeLabel} class`;
  const subject = `${programmeName} booking confirmed for ${childName}`;
  const contactUrl = getContactUsUrl();
  const formattedTotal =
    input.monthlyTotal == null ? "Confirmed by Stripe" : `${formatCurrency(input.monthlyTotal * 100)} per month`;
  const classLines = input.classes.map((item) => {
    const duration = item.durationMinutes ? `, ${item.durationMinutes} mins` : "";
    if (input.programmeLabel === "Competition") {
      return `${item.name} - ${item.weekday}, ${formatTimeRange(item.startTime, item.endTime)}${duration}`;
    }
    const price =
      item.monthlyPrice == null
        ? "Price confirmed by Stripe"
        : `${formatCurrency(item.monthlyPrice * 100)} per month`;
    return `${item.name} - ${item.weekday}, ${formatTimeRange(item.startTime, item.endTime)}${duration} - ${price}`;
  });

  const text = [
    `Hello ${input.accountName || "there"},`,
    "",
    `Your ${programmeName.toLowerCase()} booking has been confirmed.`,
    "",
    `Child: ${childName}`,
    `Monthly total: ${formattedTotal}`,
    "",
    "Classes:",
    ...classLines.map((line) => `- ${line}`),
    "",
    "You can view your bookings from your account area. If you need to make changes, please contact Eagle Gymnastics Academy through the website contact page.",
    `Contact us: ${contactUrl}`,
  ].join("\n");

  const classRows = input.classes
    .map((item) => {
      const price =
        item.monthlyPrice == null
          ? "Price confirmed by Stripe"
          : `${formatCurrency(item.monthlyPrice * 100)} per month`;
      const duration = item.durationMinutes ? `${item.durationMinutes} mins` : "Duration TBC";
      return `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #ece3f4;">
            <strong>${escapeHtml(item.name)}</strong><br />
            <span style="color: #5f5268;">${escapeHtml(item.weekday)} · ${escapeHtml(formatTimeRange(item.startTime, item.endTime))} · ${escapeHtml(duration)}</span>
          </td>
          ${input.programmeLabel === "Competition" ? "" : `<td style="padding: 10px 0; border-top: 1px solid #ece3f4; text-align: right;">${escapeHtml(price)}</td>`}
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a25;">
      <div style="border-radius: 20px; overflow: hidden; border: 1px solid #e6dcf0;">
        <div style="background: linear-gradient(135deg, #6f3bc9, #6c35c3 48%, #5f2eb6); color: #ffffff; padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase;">Eagle Gymnastics Academy</p>
          <h1 style="margin: 0; font-size: 24px;">${escapeHtml(programmeName)} booking confirmed</h1>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px;">Hello ${escapeHtml(input.accountName || "there")},</p>
          <p style="margin: 0 0 20px;">Your ${escapeHtml(programmeName.toLowerCase())} booking has been confirmed. Here are your booking details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Child</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(childName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Monthly total</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(formattedTotal)}</td>
            </tr>
          </table>
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #6c35c3;">Classes booked</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${classRows}
          </table>
          <p style="margin: 0;">You can view your bookings from your account area. If you need to make changes, please contact Eagle Gymnastics Academy through the website contact page.</p>
          ${buildContactButtonHtml(contactUrl)}
        </div>
      </div>
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

export async function sendRecreationalClassBookingConfirmationEmail(
  input: RecreationalClassBookingConfirmationEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendClassBookingConfirmationEmail({
    ...input,
    programmeLabel: "Recreational",
  });
}

export async function sendCompetitionClassBookingConfirmationEmail(
  input: RecreationalClassBookingConfirmationEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendClassBookingConfirmationEmail({
    ...input,
    programmeLabel: "Competition",
  });
}

export async function sendSummerCampBookingConfirmationEmail(
  input: SummerCampBookingConfirmationEmailInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.BOOKING_FROM_EMAIL?.trim() || process.env.CONTACT_FROM_EMAIL?.trim();

  if (!resendApiKey || !from) {
    return { ok: false, error: "Booking email is not configured." };
  }

  const childName = input.childName.trim() || "Selected child";
  const subject = `Summer camp booking confirmed for ${childName}`;
  const contactUrl = getContactUsUrl();
  const formattedTotal =
    input.totalAmountPence == null ? "Confirmed by Stripe" : formatCurrency(input.totalAmountPence);
  const dateLines = input.dates.map((item) => {
    return `${item.label} - ${formatTimeRange(item.startTime, item.endTime)}`;
  });

  const text = [
    `Hello ${input.accountName || "there"},`,
    "",
    "Your summer camp booking has been confirmed.",
    "",
    `Child: ${childName}`,
    `Camp: ${input.campTitle}`,
    `Amount paid: ${formattedTotal}`,
    "",
    "Booked days:",
    ...dateLines.map((line) => `- ${line}`),
    "",
    "Important reminders:",
    "- Summer camp runs from 10am to 3pm each day.",
    "- Please bring a packed lunch and drinks each day.",
    "",
    "You can view your bookings from your account area. If you need to make changes, please contact Eagle Gymnastics Academy through the website contact page.",
    `Contact us: ${contactUrl}`,
  ].join("\n");

  const dateRows = input.dates
    .map((item) => {
      return `
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #ece3f4;">
            <strong>${escapeHtml(item.label)}</strong><br />
            <span style="color: #5f5268;">${escapeHtml(formatTimeRange(item.startTime, item.endTime))}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1a25;">
      <div style="border-radius: 20px; overflow: hidden; border: 1px solid #e6dcf0;">
        <div style="background: linear-gradient(135deg, #6f3bc9, #6c35c3 48%, #5f2eb6); color: #ffffff; padding: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase;">Eagle Gymnastics Academy</p>
          <h1 style="margin: 0; font-size: 24px;">Summer camp booking confirmed</h1>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px;">Hello ${escapeHtml(input.accountName || "there")},</p>
          <p style="margin: 0 0 20px;">Your summer camp booking has been confirmed. Here are your booking details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Child</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(childName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Camp</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(input.campTitle)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Amount paid</td>
              <td style="padding: 8px 0; text-align: right;">${escapeHtml(formattedTotal)}</td>
            </tr>
          </table>
          <h2 style="margin: 0 0 8px; font-size: 18px; color: #6c35c3;">Booked days</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${dateRows}
          </table>
          <div style="margin-bottom: 20px; border-radius: 16px; border: 1px solid #ece3f4; background: #fbf8fd; padding: 16px;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #2a0c4f;">Important reminders</p>
            <p style="margin: 0 0 4px;">Summer camp runs from 10am to 3pm each day.</p>
            <p style="margin: 0;">Please bring a packed lunch and drinks each day.</p>
          </div>
          <p style="margin: 0;">You can view your bookings from your account area. If you need to make changes, please contact Eagle Gymnastics Academy through the website contact page.</p>
          ${buildContactButtonHtml(contactUrl)}
        </div>
      </div>
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
