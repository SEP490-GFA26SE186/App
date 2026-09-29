/**
 * src/shims/expo-stub.ts
 * 
 * Web shims for expo-speech, expo-haptics, expo-linear-gradient, etc.
 */
export const speak = (text: string, options?: any) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (options?.language) utterance.lang = options.language;
    if (options?.pitch) utterance.pitch = options.pitch;
    if (options?.rate) utterance.rate = options.rate;
    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onDone) utterance.onend = options.onDone;
    if (options?.onError) utterance.onerror = options.onError;
    window.speechSynthesis.speak(utterance);
  }
};

export const stop = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeakingAsync = async () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

// expo-haptics stub
export const impactAsync = async () => {};
export const notificationAsync = async () => {};
export const selectionAsync = async () => {};
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };

export default {
  speak,
  stop,
  isSpeakingAsync,
  impactAsync,
  notificationAsync,
  selectionAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
};
