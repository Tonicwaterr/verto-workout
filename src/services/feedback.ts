import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

import { GlobalSettings } from "../types/workout";

const beepSource = require("../../assets/sounds/beep.wav");

let beepPlayer: ReturnType<typeof createAudioPlayer> | null = null;

function getBeepPlayer() {
  if (!beepPlayer) {
    beepPlayer = createAudioPlayer(beepSource);
  }

  return beepPlayer;
}

async function playBeep(settings: GlobalSettings) {
  if (!settings.beepEnabled) {
    return;
  }

  try {
    const player = getBeepPlayer();

    player.seekTo(0);
    player.play();
  } catch (error) {
    console.log("Beep failed:", error);
  }
}

async function playVibration(settings: GlobalSettings) {
  if (!settings.vibrationEnabled) {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.log("Haptic feedback failed:", error);
  }
}

export async function playTimerFeedback(settings: GlobalSettings) {
  await playVibration(settings);
  await playBeep(settings);
}

export async function playFinishFeedback(settings: GlobalSettings) {
  if (settings.vibrationEnabled) {
    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.log("Finish haptic feedback failed:", error);
    }
  }

  await playBeep(settings);
}