export function getAuthTokenClient(): string | null {
  const match = document.cookie.match(/(?:^|; )authToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
