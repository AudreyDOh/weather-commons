# Realtime Weather: how the workshop works

Realtime Weather is a working group in *Weather Commons*, TBA21–Academy's UNI program, led by Farzin Lotfi-Jam and Boone Mercado (Realtime Urbanism Lab, Cornell). It meets for four sessions, on Mondays from 2 to 23 November 2026.

We look at how weather is monitored, modelled, managed and shown in real time. We try to understand these practices on their own terms and to place them in their social, political and global context. We model an event and also its effects, through scientific, geographic, historical, humanities and critical approaches. Behind it all is the program's question: if the atmosphere is a commons, who has the right to change the weather?

Each person or small group makes one sketch: a small web page that models and explains one event. Together the sketches form a shared atlas of how weather becomes visible, governable and contested. Each sketch covers one bounded case. None tries to model the whole planet.

- Shared site: https://realtimeurbanismlab.github.io/weather-commons/
- Setup guide: https://realtimeurbanismlab.github.io/weather-commons/guide/
- Catalog of events: https://realtimeurbanismlab.github.io/weather-commons/catalog/
- Community space, for talking between sessions: https://community.ocean-archive.org/spaces/25478985

## The four parts

### 1. Event (2 November)

Choose a weather event, a way of measuring weather, or a contested intervention. The catalog is a good starting point.

Make a source list. For each source, note what it is: measured, reanalysed, modelled, made up for teaching, mapped, or told as a story. Find the instruments, institutions, computers and landscapes involved.

Leave with a one-page research question, a few sources, and a first page online.

### 2. Simulate (9 November)

Turn what you found into a small model, or start from the template's made-up wind field. Write down:
- the resolution, time and units;
- how values between data points are filled in;
- what you do with missing data;
- every change you make to the data.

Build one small experiment that shows how something moves or changes, including the event's effects. The aim is a result that's clear and can be checked, not one that's complete.

### 3. Situate (16 November)

Place the model in its world. That includes sensors, satellite ground stations, forecasting centres, airfields, archives, rivers, towns, military supply lines, legal borders and supply chains.

Keep what the model calculates apart from any claim about people or places. Being near a simulated plume isn't evidence of harm. Pair the model with a short sequence of places that tells its story.

### 4. Narrate and publish (23 November)

Present the event as a scene. Show:
- the source;
- the rule the model follows;
- what it calculated;
- where it happens;
- what you make of it;
- what it can't show.

Write a short public explanation. Before publishing, a peer review checks where every claim comes from, whether the page is easy to read, and whether it claims too much. Then the sketch joins the shared site.

## Roles

Groups of two to four work well. People can share roles:

- **Data steward:** keeps the source list and records every change to the data.
- **Modeller:** builds or checks the model.
- **Spatial researcher:** maps the infrastructure, places and institutions.
- **Writer:** shapes the story, and keeps a list of claims and their evidence.

## What a finished sketch includes

1. A page that runs on the shared site.
2. A source list with links, dates, licences, the steps you took and what you don't know.
3. Three to five places or institutions that matter to the story.
4. One sentence on what the model calculates, and one on what it can't establish.
5. A short story that goes with the page.

## Words we use

We keep these apart, on the page and in conversation:

- **Observation:** something measured, such as a weather station reading or a satellite image.
- **Reanalysis:** a best estimate of past weather, made by combining many observations with a model.
- **Forecast:** a model's prediction of future weather.
- **Simulation:** what our own model calculates.
- **Visualization:** how any of these is drawn, which also involves choices.
- **Interpretation:** what we say it means.

Show uncertainty as part of the work. Don't smooth it away.

## Working with Claude

Claude writes most of the code. You decide what the sketch says and check that it's true.

- Give Claude a clear question, your sources and a size limit for the data.
- First, ask it to find the units, time range, missing-data codes and licence in the source's own documentation.
- Ask it to make a small, derived version of the data, plus the script that made it, and to note every step.
- Before you trust a result, check a few values against the original source yourself, or ask someone else to. Trace each claim back to a document.
- Plausible numbers that Claude invents are never data.

Two shortcuts are built in. Ask Claude to **start a sketch** (the `start-sketch` skill), and to **publish** it (the `publish` skill).

## The pilot

Sketch 01, *Realtime Weather*, is a worked example with a globe, satellite imagery, cloud heights, terrain and a simple transport model. Its exercises for these sessions are in [sketches/01-realtime-weather-pilot/docs/WORKSHOP.md](../../sketches/01-realtime-weather-pilot/docs/WORKSHOP.md).

Sketch 02, *Haida witness composite*, models the 2012 Haida Gwaii iron dump.
