import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

import { GlobalSettings } from "../types/workout";

const soundSources = {
  repTick: require("../../assets/sounds/rep-tick.wav"),
  timerWarning: require("../../assets/sounds/timer-warning.wav"),
  timerComplete: require("../../assets/sounds/timer-complete.wav"),
};

type SoundName = keyof typeof soundSources;

const soundPlayers: Partial<
  Record<SoundName, ReturnType<typeof createAudioPlayer>>
> = {};

function getSoundPlayer(soundName: SoundName) {
  if (!soundPlayers[soundName]) {
    soundPlayers[soundName] = createAudioPlayer(
      soundSources[soundName]
    );
  }

  return soundPlayers[soundName];
}

async function playSound(
  settings: GlobalSettings,
  soundName: SoundName
) {
  if (!settings.beepEnabled) {
    return;
  }

  try {
    const player = getSoundPlayer(soundName);

    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.log(`${soundName} sound failed:`, error);
  }
}

async function playImpact(
  settings: GlobalSettings,
  style: Haptics.ImpactFeedbackStyle
) {
  if (!settings.vibrationEnabled) {
    return;
  }

  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    console.log("Haptic feedback failed:", error);
  }
}

async function playSuccessHaptic(settings: GlobalSettings) {
  if (!settings.vibrationEnabled) {
    return;
  }

  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch (error) {
    console.log("Finish haptic feedback failed:", error);
  }
}

export async function playTimerWarningFeedback(
  settings: GlobalSettings
) {
  await playImpact(
    settings,
    Haptics.ImpactFeedbackStyle.Light
  );
  await playSound(settings, "timerWarning");
}

export async function playTimerCompleteFeedback(
  settings: GlobalSettings
) {
  await playImpact(
    settings,
    Haptics.ImpactFeedbackStyle.Heavy
  );
  await playSound(settings, "timerComplete");
}

/*
 * Backward-compatible alias.
 * Existing code that still calls playTimerFeedback will behave like
 * a phase-complete feedback.
 */
export async function playTimerFeedback(settings: GlobalSettings) {
  await playTimerCompleteFeedback(settings);
}

export async function playFinishFeedback(settings: GlobalSettings) {
  await playSuccessHaptic(settings);
  await playSound(settings, "timerComplete");
}

export async function playRepTickFeedback(settings: GlobalSettings) {
  await playSound(settings, "repTick");
}

export async function playTargetReachedFeedback(
  settings: GlobalSettings
) {
  await playTimerCompleteFeedback(settings);
}