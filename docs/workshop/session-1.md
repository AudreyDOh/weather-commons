# Session 1: Event (2 November, 2.5 hours)

Facilitator run sheet for Farzin and Boone.

Have these open before you start:
- the shared site: https://realtimeurbanismlab.github.io/weather-commons/
- the setup guide: https://realtimeurbanismlab.github.io/weather-commons/guide/
- the catalog: https://realtimeurbanismlab.github.io/weather-commons/catalog/
- the community space: https://community.ocean-archive.org/spaces/25478985
- a number list from [roster.md](roster.md), kept privately

## Before the session

- **Rehearse Tech Demo 1** (see below) and record the screen as a fallback in case the live demo stalls.
- **Prepare your demo fork:** fork it, and turn on Actions and Pages ahead of time, so the live demo starts at the Claude step.
- **Post a welcome thread** in the community space with the three links above. Ask everyone to:
  - make a GitHub account;
  - check that claude.ai/code opens for them before the session;
  - post their live page in the thread once it's up.

### Rehearsal (about 15 minutes)

Use an account that doesn't own the repository, such as Boone's or a spare one, so it behaves like a participant's.

1. Open a private browser window and sign in as the test account.
2. Fork `RealtimeUrbanismLab/weather-commons`. In the fork:
   - **Actions** → enable workflows;
   - **Settings → Pages → Source: GitHub Actions**.
3. Open claude.ai/code. Connect GitHub and give the Claude app access to the fork only.
4. Paste the first-page prompt from the setup guide, with number 09. Time how long Claude takes.
5. Check that the pull request's base is the fork, not `RealtimeUrbanismLab`. Merge it, then watch the "pages" job under **Actions**.
6. Open `https://<account>.github.io/weather-commons/09-…/` once the job has a green tick.
7. Open a pull request from the fork to `RealtimeUrbanismLab/weather-commons`. Check that the checks run and that you can review it, then close it without merging.
8. Note how long each step took, and anything that confused you.

### What can go wrong

| Risk | What happens | How to avoid it |
| --- | --- | --- |
| Actions are off in the fork (the most common) | Nothing deploys after merging | Turn on Actions straight after forking |
| Pages source not set | The "deploy" step fails | **Settings → Pages → Source: GitHub Actions**, then re-run the job |
| The pull request goes to the shared repository | GitHub suggests it first; the page doesn't go live | Close it and open one with base `<username>/weather-commons`. Branch protection stops accidental merges into the shared repository |
| The Claude app can't see the fork | Claude can't open or push to the repository | GitHub → **Settings → Applications → Claude** → add the fork |
| claude.ai/code is switched off | Some institutional Team or Enterprise plans disable it | Ask people to open claude.ai/code before the session |
| Brand-new GitHub account | Email check, or a delay from spam protection | Make accounts the day before |
| A repository called `weather-commons` already exists | The fork is named `weather-commons-1`, and the address ends `/weather-commons-1/` | The build handles it. Tell them to use that address |
| The first deploy takes 1–2 minutes | The page shows 404 and people think it failed | Wait for the green tick under **Actions**, then reload |
| 17 people on one connection while you share your screen | Slow pages and stalled demos | Keep the recording ready |
- **Decide the breakout rooms:** 17 people in four rooms of four or five, for peer feedback. Everyone works on their own project. Give out sketch numbers by room: room 1 gets 10–19, room 2 gets 20–29, and so on.

## Part 1: Intro (60 minutes)

**10 min: Boone and Farzin introduce themselves.**

**30 min: participants introduce themselves.** That's under two minutes each for 17 people. Each person gives their name, their practice, and the research or weather question they want to work on. Many will bring an existing project. Write the topics down for the breakout.

**10 min: Workshop introduction.** Use [README.md](README.md) in this folder.
- **The framing:** how weather is monitored, modelled, managed and shown in real time, and who has the right to change it.
- **The four parts:** Event, Simulate, Situate, Narrate.
- **The catalog:** the Geoengineering Monitor map and the categories.
- **Earlier work:** sketch 01 (globe, Project Popeye) and sketch 02 (Haida Gwaii).

**10 min: Tech Demo 1, from GitHub to Claude to a live page.** Narrate each step in one sentence.

1. On github.com, open `RealtimeUrbanismLab/weather-commons` → **Fork**. "This is your own copy."
2. In the fork:
   - **Actions** → enable workflows;
   - **Settings → Pages → Source: GitHub Actions**.
3. Open claude.ai/code → connect GitHub → choose the fork.
4. Paste:
   > Start a sketch called "Hail cannons" with number 09, author "Farzin Lotfi-Jam". It's about anti-hail cannons in wine regions. Then publish it to my own site.
5. Claude makes the sketch, opens a pull request in the fork, and merges it when asked.
6. Wait about a minute for the "pages" workflow, then open `https://<username>.github.io/weather-commons/09-hail-cannons/`.

Show the page, its "synthetic" label and its Sources and limits box. "Everything we make says where it comes from."

## Part 2: Peer to peer (45 minutes)

Four breakout rooms of four or five people, for peer feedback. Everyone works on their own project. Facilitators move between rooms.

**15 min: Explore, on your own.** Prompt:
> If you have a research project, write down the event or practice at its centre. If not, browse the catalog and the map and pick one. What happened, where, when, and who decided? What would you want to see that you can't see now?

**15 min: Feedback.** Prompt:
> Each person has two or three minutes to describe their event and question. The others give feedback: what's clear, what's missing, and which sources they know of.

**15 min: Set up and publish a first page.** Everyone follows the setup guide, route A (browser only), using their own sketch number. The aim is one live page each, even if it only shows the template with their question on it.

### When setup goes wrong

| Problem | Fix |
| --- | --- |
| No GitHub account yet | Sign up at github.com and verify the email. Pair with a neighbour while waiting. |
| The page shows 404 | Wait a minute after the "pages" workflow finishes, then reload. |
| The "pages" workflow didn't run | Actions are off in forks by default. In the fork, open **Actions** and enable workflows, then re-run. |
| The workflow fails at "deploy" | In the fork, set **Settings → Pages → Source: GitHub Actions**, then re-run. |
| Claude can't see the fork | In GitHub, open **Settings → Applications → Claude** and give it access to the `weather-commons` fork. |
| Claude says the number is taken | They used someone else's number. Check the roster. |
| Claude asks to upgrade, or code isn't available | Check they're signed in to the account that has their Claude plan. |

Anything else goes into the community space, where facilitators answer after the session.

## Part 3: Report back and next steps (45 minutes)

**20 min: Report back.** Five minutes per room: the range of projects in the room, one open question, and one live page shown on screen.

**20 min: Tech Demo 2, weather simulation.**
- **Sketch 01, one Earth, five kinds of evidence**, from [the pilot's exercises](../../sketches/01-realtime-weather-pilot/docs/WORKSHOP.md):
  - pause GOES at 04:10 UTC and compare Air Mass with GeoColor;
  - show cloud-top heights at 1× and 50×;
  - run the transport model twice with the same seed and one changed setting.
  The point: observed, reanalysed, simulated and interpreted are different things.
- **Sketch 02, Haida Gwaii.** Switch the witness weights. A simulation can also act as a rule for arranging real observations.
- **Close by asking Claude live** to change the template's wind direction. Point out the "synthetic" label staying in place.

**5 min: Next steps.**
- Before session 2 (9 November), write a one-page research question and collect three to five sources. Post both in the community space.
- Session 2 is **Simulate**. Bring your data, or start from the template's wind field.
- Anyone who wants to work on their own computer can follow route B in the setup guide beforehand. It's optional.

## After the session

- Merge nothing to the shared site yet. First pages stay in participants' own copies.
- Put the filled-in numbers on Box. Commit only the numbers that are taken to `roster.md`.
- Answer setup questions in the community space.
