# Tugtog

A band practice web app for chord charts with lyrics. Transpose any song to any key, play it in a full-screen stage view, and share setlists with your band. Built for bands, worship teams, singers, and musicians learning their parts.

**Live demo:** https://tugtog-delta.vercel.app/

## Features

- Transpose a full song with lyrics to any key; only chord lines change, lyrics stay as written
- Handles major, minor, 7ths, sus, and slash chords (`D/F#` → `E/G#`)
- Spells notes the way musicians expect for each key (`Bb` in C and F, `G#` in `E/G#`)
- Suggests a guitar capo and easy open chord shapes for hard keys (Bb → capo 1, A shapes)
- Nashville number system view
- Stage mode: full-screen song view with bigger text, colored sections, and auto-scroll
- Accounts with a private song library (save, open, update, delete)
- Setlists with a key per song, reorder, stage mode for the whole set, and a read-only share link for the band
- Light and dark mode

## Tech stack

- React 19 + TypeScript
- Vite and Tailwind CSS
- Supabase: Postgres, auth, and row-level security so each user only sees their own songs
- Vitest, with the music logic built test-first (TDD)
- Deployed on Vercel

## Run it locally

```bash
git clone https://github.com/EmilCalundan/tugtog.git
cd tugtog
npm install
npm run dev
```

Create a `.env.local` file with your Supabase project URL and publishable key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Run the tests:

```bash
npm test
```

## How it works

The music logic lives in `src/music/transpose.ts` and has no UI code, so it is easy to test:

- `isChordLine` decides whether a line is chords or lyrics, so lyrics are never changed
- `transposeChord` splits a chord into root and quality, moves the root, and keeps the quality
- `spellNote` names each note for the target key, and spells a slash bass from its chord root
- `suggestCapo` finds the lowest capo that turns a key into an open chord shape

Shared setlists are read through a Postgres function (`get_shared_setlist`), so anyone with the link can view a setlist without seeing any other data.

## Roadmap

- [x] Chord transposer with tests
- [x] Capo suggestion
- [x] Nashville number system
- [x] Lyrics with chords, and stage mode
- [x] Song library, setlists, and share link (Supabase)
- [ ] Parts for bass, piano, and drums
- [ ] Animated instrument tutorials

## Author

Emil Calundan, Computer Science student at the University of Makati