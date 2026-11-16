# Tugtog

A band practice web app that transposes chord charts to any key, with guitar capo suggestions. Built for worship teams, bands, and musicians learning their parts.

**Live demo:** https://tugtog-delta.vercel.app/

## Features

- Transpose a full chord chart to any key as you type
- Handles major, minor, 7ths, sus, and slash chords (`D/F#` → `E/G#`)
- Reads both sharps and flats, and writes flats in flat keys (`Bb`, not `A#`)
- Suggests a guitar capo and easy open chord shapes for hard keys (Bb → capo 1, A shapes)

## Tech stack

- React 19 + TypeScript
- Vite
- Vitest, with the music logic built test-first (TDD)
- Deployed on Vercel

## Run it locally

```bash
git clone https://github.com/EmilCalundan/tugtog.git
cd tugtog
npm install
npm run dev
```

Run the tests:

```bash
npm test
```

## How it works

The music logic lives in `src/music/transpose.ts` and has no UI code, so it is easy to test:

- `transposeChord` splits a chord into root and quality, moves the root, and keeps the quality
- `transposeText` transposes every chord in a block of text and keeps the spacing
- `suggestCapo` finds the lowest capo that turns a key into an open chord shape

## Roadmap

- [x] Chord transposer with tests
- [x] Capo suggestion
- [ ] Nashville number system
- [ ] Song library and setlists (Supabase)
- [ ] Parts for bass, piano, and drums
- [ ] Animated instrument tutorials

## Author

Emil Calundan, Computer Science student at the University of Makati