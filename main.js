var navButton = document.getElementById("navButton");
var navDropdown = document.getElementById("navDropdown");
var page = document.body.dataset.page;
var gamesApi = "https://www.freetogame.com/api/games";
var detailsApi = "https://www.freetogame.com/api/game?id=";

var allGames = [];
var currentPage = 1;
var gamesPerPage = 24;

if (navButton) {
  navButton.addEventListener("click", function () {
    if (navDropdown.className.indexOf("off") === -1) {
      navDropdown.className = navDropdown.className + " off";
    } else {
      navDropdown.className = navDropdown.className.replace("off", "").trim();
    }
  });
}

function getFavourites() {
  var data = localStorage.getItem("favouriteGames");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveFavourites(games) {
  localStorage.setItem("favouriteGames", JSON.stringify(games));
}

function isFavourite(id) {
  var favourites = getFavourites();
  for (var i = 0; i < favourites.length; i++) {
    if (favourites[i].id === id) {
      return true;
    }
  }
  return false;
}

function makeSmallGame(game) {
  return {
    id: game.id,
    title: game.title,
    thumbnail: game.thumbnail,
    genre: game.genre,
    platform: game.platform,
    short_description: game.short_description,
  };
}

function toggleFavourite(game) {
  var favourites = getFavourites();
  var alreadySaved = isFavourite(game.id);

  if (alreadySaved) {
    var newFavourites = [];
    for (var i = 0; i < favourites.length; i++) {
      if (favourites[i].id !== game.id) {
        newFavourites.push(favourites[i]);
      }
    }
    saveFavourites(newFavourites);
    return false;
  }

  favourites.push(makeSmallGame(game));
  saveFavourites(favourites);
  return true;
}

function updateSaveButton(button, game) {
  var notSavedIcon = button.querySelector(".notSavedIcon");
  var savedIcon = button.querySelector(".savedIcon");

  if (isFavourite(game.id)) {
    notSavedIcon.style.display = "none";
    savedIcon.style.display = "block";
  } else {
    notSavedIcon.style.display = "block";
    savedIcon.style.display = "none";
  }
}

function createGameCard(game, removeMode) {
  var template = document.getElementById("gameCardTemplate");
  if (!template) {
    return document.createElement("div");
  }

  var card = template.content.cloneNode(true);
  var gameCard = card.querySelector(".gameCard");
  var image = card.querySelector(".gameImg");
  var title = card.querySelector(".gameTitle");
  var genre = card.querySelector(".gameGenre");
  var text = card.querySelector(".gameText");
  var saveButton = card.querySelector(".saveButton");

  image.src = game.thumbnail;
  image.alt = game.title + " cover";
  title.textContent = game.title;
  genre.textContent = game.genre + " / " + game.platform;
  text.textContent = game.short_description;

  updateSaveButton(saveButton, game);

  gameCard.addEventListener("click", function () {
    window.location.href = "./details.html?id=" + game.id;
  });

  saveButton.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleFavourite(game);
    if (removeMode) {
      loadFavouritesPage();
    } else {
      updateSaveButton(saveButton, game);
    }
  });

  return card;
}

function showGameCards(games, boxId, removeMode) {
  var box = document.getElementById(boxId);
  if (!box) {
    return;
  }

  box.innerHTML = "";
  if (games.length === 0) {
    box.innerHTML = "<p>No games found.</p>";
    return;
  }

  for (var i = 0; i < games.length; i++) {
    var card = createGameCard(games[i], removeMode);
    box.appendChild(card);
  }
}

function getGames() {
  return fetch(gamesApi).then(function (response) {
    return response.json();
  });
}

function createFeaturedGame(featured) {
  var template = document.getElementById("featuredGameTemplate");
  if (!template) {
    return document.createElement("div");
  }

  var featuredCard = template.content.cloneNode(true);
  var image = featuredCard.querySelector(".featuredImg");
  var title = featuredCard.querySelector(".featuredTitle");
  var genre = featuredCard.querySelector(".featuredGenre");
  var text = featuredCard.querySelector(".featuredShortText");
  var saveButton = featuredCard.querySelector(".saveButton");

  image.src = featured.thumbnail;
  image.alt = featured.title + " cover";
  title.textContent = featured.title;
  genre.textContent = featured.genre + " / " + featured.platform;
  text.textContent = featured.short_description;

  updateSaveButton(saveButton, featured);

  saveButton.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleFavourite(featured);
    updateSaveButton(saveButton, featured);
  });

  return featuredCard;
}

function loadHomePage() {
  var featuredGame = document.getElementById("featuredGame");
  if (!featuredGame) {
    return;
  }

  getGames()
    .then(function (games) {
      if (!games || games.length === 0) {
        featuredGame.innerHTML = "<p>Could not load games.</p>";
        return;
      }

      var featured = games[0];
      featuredGame.innerHTML = "";
      featuredGame.appendChild(createFeaturedGame(featured));
      featuredGame.style.cursor = "pointer";

      featuredGame.addEventListener("click", function () {
        window.location.href = "./details.html?id=" + featured.id;
      });

      showGameCards(games.slice(1, 7), "homeGames", false);
    })
    .catch(function () {
      featuredGame.innerHTML = "<p>Could not load games.</p>";
    });
}

function loadGamesPage() {
  var searchInput = document.getElementById("searchInput");
  var platformSelect = document.getElementById("platformSelect");
  var categorySelect = document.getElementById("categorySelect");
  var resultText = document.getElementById("resultText");

  if (!searchInput || !platformSelect || !categorySelect || !resultText) {
    return;
  }

  getGames()
    .then(function (games) {
      allGames = games;
      showFilteredGames();
    })
    .catch(function () {
      resultText.textContent = "Could not load games.";
    });

  searchInput.addEventListener("input", showFilteredGames);
  platformSelect.addEventListener("change", showFilteredGames);
  categorySelect.addEventListener("change", showFilteredGames);
}

function renderPagination(totalPages) {
  var pagination = document.getElementById("paginationControls");
  if (!pagination) {
    return;
  }

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  var html = "";
  html += '<button id="prevPage">Previous</button>';
  html += '<span class="pageInfo">Page ' + currentPage + ' of ' + totalPages + '</span>';
  html += '<button id="nextPage">Next</button>';
  pagination.innerHTML = html;

  var prevButton = document.getElementById("prevPage");
  var nextButton = document.getElementById("nextPage");

  if (currentPage <= 1) {
    prevButton.disabled = true;
  }
  if (currentPage >= totalPages) {
    nextButton.disabled = true;
  }

  prevButton.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage = currentPage - 1;
      showFilteredGames(false);
    }
  });

  nextButton.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage = currentPage + 1;
      showFilteredGames(false);
    }
  });
}

function showFilteredGames(resetPage) {
  if (resetPage !== false) {
    currentPage = 1;
  }

  var searchInput = document.getElementById("searchInput");
  var platformSelect = document.getElementById("platformSelect");
  var categorySelect = document.getElementById("categorySelect");
  var resultText = document.getElementById("resultText");

  if (!searchInput || !platformSelect || !categorySelect || !resultText) {
    return;
  }

  var searchText = searchInput.value.toLowerCase();
  var platform = platformSelect.value;
  var category = categorySelect.value;
  var filteredGames = [];

  for (var i = 0; i < allGames.length; i++) {
    var game = allGames[i];
    var sameTitle = game.title.toLowerCase().indexOf(searchText) !== -1;
    var samePlatform = true;
    var sameCategory = true;

    if (platform !== "all") {
      samePlatform = game.platform.toLowerCase().indexOf(platform) !== -1;
    }

    if (category !== "all") {
      sameCategory = game.genre.toLowerCase().indexOf(category) !== -1;
    }

    if (sameTitle && samePlatform && sameCategory) {
      filteredGames.push(game);
    }
  }

  resultText.textContent = filteredGames.length + " games found";
  var totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  if (totalPages === 0) {
    totalPages = 1;
  }
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  var startIndex = (currentPage - 1) * gamesPerPage;
  var endIndex = startIndex + gamesPerPage;
  var gamesToShow = [];
  for (var j = startIndex; j < filteredGames.length && j < endIndex; j++) {
    gamesToShow.push(filteredGames[j]);
  }

  showGameCards(gamesToShow, "gamesGrid", false);
  renderPagination(totalPages);
}

function getSearchId() {
  var search = window.location.search;
  if (search.indexOf("id=") === -1) {
    return null;
  }

  var parts = search.split("id=");
  if (parts.length < 2) {
    return null;
  }

  return parts[1];
}

function createDetailsPage(game) {
  var template = document.getElementById("detailsPageTemplate");
  if (!template) {
    return document.createElement("div");
  }

  var detailsCard = template.content.cloneNode(true);
  var image = detailsCard.querySelector(".detailsImg");
  var title = detailsCard.querySelector(".detailsTitle");
  var description = detailsCard.querySelector(".detailsText");
  var genre = detailsCard.querySelector(".detailsGenre");
  var platform = detailsCard.querySelector(".detailsPlatform");
  var publisher = detailsCard.querySelector(".detailsPublisher");
  var release = detailsCard.querySelector(".detailsRelease");
  var playButton = detailsCard.querySelector(".detailsPlayButton");
  var saveButton = detailsCard.querySelector(".saveButton");

  image.src = game.thumbnail;
  image.alt = game.title + " cover";
  title.textContent = game.title;
  description.textContent = game.description;
  genre.textContent = "Genre: " + game.genre;
  platform.textContent = "Platform: " + game.platform;
  publisher.textContent = "Publisher: " + game.publisher;
  release.textContent = "Release date: " + game.release_date;
  playButton.href = game.game_url;

  updateSaveButton(saveButton, game);

  saveButton.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleFavourite(game);
    updateSaveButton(saveButton, game);
  });

  return detailsCard;
}

function loadDetailsPage() {
  var detailsPage = document.getElementById("detailsPage");
  if (!detailsPage) {
    return;
  }

  var id = getSearchId();
  if (!id) {
    detailsPage.innerHTML = "<p>No game selected.</p>";
    return;
  }

  fetch(detailsApi + id)
    .then(function (response) {
      return response.json();
    })
    .then(function (game) {
      document.title = game.title + " - FreePlay";
      detailsPage.innerHTML = "";
      detailsPage.appendChild(createDetailsPage(game));
    })
    .catch(function () {
      detailsPage.innerHTML = "<p>Could not load this game.</p>";
    });
}

function loadFavouritesPage() {
  var favourites = getFavourites();
  showGameCards(favourites, "favouritesGrid", true);
}

function getSuggestions() {
  var data = localStorage.getItem("gameSuggestions");
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

function saveSuggestions(suggestions) {
  localStorage.setItem("gameSuggestions", JSON.stringify(suggestions));
}

function showSuggestions() {
  var suggestionsList = document.getElementById("suggestionsList");
  if (!suggestionsList) {
    return;
  }

  var suggestions = getSuggestions();
  suggestionsList.innerHTML = "";

  if (suggestions.length === 0) {
    suggestionsList.innerHTML = "<p>No suggestions yet.</p>";
    return;
  }

  for (var i = 0; i < suggestions.length; i++) {
    var item = suggestions[i];
    var div = document.createElement("div");
    var title = document.createElement("h3");
    var text = document.createElement("p");

    div.className = "suggestionItem";
    title.textContent = item.gameName;
    text.textContent = item.name + " suggested this game. " + item.message;

    div.appendChild(title);
    div.appendChild(text);
    suggestionsList.appendChild(div);
  }
}

function loadContactPage() {
  var form = document.getElementById("contactForm");
  if (!form) {
    return;
  }

  var name = document.getElementById("name");
  var email = document.getElementById("email");
  var gameName = document.getElementById("gameName");
  var message = document.getElementById("message");
  var successText = document.getElementById("successText");

  showSuggestions();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    document.getElementById("nameError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("gameError").textContent = "";
    document.getElementById("messageError").textContent = "";
    successText.textContent = "";

    var isValid = true;

    if (!name || name.value.trim().length < 2) {
      document.getElementById("nameError").textContent = "Name is too short.";
      isValid = false;
    }

    if (!email || email.value.indexOf("@") === -1 || email.value.indexOf(".") === -1) {
      document.getElementById("emailError").textContent = "Email is not valid.";
      isValid = false;
    }

    if (!gameName || gameName.value.trim().length < 2) {
      document.getElementById("gameError").textContent = "Game name is too short.";
      isValid = false;
    }

    if (!message || message.value.trim().length < 10) {
      document.getElementById("messageError").textContent = "Message is too short.";
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    var suggestions = getSuggestions();
    suggestions.push({
      name: name.value,
      email: email.value,
      gameName: gameName.value,
      message: message.value,
    });

    saveSuggestions(suggestions);
    form.reset();
    successText.textContent = "Suggestion saved!";
    showSuggestions();
  });
}

if (page === "home") {
  loadHomePage();
}

if (page === "games") {
  loadGamesPage();
}

if (page === "details") {
  loadDetailsPage();
}

if (page === "favourites") {
  loadFavouritesPage();
  var clearButton = document.getElementById("clearFavourites");
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      saveFavourites([]);
      loadFavouritesPage();
    });
  }
}

if (page === "contact") {
  loadContactPage();
}
