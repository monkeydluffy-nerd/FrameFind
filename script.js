const emptyState = document.getElementById("empty-state");
const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const topicChips = document.querySelectorAll(".topic-chip");
const results = document.querySelector("#results.results-grid");
const resultCount = document.getElementById("result-count");
const emptyIndex = emptyState.querySelector(".empty-index");
const emptyHeading = emptyState.querySelector("h3");
const emptyDescription = emptyState.querySelector(".empty-description");
const initialEmptyState = {
  index: emptyIndex.textContent,
  heading: emptyHeading.innerHTML,
  description: emptyDescription.textContent,
};

function setEmptyState(index, heading, description) {
  emptyIndex.textContent = index;
  emptyHeading.textContent = heading;
  emptyDescription.textContent = description;
}

function resetEmptyState() {
  emptyIndex.textContent = initialEmptyState.index;
  emptyHeading.innerHTML = initialEmptyState.heading;
  emptyDescription.textContent = initialEmptyState.description;
}

async function searchImages(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    results.innerHTML = "";
    emptyState.hidden = false;
    resetEmptyState();
    resultCount.textContent = "Enter a search term to find images.";
    return;
  }

  results.innerHTML = "";
  emptyState.hidden = true;
  resultCount.textContent = `Searching for "${trimmedQuery}"...`;
  results.setAttribute("aria-busy", "true");

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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const items = Object.values(data.query?.pages || {});

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

    if (renderedCount === 0) {
      setEmptyState(
        "NO IMAGES FOUND",
        "No frames found.",
        "Try a different search to discover more images."
      );
      resultCount.textContent = `No images found for "${trimmedQuery}".`;
    } else {
      resultCount.textContent =
        `Showing ${renderedCount} results for "${trimmedQuery}"`;
    }
  } catch (error) {
    console.error("Image search failed:", error);
    results.innerHTML = "";
    emptyState.hidden = false;
    setEmptyState(
      "SOMETHING WENT WRONG",
      "We couldn't load images.",
      "Please check your connection and try again."
    );
    resultCount.textContent = "Unable to fetch images. Please try again.";
  } finally {
    results.setAttribute("aria-busy", "false");
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
