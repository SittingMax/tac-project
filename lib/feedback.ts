/**
 * Audio & Haptic Feedback System
 * Provides sensory feedback for scanning operations
 */

// Audio context for generating tones
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  return audioContext;
};

/**
 * Play a beep tone
 */
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Fade out to avoid clicks
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('[Feedback] Audio playback failed:', error);
  }
};

/**
 * Trigger haptic feedback (mobile devices)
 */
const triggerHaptic = (pattern: number | number[]) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.warn('[Feedback] Haptic feedback failed:', error);
  }
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Success feedback - high beep + short vibration
 * Use after successful scan
 */
export const playSuccessFeedback = () => {
  playTone(1200, 0.15, 'sine');
  triggerHaptic(100);
};

/**
 * Error feedback - low buzz + long vibration
 * Use when scan fails or is invalid
 */
export const playErrorFeedback = () => {
  playTone(400, 0.3, 'square');
  triggerHaptic(300);
};

/**
 * Warning feedback - medium tone + double vibration
 * Use for duplicate scans or route mismatches
 */
export const playWarningFeedback = () => {
  playTone(800, 0.1, 'sine');
  setTimeout(() => playTone(800, 0.1, 'sine'), 150);
  triggerHaptic([100, 50, 100]);
};

/**
 * Info feedback - soft chime
 * Use for non-critical notifications
 */
export const playInfoFeedback = () => {
  playTone(600, 0.1, 'sine');
  triggerHaptic(50);
};

/**
 * Manifest activated feedback - ascending tones
 * Use when manifest QR is scanned
 */
export const playManifestActivatedFeedback = () => {
  playTone(400, 0.1, 'sine');
  setTimeout(() => playTone(600, 0.1, 'sine'), 100);
  setTimeout(() => playTone(800, 0.15, 'sine'), 200);
  triggerHaptic([50, 30, 50, 30, 100]);
};

/**
 * Manifest closed feedback - descending tones
 * Use when manifest is closed/finalized
 */
export const playManifestClosedFeedback = () => {
  playTone(800, 0.1, 'sine');
  setTimeout(() => playTone(600, 0.1, 'sine'), 100);
  setTimeout(() => playTone(400, 0.15, 'sine'), 200);
  triggerHaptic([100, 50, 100]);
};

// ============================================================================
// FEEDBACK PRESETS
// ============================================================================

export const ScanFeedback = {
  success: playSuccessFeedback,
  error: playErrorFeedback,
  warning: playWarningFeedback,
  duplicate: playWarningFeedback,
  info: playInfoFeedback,
  manifestActivated: playManifestActivatedFeedback,
  manifestClosed: playManifestClosedFeedback,
} as const;

export type FeedbackType = keyof typeof ScanFeedback;

/**
 * Play feedback by type
 */
export const playFeedback = (type: FeedbackType) => {
  ScanFeedback[type]();
};
