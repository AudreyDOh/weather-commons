# 23 · undecidedaudrey

Author: Audrey Doh · Started: 2026-11-02 · Status: sketch · Stack: static HTML + JS

A first research sketch by Audrey Doh, with the weather case still to be chosen. The page includes a clearly labelled synthetic wind example from the workshop template.

## Run

Online: https://audreydoh.github.io/weather-commons/23-undecidedaudrey/

From this sketch folder:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. No packages or build step are needed for this sketch.

## 1. Event

The weather event, practice or intervention, its place and its period are undecided.

Working question: which weather event, practice or intervention will this sketch examine, and what can its sources show? This question will be narrowed when a case is selected.

## 2. Simulate

The starter template animates 1,500 particles. Each animation frame adds 1.2 pixels east and 0.2 pixels north, with uniform random spread of up to 0.3 pixels per axis. Particles wrap around the edges.

This is a synthetic screen-space demonstration. It has no geographic grid, physical units, real time range, missing observations or interpolation of measured data. Its apparent speed depends on the display’s frame rate. The movement rule is unchanged from the template; initial positions and spread are random, so each visit differs.

## 3. Situate

No real places or institutions have been selected yet. Add three to five relevant places or institutions after the case is chosen.

## 4. Narrate

This is the starting page for a personal workshop project. It shows how an invented movement rule becomes an animation. It makes no claims about an actual weather event or its effects.

## Sources and limits

- **Realtime Weather starter template**, Realtime Urbanism Lab, `sketches/_template/index.html` at repository revision `613d7f6` (copied 2026-11-02): https://github.com/RealtimeUrbanismLab/weather-commons/tree/613d7f6/sketches/_template. Code: MIT. Original text: CC BY 4.0. Type: synthetic and illustrative. This sketch adds its title, author, research status, accessible canvas description and explanations; the movement rule is unchanged.
- **Weather datasets:** none. There are no observations, reanalyses or forecasts on this page. Event-specific sources and their versions, dates, licences and transformations are still to be selected.

The model calculates particle positions in pixels. It cannot establish real wind, rainfall, the effectiveness of weather modification, or harm to people or ecosystems. The animation has no mapped location or historical period.
