# Third-party UI components

These components are selectively adapted as application source; no full UI kit is installed. Local changes preserve the site's design tokens, existing pointer controller, static server-rendered text, keyboard behavior, and reduced-motion support.

## Magic UI

- Animated Beam: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-beam.tsx
  - Local: `app/components/ui/AnimatedBeam.tsx`
  - Adaptations: one signal pulse per pointer selection, theme colors, static connection for keyboard/reduced motion, observed endpoint sizes, no repeating animation.
- Magic Card: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/magic-card.tsx
  - Local: `app/components/ui/MagicCardGlow.tsx` and its CSS module.
  - Adaptations: gradient and border illumination use the existing delegated spotlight coordinates, CSS layers and per-project colors; no extra pointer controller or theme provider.

- Flickering Grid: https://magicui.design/docs/components/flickering-grid
  - Local: `app/components/ui/FlickeringGrid.tsx`
  - Adaptations: live theme accent, throttled loop that stops off screen, on hidden tabs and for reduced motion.
- Border Beam: https://magicui.design/docs/components/border-beam
  - Local: `app/components/ui/BorderBeam.tsx`
  - Adaptations: CSS-only conic gradient driven by a registered `--beam-angle`; hidden for reduced motion.
- Number Ticker: https://magicui.design/docs/components/number-ticker
  - Local: `app/components/ui/NumberTicker.tsx`
  - Adaptations: server renders the final value; count-up replays once in view without the motion library.
- Marquee: https://magicui.design/docs/components/marquee
  - Local: `app/components/ui/Marquee.tsx`
  - Adaptations: decorative duplicate track hidden from assistive technology; paused on hover and for reduced motion.
- Shimmer Button: https://magicui.design/docs/components/shimmer-button
  - Local: `.shimmer` in `app/components/sections/mission/MissionLog.module.css`
  - Adaptations: a single sweeping layer on the existing send button.

- Aurora Text: https://magicui.design/docs/components/aurora-text
  - Local: `.aurora` in `app/components/sections/mission/MissionLog.module.css`
  - Adaptations: CSS gradient built from theme tokens that sweeps once as it scrolls into view (scroll-driven, no idle loop); static for reduced motion.
- Hyper Text: https://magicui.design/docs/components/hyper-text
  - Local: `app/components/ui/HyperText.tsx`
  - Adaptations: triggered by hovering or focusing the enclosing navigation link; skipped for reduced motion.
- Ripple: https://magicui.design/docs/components/ripple
  - Local: `app/components/ui/Ripple.tsx`
  - Adaptations: corner-anchored theme-colored rings that appear only while the contact card is hovered or focused; hidden for touch and reduced motion.
- Animated List: https://magicui.design/docs/components/animated-list
  - Local: `app/components/ui/AnimatedList.tsx`
  - Adaptations: plays once for the existing note queue when it scrolls into view; skipped above the fold, for keyboard input and reduced motion.

MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## React Bits

- Decrypted Text: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/DecryptedText/DecryptedText.tsx
  - Local: `app/components/ui/DecryptedText.tsx` and its CSS module.
  - Adaptations: bounded sequential reveal, fixed-width character cells, separate accessible text, static SSR output, explicit replay, and cleanup on keyboard input, preference changes, leaving the viewport or hiding the tab.
- Blur Text: https://reactbits.dev/text-animations/blur-text
  - Local: `app/components/ui/BlurText.tsx`
  - Adaptations: titles stay in server HTML; only titles below the fold hide and blur in once; skipped for keyboard input and reduced motion.
- Shiny Text: https://reactbits.dev/text-animations/shiny-text
  - Local: `.shiny` in `app/components/sections/Hero.module.css`
  - Adaptations: theme-aware sheen on the accent wordmark.
- Click Spark: https://reactbits.dev/animations/click-spark
  - Local: `app/components/ui/ClickSpark.tsx`
  - Adaptations: one fixed page-wide canvas that only animates while sparks are alive; skips text fields and reduced motion.
- Rotating Text: https://reactbits.dev/text-animations/rotating-text
  - Local: `app/components/ui/RotatingText.tsx`
  - Adaptations: rotates only while visible; screen readers get the full list.
- Magnet: https://reactbits.dev/animations/magnet
  - Local: `app/components/ui/Magnet.tsx`
- Glare Hover: https://reactbits.dev/animations/glare-hover
  - Local: `.postButton[data-glare]` in `app/components/sections/mission/MissionLog.module.css`
- Dot Grid: https://reactbits.dev/backgrounds/dot-grid
  - Local: `app/components/ui/DotGrid.tsx`
  - Adaptations: no GSAP; damped spring push and accent heat near a mouse pointer, loop sleeps when settled; still grid for touch and reduced motion.
- Circular Text: https://reactbits.dev/text-animations/circular-text
  - Local: `app/components/ui/CircularText.tsx`
  - Adaptations: CSS-only spin that speeds up on hover/focus of the back-to-top link, around a progress ring that closes as the visitor reaches the end; static for reduced motion.
- Tilted Card: https://reactbits.dev/components/tilted-card
  - Local: `app/components/ui/TiltedCard.tsx`
  - Adaptations: no motion library; CSS-variable tilt (6°) with glare and shadow tinted by each project's color, matching the Magic Card glow; mouse pointer only.
- Pixel Transition: https://reactbits.dev/animations/pixel-transition
  - Local: `app/components/ui/PixelTransition.tsx`
  - Adaptations: CSS-only, deterministic pixel order, driven by the project expand state in each project's color.
- True Focus: https://reactbits.dev/text-animations/true-focus
  - Local: `app/components/ui/TrueFocus.tsx`
  - Adaptations: tours the Skills legend once when visible, then rests sharp; hover publishes the focused state so matching groups highlight; static for reduced motion.
- License: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
- Components are incorporated into this website, not distributed as a standalone component library.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
