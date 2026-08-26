# BCM Bowling League

BCM Bowling League is a browser-based bowling career simulator and championship arcade game.

## Current build

**Beta v0.3.1d — A4 Frame 10 Fix**

This repository is the stable development copy used for testing and future releases.

## v0.3.1d highlights

- Stable championship scoring and bracket logic preserved
- 1x / 2x championship watch-speed controls
- Visible championship crowd characters with scaled reactions
- Centered BCM crowd sign plus BENNY sign
- More varied visual ball paths for pocket hits, Brooklyn hits, spares, misses, and real gutter balls
- Visible pin leaves now stay synchronized with the scored pin count
- Correct fresh-rack visual logic for 10th-frame strike and spare bonus balls
- Championship pin-differential HUD for game and total pins ahead/behind
- Broadcast lower-third with minimize / expand control
- Existing A3 title-clinch presentation, Start Fresh control, signature speech, streak graphics, custom bowlers, tier jerseys, history, rivalries, and saves remain intact

## Saving

The current beta automatically saves career progress in the browser using `localStorage`. The in-game **Share Save Code** and **Import Save** tools can move a career between browsers or devices manually. Cloud accounts and shared league saves are planned for a later phase.

## Development workflow

1. Test the latest build on the GitHub Pages site.
2. Report bugs, screenshots, balance concerns, or feature ideas in ChatGPT.
3. ChatGPT updates the repository and build version.
4. Refresh the Pages site and test again.

## Next phase: A5

Planned A5 work is the broadcast and arena-cinematics pass: stronger arena lighting, current-bowler spotlighting, championship-point lighting changes, larger title-clinch lighting effects, selective camera/crowd cutaways for major moments, more polished championship framing, and tighter visual integration of the lower-third and pin-differential HUD.

## Later career-generation phase

The generation/lineage system is planned for a later major career update, not yet in the current build. The target design is a new generation every 50 years, with descendants such as Bau Jr., Bau III, Bau IV, etc., inherited bowling identity with some talent variation, lineage records, era records, retirement ceremonies, and Hall of Fame classes.
