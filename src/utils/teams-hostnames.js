const SUPPORTED_TEAMS_HOSTNAMES = new Set([
  "teams.microsoft.com",
  "teams.cloud.microsoft",
]);

export function isSupportedTeamsHostname(hostname) {
  return SUPPORTED_TEAMS_HOSTNAMES.has(String(hostname).toLowerCase());
}
