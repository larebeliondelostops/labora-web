const dangerousTags = /<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi;
const dangerousAttributes =
  /\s(on\w+|formaction|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const javascriptUrls = /(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

export function sanitizeDraftHtml(html: string) {
  if (!html) {
    return "";
  }

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html
      .replace(dangerousTags, "")
      .replace(dangerousAttributes, "")
      .replace(javascriptUrls, "$1=\"#\"");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  document
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((node) => node.remove());

  document.body.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (
        name.startsWith("on") ||
        name === "formaction" ||
        name === "xlink:href" ||
        ((name === "href" || name === "src") && value.startsWith("javascript:"))
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return document.body.innerHTML;
}
