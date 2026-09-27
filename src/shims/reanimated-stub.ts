/**
 * src/shims/reanimated-stub.ts
 * 
 * Web shim cho react-native-reanimated.
 * Stub toàn bộ API với no-op functions để web build không crash.
 */

import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';

// ── Animated component — pass-through wraps with proper children handling ──────
const AnimatedViewForward = React.forwardRef<any, any>(({ children, style, ...rest }, _ref) =>
  React.createElement(View, { style, ...rest }, children)
);
AnimatedViewForward.displayName = 'Animated.View';

const AnimatedTextForward = React.forwardRef<any, any>(({ children, style, ...rest }, _ref) =>
  React.createElement(Text, { style, ...rest }, children)
);
AnimatedTextForward.displayName = 'Animated.Text';

const AnimatedImageForward = React.forwardRef<any, any>(({ style, ...rest }, _ref) =>
  React.createElement(Image, { style, ...rest })
);
AnimatedImageForward.displayName = 'Animated.Image';

const AnimatedScrollViewForward = React.forwardRef<any, any>(({ children, style, ...rest }, _ref) =>
  React.createElement(ScrollView, { style, ...rest }, children)
);
AnimatedScrollViewForward.displayName = 'Animated.ScrollView';

// Default export — must be a valid component itself
const Animated: any = AnimatedViewForward;
Animated.View = AnimatedViewForward;
Animated.Text = AnimatedTextForward;
Animated.Image = AnimatedImageForward;
Animated.ScrollView = AnimatedScrollViewForward;
Animated.FlatList = ScrollView;
Animated.createAnimatedComponent = (Component: any) => Component;

export default Animated;


// ── Hook stubs ────────────────────────────────────────────────────────────────
export const useSharedValue = (initialValue: any) => {
  // Simple mutable ref object — mimics Reanimated SharedValue API
  // We use useState to track the value for any renders
  const [, forceUpdate] = React.useState(0);
  const sv = React.useRef({ value: initialValue, _forceUpdate: forceUpdate });
  return sv.current;
};

export const useAnimatedStyle = (_fn: () => any) => ({});

export const useAnimatedRef = () => React.useRef(null);
export const useAnimatedScrollHandler = () => () => {};
export const useAnimatedGestureHandler = () => () => {};
export const useDerivedValue = (fn: () => any) => ({ value: fn() });
export const useAnimatedReaction = () => {};
export const useFrameCallback = () => {};

// ── Animation function stubs ──────────────────────────────────────────────────
export const withTiming = (toValue: any, _opts?: any, _cb?: any) => toValue;
export const withSpring = (toValue: any, _opts?: any, _cb?: any) => toValue;
export const withDecay = (_config: any) => 0;
export const withDelay = (_delay: number, animation: any) => animation;
export const withRepeat = (animation: any, _count?: number, _reverse?: boolean) => animation;
export const withSequence = (...animations: any[]) => animations[animations.length - 1];
export const cancelAnimation = (_sv: any) => {};
export const runOnJS = (fn: Function) => fn;
export const runOnUI = (fn: Function) => fn;
export const makeMutable = (val: any) => ({ value: val });

// ── Easing ────────────────────────────────────────────────────────────────────
const identity = (t: number) => t;
export const Easing = {
  linear: identity,
  ease: identity,
  quad: identity,
  cubic: identity,
  sin: identity,
  circle: identity,
  exp: identity,
  elastic: () => identity,
  back: () => identity,
  bounce: identity,
  bezier: () => identity,
  bezierFn: () => identity,
  in: (e: Function) => e,
  out: (e: Function) => e,
  inOut: (e: Function) => e,
  poly: () => identity,
  step0: () => identity,
  step1: () => identity,
};

// ── Interpolation ─────────────────────────────────────────────────────────────
export const interpolate = (value: number, inputRange: number[], outputRange: number[]) => {
  if (!inputRange.length) return outputRange[0] ?? 0;
  const clamped = Math.max(inputRange[0], Math.min(inputRange[inputRange.length - 1], value));
  const idx = inputRange.findIndex((v) => v >= clamped);
  if (idx <= 0) return outputRange[0];
  if (idx >= inputRange.length) return outputRange[outputRange.length - 1];
  const ratio = (clamped - inputRange[idx - 1]) / (inputRange[idx] - inputRange[idx - 1]);
  return outputRange[idx - 1] + ratio * (outputRange[idx] - outputRange[idx - 1]);
};
export const interpolateColor = () => 'transparent';
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// ── Other ─────────────────────────────────────────────────────────────────────
export const measure = () => null;
export const scrollTo = () => {};
export const FadeIn = {};
export const FadeOut = {};
export const SlideInDown = {};
export const SlideOutDown = {};
export const ZoomIn = {};
export const ZoomOut = {};
export const Layout = {};
export const ReduceMotion = { System: 'system', Always: 'always', Never: 'never' };
