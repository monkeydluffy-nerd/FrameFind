  
const API_URL = "https://commons.wikimedia.org/w/api.php";

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const results = document.getElementById("results");
const status = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const topicChips = document.querySelectorAll(".topic-chip");

let currentQuery = "";
let continuation = null;
let totalLoaded = 0;
let requestNumber = 0;
let loadMoreButton = null;

function setStatus(message) {
  status.textContent = message;
}

function showEmptyState(show) {
  emptyState.hidden = !show;
}

function createLoadMoreButton() {
  if (loadMoreButton) return;

  loadMoreButton = document.createElement("button");
  loadMoreButton.type = "button";
  loadMoreButton.className = "load-more-button";
  loadMoreButton.textContent = "Load more images ↗";

  loadMoreButton.addEventListener("click", () => {
    if (currentQuery && continuation) {
      searchImages(currentQuery, true);
    }
  });

  results.insertAdjacentElement("afterend", loadMoreButton);
}

function removeLoadMoreButton() {
  loadMoreButton?.remove();
  loadMoreButton = null;
}

function setLoading(loading) {
  searchButton.disabled = loading;
  searchButton.textContent = loading ? "Searching..." : "Search ↗";

  if (loadMoreButton) {
    loadMoreButton.disabled = loading;
    loadMoreButton.textContent = loading
      ? "Loading..."
      : "Load more images ↗";
  }
}

function createImageCard(image) {
  const card = document.createElement("article");
  card.className = "image-card";

  const link = document.createElement("a");
  link.className = "image-link";
  link.href = image.descriptionurl || image.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `Open source for ${image.title}`);

  const img = document.createElement("img");
  img.src = image.thumburl || image.url;
  img.alt = image.title;
  img.loading = "lazy";
  img.decoding = "async";

  const caption = document.createElement("div");
  caption.className = "image-caption";

  const title = document.createElement("p");
  title.className = "image-title";
  title.textContent = image.title
    .replace(/^File:/, "")
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ");

  const credit = document.createElement("p");
  credit.className = "image-credit";

  const artist = image.extmetadata?.Artist?.value || "";
  const license = image.extmetadata?.LicenseShortName?.value || "";

  // Treat API metadata as text, not trusted HTML.
  const cleanArtist = artist.replace(/<[^>]*>/g, "").trim();
  const cleanLicense = license.replace(/<[^>]*>/g, "").trim();

  credit.textContent = [
    cleanArtist ? `By ${cleanArtist}` : "",
    cleanLicense
  ].filter(Boolean).join(" · ") || "View source and licensing";

  const sourceLink = document.createElement("a");
  sourceLink.className = "source-link";
  sourceLink.href = image.descriptionurl || image.url;
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = "SOURCE ↗";
  sourceLink.setAttribute("aria-label", `View source for ${image.title}`);

  img.addEventListener("error", () => {
    card.remove();
    totalLoaded = results.querySelectorAll(".image-card").length;
    setStatus(`${totalLoaded} images displayed`);
  });

  link.appendChild(img);
  caption.append(title, credit, sourceLink);
  card.append(link, caption);

  return card;
}

async function searchImages(query, append = false) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    searchInput.focus();
    setStatus("Enter a topic to search for images.");
    showEmptyState(true);
    return;
  }

  if (!append) {
    currentQuery = cleanQuery;
    continuation = null;
    totalLoaded = 0;
    results.replaceChildren();
    removeLoadMoreButton();
    showEmptyState(false);
  }

  const thisRequest = ++requestNumber;
  setLoading(true);
  setStatus(append ? "Loading more images..." : "Searching Wikimedia Commons...");

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: cleanQuery,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "600",
    iiextmetadatafilter: "LicenseShortName|Artist",
    format: "json",
    origin: "*"
  });

  if (append && continuation) {
    Object.entries(continuation).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  try {
    const response = await fetch(`${API_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.info || "The image search failed.");
    }

    // Ignore outdated responses if another search started meanwhile.
    if (thisRequest !== requestNumber) return;

    const pages = Object.values(data.query?.pages || {});

    const images = pages
  .map(page => ({
    title: page.title,
    ...page.imageinfo?.[0]
  }))
  .filter(image => image.url);

console.log("API response:", data);
console.log("Images found:", images);

    continuation = data.continue || null;

    if (!append) {
      results.replaceChildren();
    }

    if (images.length) {
      const fragment = document.createDocumentFragment();

      images.forEach(image => {
        fragment.appendChild(createImageCard(image));
      });

      results.appendChild(fragment);
    }

    totalLoaded = results.querySelectorAll(".image-card").length;

    if (totalLoaded === 0) {
      showEmptyState(true);
      setStatus(`No images found for "${cleanQuery}". Try another topic.`);
      removeLoadMoreButton();
      return;
    }

    showEmptyState(false);
    setStatus(`Showing ${totalLoaded} images for "${cleanQuery}"`);

    if (continuation) {
      createLoadMoreButton();
    } else {
      removeLoadMoreButton();
    }
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    console.error("Image search error:", error);

    if (totalLoaded === 0) {
      showEmptyState(true);
      setStatus("Couldn't load images. Check your connection and try again.");
    } else {
      setStatus(`Loaded ${totalLoaded} images. More images couldn't be loaded.`);
    }

    if (continuation) createLoadMoreButton();
  } finally {
    if (thisRequest === requestNumber) {
      setLoading(false);
    }
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  searchImages(searchInput.value);
});

topicChips.forEach(chip => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.textContent.trim();
    searchImages(searchInput.value);
  });
});
