# Alternative Sound Loading Method

This directory can be used as an alternative to placing sounds in `android/app/src/main/res/raw/`.

## Setup

1. Place your MP3 files in this directory
2. Run: `npx react-native-asset`
3. Update the sound loading code in `App.js` to use `require()`:

```javascript
// Instead of:
const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
  // ...
});

// Use:
const sound = new Sound(require(`./src/sounds/${file}`), (error) => {
  // ...
});
```

## File Requirements

- All lowercase filenames
- No spaces or special characters
- MP3 format only
- Example: `buttonpress.mp3`, `correct.mp3`, etc. 