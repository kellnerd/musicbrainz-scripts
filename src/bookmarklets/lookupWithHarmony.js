/**
 * - Opens [Harmony](https://harmony.pulsewidth.org.uk) and performs a release lookup for the currently visited URL.
 */

open(`https://harmony.pulsewidth.org.uk/release?url=${encodeURIComponent(location)}&category=preferred`);
