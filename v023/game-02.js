/* =========================================================================

  CAREER MODE — tiers, progression, milestones

  ========================================================================= */

const TIER_ORDER = [

 'BCM League',

 'Enzo League',

 'Semi-Pro Tour',

 'Pro Tour',

 'Elite Level Pro',

 'All-Time Great',

];

const ALL_TIME_GREAT_MIN_RINGS = 8;

const ALL_TIME_GREAT_MIN_MVPS = 5;

const ALL_TIME_GREAT_MIN_PRESTIGE = 225;

function totalMVPs(pl){

 return (pl.regularSeasonMvps||0) + (pl.playoffMvps||0);

}

function qualifiesAllTimeGreat(pl, prestige){

 return !!pl &&

   (pl.championships||0) >= ALL_TIME_GREAT_MIN_RINGS &&

   totalMVPs(pl) >= ALL_TIME_GREAT_MIN_MVPS &&

   prestige >= ALL_TIME_GREAT_MIN_PRESTIGE;

}

function computeTier(score, pl){

 // All-Time Great is a legacy tier, not just a high average. Once earned, it sticks.

 if(pl && (pl.allTimeGreat || qualifiesAllTimeGreat(pl, score))){

   pl.allTimeGreat = true;

   return 'All-Time Great';

 }

 if(score < 120) return 'BCM League';

 if(score < 150) return 'Enzo League';

 if(score < 180) return 'Semi-Pro Tour';

 if(score < 210) return 'Pro Tour';

 return 'Elite Level Pro';

}

function tierRank(label){ return TIER_ORDER.indexOf(label); }

/* Tier status isn't pure bowling average — deep playoff runs, awards, and past

  finishes matter too. Rings and MVPs build prestige, but All-Time Great still

  requires a genuinely historic résumé. */

function computePrestigeScore(pl){

 const champBonus = (pl.championships||0) * 8;

 const mvpBonus = (pl.regularSeasonMvps||0) * 3 + (pl.playoffMvps||0) * 2;

 let finishBonus = 0;

 if(pl.finishHistory && pl.finishHistory.length){

   const recent = pl.finishHistory.slice(-3);

   const avgFinish = mean(recent);

   finishBonus = (5 - avgFinish) * 3;

 }

 return pl.careerAvg + champBonus + mvpBonus + finishBonus;

}

let careerModeOn = false;

let careerYear = 1;

let careerMilestones = []; // {year, text}

let careerHistoryLog = []; // {year, champion, mvp, comeback, playoffMVP, highRound}

let rivalryBook = {}; // pairKey -> playoff head-to-head history

let bulkSimMode = false;

let silentMode = false;

const SAVE_KEY = 'bcmBowlingLeagueArcadeV4';

 

function assignTierGroups(){

 const ranked = Object.values(PLAYERS).slice().sort((a,b)=>b.careerAvg-a.careerAvg);

 ranked.forEach((pl,i)=>{

   if(i<3){ pl.tierGroup='top'; pl.targetYear=10; pl.proTarget=215; }

   else if(i<6){ pl.tierGroup='mid'; pl.targetYear=15; pl.proTarget=205; }

   else { pl.tierGroup='bottom'; pl.targetYear=20; pl.proTarget=195; }

   pl.tier = computeTier(computePrestigeScore(pl), pl);

 });

}

 

function logMilestone(text){

 careerMilestones.push({ year: careerModeOn ? careerYear : seasonNumber, text });

 if(!bulkSimMode) renderCareerMilestones();

 if(!silentMode) showMilestoneToast(text);

}

 

function showMilestoneToast(text){

 const host = document.getElementById('milestoneToastHost');

 if(!host) return;

 const el = document.createElement('div');

 el.className = 'milestone-toast';

 el.textContent = text;

 host.appendChild(el);

 setTimeout(()=>{ el.classList.add('fade-out'); setTimeout(()=> el.remove(), 500); }, 4000);

}

 

function advancePlayerCareer(pl){

 const prevTier = pl.tier;

 if(careerYear <= 40){

   if(careerYear <= pl.targetYear){

     const remaining = pl.targetYear - careerYear + 1;

     const gap = pl.proTarget - pl.careerAvg;

     pl.careerAvg += gap / Math.max(1, remaining);

   } else {

     pl.careerAvg += (Math.random()-0.5)*2; // small plateau wobble

   }

 } else {

   if(!pl.seniorTour){

     pl.seniorTour = true;

     logMilestone(`🎗️ ${pl.emoji} ${pl.name} enters the Senior Tour at Year ${careerYear}.`);

   }

   pl.careerAvg -= (1 + Math.random()*2);

   pl.careerAvg = Math.max(pl.careerAvg, pl.startAvg*0.85);

 }

 pl.careerAvg = Math.round(pl.careerAvg*10)/10;

 pl.tier = computeTier(computePrestigeScore(pl), pl);

 if(pl.tier !== prevTier){

   const promoted = tierRank(pl.tier) > tierRank(prevTier);

   logMilestone(`${promoted?'⬆️':'⬇️'} ${pl.emoji} ${pl.name} ${promoted?'promoted to':'drops to'} ${pl.tier}.`);

 }

}

 

/* Snapshot the year that's about to end: champion, regular-season MVP,

  comeback player of the year, playoff MVP, and the season's high round.

  Must be called BEFORE season-specific fields are reset for the next year. */

function recordYearSummary(year){

 // Never write an empty/incomplete season into career history.

 if(careerHistoryLog.some(y=>y.year===year)) return true;

 if(currentWeek < TOTAL_WEEKS || !playoffs || !playoffs.champion){

   console.warn(`Career Year ${year} was not complete, so no history entry was recorded.`);

   return false;

 }

 const playersArr = Object.values(PLAYERS);

 if(!playersArr.length || !playersArr.some(pl=>pl.seasonGames.length)){

   console.warn(`Career Year ${year} had no game data, so no history entry was recorded.`);

   return false;

 }

 const mvp = playersArr.slice().sort((a,b)=>b.seasonTotal-a.seasonTotal)[0];

 let highRoundPlayer=null, highRoundVal=-1;

 playersArr.forEach(pl=> pl.seasonGames.forEach(g=>{ if(g>highRoundVal){ highRoundVal=g; highRoundPlayer=pl; } }));

 let comeback=null, comebackDelta=-999;

 playersArr.forEach(pl=>{

   if(pl.finishHistory && pl.finishHistory.length>=2){

     const cur = pl.finishHistory[pl.finishHistory.length-1];

     const prev = pl.finishHistory[pl.finishHistory.length-2];

     const delta = prev - cur; // positive = moved up in the standings

     if(delta>comebackDelta){ comebackDelta = delta; comeback = pl; }

   }

 });

 let playoffMVP=null, playoffMVPWins=0;

 if(playoffs.recordsWL){

   Object.entries(playoffs.recordsWL).forEach(([id,wins])=>{

     if(wins>playoffMVPWins){ playoffMVPWins=wins; playoffMVP=PLAYERS[id]; }

   });

 }

 const champion = playoffs.champion;

 // Career award counters are updated exactly once because the year guard above is idempotent.

 mvp.regularSeasonMvps = (mvp.regularSeasonMvps||0) + 1;

 if(playoffMVP) playoffMVP.playoffMvps = (playoffMVP.playoffMvps||0) + 1;

 careerHistoryLog.push({

   year,

   champion: { name:champion.name, emoji:champion.emoji },

   mvp: { name:mvp.name, emoji:mvp.emoji, total:mvp.seasonTotal },

   comeback: (comeback && comebackDelta>0) ? { name:comeback.name, emoji:comeback.emoji, delta:comebackDelta } : null,

   playoffMVP: playoffMVP ? { name:playoffMVP.name, emoji:playoffMVP.emoji, wins:playoffMVPWins } : null,

   highRound: highRoundPlayer ? { name:highRoundPlayer.name, emoji:highRoundPlayer.emoji, score:highRoundVal } : null,

 });

 renderHistoryChannel();

 return true;

}

function renderHistoryChannel(){

 const wrap = document.getElementById('historyChannelPanel');

 if(!wrap) return;

 if(careerHistoryLog.length===0){ wrap.style.display='none'; return; }

 wrap.style.display='block';

 const cards = careerHistoryLog.slice().reverse().map(y=>`

   <div class="history-year-card clickable" onclick="window.__openSeasonArchive(${y.year})">

     <div class="hy-year">Year ${y.year} · tap for full archive</div>

     <div class="hy-grid">

       <div><span class="hy-label">Champion</span><span class="hy-val">${y.champion ? y.champion.emoji+' '+y.champion.name : '—'}</span></div>

       <div><span class="hy-label">Regular Season MVP</span><span class="hy-val">${y.mvp ? y.mvp.emoji+' '+y.mvp.name+' ('+y.mvp.total+')' : '—'}</span></div>

       <div><span class="hy-label">Comeback Player</span><span class="hy-val">${y.comeback ? y.comeback.emoji+' '+y.comeback.name+' (+'+y.comeback.delta+' spots)' : '—'}</span></div>

       <div><span class="hy-label">Playoff MVP</span><span class="hy-val">${y.playoffMVP ? y.playoffMVP.emoji+' '+y.playoffMVP.name+' ('+y.playoffMVP.wins+'W)' : '—'}</span></div>

       <div><span class="hy-label">Season High Round</span><span class="hy-val">${y.highRound ? y.highRound.emoji+' '+y.highRound.name+' — '+y.highRound.score : '—'}</span></div>

     </div>

   </div>

 `).join('');

 document.getElementById('historyChannelContent').innerHTML = cards;

 document.getElementById('historyChannelSummary').textContent = `▸ View history channel (${careerHistoryLog.length} year${careerHistoryLog.length>1?'s':''})`;

}

function renderCareerMilestones(){

 const wrap = document.getElementById('careerMilestonesPanel');

 if(!wrap) return;

 if(careerMilestones.length===0){ wrap.style.display='none'; return; }

 wrap.style.display='block';

 const rows = careerMilestones.slice().reverse().slice(0,40).map(m=>`

   <tr><td class="odds-seed">${careerModeOn?'Year':'Season'} ${m.year}</td><td class="odds-name">${m.text}</td></tr>

 `).join('');

 document.getElementById('careerMilestonesContent').innerHTML = `<table class="odds-table">${rows}</table>`;

 document.getElementById('careerMilestonesSummary').textContent = `▸ View career milestones (${careerMilestones.length})`;

}

function updateResetButtonLabel(){

 const btn = document.getElementById('btnReset');

 if(!btn) return;

 if(!careerModeOn){

   btn.textContent = 'New Season';

   return;

 }

 btn.textContent = (playoffs && playoffs.champion)

   ? `Advance to Year ${careerYear+1}`

   : `Simulate to Year ${careerYear+1}`;

}

function setPlayoffButtonsDisabled(disabled){

 document.querySelectorAll('[data-role="nextMatch"]').forEach(b=> b.disabled = disabled);

 document.querySelectorAll('[data-role="simAllPlayoffs"]').forEach(b=> b.disabled = disabled);

}

 

let firstInit = true;

let seasonNumber = 1;

let hallOfFame = []; // {season, name, emoji, seed, seasonTotal}

 

function resetSeasonUI(){

 currentWeek = 0;

 standingsSnapshotPrev = null;

 weeklyRecaps = [];

 playoffs = null;

 seasonLocked = false;

 followedPlayerId = null;

 autoSimAfterModal = null;

 document.getElementById('recapPanel').style.display='none';

 document.getElementById('playoffIntroPanel').style.display='none';

 document.getElementById('playoffPanel').style.display='none';

 document.getElementById('championPanel').style.display='none';

 document.getElementById('oddsPanelWrap').style.display='none';

 document.getElementById('playoffRecapPanel').style.display='none';

 document.getElementById('playerCardModal').classList.add('hidden');

 document.getElementById('matchAnimModal').classList.add('hidden');

 if(typeof clearModalTimers === 'function') clearModalTimers();

 matchModal = { active:false, key:null, res:null, gameIndex:0, chainMode:false, timers:[], skipRequested:false };

 document.getElementById('btnWatchFinals').disabled = true;

 document.getElementById('btnSimToChamp').disabled = false;

 document.getElementById('pastRecaps').innerHTML='';

 document.getElementById('pastWeeksWrap').style.display='none';

 document.getElementById('latestRecap').innerHTML='';

 document.getElementById('btnSimWeek').disabled=false;

 document.getElementById('btnSimAll').disabled=false;

 setPlayoffButtonsDisabled(false);

 document.getElementById('controlHint').textContent = careerModeOn

   ? 'Career Mode: each "year" is a full season. Players gradually climb the league ladder toward pro caliber, then taper off after year 40.'

   : 'Each week, every bowler rolls three nights of three games apiece. Standings are cumulative pinfall — no head-to-head, pure aggregate. Results are freshly simulated every run, so no two seasons play out the same.';

 renderStandings(true);

 updateStatus();

 renderHallOfFame();

 renderCareerMilestones();

 renderHistoryChannel();

 renderCareerHub();

 renderRacePanel();

 updateResetButtonLabel();

}

 

function initSeason(){

 if(!firstInit) seasonNumber++;

 firstInit = false;

 PLAYERS = {};

 RAW_PLAYERS.forEach(p=> PLAYERS[p.id] = freshPlayerState(p));

 assignTierGroups();

 careerYear = 1;

 careerHistoryLog = [];

 resetSeasonUI();

}

 

function ensureCareerYearComplete(){

 if(!careerModeOn) return false;

 // Finish any remaining regular-season weeks first.

 while(currentWeek < TOTAL_WEEKS){ simulateWeek(); }

 // Defensive repair: a 10-week season should always have a bracket.

 if(currentWeek >= TOTAL_WEEKS && !playoffs){ lockRegularSeason(); }

 let guard=0;

 while(playoffs && !playoffs.champion && guard<100){

   const advanced = playNextMatch();

   if(!advanced) break;

   guard++;

 }

 if(!playoffs || !playoffs.champion){

   console.error(`Career Year ${careerYear} could not be completed; advancement was cancelled instead of writing a blank season.`);

   return false;

 }

 // Idempotent safety calls keep every completion route in sync.

 recordHallOfFame();

 renderBracket();

 showChampion();

 return true;

}

function advanceCareerYear(autoComplete=true){

 if(!careerModeOn) return false;

 if(autoComplete && !ensureCareerYearComplete()) return false;

 if(currentWeek < TOTAL_WEEKS || !playoffs || !playoffs.champion){

   console.warn(`Career Year ${careerYear} is incomplete; advancement was blocked.`);

   return false;

 }

 const endingYear = careerYear;

 const ordered = Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);

 ordered.forEach((pl,i)=>{

   const finish = i+1;

   pl.finishHistory[endingYear-1] = finish;

   pl.lastFinish = finish;

   pl.lastSeasonTotal = pl.seasonTotal;

   pl.lastSeasonWeeklyAvg = pl.weeklyTotals.length ? Math.round(mean(pl.weeklyTotals)) : 0;

   pl.lastSeasonLastWeekTotal = pl.lastWeekTotal || (pl.weeklyTotals.length ? pl.weeklyTotals[pl.weeklyTotals.length-1] : 0);

 });

 recordHallOfFame();

 if(!recordYearSummary(endingYear)) return false;

 finalizeCareerSeasonMetrics(endingYear);

 careerYear++;

 Object.values(PLAYERS).forEach(pl=>{

   pl.seasonGames = [];

   pl.weeklyTotals = [];

   pl.seasonTotal = 0;

   pl.lastWeekTotal = 0;

   pl.rank=0;

   pl.prevRank=0;

   pl.formState='NORMAL'; pl.formModifier=0; pl.formWeeksLeft=0;

   advancePlayerCareer(pl);

 });

 resetSeasonUI();

 return true;

}

/* Instantly resolves an entire career year (regular season + full playoffs),

  records every award/result, and advances to the next year. */

function simulateFullCareerYear(){

 return advanceCareerYear(true);

}

function simulateCareerYears(n){
 if(!careerModeOn) return;
 const priorBulk = bulkSimMode, priorSilent = silentMode;
 bulkSimMode = true; silentMode = true;
 try{
   if(playoffs && playoffs.champion){
     if(!advanceCareerYear(false)) return;
   }
   for(let i=0;i<n;i++){
     if(!simulateFullCareerYear()) break;
   }
 } finally {
   bulkSimMode = priorBulk; silentMode = priorSilent;
   renderAllCareerPanels();
   autosaveGame();
 }
}

/* Rolling blended average: 65% last-10 (career+season combined, chronological), 35% career avg */

function blendedAverage(pl){

 const combined = pl.careerHistory.concat(pl.seasonGames);

 const last10 = combined.slice(-10);

 const l10avg = mean(last10);

 return 0.65*l10avg + 0.35*pl.careerAvg;

}

 

function simulateGame(pl){

 const target = blendedAverage(pl) + (pl.formModifier||0);

 let mean_ = target, sd = pl.careerSd;

 const roll = Math.random();

 if(roll < 0.08){ mean_ += sd*0.9; sd *= 1.15; }        // hot night

 else if(roll < 0.16){ mean_ -= sd*0.9; sd *= 1.15; }   // cold night

 let score = Math.round(mean_ + sd * gaussian());

 score = clamp(score, 30, 300);

 pl.seasonGames.push(score);

 if(score > pl.allTimeHigh){

   const prev = pl.allTimeHigh;

   pl.allTimeHigh = score;

   logMilestone(`🎳 NEW CAREER HIGH — ${pl.emoji} ${pl.name} rolls ${score}, breaking the previous record of ${prev}!`);

 }

 return score;

}

 

function simulateNight(pl){

 const g = [simulateGame(pl), simulateGame(pl), simulateGame(pl)];

 return { games:g, total:g[0]+g[1]+g[2] };

}

 

