/* =========================================================================

  REGULAR SEASON — WEEK SIMULATION

  ========================================================================= */

function simulateWeek(){

 if(seasonLocked) return;

 currentWeek++;

 const formEvents = prepareWeeklyForms();

 const weekData = {}; // playerId -> {nights:[...], weekTotal}

 Object.values(PLAYERS).forEach(pl=>{

   const nights = [simulateNight(pl), simulateNight(pl), simulateNight(pl)];

   const weekTotal = nights.reduce((a,n)=>a+n.total,0);

   pl.weeklyTotals.push(weekTotal);

   pl.lastWeekTotal = weekTotal;

   pl.seasonTotal += weekTotal;

   weekData[pl.id] = { nights, weekTotal };

 });

 

 // snapshot standings before ranking update (for movement)

 const prevOrder = Object.values(PLAYERS).slice().sort((a,b)=> (b.seasonTotal-b.lastWeekTotal) - (a.seasonTotal-a.lastWeekTotal));

 prevOrder.forEach((pl,i)=> pl.prevRank = i+1);

 

 const newOrder = Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);

 newOrder.forEach((pl,i)=> pl.rank = i+1);

 

 buildRecap(weekData, newOrder, formEvents);

 decayWeeklyForms();

 if(!bulkSimMode){
   renderStandings(false);
   updateStatus();
   renderRacePanel();
   renderCareerHub();
 }

 

 if(currentWeek >= TOTAL_WEEKS){

   lockRegularSeason();

 }

 if(!bulkSimMode) autosaveGame();

}

 

function buildRecap(weekData, orderedStandings, formEvents){

 let weekLeaderId=null, weekLeaderTotal=-1;

 let highGamePlayer=null, highGameVal=-1;

 Object.entries(weekData).forEach(([id,d])=>{

   if(d.weekTotal>weekLeaderTotal){ weekLeaderTotal=d.weekTotal; weekLeaderId=id; }

   d.nights.forEach(n=> n.games.forEach(g=>{

     if(g>highGameVal){ highGameVal=g; highGamePlayer=id; }

   }));

 });

 let bigRiser=null, riserDelta=-999;

 Object.values(PLAYERS).forEach(pl=>{

   const delta = pl.prevRank - pl.rank;

   if(delta>riserDelta){ riserDelta=delta; bigRiser=pl.id; }

 });

 const leader = orderedStandings[0];

 weeklyRecaps.push({

   week: currentWeek,

   weekLeader: PLAYERS[weekLeaderId].name+' '+PLAYERS[weekLeaderId].emoji,

   weekLeaderTotal,

   highGame: PLAYERS[highGamePlayer].name+' '+PLAYERS[highGamePlayer].emoji,

   highGameVal,

   bigRiser: riserDelta>0 ? (PLAYERS[bigRiser].name+' '+PLAYERS[bigRiser].emoji) : null,

   riserDelta,

   seasonLeader: leader.name+' '+leader.emoji,

   seasonLeaderTotal: leader.seasonTotal,

   stories: generateWeeklyStorylines(weekData, orderedStandings, formEvents||[]),

 });

 if(PLAYERS[weekLeaderId]) PLAYERS[weekLeaderId].playerOfWeekAwards = (PLAYERS[weekLeaderId].playerOfWeekAwards||0)+1;

 renderRecap();

}

 

function renderRecap(){

 if(bulkSimMode) return;

 document.getElementById('recapPanel').style.display='block';

 const latest = weeklyRecaps[weeklyRecaps.length-1];

 document.getElementById('latestRecap').innerHTML = recapCardHtml(latest);

 const past = weeklyRecaps.slice(0,-1).reverse();

 const wrap = document.getElementById('pastWeeksWrap');

 if(past.length>0){

   wrap.style.display='block';

   document.getElementById('pastRecaps').innerHTML = past.map(recapCardHtml).join('');

 }

}

 

function recapCardHtml(r){

 return `<div class="recap-card">

   <div class="wk">Week ${r.week} of ${TOTAL_WEEKS}</div>

   <div class="recap-grid">

     <div class="recap-item"><div class="label">Week Leader</div><div class="value"><span class="accent">${r.weekLeader}</span> — ${r.weekLeaderTotal} pins</div></div>

     <div class="recap-item"><div class="label">High Game</div><div class="value">${r.highGame} — <span class="accent">${r.highGameVal}</span></div></div>

     <div class="recap-item"><div class="label">Biggest Riser</div><div class="value">${r.bigRiser ? r.bigRiser+' <span class="accent">(+'+r.riserDelta+' spots)</span>' : '— no change —'}</div></div>

     <div class="recap-item"><div class="label">Season Leader</div><div class="value"><span class="accent">${r.seasonLeader}</span> — ${r.seasonLeaderTotal} pins</div></div>

   </div>

   ${r.stories && r.stories.length ? `<div class="story-stack">${r.stories.map(x=>`<div class="story-line">${x}</div>`).join('')}</div>` : ''}

 </div>`;

}

 

/* =========================================================================

  STANDINGS RENDER

  ========================================================================= */

function renderStandings(initial){

 const tbody = document.getElementById('standingsBody');

 const players = Object.values(PLAYERS);

 const showingPriorSeason = careerModeOn && currentWeek===0 && players.some(pl=>pl.lastFinish!==null);

 const ordered = players.slice().sort((a,b)=>{

   if(showingPriorSeason){

     return (a.lastFinish ?? 99) - (b.lastFinish ?? 99);

   }

   return (b.seasonTotal-a.seasonTotal) || (b.careerAvg-a.careerAvg);

 });

 ordered.forEach((pl,i)=> pl.rank = showingPriorSeason ? (pl.lastFinish || i+1) : i+1);

 tbody.innerHTML = ordered.map(pl=>{

   const currentWeeklyAvg = pl.weeklyTotals.length ? Math.round(mean(pl.weeklyTotals)) : 0;

   const weeklyAvg = showingPriorSeason ? pl.lastSeasonWeeklyAvg : currentWeeklyAvg;

   const weekValue = showingPriorSeason

     ? (pl.lastSeasonLastWeekTotal || '—')

     : (pl.lastWeekTotal || (pl.weeklyTotals.length ? pl.weeklyTotals[pl.weeklyTotals.length-1] : '—'));

   const totalValue = showingPriorSeason ? pl.lastSeasonTotal : pl.seasonTotal;

   let deltaHtml = '<span class="delta flat">—</span>';

   if(!showingPriorSeason && !initial && pl.weeklyTotals.length>0){

     const moved = pl.prevRank - pl.rank;

     if(moved>0) deltaHtml = `<span class="delta up">▲ ${moved}</span>`;

     else if(moved<0) deltaHtml = `<span class="delta down">▼ ${Math.abs(moved)}</span>`;

     else deltaHtml = `<span class="delta flat">— hold</span>`;

   }

   const tRank = Math.max(0, tierRank(pl.tier));

   return `<tr class="${!initial && !showingPriorSeason ? 'updated':''}">

     <td class="rank ${pl.rank<=3?'top3':''}">${pl.rank}</td>

     <td class="pname" style="cursor:pointer;" onclick="window.__showPlayerCard('${pl.id}')"><span class="emoji">${pl.emoji}</span>${pl.name}${accoladeMiniHtml(pl)}<span class="tier-pill t${tRank}">${pl.tier}</span></td>

     <td class="num">${weekValue}</td>

     <td class="num">${weeklyAvg || '—'}</td>

     <td class="num season-total">${totalValue}</td>

     <td class="movement">${deltaHtml}</td>

   </tr>`;

 }).join('');

 const weekHead = document.getElementById('standingsWeekHead');

 const avgHead = document.getElementById('standingsAvgHead');

 const totalHead = document.getElementById('standingsTotalHead');

 if(weekHead) weekHead.textContent = showingPriorSeason ? 'Prev. Final Week' : 'This Week';

 if(avgHead) avgHead.textContent = showingPriorSeason ? 'Prev. Weekly Avg' : 'Weekly Avg';

 if(totalHead) totalHead.textContent = showingPriorSeason ? 'Prev. Season Total' : 'Season Total';

 document.getElementById('leaderboardSub').textContent = showingPriorSeason

   ? `Year ${careerYear} preseason · showing Year ${careerYear-1} final standings`

   : (currentWeek===0 ? 'Season not yet started' : `Through Week ${currentWeek} of ${TOTAL_WEEKS}`);

}

function updateStatus(){

 document.getElementById('weekIndicator').textContent = seasonLocked

   ? (playoffs && playoffs.champion ? 'Season Complete' : 'Regular Season Complete')

   : `Week ${currentWeek} of ${TOTAL_WEEKS}`;

 document.getElementById('seasonStatus').firstChild.textContent = seasonLocked ? 'Playoffs ' : 'Regular Season ';

 const yearBadge = document.getElementById('careerYearBadge');

 if(yearBadge) yearBadge.textContent = careerModeOn ? ` · Career Year ${careerYear}` : '';

 if(!bulkSimMode){ renderCareerHub(); renderRacePanel(); }

}

 

/* =========================================================================

  LOCK REGULAR SEASON -> SEED BRACKET

  ========================================================================= */

function lockRegularSeason(){

 seasonLocked = true;

 document.getElementById('btnSimWeek').disabled = true;

 document.getElementById('btnSimAll').disabled = true;

 document.getElementById('controlHint').textContent = 'Regular season closed. Scroll down to view seeding and start the playoffs.';

 const seeded = Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);

 seeded.forEach((pl,i)=> pl.seed = i+1);

 playoffs = { seeds: seeded, matches: [], idx:0, champion:null, buildOnly:true, recordsWL:{} };

 buildBracketStructure();

 if(!bulkSimMode){
   buildOddsTable();
   populateFollowPlayerSelect(seeded);
   document.getElementById('playoffIntroPanel').style.display='block';
   updateStatus();
 }

}

 

let followedPlayerId = null;

let autoSimAfterModal = null; // null, or { stopBeforeFinals: bool } — set when the auto-sim loop pauses for a followed player's match

 

function populateFollowPlayerSelect(seeded){

 followedPlayerId = null;

 const sel = document.getElementById('followPlayerSelect');

 if(!sel) return;

 sel.innerHTML = '<option value="">— Watch All Games —</option>' +

   seeded.map(pl=>`<option value="${pl.id}">${pl.emoji} ${pl.name} (#${pl.seed})</option>`).join('');

 sel.value = '';

}

 

/* =========================================================================

  PLAYOFF ENGINE

  Fixed-shape double-elimination for 9 seeds:

    PI: 8 vs 9

    QF1: 1 vs W(PI)   QF2: 4 vs 5   QF3: 3 vs 6   QF4: 2 vs 7

    SF1: W(QF1) vs W(QF2)   SF2: W(QF3) vs W(QF4)

    WF:  W(SF1) vs W(SF2)  -> Winners Bracket Champion

    LR1: pool = [L(PI), L(QF1..4)] (5) -> bye to best seed, 2 matches

    LR2: pool = LR1 survivors (3) + [L(SF1),L(SF2)] (2) = 5 -> bye, 2 matches

    LR3: pool = LR2 survivors (3) + [L(WF)] (1) = 4 -> 2 matches

    LR4: pool = LR3 survivors (2) -> 1 match -> Losers Bracket Champion

    GF: best-of-3 matches, Winners Champ vs Losers Champ

  ========================================================================= */

function buildBracketStructure(){

 const s = playoffs.seeds; // sorted seed 1..9

 const bySeed = n => s[n-1];

 

 playoffs.M = {}; // named matches, participants resolved lazily

 playoffs.order = [];

 

 function addMatch(key, lane, roundLabel, getA, getB){

   playoffs.M[key] = { key, lane, roundLabel, getA, getB, played:false, result:null };

   playoffs.order.push(key);

 }

 

 addMatch('PI','winners','Play-In', ()=>bySeed(8), ()=>bySeed(9));

 addMatch('QF1','winners','Quarterfinal', ()=>bySeed(1), ()=>winnerOf('PI'));

 addMatch('QF2','winners','Quarterfinal', ()=>bySeed(4), ()=>bySeed(5));

 addMatch('QF3','winners','Quarterfinal', ()=>bySeed(3), ()=>bySeed(6));

 addMatch('QF4','winners','Quarterfinal', ()=>bySeed(2), ()=>bySeed(7));

 addMatch('SF1','winners','Semifinal', ()=>winnerOf('QF1'), ()=>winnerOf('QF2'));

 addMatch('SF2','winners','Semifinal', ()=>winnerOf('QF3'), ()=>winnerOf('QF4'));

 addMatch('WF','winners','Winners Final', ()=>winnerOf('SF1'), ()=>winnerOf('SF2'));

 

 // Losers Round 1: pool of 5 -> [loser(PI), loser(QF1..4)] sorted by seed asc, bye to best seed

 addMatch('LR1a','losers','Round 1', ()=>lr1Pool()[1], ()=>lr1Pool()[2]);

 addMatch('LR1b','losers','Round 1', ()=>lr1Pool()[3], ()=>lr1Pool()[4]);

 // LR1 bye recipient = lr1Pool()[0]

 

 addMatch('LR2a','losers','Round 2', ()=>lr2Pool()[1], ()=>lr2Pool()[2]);

 addMatch('LR2b','losers','Round 2', ()=>lr2Pool()[3], ()=>lr2Pool()[4]);

 // LR2 bye recipient = lr2Pool()[0]

 

 addMatch('LR3a','losers','Round 3', ()=>lr3Pool()[0], ()=>lr3Pool()[1]);

 addMatch('LR3b','losers','Round 3', ()=>lr3Pool()[2], ()=>lr3Pool()[3]);

 

 addMatch('LR4','losers','Losers Final', ()=>winnerOf('LR3a'), ()=>winnerOf('LR3b'));

 

 addMatch('GF1','grandfinal','Match 1', ()=>winnerOf('WF'), ()=>winnerOf('LR4'));

 addMatch('GF2','grandfinal','Match 2', ()=>winnerOf('WF'), ()=>winnerOf('LR4'));

 addMatch('GF3','grandfinal','Match 3 (if needed)', ()=>winnerOf('WF'), ()=>winnerOf('LR4'));

 

 playoffs.gfWins = {}; // playerId -> match wins in grand final

}

 

function winnerOf(key){

 const m = playoffs.M[key];

 return m && m.played ? m.result.winner : null;

}

function loserOf(key){

 const m = playoffs.M[key];

 return m && m.played ? m.result.loser : null;

}

function bySeedSort(arr){ return arr.slice().sort((a,b)=>a.seed-b.seed); }

 

function lr1Pool(){

 return bySeedSort([loserOf('PI'), loserOf('QF1'), loserOf('QF2'), loserOf('QF3'), loserOf('QF4')].filter(Boolean));

}

function lr2Pool(){

 const survivors = [lr1Pool()[0]||null, winnerOf('LR1a'), winnerOf('LR1b')].filter(Boolean);

 return bySeedSort(survivors.concat([loserOf('SF1'), loserOf('SF2')].filter(Boolean)));

}

function lr3Pool(){

 const survivors = [lr2Pool()[0]||null, winnerOf('LR2a'), winnerOf('LR2b')].filter(Boolean);

 return bySeedSort(survivors.concat([loserOf('WF')].filter(Boolean)));

}

 

function playMatchTrack(pA, pB){

 const res = playMatch(pA, pB);

 // Track wins in bracket by player seed

 if(!playoffs.recordsWL){ playoffs.recordsWL={}; }

 playoffs.recordsWL[res.winner.id] = (playoffs.recordsWL[res.winner.id]||0)+1;

 playoffs.recordsWL[res.loser.id] = (playoffs.recordsWL[res.loser.id]||0);

 return res;

}

 

