# Contributing

Each sketch is one person's project in its own folder, `sketches/NN-name/`, with a web page, a README and a NOTES file. It can grow out of research you're already doing. This page explains how to add one and keep it in good shape. To get set up first, follow the [setup guide](https://realtimeurbanismlab.github.io/weather-commons/guide/).

The repository is public: anyone can read everything in it, including its history. Box is private to the lab.

## 1. How work gets in

1. **Fork** the repository on GitHub. That's your own copy, published at `https://<your-username>.github.io/weather-commons/`. Turn it on once in your fork: **Actions** → enable workflows, then **Settings → Pages → Source: GitHub Actions**.
2. **Make your sketch** in your fork. Ask Claude to "start a sketch" with the number the facilitators gave you. Or run:
   ```bash
   node scripts/new-sketch.mjs "Hail cannons in Mendoza" --number 12 --author "Your Name"
   ```
3. **Publish it to your own copy.** Ask Claude to "publish", or commit, push and merge into your fork's `main`. It goes live about a minute later.
4. **Add it to the shared site.** Open a pull request from your fork to `RealtimeUrbanismLab/weather-commons` and fill in the checklist. A facilitator reviews it. Once merged, it appears on the shared site.

A pull request should change only your own sketch folder. For changes to shared files (`scripts/`, the root READMEs, `.github/`), talk to a facilitator first.

## 2. Numbers and names

- **Numbers.** Workshop participants use the number the facilitators gave them (see `docs/workshop/roster.md`). That way sketches made in different forks never clash. Lab members can leave out `--number` to take the next free one.
- **Names.** Folders are named `NN-words-that-name-the-place-or-idea`, like `02-haida-witness-composite`, never `test2`.
- **Never renumber or reuse a number,** even for a retired sketch. Notes, links and Box folders point at these names.
- **Same idea, better** (a fix, a new control, more data for the same question): keep working in the same folder and update the Status in the README (`v0.3`).
- **New idea, place or method:** start a new sketch. If it grows out of another, say so in its README: `Forked from 02 on 2026-10-20`.
- **Stand-alone:** everything a sketch needs is inside its folder, including its data and its own `package.json` if it uses packages. Copy from other sketches, but never link to their files.

## 3. The README

The first lines feed the site's front page:

```
# 12 · Hail cannons in Mendoza

Author: Your Name · Started: 2026-11-02 · Status: sketch · Stack: static HTML + JS

One or two sentences: what it shows and the question it asks. The first sentence is the summary on the site.
```

Then follow the four parts: **Event, Simulate, Situate, Narrate**. Finish with **Sources and limits**: for each dataset, who made it, its date, its licence, what you changed, and whether it is observed, reanalysed, modelled, synthetic or interpretive. Say what the sketch cannot show. The template already has these headings.

Status is one of `sketch`, `pilot`, `v0.2` and so on, or `retired`. Add `Publish: no` to the header line to keep a sketch off the shared site.

## 4. Notes between sessions

`NOTES.md` sits next to the README. It holds what to do next, decisions, open questions and what's done, with dates. Read it before working on a sketch, and leave notes there for whoever (or whichever Claude) comes next. When a version is finished, move its items to Done.

## 5. Where does a file go?

| The file is… | Put it | Notes |
| --- | --- | --- |
| code, settings, lock files, scripts | in the sketch, in git | |
| small data the page reads (JSON, GeoJSON, CSV, small images) | in the sketch, in git | under 10 MB per file, about 50 MB per sketch |
| an image, tile set or mesh you made from data | in the sketch, in git, if each file is under 10 MB | keep the script that made it in `tools/` |
| raw downloads you can fetch again | Box, `02 Sketch Assets/NN-name/` | keep the download script in git |
| anything over 10 MB the sketch needs | Box, `02 Sketch Assets/NN-name/`, marked `"required": true` | others run `pull NN` |
| readings, PDFs, research dossiers | Box, `01 Geoengineering Events, Technologies, Sites/` | |
| renders, prints, video, audio | Box, `03 Renders/` | |
| Photoshop, Affinity, Blender, Rhino, InDesign files | Box | git blocks these types |
| licensed fonts (ABC Diatype …) | Box, `02 Sketch Assets/_shared/fonts/` | never in git; pages fall back to system fonts |
| passwords, API keys, `.env` | nowhere shared | commit a `.env.example` with blank values |

`node scripts/check-sizes.mjs` stops any file over 10 MB and warns when a sketch passes 50 MB. If a small file of a blocked type really belongs in a sketch, such as an open-licence font, add it with `git add -f` and say why in the commit message.

Not in the lab? Keep big files out of the repository and link to where they live, with their source and licence.

## 6. Box (lab members)

- **Set up.** Install Box Drive and accept the share of **2026 Realtime Weather**. Then run `node scripts/assets.mjs where`. It looks in `WC_ASSETS`, `~/Box/2026 Realtime Weather` (Windows) and `~/Library/CloudStorage/Box-Box/2026 Realtime Weather` (Mac). If yours is elsewhere, such as `~/Box/Realtime Urbanism Lab/Projects/2026 Realtime Weather`, set `WC_ASSETS` to it.
- **Add a large file:**
  ```bash
  node scripts/assets.mjs add 12 ~/Downloads/radar --required --about "NEXRAD level II, KRGX, 12–15 Jan 2026; fetched with tools/fetch_radar.py"
  git add sketches/12-…/assets.json && git commit -m "12: radar archive on Box"
  ```
  `add` moves the file or folder to `02 Sketch Assets/12-…/` on Box, leaving no copy behind. It records it in the sketch's `assets.json`: `src` is the path on Box, and `dest` is where `pull` puts it in the sketch (`null` for reading material the sketch never loads).
- **Get a sketch's files.** `node scripts/assets.mjs pull 12 --all` copies them into `sketches/12-…/assets/`, which git ignores. The sketch reads them from there, never from Box directly. `check 12` shows what's expected and what you have.
- **Keep Box folders stable.** One folder per sketch, named like the git folder. Don't rename or move what an `assets.json` points to without updating it in the same commit.

## 7. Commits and checks

- Commit messages start with the sketch number: `12: add rainfall layer`. Changes to shared files start with `repo:` and go through a pull request.
- Before pushing, run `node scripts/check-sketches.mjs` and `node scripts/check-sizes.mjs`, plus the sketch's own checks (for 01: `pnpm check`, `pnpm lint`, `pnpm build`). GitHub runs the same checks on every pull request, and builds the site to check it still works.
- On Windows, Git may change line endings. For data with recorded checksums, mark it `-text` in a `.gitattributes` in the sketch (see sketch 01's).

## 8. The shared site

Every push to `main` that changes a sketch rebuilds the site with `scripts/build-pages.mjs`.

- Every sketch with an `index.html` goes online at `/weather-commons/NN-name/`, unless its README header says `Publish: no`. A sketch with a `build:pages` script is built first. Sketch 01 has its own build.
- The site uses only files in git. Box files and `assets/` folders are never copied.
- Pages live under a sub-folder, so load files with relative paths (`data/x.json`), not paths starting with `/`. `check-sketches` warns about these.
- To check before pushing: `node scripts/build-pages.mjs --out _preview/weather-commons`, then `python -m http.server 8090 -d _preview` and open http://localhost:8090/weather-commons/.

## 9. Writing and look

Every page, guide and README in this repository should look and sound the same.

**Writing**
- Plain, natural language. Short sentences. Say it once.
- Explain any technical word in a few words the first time, or leave it out.
- Address the reader as "you".
- Use the same names everywhere:
  - **sketch:** one person's project and its page;
  - **the shared site:** realtimeurbanismlab.github.io/weather-commons;
  - **your own copy:** your fork and its site;
  - **the setup guide, the catalog, the community space.**
- The four parts are always **Event, Simulate, Situate, Narrate**, in that order.
- Always say what kind of material something is: observed, reanalysed, modelled, synthetic or interpretive.

**Look**
- Black and white, system fonts, light and dark.
- No colour except the source colours of scientific imagery.
- Pages use `site/style.css` (new sketches get their own copy) and the same header: the **Weather Commons** wordmark, then Sketches, Guide and Catalog.
- Section headings are small capitals with a rule above.
- Images are greyscale on the front page.
- Sketches 01 and 02 keep their own designs.

## 10. Retiring a sketch

Leave it in place, set `Status: retired` in its README header, and say in the README what replaced it. Its Box folder stays.
