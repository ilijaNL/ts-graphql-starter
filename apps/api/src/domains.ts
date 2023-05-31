export async function domainIsAllowed(url: string) {
  const { hostname } = new URL(url);
  const allowedHostnames = ['localhost'];

  return allowedHostnames.some((d) => hostname.endsWith(d));
}
