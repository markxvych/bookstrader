export function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function isImageUrl(value: string) {
  const url = /^https?:\/\/\S+$/i.test(value) ? URL.parse(value) : null;
  return Boolean(
    url &&
    ["http:", "https:"].includes(url.protocol) &&
    !url.username &&
    !url.password,
  );
}

export function isUuid(value: string) {
  return /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);
}

export function pageNumber(value?: string | string[]) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 2147483647
    ? page
    : 1;
}
