const emptyState = document.getElementById("empty-state");
const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const topicChips = document.querySelectorAll(".topic-chip");
const results = document.querySelector("#results.results-grid");
const resultCount = document.getElementById("result-count");

async function searchImages(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return;

  const url =
    "https://commons.wikimedia.org/w/api.php?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(trimmedQuery) +
    "&gsrnamespace=6" +
    "&gsrlimit=12" +
    "&prop=imageinfo" +
    "&iiprop=url" +
    "&iiurlwidth=500" +
    "&format=json" +
    "&origin=*";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const items = Object.values(data.query?.pages || {});

    results.innerHTML = "";

    items.forEach((item) => {
      const imageInfo = item.imageinfo?.[0];
      const imageUrl = imageInfo?.thumburl || imageInfo?.url;

      if (typeof imageUrl !== "string" || !imageUrl.trim()) return;

      const card = document.createElement("article");
      card.className = "image-card";

      const image = document.createElement("img");
      image.src = imageUrl.trim();
      image.alt = item.title || "Image result";
      image.loading = "lazy";

      const caption = document.createElement("p");
      caption.textContent = item.title || "Untitled image";

      card.appendChild(image);
      card.appendChild(caption);
      results.appendChild(card);
    });

    const renderedCount = results.querySelectorAll(".image-card").length;
    emptyState.hidden = renderedCount > 0;

    if (resultCount) {
      resultCount.textContent =
        `Showing ${renderedCount} results for "${trimmedQuery}"`;
    }
  } catch (error) {
    console.error("Image search failed:", error);
    if (resultCount) {
      resultCount.textContent = "Unable to fetch images. Please try again.";
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchImages(searchInput.value);
});

topicChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const query = chip.textContent.trim();
    searchInput.value = query;
    searchImages(query);
  });
});
