'use strict';

// Moscow midnight is a fixed instant, independent of the visitor's time zone.
const BIRTHDAY = Date.parse('2026-11-25T00:00:00+03:00');
const BIRTHDAY_END = Date.parse('2026-11-26T00:00:00+03:00');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const birthdayStatus = document.getElementById('birthdayStatus');
const countdownGate = document.getElementById('countdownGate');
const birthdayPage = document.getElementById('birthdayPage');
const units = ['days', 'hours', 'minutes', 'seconds'].map(id => document.getElementById(id));

function getBirthdayState(now) {
  if (now >= BIRTHDAY) return { phase: now < BIRTHDAY_END ? 'birthday' : 'after', values: [0, 0, 0, 0] };
  const seconds = Math.ceil((BIRTHDAY - now) / 1000);
  return { phase: 'before', values: [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60] };
}
function tick() {
  const state = getBirthdayState(Date.now());
  units.forEach((element, index) => { element.textContent = String(state.values[index]).padStart(2, '0'); });
  const unlocked = state.phase !== 'before';
  const justOpened = unlocked && birthdayPage.hidden;
  countdownGate.hidden = unlocked;
  birthdayPage.hidden = !unlocked;
  birthdayPage.inert = !unlocked;
  document.body.classList.toggle('birthday-locked', !unlocked);
  if (justOpened) {
    birthdayStatus.textContent = 'С днём рождения, Настюша! Твой сюрприз открыт.';
    celebrate();
  }
}
tick();
setInterval(tick, 1000);

function celebrate() {
  if (reducedMotion.matches || document.hidden) return;
  const container = document.getElementById('celebration');
  container.replaceChildren();
  for (let index = 0; index < 24; index++) {
    const particle = document.createElement('span');
    particle.className = 'confetti';
    particle.textContent = ['✦', '♡', '✧'][index % 3];
    particle.style.left = `${Math.random() * 96}%`;
    particle.style.fontSize = `${14 + Math.random() * 17}px`;
    particle.style.color = ['#e9cf9f', '#e5b5cd', '#c7b4db'][index % 3];
    particle.style.setProperty('--duration', `${4 + Math.random() * 2}s`);
    particle.style.animationDelay = `${Math.random() * .6}s`;
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
    container.appendChild(particle);
  }
}
document.getElementById('letterDetails').addEventListener('toggle', event => {
  if (event.currentTarget.open) celebrate();
});

const wishes = [
  'Пусть счастье будет не далёкой целью, а маленькими моментами, из которых складывается каждый твой день.',
  'Пусть рядом будут люди, с которыми тепло, спокойно и можно быть собой. И пусть тебя всегда любят просто за то, что ты есть.',
  'Пусть смелости всегда будет чуть больше, чем сомнений. У тебя получится гораздо больше, чем ты сейчас думаешь.',
  'Пусть даже самые большие мечты однажды станут твоими любимыми воспоминаниями. Не переставай загадывать.',
  'Пусть находятся новые любимые места, песни и занятия, от которых загораются глаза. А в обычных днях - что-то необыкновенное.',
  'Пусть жизнь иногда устраивает приятные сюрпризы. Те самые, после которых улыбаешься и думаешь: «Как же хорошо!».'
];
const starButtons = document.querySelectorAll('.wish-star');
starButtons.forEach(button => button.addEventListener('click', () => {
  starButtons.forEach(star => star.setAttribute('aria-pressed', String(star === button)));
  document.querySelector('#starWish p').textContent = wishes[Number(button.dataset.wish)];
}));

const candleRow = document.getElementById('candles');
for (let index = 0; index < 20; index++) {
  const candle = document.createElement('span');
  candle.className = 'candle';
  candle.style.setProperty('--delay', `${-index * .17}s`);
  candleRow.appendChild(candle);
}
const blowButton = document.getElementById('blowBtn');
const relightButton = document.getElementById('relightBtn');
let candleTimers = [];
blowButton.addEventListener('click', () => {
  blowButton.disabled = true;
  blowButton.textContent = 'Пусть сбудется ♡';
  [...candleRow.children].forEach((candle, index) => {
    candleTimers.push(setTimeout(() => candle.classList.add('out'), reducedMotion.matches ? 0 : index * 45));
  });
  candleTimers.push(setTimeout(() => {
    document.getElementById('candleMessage').textContent = 'Пусть всё, о чём ты сейчас подумала, обязательно сбудется. С двадцатилетием! ♡';
    relightButton.hidden = false;
    celebrate();
  }, reducedMotion.matches ? 0 : 950));
});
relightButton.addEventListener('click', () => {
  candleTimers.forEach(clearTimeout);
  candleTimers = [];
  [...candleRow.children].forEach(candle => candle.classList.remove('out'));
  blowButton.disabled = false;
  blowButton.innerHTML = 'Задуть свечи <span aria-hidden="true">✧</span>';
  document.getElementById('candleMessage').textContent = '';
  relightButton.hidden = true;
  blowButton.focus({ preventScroll: true });
});

// Put music.mp3 next to index.html to use a personal track.
// If the file is missing or unsupported, use the original synthesized melody.
const customTrack = document.getElementById('birthdayAudio');
customTrack.preload = 'none';
customTrack.loop = true;
customTrack.volume = .35;
let customTrackUnavailable = false;
let usingCustomTrack = false;
let audioContext, master, musicInterval;
let playing = false;
let musicBusy = false;
let noteIndex = 0;
const musicButton = document.getElementById('musicBtn');
const musicText = document.getElementById('musicText');
const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
function playNote() {
  if (!playing || !audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = notes[noteIndex++ % notes.length];
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.22, now + .08);
  gain.gain.exponentialRampToValueAtTime(.001, now + 2.2);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(now);
  oscillator.stop(now + 2.3);
}
async function setMusic(enable) {
  if (musicBusy) return;
  musicBusy = true;
  musicButton.disabled = true;
  try {
    if (enable) {
      usingCustomTrack = false;
      if (!customTrackUnavailable) {
        try {
          await customTrack.play();
          usingCustomTrack = true;
        } catch (error) {
          customTrack.pause();
          if (error.name !== 'NotSupportedError') throw error;
          customTrackUnavailable = true;
        }
      }
      if (!usingCustomTrack) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Audio is unavailable');
        if (!audioContext) {
          audioContext = new AudioContextClass();
          master = audioContext.createGain();
          master.gain.value = .1;
          master.connect(audioContext.destination);
        }
        await audioContext.resume();
        playing = true;
        playNote();
        musicInterval = setInterval(playNote, 1150);
      }
      playing = true;
      if (document.hidden) {
        customTrack.pause();
        clearInterval(musicInterval);
        if (audioContext) await audioContext.suspend();
        playing = false;
      }
    } else {
      playing = false;
      customTrack.pause();
      clearInterval(musicInterval);
      if (audioContext) await audioContext.suspend();
    }
    musicText.textContent = playing ? 'Выключить музыку' : 'Включить музыку';
  } catch {
    playing = false;
    customTrack.pause();
    clearInterval(musicInterval);
    musicText.textContent = 'Музыка недоступна';
    musicButton.setAttribute('aria-label', 'Браузер не смог включить музыку. Нажми, чтобы повторить.');
  } finally {
    musicButton.setAttribute('aria-pressed', String(playing));
    if (playing) musicButton.removeAttribute('aria-label');
    musicButton.disabled = false;
    musicBusy = false;
  }
}
musicButton.addEventListener('click', () => { void setMusic(!playing); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playing) void setMusic(false);
  tick();
});
