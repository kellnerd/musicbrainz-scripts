/**
 * - Opens [Harmony](https://harmony.pulsewidth.org.uk) and performs a release lookup for the currently visited URL.
 * - Uses the lookup defaults (preferred providers and region) from your Harmony settings.
 */

open(`https://harmony.pulsewidth.org.uk/release?url=${encodeURIComponent(location)}&category=preferred`);
