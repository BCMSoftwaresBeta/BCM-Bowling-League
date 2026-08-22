/* =========================================================================

  PLAYOFF RECAP

  ========================================================================= */

function buildPlayoffRecap(){

 const champ = playoffs.champion;

 const runner = null; // we'd need to track losers bracket runner-up to show here; for now just show champ

 const recap = `

   <div style="margin-bottom:18px;">

     <div style="text-align:center;">

       <div style="font-family:'Roboto Mono',monospace; font-size:12px; color:var(--polo); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px;">Season Champion</div>

       <div style="font-family:'Playfair Display',serif; font-size:28px; color:var(--gold-bright); margin-bottom:4px;">${champ.emoji} ${champ.name}</div>

       <div style="font-family:'Frank Ruhl Libre',serif; font-style:italic; color:var(--regent); font-size:15px;">Seed #${champ.seed}</div>

     </div>

   </div>

   <div style="border:1px solid var(--rule); border-radius:3px; padding:16px; background:rgba(75,107,149,0.06);">

     <div style="font-family:'Roboto Mono',monospace; font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--polo); margin-bottom:12px;">Playoff Journey</div>

     <div style="font-family:'Frank Ruhl Libre',serif; color:var(--botticelli); font-size:14px; line-height:1.6;">

       ${champ.name} advanced through double-elimination bracket, defeating all challengers in best-of-three format.

       Final victory clinches the 2026 BCM Bowling League Championship.

     </div>

   </div>

 `;

 document.getElementById('playoffRecapContent').innerHTML = recap;

 document.getElementById('playoffRecapPanel').style.display='block';

}

 

/* Update bracket card rendering to show W-L */

function matchCardHtmlWithRecords(m){

 const A = m.getA(), B = m.getB();

 const cls = m.played ? 'done' : (A && B ? 'live' : '');

 if(m.skipped){

   return `<div class="match"><div class="round-label" style="margin:0 0 4px;">${m.roundLabel}</div>

     <div class="m-side tbd"><span class="who">Not needed</span></div></div>`;

 }

 let aHtml, bHtml, gamesLine='';

 if(!m.played){

   aHtml = A ? sideHtml(A) : sideHtml(null,undefined,false,true);

   bHtml = B ? sideHtml(B) : sideHtml(null,undefined,false,true);

 } else {

   const r = m.result;

   const wlA = playoffs.recordsWL && playoffs.recordsWL[r.pA.id] ? playoffs.recordsWL[r.pA.id] : 0;

   const wlB = playoffs.recordsWL && playoffs.recordsWL[r.pB.id] ? playoffs.recordsWL[r.pB.id] : 0;

   aHtml = `<div class="m-side ${r.winner.id===r.pA.id?'winner':''}">

     <span class="who">${r.pA.emoji} ${r.pA.name}<span class="seed">#${r.pA.seed} (${wlA}W)</span></span>

     <span class="score">${r.totalA}</span>

   </div>`;

   bHtml = `<div class="m-side ${r.winner.id===r.pB.id?'winner':''}">

     <span class="who">${r.pB.emoji} ${r.pB.name}<span class="seed">#${r.pB.seed} (${wlB}W)</span></span>

     <span class="score">${r.totalB}</span>

   </div>`;

   gamesLine = `<div class="m-games">${r.pA.name}: ${r.gamesA.join('-')} &nbsp;|&nbsp; ${r.pB.name}: ${r.gamesB.join('-')}</div>`;

 }

 return `<div class="match ${cls}">

   <div class="round-label" style="margin:0 0 4px;">${m.roundLabel}</div>

   ${aHtml}<div class="m-mid-rule"></div>${bHtml}

   ${gamesLine}

 </div>`;

}

 

/* Play a single 3-game aggregate match between two players */

function playMatch(pA, pB){

 const gamesA=[simulateGame(pA),simulateGame(pA),simulateGame(pA)];

 const gamesB=[simulateGame(pB),simulateGame(pB),simulateGame(pB)];

 const totalA=gamesA.reduce((x,y)=>x+y,0), totalB=gamesB.reduce((x,y)=>x+y,0);

 let winner,loser,winScore,loseScore,winGames,loseGames;

 if(totalA>=totalB){ winner=pA; loser=pB; winScore=totalA; loseScore=totalB; winGames=gamesA; loseGames=gamesB; }

 else { winner=pB; loser=pA; winScore=totalB; loseScore=totalA; winGames=gamesB; loseGames=gamesA; }

 return { pA,pB,gamesA,gamesB,totalA,totalB,winner,loser,winScore,loseScore };

}

 

/* Find the key of the next playable match without playing it. Auto-marks

  unneeded grand-final matches as skipped along the way. */

function getNextPlayableMatchKey(){

 if(!playoffs || playoffs.champion) return null;

 const gfKeys = ['GF1','GF2','GF3'];

 for(const key of playoffs.order){

   const m = playoffs.M[key];

   if(m.played) continue;

   if(gfKeys.includes(key)){

     const wins = Object.values(playoffs.gfWins);

     if(wins.some(w=>w>=2)) { m.played=true; m.skipped=true; continue; }

     if(key==='GF3'){

       const vals = Object.values(playoffs.gfWins);

       if(!(vals.length===2 && vals[0]===1 && vals[1]===1)){ m.played=true; m.skipped=true; continue; }

     }

   }

   const A = m.getA(), B = m.getB();

   if(!A || !B) continue; // dependency not resolved yet, try next in order

   return key;

 }

 return null;

}

 

/* Compute (but do not commit to the bracket) the real result for a match.

  Safe to call more than once for the same still-unplayed key: if the

  animation modal was closed mid-reveal, the same computed result is reused

  instead of re-simulating (which would double-count games in season stats). */

function resolveMatch(key){

 if(playoffs.pending && playoffs.pending.key===key) return playoffs.pending.res;

 const m = playoffs.M[key];

 const A = m.getA(), B = m.getB();

 const res = playMatchTrack(A,B);

 playoffs.pending = { key, res };

 return res;

}

 

/* Finalize a resolved match into the bracket: marks it played, updates

  win/loss records, grand-final series tracking, and crowns a champion

  if the series is decided. */

function commitMatch(key, res){

 const m = playoffs.M[key];

 if(!m || m.played) return;

 m.played = true;

 m.result = { winner:res.winner.id, loser:res.loser.id, ...res };

 if(playoffs.pending && playoffs.pending.key===key) playoffs.pending = null;

 

 const gfKeys = ['GF1','GF2','GF3'];

 recordRivalryMatch(res, gfKeys.includes(key));

 if(gfKeys.includes(key)){

   playoffs.gfWins[res.winner.id] = (playoffs.gfWins[res.winner.id]||0)+1;

   const w = Object.values(playoffs.gfWins);

   if(Math.max(...w)>=2){

     playoffs.champion = res.winner;

     gfKeys.forEach(k=>{ if(!playoffs.M[k].played){ playoffs.M[k].played=true; playoffs.M[k].skipped=true; } });

     recordHallOfFame();

     buildPlayoffRecap();

   }

 }

 if(!bulkSimMode) autosaveGame();

}

 

/* Advance exactly one unplayed match instantly, no animation. Used by

  "Simulate Rest of Playoffs". */

function playNextMatch(){

 const key = getNextPlayableMatchKey();

 if(!key) return false;

 const res = resolveMatch(key);

 commitMatch(key, res);

 return true;

}

 

function simulateAllPlayoffs(){

 if(followedPlayerId){ simulateRestRespectingFollow(false); return; }

 let guard=0;

 while(!playoffs.champion && guard<60){

   const advanced = playNextMatch();

   guard++;

   if(!advanced) break;

 }

 renderBracket();

 if(playoffs.champion) showChampion();

}

 

/* Instantly resolve the winners/losers brackets, but stop right before the

  grand final so the championship can be watched via the animation. */

function simToChampionship(){

 if(!playoffs || playoffs.champion) return;

 if(followedPlayerId){ simulateRestRespectingFollow(true); return; }

 const gfKeys = ['GF1','GF2','GF3'];

 let guard=0;

 while(guard<60){

   const key = getNextPlayableMatchKey();

   if(!key || gfKeys.includes(key)) break;

   playNextMatch();

   guard++;

 }

 renderBracket();

}

 

/* Instantly resolves every match EXCEPT ones involving the followed player —

  those pause the auto-sim and open the live animation so the user can

  watch just their player's games. Resumes automatically once that match's

  modal is closed (see closeMatchModal). */

function simulateRestRespectingFollow(stopBeforeFinals){

 if(!playoffs || playoffs.champion){ renderBracket(); return; }

 const gfKeys = ['GF1','GF2','GF3'];

 let guard=0;

 while(guard<60){

   const key = getNextPlayableMatchKey();

   if(!key) break;

   if(stopBeforeFinals && gfKeys.includes(key)) break;

   const m = playoffs.M[key];

   const A = m.getA(), B = m.getB();

   if(A && B && (A.id===followedPlayerId || B.id===followedPlayerId)){

     autoSimAfterModal = { stopBeforeFinals };

     openMatchForKey(key, false);

     return;

   }

   playNextMatch();

   guard++;

 }

 renderBracket();

 if(playoffs.champion) showChampion();

}

 

/* =========================================================================

  MATCH ANIMATION MODAL — reveals an already-resolved match game-by-game

  with a simple bowling animation, instead of showing the result instantly.

  ========================================================================= */

const ANIM_STEPS = 7;
const ANIM_STEP_MS = 950;
const ANIM_ROLL_MS = 520;

let matchModal = { active:false, key:null, res:null, gameIndex:0, chainMode:false, timers:[], skipRequested:false };

function scoreIncrements(final, steps){
 if(final<=0) return Array(steps).fill(0);
 const weights = Array.from({length:steps}, ()=> 0.4+Math.random());
 const sumW = weights.reduce((a,b)=>a+b,0);
 let incs = weights.map(w=> Math.round(final*w/sumW));
 let drift = final - incs.reduce((a,b)=>a+b,0);
 incs[incs.length-1] += drift;
 for(let i=0;i<incs.length;i++){ if(incs[i]<0){ incs[incs.length-1] += incs[i]; incs[i]=0; } }
 const sum2 = incs.reduce((a,b)=>a+b,0);
 if(sum2!==final) incs[incs.length-1] += (final-sum2);
 return incs;
}

function clearModalTimers(){ matchModal.timers.forEach(t=>clearTimeout(t)); matchModal.timers = []; }

function openMatchForKey(key, chainMode){
 const m = playoffs.M[key]; const A = m.getA(), B = m.getB();
 clearModalTimers();
 matchModal = { active:true, key, res:null, gameIndex:0, chainMode, timers:[], skipRequested:false };
 document.getElementById('matchModalTitle').textContent = `${A.emoji} ${A.name} vs ${B.emoji} ${B.name}`;
 document.getElementById('matchModalSub').textContent = m.roundLabel + (chainMode ? ' · Championship Series' : '');
 renderMatchModalIntro(A,B);
 document.getElementById('matchAnimModal').classList.remove('hidden');
}

function renderMatchModalIntro(A,B){
 document.getElementById('matchModalBody').innerHTML = `<div class="game-progress">Game 1 of 3</div><div class="lanes-wrap">${laneHtml('A', A, 0)}${laneHtml('B', B, 0)}</div><div class="game-log">Best of three games decides this match.</div><div class="match-modal-actions"><button class="primary" id="btnStartGame">Start Game</button></div>`;
 document.getElementById('btnStartGame').addEventListener('click', beginCurrentGameAnimation);
}

function laneHtml(side, player, score){
 return `<div class="bowl-lane"><div class="lane-name"><span class="em">${player.emoji}</span>${player.name}</div><div class="pin-rack" id="pinRack${side}"><div class="pin-row"><div class="pin"></div><div class="pin"></div><div class="pin"></div><div class="pin"></div></div><div class="pin-row"><div class="pin"></div><div class="pin"></div><div class="pin"></div></div><div class="pin-row"><div class="pin"></div><div class="pin"></div></div><div class="pin-row"><div class="pin"></div></div></div><div class="lane-track"><div class="bowl-ball" id="ball${side}"></div></div><div class="lane-score"><span id="score${side}">${score}</span><span class="lbl">pins</span></div></div>`;
}

function beginCurrentGameAnimation(){
 if(!matchModal.res) matchModal.res = resolveMatch(matchModal.key);
 const idx = matchModal.gameIndex, finalA = matchModal.res.gamesA[idx], finalB = matchModal.res.gamesB[idx];
 const incsA = scoreIncrements(finalA, ANIM_STEPS), incsB = scoreIncrements(finalB, ANIM_STEPS);
 document.getElementById('matchModalBody').innerHTML = `<div class="game-progress">Game ${idx+1} of 3</div><div class="lanes-wrap">${laneHtml('A', matchModal.res.pA, 0)}${laneHtml('B', matchModal.res.pB, 0)}</div><div class="game-log" id="gameLog">Rolling…</div><div class="match-modal-actions"><button class="ghost" id="btnSkipAnim">Skip Animation</button></div>`;
 document.getElementById('btnSkipAnim').addEventListener('click', ()=>{ matchModal.skipRequested = true; clearModalTimers(); finishGameReveal(finalA, finalB); });
 let running = { A:0, B:0 };
 const runStep = (step) => {
   if(matchModal.skipRequested || step>=ANIM_STEPS){ finishGameReveal(finalA, finalB); return; }
   const ballA = document.getElementById('ballA'), ballB = document.getElementById('ballB');
   const pinsA = document.querySelectorAll('#pinRackA .pin'), pinsB = document.querySelectorAll('#pinRackB .pin');
   if(ballA) ballA.classList.add('rolling'); if(ballB) ballB.classList.add('rolling');
   matchModal.timers.push(setTimeout(()=>{
     if(matchModal.skipRequested){ finishGameReveal(finalA, finalB); return; }
     pinsA.forEach(p=>{ if(Math.random()<0.55) p.classList.add('down'); }); pinsB.forEach(p=>{ if(Math.random()<0.55) p.classList.add('down'); });
     running.A += incsA[step]; running.B += incsB[step];
     const scoreA = document.getElementById('scoreA'), scoreB = document.getElementById('scoreB');
     if(scoreA) scoreA.textContent = running.A; if(scoreB) scoreB.textContent = running.B;
   }, ANIM_ROLL_MS));
   matchModal.timers.push(setTimeout(()=>{
     if(matchModal.skipRequested){ finishGameReveal(finalA, finalB); return; }
     if(ballA) ballA.classList.remove('rolling'); if(ballB) ballB.classList.remove('rolling');
     pinsA.forEach(p=>p.classList.remove('down')); pinsB.forEach(p=>p.classList.remove('down')); runStep(step+1);
   }, ANIM_STEP_MS));
 };
 runStep(0);
}

function finishGameReveal(finalA, finalB){
 clearModalTimers();
 const scoreA = document.getElementById('scoreA'), scoreB = document.getElementById('scoreB'); if(scoreA) scoreA.textContent = finalA; if(scoreB) scoreB.textContent = finalB;
 const log = document.getElementById('gameLog'); const idx = matchModal.gameIndex; const A = matchModal.res.pA, B = matchModal.res.pB;
 if(log) log.textContent = `Game ${idx+1}: ${A.name} ${finalA} — ${B.name} ${finalB}`;
 matchModal.gameIndex++;
 const actions = document.querySelector('.match-modal-actions');
 if(matchModal.gameIndex < 3){
   if(actions) actions.innerHTML = `<button class="primary" id="btnNextGame">Start Game ${matchModal.gameIndex+1}</button><button class="ghost" id="btnSkipRest">Skip Animation</button>`;
   const nextBtn = document.getElementById('btnNextGame'), skipBtn = document.getElementById('btnSkipRest');
   if(nextBtn) nextBtn.addEventListener('click', ()=>{ matchModal.skipRequested=false; beginCurrentGameAnimation(); });
   if(skipBtn) skipBtn.addEventListener('click', ()=>{ revealRemainingGamesInstantly(); });
 } else showMatchSummary();
}

function revealRemainingGamesInstantly(){ clearModalTimers(); showMatchSummary(); }

function showMatchSummary(){
 clearModalTimers(); const key = matchModal.key, res = matchModal.res; commitMatch(key, res); renderBracket();
 document.getElementById('matchModalBody').innerHTML = `<div class="match-summary"><div class="winner-line">${res.winner.emoji} ${res.winner.name} wins the match</div><div class="score-line">${res.gamesA.join('-')} (${res.totalA}) &nbsp;vs&nbsp; ${res.gamesB.join('-')} (${res.totalB})</div></div><div class="match-modal-actions" id="postMatchActions"></div>`;
 const nextKey = getNextPlayableMatchKey(); const gfKeys = ['GF1','GF2','GF3']; const actions = document.getElementById('postMatchActions');
 if(matchModal.chainMode && nextKey && gfKeys.includes(nextKey) && !playoffs.champion){
   const label = playoffs.M[nextKey].roundLabel; actions.innerHTML = `<button class="primary" id="btnContinueChain">Play ${label}</button>`;
   document.getElementById('btnContinueChain').addEventListener('click', ()=>{ openMatchForKey(nextKey, true); });
 } else {
   const label = playoffs.champion ? 'Close' : 'Continue'; actions.innerHTML = `<button class="primary" id="btnCloseMatchModal">${label}</button>`;
   document.getElementById('btnCloseMatchModal').addEventListener('click', closeMatchModal);
 }
}

function closeMatchModal(){
 clearModalTimers(); matchModal.active = false; document.getElementById('matchAnimModal').classList.add('hidden'); renderBracket();
 if(autoSimAfterModal){ const opts = autoSimAfterModal; autoSimAfterModal = null; simulateRestRespectingFollow(opts.stopBeforeFinals); }
}

