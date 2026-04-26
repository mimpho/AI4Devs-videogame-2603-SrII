import { AUDIO_VOLUME } from './config.js';

let muted = false;

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function play(scene, key) {
  if (muted) return;
  if (!scene?.sound) return;
  scene.sound.play(key, { volume: AUDIO_VOLUME });
}
