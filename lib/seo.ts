const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.APP_URL?.trim() ||
  "https://www.eaglegymnasticsacademy.co.uk";

function normalizeSiteUrl(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.endsWith("/") ? withScheme.slice(0, -1) : withScheme;
}

export const siteUrl = normalizeSiteUrl(rawSiteUrl);

export const siteName = "Eagle Gymnastics Academy";
export const defaultTitle = "Eagle Gymnastics Academy";
export const defaultDescription =
  "Recreational gymnastics classes, competition training, birthday parties, and summer camps for children in Paisley.";

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return siteUrl;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildTitle(title: string) {
  return `${title} | ${siteName}`;
}
