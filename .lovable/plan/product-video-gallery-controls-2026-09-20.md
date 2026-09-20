# Product video gallery controls

## Build
- Replace the browser’s basic video controls with a polished overlay toolbar for play/pause, mute/unmute, and fullscreen.
- Keep photo and video navigation together as clear thumbnails, with selected states and accessible labels.
- Preserve the existing product page layout, imagery, product details, and checkout actions.
- Keep playback state accurate when the video ends, pauses, or fullscreen changes.

## Verify
- Check the gallery on desktop and mobile-sized screens.
- Confirm every control works, thumbnail switching is stable, and products without videos remain unchanged.
- Confirm the app builds without errors.

## Technical details
- Implement the controls against the native HTML video element with React refs and media events.
- Use the existing design tokens, button component, and icon library.
- Respect reduced-motion preferences and avoid autoplay surprises when switching media.
