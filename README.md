# BCM Bowling League

BCM Bowling League is a browser-based bowling career simulator and championship arcade game.

## Current build

**Beta v0.3.0d — A3 UX Fixes**

This repository is the stable development copy used for testing and future releases.

## v0.3.0d highlights

- Stable championship bowling core preserved
- New-season Live Leaderboard uses the prior season's final playoff order
- Corrected pin orientation
- BCM Wallaby STRIKE stinger plus Turkey / five-bagger moments
- Character-anchored signature speech bubbles for Bau, Farb, and Woo
- Championship pin-differential HUD for game and total pins ahead/behind
- Broadcast lower-third with working minimize / expand control
- Championship-point camera beat and expanded title-clinch presentation
- Start Fresh control with confirmation that resets the local career to Year 1
- Existing custom bowlers, tier jerseys, history, rivalries, saves, and championship flow remain intact

## Saving

The current beta automatically saves career progress in the browser using `localStorage`. The in-game **Share Save Code** and **Import Save** tools can move a career between browsers or devices manually. Cloud accounts and shared league saves are planned for a later phase.

## Development workflow

1. Test the latest build on the GitHub Pages site.
2. Report bugs, screenshots, balance concerns, or feature ideas in ChatGPT.
3. ChatGPT updates the repository and build version.
4. Refresh the Pages site and test again.

## Next phase: A4

Planned A4 work focuses on championship-arena immersion: visible Wii/Mii-style crowd characters, crowd reactions that scale with the moment, stronger arena atmosphere, and a **1x / 2x championship watch-speed option** so CPU-vs-CPU finals can be watched faster without changing results.

## Later career-generation phase

The generation/lineage system is planned for a later major career update, not yet in the current build. The target design is a new generation every 50 years, with descendants such as Bau Jr., Bau III, Bau IV, etc., inherited bowling identity with some talent variation, lineage records, era records, retirement ceremonies, and Hall of Fame classes.
