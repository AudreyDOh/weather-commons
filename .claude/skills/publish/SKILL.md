---
name: publish
description: Publish a workshop sketch. Check it, save it with git, put it online on the participant's own GitHub Pages site, and optionally send it to the shared Weather Commons site. Use when someone says publish, put it online, share it, save my work, or make it live.
---

# Publish a sketch

The person is probably new to git and GitHub. Before each step, say what you're doing in one plain sentence. Never force-push, and never change files outside their sketch folder.

1. **Find their sketch:** the `sketches/NN-name/` folder they've been working in. If they have more than one, ask which.

2. **Check it:**
   ```bash
   node scripts/check-sketches.mjs
   node scripts/check-sizes.mjs
   ```
   - Fix problems in their folder and explain each fix in a sentence.
   - Make sure the README has its header and a **Sources and limits** section, and that made-up data is labelled synthetic.
   - If `README.md` at the repository root changed, restore it (`git checkout -- README.md`).

3. **Save it.** Put the work on a branch named after the sketch, unless you're already on a working branch. Commit only their folder, with a message starting with the number:
   ```bash
   git add sketches/NN-name
   git commit -m "NN: <what changed, in a few words>"
   ```

4. **Put it online on their own site.**
   - Push the branch to their fork (`origin`).
   - Open a pull request into their fork's `main`, using `gh` or your GitHub tools. With `gh`, pass `--repo <their-username>/weather-commons`, because `gh` otherwise defaults to the upstream repository.
   - Merge it once they agree.
   - Check that GitHub Pages is switched on. With `gh`, run `gh api repos/<owner>/weather-commons/pages`.
     - **If it isn't on**, tell them how: on github.com, open their fork → **Actions** → enable workflows. Then **Settings → Pages → Source: GitHub Actions**. Then re-run the "pages" workflow.
   - The page is live about a minute after the "pages" workflow finishes: `https://<their-username>.github.io/weather-commons/NN-name/`. Give them this link.

5. **Add it to the shared site (only when they ask, usually from session 2).**
   - Open a pull request from their fork to `RealtimeUrbanismLab/weather-commons`, base `main`. It should change only `sketches/NN-name/`.
   - The title starts with the sketch number. Fill in the checklist in the pull request template.
   - Tell them a facilitator will review it, and the sketch then appears on https://realtimeurbanismlab.github.io/weather-commons/.

6. **Finish:** give them the live link and suggest posting it in the community space: https://community.ocean-archive.org/spaces/25478985

If a step fails, explain what happened in plain words, what you tried and what they can do. The setup guide covers common problems: https://realtimeurbanismlab.github.io/weather-commons/guide/
