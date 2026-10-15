const MAX_HEALTH = 3;

const scenes = {
  gate: {
    title: "The Temple Gate",
    text: [
      "After three days beneath the jungle canopy, you find the temple at last. Roots coil around its stone gate, and the map in your hand ends at two dark entrances.",
      "Somewhere inside waits the Sunken Crown, lost with the temple's last king."
    ],
    choices: [
      {
        label: "Climb the vine-covered stairway",
        next: "hall",
        result: "The vines hold. You enter above the flooded foundations, your lantern steady."
      },
      {
        label: "Wade into the flooded passage",
        next: "hall",
        damage: 1,
        item: "Moonstone",
        result: "Cold water closes over your boots. Beneath the surface, your hand closes around a pale Moonstone."
      }
    ]
  },
  hall: {
    title: "The Hall of Listening Eyes",
    text: [
      "Carved faces watch from every pillar. At the far end, a golden door waits beneath a mural of a queen holding the Sunken Crown.",
      "A floor of black stone stretches between you and the mural."
    ],
    choices: [
      {
        label: "Study the mural before moving on",
        next: "chamber",
        item: "Sun Key",
        clue: true,
        result: "The mural reveals a hidden compartment. Inside rests the Sun Key, warm despite the damp air."
      },
      {
        label: "Cross the black stone floor quickly",
        next: "chamber",
        damage: 1,
        result: "A stone tooth drops from the ceiling. You reach the far side, but your shoulder burns."
      },
      {
        label: "Hold the Moonstone toward the carved faces",
        next: "chamber",
        requires: "Moonstone",
        clue: true,
        result: "The Moonstone catches a hidden beam. The faces turn aside, revealing a safe path and an ancient warning."
      }
    ]
  },
  chamber: {
    title: "The Sealed Chamber",
    text: [
      "The treasure door rises higher than a house. Gold letters run across it: Only a keeper may wake what sleeps below.",
      "Behind you, the temple groans as if it has finally noticed your presence."
    ],
    choices: [
      {
        label: "Unlock the door with the Sun Key",
        next: "altar",
        requires: "Sun Key",
        result: "The key turns with a sound like distant thunder. The door opens without resistance."
      },
      {
        label: "Search for a hidden route with the Moonstone",
        next: "altar",
        requires: "Moonstone",
        result: "The Moonstone glows against the wall. A narrow moon-door opens into the treasure chamber."
      },
      {
        label: "Force the sealed door",
        next: "altar",
        damage: 1,
        result: "You throw your weight against the stone. It yields, but a crack races through the ceiling behind you."
      }
    ]
  },
  altar: {
    title: "The Crown of Dawn",
    text: [
      "The Sunken Crown rests on an altar of roots and gold. Its jewels hold the color of sunrise, and the whole chamber seems to breathe around it.",
      "The map's final note returns to you: A treasure is only lost when its story is forgotten."
    ],
    choices: [
      {
        label: "Return the Crown to the altar",
        ending: "guardian",
        requires: "Sun Key"
      },
      {
        label: "Take the Crown and run for the jungle",
        ending: "treasure"
      },
      {
        label: "Leave the Crown and carry the story home",
        ending: "storyteller",
        requiresClue: true
      }
    ]
  }
};

const endings = {
  guardian: {
    title: "The Temple Remembers",
    text: "You place the Sunken Crown back into the altar. Dawn pours through the ceiling, and the temple's roots loosen their grip. You leave with no gold, but with the feeling that you have returned something priceless."
  },
  treasure: {
    title: "A Crown and a Chance",
    text: "You seize the Crown and sprint through the collapsing halls. The jungle swallows the temple behind you. The treasure is yours, but every night you dream of the eyes carved into the pillars."
  },
  storyteller: {
    title: "The Story Lives",
    text: "You leave the Crown untouched and carry the temple's warning back to the world. Years later, explorers come to protect the ruins instead of plundering them. Its story survives because you chose not to own it."
  },
  wounded: {
    title: "The Jungle Takes Its Price",
    text: "You escape with the Crown, but only barely. The treasure buys medicine and shelter, while the temple becomes a fevered memory you cannot quite leave behind."
  },
  lost: {
    title: "The Forgotten Temple",
    text: "Your strength gives out in the dark. The temple settles around you, quiet as a sealed book. Somewhere beneath the roots, the Crown waits for another story."
  }
};

const gameState = {
  scene: "gate",
  health: MAX_HEALTH,
  inventory: ["Temple Map"],
  hasClue: false,
  ended: false
};

const sceneTitle = document.querySelector("#scene-title");
const storyText = document.querySelector("#story-text");
const choiceList = document.querySelector("#choice-list");
const healthDisplay = document.querySelector("#health-display");
const healthNote = document.querySelector("#health-note");
const inventoryList = document.querySelector("#inventory-list");
const restartButton = document.querySelector("#restart-button");

function resetGame() {
  gameState.scene = "gate";
  gameState.health = MAX_HEALTH;
  gameState.inventory = ["Temple Map"];
  gameState.hasClue = false;
  gameState.ended = false;
  renderGame();
}

function renderGame() {
  renderStatus();

  if (gameState.ended) {
    return;
  }

  const scene = scenes[gameState.scene];
  sceneTitle.textContent = scene.title;
  storyText.replaceChildren(...scene.text.map((paragraph) => createParagraph(paragraph)));
  choiceList.replaceChildren(...scene.choices
    .filter((choice) => isChoiceAvailable(choice))
    .map((choice, index) => createChoiceButton(choice, index)));
}

function renderStatus() {
  healthDisplay.replaceChildren(...Array.from({ length: MAX_HEALTH }, (_, index) => {
    const heart = document.createElement("span");
    heart.className = `heart${index >= gameState.health ? " empty" : ""}`;
    heart.textContent = "♥";
    heart.setAttribute("aria-hidden", "true");
    return heart;
  }));
  healthDisplay.setAttribute("aria-label", `Health: ${gameState.health} out of ${MAX_HEALTH}`);
  healthNote.textContent = getHealthNote();

  inventoryList.replaceChildren(...gameState.inventory.map((item) => {
    const listItem = document.createElement("li");
    listItem.className = "inventory-item";
    listItem.textContent = item;
    return listItem;
  }));
}

function createParagraph(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}

function createChoiceButton(choice, index) {
  const button = document.createElement("button");
  button.className = "choice-button";
  button.type = "button";

  const number = document.createElement("span");
  number.className = "choice-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const label = document.createElement("span");
  label.textContent = choice.label;

  button.append(number, label);
  button.addEventListener("click", () => chooseAction(choice));
  return button;
}

function isChoiceAvailable(choice) {
  const hasRequiredItem = !choice.requires || gameState.inventory.includes(choice.requires);
  const hasRequiredClue = !choice.requiresClue || gameState.hasClue;
  return hasRequiredItem && hasRequiredClue;
}

function chooseAction(choice) {
  if (gameState.ended) {
    return;
  }

  if (choice.damage) {
    changeHealth(-choice.damage);
  }

  if (choice.item) {
    addItem(choice.item);
  }

  if (choice.clue) {
    gameState.hasClue = true;
  }

  if (gameState.health <= 0) {
    finishGame("lost");
    return;
  }

  if (choice.ending) {
    const ending = choice.ending === "treasure" && gameState.health === 1 ? "wounded" : choice.ending;
    finishGame(ending);
    return;
  }

  gameState.scene = choice.next;
  renderGame();
  showResult(choice.result);
}

function addItem(item) {
  if (!gameState.inventory.includes(item)) {
    gameState.inventory.push(item);
  }
}

function changeHealth(amount) {
  gameState.health = Math.max(0, Math.min(MAX_HEALTH, gameState.health + amount));
}

function finishGame(endingName) {
  const ending = endings[endingName];
  gameState.ended = true;
  renderStatus();
  sceneTitle.textContent = ending.title;
  storyText.replaceChildren(createParagraph(ending.text));
  choiceList.replaceChildren();
  healthNote.textContent = "The expedition is complete.";
}

function showResult(result) {
  if (!result) {
    return;
  }

  const resultParagraph = document.createElement("p");
  resultParagraph.className = "result-note";
  resultParagraph.textContent = result;
  storyText.prepend(resultParagraph);
}

function getHealthNote() {
  if (gameState.health === 1) {
    return "One breath remains.";
  }
  if (gameState.health === MAX_HEALTH) {
    return "The temple is watching.";
  }
  return "The way back is growing dangerous.";
}

restartButton.addEventListener("click", resetGame);
renderGame();