import { extractEntityFromURL } from "../entity";

// --- Configuration ---
const harmonyIconUrl = "https://harmony.pulsewidth.org.uk/favicon.svg";
const harmonyBaseUrl =
  "https://harmony.pulsewidth.org.uk/release/actions?release_mbid=";
const iconSize = "1.5em"; // Keep your desired size
const iconMarginRight = "5px";
const releaseTableSelector = "table.tbl.mergeable-table tbody";
// --- End Configuration ---

/**
 * Creates the Harmony link anchor (<a>) element with the icon (<img>).
 * @param {string} mbid - The MusicBrainz Release MBID.
 * @returns {HTMLAnchorElement|null} The created anchor element or null if mbid is invalid.
 */
function createHarmonyLinkElement(mbid) {
  if (!mbid || typeof mbid !== "string" || !/^[a-f0-9\-]{36}$/.test(mbid)) {
    console.warn(
      "Harmony Link Script: Invalid MBID passed to createHarmonyLinkElement:",
      mbid
    );
    return null;
  }

  const harmonyLink = document.createElement("a");
  harmonyLink.href = `${harmonyBaseUrl}${mbid}`;
  harmonyLink.target = "_blank"; // Open in new tab
  harmonyLink.rel = "noopener noreferrer"; // Security best practice for target="_blank"
  harmonyLink.title = `View Harmony Actions for ${mbid} (opens in new tab)`;
  harmonyLink.style.marginRight = iconMarginRight; // Add space after the icon link
  harmonyLink.style.textDecoration = "none"; // Avoid underline on the icon link itself
  harmonyLink.classList.add("harmony-release-link-icon"); // Add class for potential future styling/selection

  const harmonyIcon = document.createElement("img");
  harmonyIcon.src = harmonyIconUrl;
  harmonyIcon.alt = "Harmony Logo";
  harmonyIcon.style.height = iconSize;
  harmonyIcon.style.width = iconSize; // Assuming square icon, keep aspect ratio
  harmonyIcon.style.verticalAlign = "middle"; // Align vertically with text/icons
  harmonyIcon.style.border = "none"; // Ensure no border is added by browser/CSS

  harmonyLink.appendChild(harmonyIcon);
  return harmonyLink;
}

/**
 * Processes a table containing release links, adding Harmony icons.
 * @param {string} tableBodySelector - CSS selector for the table body (tbody).
 */
function processReleaseTable(tableBodySelector) {
  const releaseTableBody = document.querySelector(tableBodySelector);
  if (!releaseTableBody) {
    console.error(
      `Harmony Link Script: Could not find release table body using selector: "${tableBodySelector}".`
    );
    return;
  }

  // Select BDI elements within release links in the second column
  const releaseTitleBDIElements = releaseTableBody.querySelectorAll(
    'tr:not(.subh) > td:nth-of-type(2) a[href*="/release/"] > bdi'
  );
  let addedCount = 0;

  releaseTitleBDIElements.forEach((bdiElement) => {
    const releaseLink = bdiElement.parentElement; // The <a> tag containing the BDI
    if (!releaseLink || releaseLink.tagName !== "A") return;

    const linkEntity = extractEntityFromURL(releaseLink.href);

    if (linkEntity && linkEntity.type === "release" && linkEntity.mbid) {
      const mbid = linkEntity.mbid;
      const harmonyLink = createHarmonyLinkElement(mbid);
      const parentTd = releaseLink.closest("td"); // The containing cell (TD)

      if (harmonyLink && parentTd) {
        let nodeToInsertBefore = releaseLink; // Start with the link itself

        // Traverse up the DOM tree from the release link
        // until we find the element that is a DIRECT child of the TD.
        // This handles cases where the link is wrapped in other elements (like span.mp).
        while (nodeToInsertBefore.parentElement !== parentTd) {
          nodeToInsertBefore = nodeToInsertBefore.parentElement;
          // Safety check: If we somehow traverse outside the TD, stop.
          if (
            !nodeToInsertBefore ||
            nodeToInsertBefore === parentTd ||
            nodeToInsertBefore === document.body
          ) {
            console.error(
              "Harmony Link Script: Could not find the correct insertion point within the TD for link:",
              releaseLink.href
            );
            nodeToInsertBefore = null; // Prevent insertion if logic fails
            break;
          }
        }

        // Only insert if we successfully found the correct reference node
        if (nodeToInsertBefore) {
          try {
            parentTd.insertBefore(harmonyLink, nodeToInsertBefore);
            addedCount++;
            // console.log(`Harmony link added for release in table: ${mbid}`);
          } catch (e) {
            console.error(
              "Harmony Link Script: Error during insertBefore:",
              e,
              {
                parent: parentTd,
                newChild: harmonyLink,
                referenceChild: nodeToInsertBefore,
              }
            );
          }
        }
      }
    } else {
      console.warn(
        "Harmony Link Script: Could not extract valid release MBID from link in table row:",
        releaseLink.href
      );
    }
  });

  if (releaseTitleBDIElements.length === 0) {
    console.log(
      `Harmony Link Script: No release title links (with BDI) found in the table: "${tableBodySelector}".`
    );
  } else {
    // Only log if some links were actually processed
    if (addedCount > 0) {
      console.log(
        `Harmony Link Script: Added ${addedCount} Harmony icons to table: "${tableBodySelector}".`
      );
    }
  }
}

/**
 * Main function to execute the script logic.
 */
function runHarmonyLinker() {
  const currentPath = window.location.pathname;
  const currentEntity = extractEntityFromURL(window.location.href);

  // Clearer console log for which page type is being processed
  console.log(
    `Harmony Link Script: Running on ${
      currentEntity ? currentEntity.type : "unknown"
    } page. Path: ${currentPath}`
  );

  // 1. Handle Single Release Page
  if (currentEntity && currentEntity.type === "release") {
    const mbid = currentEntity.mbid;
    const headingElement = document.querySelector("div.releaseheader h1");
    const releaseTitleLink = headingElement
      ? headingElement.querySelector('a[href*="/release/"] > bdi')
          ?.parentElement
      : null;

    if (headingElement && releaseTitleLink) {
      const harmonyLink = createHarmonyLinkElement(mbid);
      if (harmonyLink) {
        try {
          headingElement.insertBefore(harmonyLink, releaseTitleLink);
          console.log(`Harmony link added for Release page: ${mbid}`);
        } catch (e) {
          console.error("Harmony Link Script: Error inserting into H1:", e, {
            parent: headingElement,
            newChild: harmonyLink,
            referenceChild: releaseTitleLink,
          });
        }
      }
    } else {
      console.warn(
        // Changed to warn as it might not be a critical error if structure varies
        "Harmony Link Script: Could not find H1 title link structure on release page."
      );
    }
  }

  // 2. Handle Release Group Page
  else if (currentEntity && currentEntity.type === "release-group") {
    processReleaseTable(releaseTableSelector);
  }

  // 3. Handle Artist Releases Page
  else if (
    currentEntity &&
    currentEntity.type === "artist" &&
    currentPath.includes("/releases")
  ) {
    processReleaseTable(releaseTableSelector);
  }
  // else { // Keep this commented unless debugging other page types
  //   if (currentEntity) {
  //     console.log(
  //       `Harmony Link Script: Not a target page (Type: ${currentEntity.type}, Path: ${currentPath}).`
  //     );
  //   } else {
  //     console.log(
  //       `Harmony Link Script: Could not determine entity type from URL: ${window.location.href}`
  //     );
  //   }
  // }
}

// --- Execution ---
// Delay slightly using setTimeout to ensure the page DOM is fully settled, especially if other scripts run
// This can sometimes help with race conditions on complex pages. 0ms is often enough.
setTimeout(runHarmonyLinker, 0);
