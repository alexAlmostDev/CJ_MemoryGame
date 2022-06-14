const emojis = ['😂', '🤷‍♂️', '💖', '🥪', '🎢', '⚾', '🏀', '🗝️', '🔭', '☎️', '📸', '📎', '🛸', '🚀'];

const gameConfig = {
  roundTime: 25, //25 seconds to win
  flipDelay: 900, //Delay before the cards flip back (ms)
  audioVolume: 0.3,
  difficulty: {
    level: 0,
    cardPairs: 4,
  },
  sounds: {
    roundStart: 'audio/roundStart.mp3', // https://freesound.org/people/Benboncan/sounds/66952/
    cardFlip: 'audio/cardFlip.mp3',    // https://freesound.org/people/qubodup/sounds/454707/
    cardMatch: 'audio/cardMatch.mp3', // https://freesound.org/people/Beetlemuse/sounds/528957/
    gameWin: 'audio/gameWin.mp3',    // https://freesound.org/people/LittleRobotSoundFactory/sounds/270528/
    gameOver: 'audio/gameOver.mp3', // https://freesound.org/people/themusicalnomad/sounds/253886/
  },
};

const gameState = {
  gameRunning: false,
  timer: 0,
  points: 0,
  flippedCards: [],
  gameEnded: false,
};

const timer_span = document.querySelector('.timer_span');
const start_button = document.querySelector('.start_button');
const difficulty_button = document.querySelector('.difficulty_button');

const mute_buttons = document.querySelectorAll('.soundButton');
const sound_on_button = document.querySelector('.soundOn');
const sound_off_button = document.querySelector('.soundOff');

const restart_button = document.querySelector('.restartButton');

const main_element = document.querySelector('main');

const overlay = document.querySelector('.overlay');
const overlay_title = document.querySelector('.message');
const overlay_points = document.querySelector('.points');

let timer;
let audio = new Audio();

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const setTimer = (time) => (timer_span.textContent = `Time left: ${time}s`);

const setDifficulty = () => {
  const { level } = gameConfig.difficulty;
  const pairs = [4, 6, 8];
  const labels = ['Easy', 'Medium', 'Hard'];

  gameConfig.difficulty.cardPairs = pairs[level];

  difficulty_button.textContent = labels[level];
};

const playSound = (file) => {
  if (audio.muted) return;

  audio = new Audio(file);
  audio.volume = gameConfig.audioVolume;
  audio.play();
};

const shuffle = (array, limit) => {
  const arrayCopy = [...array];
  const shuffled = [];

  while (shuffled.length < limit) {
    const randomIndex = Math.floor(Math.random() * arrayCopy.length);
    shuffled.push(arrayCopy[randomIndex]);
    arrayCopy.splice(randomIndex, 1);
  }

  return shuffled;
};

const startGame = () => {
  const { flipDelay } = gameConfig;
  const { cardPairs } = gameConfig.difficulty;
  const { roundStart, cardFlip, cardMatch } = gameConfig.sounds;

  gameState.gameRunning = true;
  setTimer(gameConfig.roundTime);

  if (!audio.paused) audio.pause();
  playSound(roundStart);

  start_button.classList.add('hide');
  difficulty_button.classList.add('hide');

  main_element.classList.remove('hide');
  timer_span.classList.remove('hide');

  //Choose the emojis and Shuffle
  const pickedEmojis = [...shuffle(emojis, cardPairs)];
  const doubledEmojis = [...pickedEmojis, ...pickedEmojis];
  const selectedEmojis = [...shuffle(doubledEmojis, cardPairs * 2)];

  selectedEmojis.forEach((emoji) => {
    const card = document.createElement('div');
    card.innerHTML = `<div class="card">
  <div class="card_inner">
    <div class="card_front"><img src="card.jpg" alt="Card" /></div>
    <div class="card_back">${emoji}</div>
  </div>
  </div>`;

    //Append card to the page
    main_element.appendChild(card);

    //Click event for each card
    card.addEventListener('click', async () => {
      if (gameState.gameEnded) return;
      if (card.classList.contains('card_flip')) return;
      if (gameState.flippedCards.length === 2) return;

      card.classList.add('card_flip');
      gameState.flippedCards.push({ emoji, element: card });

      playSound(cardFlip);

      //2 cards are flipped
      if (gameState.flippedCards[1]) {
        const [card1, card2] = gameState.flippedCards;

        //Check for match
        if (card1.emoji == card2.emoji) {
          gameState.points += 1;
          playSound(cardMatch);

          //Check for winner
          if (gameState.points == cardPairs) return endGame(true);
        } else {
          //No match, flip back both cards after delay
          await timeout(flipDelay);
          gameState.flippedCards.forEach((e) => e.element.classList.remove('card_flip'));
        }

        //No cards flipped, reset state
        gameState.flippedCards = [];
      }
    });
  });
};

const resetGame = () => {
  clearInterval(timer);

  setDifficulty();

  gameState.gameRunning = false;
  gameState.timer = gameConfig.roundTime;
  gameState.points = 0;
  gameState.flippedCards = [];
  gameState.gameEnded = false;
  main_element.innerHTML = '';

  timer_span.classList.add('hide');
  main_element.classList.add('hide');
  overlay.classList.add('hide');

  start_button.classList.remove('hide');
};

const endGame = (win) => {
  clearInterval(timer);

  gameState.gameRunning = false;
  gameState.gameEnded = true;

  const { gameWin, gameOver } = gameConfig.sounds;
  const { timer: gameTimer, points } = gameState;

  const win_msg = `You finished in ${gameConfig.roundTime - gameTimer} seconds!`;
  const lose_msg = `You got ${points} point${points === 1 ? '' : 's'}`;

  playSound(win ? gameWin : gameOver);

  timer_span.classList.add('hide');

  overlay.classList.remove('hide');
  start_button.classList.remove('hide');
  difficulty_button.classList.remove('hide');

  start_button.textContent = win ? 'Play again' : 'Try again';

  overlay_title.textContent = win ? 'Winner!' : 'Game Over!';
  overlay_title.style.color = win ? 'white' : 'red';
  overlay_points.textContent = win ? win_msg : lose_msg;
};

//Event listeners

//Start game button
start_button.addEventListener('click', () => {
  resetGame();
  startGame();

  timer = setInterval(() => {
    if (gameState.timer < 1) return endGame(false);

    gameState.timer -= 1;
    setTimer(gameState.timer);
  }, 1000);
});

//Set difficulty button
difficulty_button.addEventListener('click', () => {
  const { level } = gameConfig.difficulty;

  if (level !== 2) gameConfig.difficulty.level += 1;
  else gameConfig.difficulty.level = 0;

  setDifficulty();
});

//Mute audio buttons
mute_buttons.forEach((button) => {
  button.addEventListener('click', () => {
    sound_on_button.classList.toggle('hide');
    sound_off_button.classList.toggle('hide');

    audio.muted = !audio.muted;
  });
});

//Restart button
restart_button.addEventListener('click', () => {
  if (gameState.gameRunning === false) return;
  endGame(false);
});
