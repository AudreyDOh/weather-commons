---
name: start-sketch
description: Start a new workshop sketch from the template, with the participant's assigned number, and make a first version of the page. Use when someone says they want to start, create or make a new sketch, page or project in this repository.
---

# Start a sketch

The person is probably new to code. Before each step, say what you're doing in one plain sentence.

1. **Ask, in one message**, for anything you don't know yet:
   - a short title for the sketch (it can change later);
   - their sketch number from the facilitators, for example 12. If they don't have one, ask them to check with a facilitator. Don't guess.
   - their name as it should appear on the site;
   - in a sentence or two, the weather event, practice or intervention they're interested in, and what they want to find out.

2. **Check where you are.** Run `git remote -v`. If `origin` is `RealtimeUrbanismLab/weather-commons` itself and they aren't a maintainer, stop. Explain that they first need their own copy (a fork), and point them to the setup guide: https://realtimeurbanismlab.github.io/weather-commons/guide/

3. **Make the sketch:**
   ```bash
   node scripts/new-sketch.mjs "<title>" --number <NN> --author "<name>"
   ```
   If it says the number is taken, tell them, and ask a facilitator for another.

4. **Make a first version** in `sketches/NN-name/`, from what they told you:
   - `index.html`: write their question where the template says "Write your question here". Keep the black-and-white style and the synthetic wind placeholder unless they ask for something else. Keep the label that says it's synthetic.
   - `README.md`: write the opening sentence and one or two lines under **1. Event**. Leave the other parts for later sessions.
   - In **Sources and limits**, list any source they mentioned, with what you know and "to check" for what you don't.

5. **Show it.**
   - If you can run commands on their computer, start a preview from the sketch folder (`python -m http.server 8000`, or the preview server in `.claude/launch.json`) and open it.
   - In a browser-only session, say that the page appears online once it's published.

6. **Finish:**
   - say in two or three sentences what you made and where the files are;
   - offer to publish it with the `publish` skill;
   - remind them they can share progress in the community space: https://community.ocean-archive.org/spaces/25478985
