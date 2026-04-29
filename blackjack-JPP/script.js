const STARTING_CHIPS = 100;
const TARGET_CHIPS = 1000;
const DECK_COUNT = 6;
const RESHUFFLE_THRESHOLD = 52;
const BLACKJACK_PAYOUT = 1.5;

const SUITS = [
  { symbol: "♠", color: "black" },
  { symbol: "♥", color: "red" },
  { symbol: "♦", color: "red" },
  { symbol: "♣", color: "black" }
];

const RANKS = [
  { rank: "A", value: 11 },
  { rank: "2", value: 2 },
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 10 },
  { rank: "Q", value: 10 },
  { rank: "K", value: 10 }
];

const state = {
  chips: STARTING_CHIPS,
  target: TARGET_CHIPS,
  shoe: [],
  dealerHand: [],
  playerHand: [],
  currentBet: 0,
  roundNumber: 1,
  roundActive: false,
  roundResolved: false,
  dealerHoleHidden: true,
  gameEnded: false
};

const elements = {
  chipCount: document.getElementById("chip-count"),
  shoeCount: document.getElementById("shoe-count"),
  dealerScore: document.getElementById("dealer-score"),
  playerScore: document.getElementById("player-score"),
  dealerHand: document.getElementById("dealer-hand"),
  playerHand: document.getElementById("player-hand"),
  roundMessage: document.getElementById("round-message"),
  currentBet: document.getElementById("current-bet"),
  roundNumber: document.getElementById("round-number"),
  banner: document.getElementById("game-banner"),
  bannerTitle: document.getElementById("banner-title"),
  bannerText: document.getElementById("banner-text"),
  betForm: document.getElementById("bet-form"),
  betInput: document.getElementById("bet-input"),
  dealButton: document.getElementById("deal-button"),
  hitButton: document.getElementById("hit-button"),
  standButton: document.getElementById("stand-button"),
  newRoundButton: document.getElementById("new-round-button"),
  cardTemplate: document.getElementById("card-template")
};

function createShoe(deckCount) {
  const cards = [];

  for (let deckIndex = 0; deckIndex < deckCount; deckIndex += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          rank: rank.rank,
          suit: suit.symbol,
          color: suit.color,
          value: rank.value
        });
      }
    }
  }

  shuffleInPlace(cards);
  return cards;
}

function shuffleInPlace(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = getSecureRandomInt(index + 1);
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
}

function getSecureRandomInt(maxExclusive) {
  if (!window.crypto || typeof window.crypto.getRandomValues !== "function") {
    throw new Error("Secure random generator is not available in this browser.");
  }

  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer.");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const randomBuffer = new Uint32Array(1);

  let randomValue = 0;
  do {
    window.crypto.getRandomValues(randomBuffer);
    randomValue = randomBuffer[0];
  } while (randomValue >= limit);

  return randomValue % maxExclusive;
}

function drawCard() {
  if (state.shoe.length <= RESHUFFLE_THRESHOLD) {
    state.shoe = createShoe(DECK_COUNT);
    setRoundMessage("The shoe was reshuffled.");
  }

  return state.shoe.pop();
}

function getHandValue(hand) {
  let total = 0;
  let aceCount = 0;

  for (const card of hand) {
    total += card.value;
    if (card.rank === "A") {
      aceCount += 1;
    }
  }

  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount -= 1;
  }

  return total;
}

function isBlackjack(hand) {
  return hand.length === 2 && getHandValue(hand) === 21;
}

function isBust(hand) {
  return getHandValue(hand) > 21;
}

function getVisibleDealerScore() {
  if (!state.dealerHoleHidden) {
    return getHandValue(state.dealerHand);
  }

  if (state.dealerHand.length === 0) {
    return 0;
  }

  return getHandValue([state.dealerHand[0]]);
}

function setRoundMessage(message) {
  elements.roundMessage.textContent = message;
}

function setBanner(title, text, variant = "") {
  elements.banner.classList.remove("banner-win", "banner-loss");
  if (variant) {
    elements.banner.classList.add(variant);
  }
  elements.bannerTitle.textContent = title;
  elements.bannerText.textContent = text;
}

function updateControls() {
  const canStartRound = !state.roundActive && !state.gameEnded && state.chips > 0;

  elements.dealButton.disabled = !canStartRound;
  elements.betInput.disabled = !canStartRound;
  elements.hitButton.disabled = !state.roundActive;
  elements.standButton.disabled = !state.roundActive;
  elements.newRoundButton.disabled = state.roundActive || state.gameEnded || !state.roundResolved;
}

function updateHUD() {
  elements.chipCount.textContent = formatChips(state.chips);
  elements.shoeCount.textContent = String(state.shoe.length);
  elements.currentBet.textContent = formatChips(state.currentBet);
  elements.roundNumber.textContent = String(state.roundNumber);
  elements.playerScore.textContent = String(getHandValue(state.playerHand));
  elements.dealerScore.textContent = String(getVisibleDealerScore());
}

function formatChips(value) {
  return String(Number(value.toFixed(2)));
}

function clearHands() {
  state.dealerHand = [];
  state.playerHand = [];
  state.dealerHoleHidden = true;
  renderHands();
  updateHUD();
}

function renderHands() {
  renderHand(elements.dealerHand, state.dealerHand, true);
  renderHand(elements.playerHand, state.playerHand, false);
}

function renderHand(container, hand, hideSecondCard) {
  container.innerHTML = "";

  hand.forEach((card, index) => {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    const cardElement = fragment.querySelector(".card");
    const rankElement = fragment.querySelector(".card-rank");
    const suitElement = fragment.querySelector(".card-suit");

    const shouldHide = hideSecondCard && state.dealerHoleHidden && index === 1;

    if (shouldHide) {
      cardElement.classList.add("hidden");
    } else {
      rankElement.textContent = card.rank;
      suitElement.textContent = card.suit;
      if (card.color === "red") {
        cardElement.classList.add("red");
      }
    }

    container.appendChild(fragment);
  });
}

function startRound(betAmount) {
  state.currentBet = betAmount;
  state.chips -= betAmount;
  state.roundActive = true;
  state.roundResolved = false;
  state.dealerHoleHidden = true;

  state.playerHand = [drawCard(), drawCard()];
  state.dealerHand = [drawCard(), drawCard()];

  setBanner("Cards on the Table", "Play your hand against the dealer.");
  setRoundMessage("Choose Hit to draw or Stand to hold.");

  renderHands();
  updateHUD();
  updateControls();

  evaluateOpeningHands();
}

function evaluateOpeningHands() {
  const playerHasBlackjack = isBlackjack(state.playerHand);
  const dealerHasBlackjack = isBlackjack(state.dealerHand);

  if (!playerHasBlackjack && !dealerHasBlackjack) {
    return;
  }

  state.dealerHoleHidden = false;
  renderHands();
  updateHUD();

  if (playerHasBlackjack && dealerHasBlackjack) {
    resolveRound("Push. Both hands have blackjack.", "push");
    return;
  }

  if (playerHasBlackjack) {
    resolveRound("Blackjack. You win 3:2.", "blackjack");
    return;
  }

  resolveRound("Dealer blackjack. You lose the round.", "dealer-blackjack");
}

function playerHit() {
  if (!state.roundActive) {
    return;
  }

  state.playerHand.push(drawCard());
  renderHands();
  updateHUD();

  if (isBust(state.playerHand)) {
    state.dealerHoleHidden = false;
    renderHands();
    updateHUD();
    resolveRound("Bust. You went over 21.", "dealer");
    return;
  }

  setRoundMessage("Choose your next move.");
}

function playerStand() {
  if (!state.roundActive) {
    return;
  }

  state.dealerHoleHidden = false;
  renderHands();
  updateHUD();
  dealerTurn();
}

function dealerTurn() {
  while (getHandValue(state.dealerHand) < 17) {
    state.dealerHand.push(drawCard());
  }

  renderHands();
  updateHUD();

  if (isBust(state.dealerHand)) {
    resolveRound("Dealer busts. You win the round.", "player");
    return;
  }

  const playerTotal = getHandValue(state.playerHand);
  const dealerTotal = getHandValue(state.dealerHand);

  if (playerTotal > dealerTotal) {
    resolveRound("You win the round.", "player");
    return;
  }

  if (playerTotal < dealerTotal) {
    resolveRound("Dealer wins the round.", "dealer");
    return;
  }

  resolveRound("Push. Your bet is returned.", "push");
}

function resolveRound(message, outcome) {
  state.roundActive = false;
  state.roundResolved = true;

  if (outcome === "player") {
    state.chips += state.currentBet * 2;
    setBanner("Round Won", "Your stack grows. Keep pushing toward 1000 chips.", "banner-win");
  } else if (outcome === "blackjack") {
    state.chips += state.currentBet + state.currentBet * (1 + BLACKJACK_PAYOUT);
    setBanner("Blackjack", "Natural 21 pays 3:2.", "banner-win");
  } else if (outcome === "push") {
    state.chips += state.currentBet;
    setBanner("Push", "No chips lost. Reset and play the next hand.");
  } else {
    setBanner("Round Lost", "Protect your stack and choose the next bet carefully.", "banner-loss");
  }

  setRoundMessage(message);
  state.currentBet = 0;

  updateHUD();
  updateControls();
  evaluateGameState();
}

function evaluateGameState() {
  if (state.chips >= state.target) {
    state.gameEnded = true;
    setBanner("You Win the Table", "You reached 1000 chips and won the match.", "banner-win");
    setRoundMessage("Victory. Start over by refreshing the page if you want another run.");
    updateControls();
    return;
  }

  if (state.chips <= 0) {
    state.gameEnded = true;
    state.chips = 0;
    setBanner("Game Over", "You ran out of chips.", "banner-loss");
    setRoundMessage("Game over. Refresh the page to try again.");
    updateHUD();
    updateControls();
  }
}

function prepareNextRound() {
  if (state.gameEnded) {
    return;
  }

  state.roundNumber += 1;
  state.currentBet = 0;
  state.roundResolved = false;
  clearHands();
  setRoundMessage("Place your bet to begin the next round.");
  setBanner("Next Hand", "Adjust your bet and deal when ready.");
  updateControls();
}

function parseBetValue() {
  const value = Number.parseInt(elements.betInput.value, 10);

  if (!Number.isInteger(value) || value < 1) {
    return { valid: false, reason: "Enter a whole-number bet of at least 1 chip." };
  }

  if (value > state.chips) {
    return { valid: false, reason: "You cannot bet more chips than you currently have." };
  }

  return { valid: true, value };
}

function handleDealSubmit(event) {
  event.preventDefault();

  if (state.roundActive || state.gameEnded) {
    return;
  }

  const bet = parseBetValue();
  if (!bet.valid) {
    setRoundMessage(bet.reason);
    return;
  }

  clearHands();
  startRound(bet.value);
}

function initializeGame() {
  state.shoe = createShoe(DECK_COUNT);
  clearHands();
  updateHUD();
  updateControls();
  setBanner("Ready to Play", "Start your first round and build your stack to 1000 chips.");
  setRoundMessage("Place your bet to begin.");
}

elements.betForm.addEventListener("submit", handleDealSubmit);
elements.hitButton.addEventListener("click", playerHit);
elements.standButton.addEventListener("click", playerStand);
elements.newRoundButton.addEventListener("click", prepareNextRound);

initializeGame();