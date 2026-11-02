# Realtime Weather

Part of [Weather Commons](https://tba21.org/uni_weathercommons), TBA21–Academy UNI.

Sketches from the Realtime Weather working group (Realtime Urbanism Lab, Cornell AAP, with TBA21–Academy UNI; Mondays, 2–23 November 2026). Each sketch is one person's project: a small web page that models one weather event, practice or intervention. Together they look at how weather is monitored, modelled, managed and shown in real time, and who has the right to change it.

**See them online:** https://realtimeurbanismlab.github.io/weather-commons/

## Start here

Joining the workshop?

1. **Set up GitHub and Claude** with the [setup guide](https://realtimeurbanismlab.github.io/weather-commons/guide/). Everything happens in the browser, with no installs.
2. **Choose your project.** It can be research you're already doing, or an event from the [catalog](https://realtimeurbanismlab.github.io/weather-commons/catalog/).
3. **Ask Claude to start your sketch** with your sketch number, then to publish it.
4. **Talk to the group** in the [community space](https://community.ocean-archive.org/spaces/25478985).

How the four sessions work (Event, Simulate, Situate, Narrate): [docs/workshop/README.md](docs/workshop/README.md). How to add work: [CONTRIBUTING.md](CONTRIBUTING.md).

## Sketches

<!-- sketches:start -->
| No. | Sketch | Author | Status | Stack | What it is |
| --- | --- | --- | --- | --- | --- |
| 01 | [Realtime Weather pilot](sketches/01-realtime-weather-pilot/) | Farzin Lotfi-Jam | pilot | vinext (Next on Vite) + React + three.js, Cloudflare | An evidence-led technical pilot for the Realtime Weather working group. |
| 02 | [Haida witness composite](sketches/02-haida-witness-composite/) | Boone Mercado (with Claude) | sketch, v0.2 | static HTML + JS, no build step | A layered model of the 2012 Haida Gwaii iron dump. |
| 03 | [Operation Popeye, Laos 1966–1972](sketches/03-operation-popeye-laos-1966-1972/) | Farzin Lotfi-Jam (with Claude) | sketch | static HTML + JS, no build step | The US military's secret cloud seeding over Laos, told in four parts: what happened, where the weather went, who and what it touched, and what we can and can't say. |
<!-- sketches:end -->

Maintainers refresh this table with `node scripts/index-sketches.mjs` after merging. The site's front page updates on its own.

## Where things live

| What | Where |
| --- | --- |
| Code and small data a sketch needs to run (each file under 10 MB) | here, in the sketch's folder `sketches/NN-name/` |
| Raw downloads, research dossiers, renders, video, working files, licensed fonts, anything over 10 MB | the lab's Box folder **2026 Realtime Weather** (lab members only) |
| Talk, questions, work in progress | the [community space](https://community.ocean-archive.org/spaces/25478985) |

Every sketch runs from the files in this repository, so you don't need Box to run, change or publish one. Box is for lab members who rebuild data from raw downloads, or use the licensed fonts (pages fall back to system fonts without them).

## On your own computer (optional)

1. Install Git, Node 22 or newer and the GitHub CLI. The [setup guide](https://realtimeurbanismlab.github.io/weather-commons/guide/) has steps for Mac and Windows.
2. Make and download your own copy:
   ```bash
   gh auth login
   gh repo fork RealtimeUrbanismLab/weather-commons --clone
   ```
3. Open a sketch's README and follow its **Run** section. Sketch 01 also needs pnpm (`corepack enable`).
4. Lab members with Box: run `node scripts/assets.mjs where` to check the scripts can find the Box folder. If it syncs somewhere else (for example `~/Box/Realtime Urbanism Lab/Projects/2026 Realtime Weather`), set the environment variable `WC_ASSETS` to that path. Then `node scripts/assets.mjs pull NN --all` copies a sketch's Box files into its `assets/` folder.

## Scripts

```bash
node scripts/new-sketch.mjs "Hail cannons in Mendoza" --number 12 --author "Your Name"
                                       # start a sketch from the template, with your number
node scripts/check-sketches.mjs        # README header, sources and limits, unique numbers, relative paths
node scripts/check-sizes.mjs           # no file over 10 MB
node scripts/build-pages.mjs           # build the site into _site/ (GitHub does this on every push)
node scripts/index-sketches.mjs        # refresh the table above
node scripts/assets.mjs pull 02 --all  # lab members: copy a sketch's Box files into its assets/ folder
node scripts/assets.mjs add 12 <path> --about "source, date, licence"
                                       # lab members: move a big file to Box and record it
```

Coding agents read [AGENTS.md](AGENTS.md); Claude Code loads it through [CLAUDE.md](CLAUDE.md).

## Layout

```
sketches/
  _template/                    what every new sketch starts from
  01-realtime-weather-pilot/    one folder per sketch: index.html or app, README.md, NOTES.md, assets.json
  02-haida-witness-composite/
guide/  catalog/  site/         the setup guide, the catalog and the shared stylesheet
docs/workshop/                  how the workshop runs, session plans, sketch numbers
scripts/                        small Node scripts, no packages needed
.github/                        checks, site build, pull request and issue templates
.claude/skills/                 start-sketch and publish, for Claude
```

Box, **2026 Realtime Weather**:

```
00 Presentations/
01 Geoengineering Events, Technologies, Sites/   research dossiers: 12 sites, 12 rituals
02 Sketch Assets/                                one folder per sketch, named as in git; _shared/fonts/ for licensed fonts
03 Renders/                                      finished renders, prints and video
```

## Licences

Code is MIT ([LICENSE](LICENSE)). Text, images and data we made are CC BY 4.0. Material from others keeps its own licence, listed in each sketch's Sources and limits. Details: [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

## The shared site

The repository is public. Every push to `main` that changes a sketch rebuilds the site with `scripts/build-pages.mjs` and publishes it on GitHub Pages. Every sketch with an `index.html` goes online. Add `Publish: no` to a sketch's README header to keep it off. A fork publishes its own copy at `https://<username>.github.io/weather-commons/`. Box files are never part of the site.

Sketch 01 moved from the repository root into its folder on 2026-10-08. Any other hosting service connected to this repository must use `sketches/01-realtime-weather-pilot` as its root folder.
