import { NextRequest, NextResponse } from "next/server";

const UK_POSTCODE_PATTERN =
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

type PostcodesIoResponse = {
  status?: number;
  result?: {
    postcode?: string;
    admin_district?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode")?.trim() ?? "";
  if (!UK_POSTCODE_PATTERN.test(postcode)) {
    return NextResponse.json(
      { error: "Enter a valid UK postcode." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      {
        headers: { accept: "application/json" },
        cache: "no-store",
      }
    );
    const data = (await response.json().catch(() => null)) as
      | PostcodesIoResponse
      | null;

    if (!response.ok || !data?.result?.postcode) {
      return NextResponse.json(
        { error: "We couldn't find that postcode. Check it and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      postcode: data.result.postcode,
      area: data.result.admin_district ?? data.result.region ?? null,
      country: data.result.country ?? null,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Postcode lookup is temporarily unavailable. You can still enter your address manually.",
      },
      { status: 503 }
    );
  }
}
