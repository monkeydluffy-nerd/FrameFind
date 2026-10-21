const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const topicChips = document.querySelectorAll(".topic-chip");

form.addEventListener("submit", event => {
  event.preventDefault();
});

topicChips.forEach(chip => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.textContent.trim();
    searchInput.focus();
  });
});
