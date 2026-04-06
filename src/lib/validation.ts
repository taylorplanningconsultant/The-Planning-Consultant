export function isValidUKPostcode(postcode: string): boolean {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  const regex = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/
  return regex.test(clean)
}

export function normalisePostcode(postcode: string): string {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  return clean.slice(0, -3) + ' ' + clean.slice(-3)
}

export function sanitiseText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>{}]/g, '')
    .trim()
    .slice(0, 2000)
}
