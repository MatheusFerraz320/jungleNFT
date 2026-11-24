/**
 * Realtime payloads carry a monotonic version. Equal versions are duplicates;
 * lower versions are stale and must never roll the cache back.
 */
export function shouldAcceptIncomingVersion(
  currentVersion: number | undefined,
  incomingVersion: number,
) {
  return currentVersion === undefined || incomingVersion > currentVersion;
}
