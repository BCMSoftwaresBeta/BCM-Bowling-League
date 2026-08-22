/* =========================================================================

  BRACKET RENDER

  ========================================================================= */

function sideHtml(player, score, isWinner, isTbd){

 if(isTbd){

   return `<div class="m-side tbd"><span class="who">TBD</span></div>`;

 }

 return `<div class="m-side ${isWinner?'winner':''}">

     <span class="who">${player.emoji} ${player.name}<span class="seed">#${player.seed}</span></span>

     <span class="score">${score!==undefined?score:''}</span>

   </div>`;

}

 

function matchCardHtml(m){

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

   aHtml = sideHtml(r.pA, r.totalA, r.winner.id===r.pA.id);

   bHtml = sideHtml(r.pB, r.totalB, r.winner.id===r.pB.id);

   gamesLine = `<div class="m-games">${r.pA.name}: ${r.gamesA.join('-')} &nbsp;|&nbsp; ${r.pB.name}: ${r.gamesB.join('-')}</div>`;

 }

 return `<div class="match ${cls}">

   <div class="round-label" style="margin:0 0 4px;">${m.roundLabel}</div>

   ${aHtml}<div class="m-mid-rule"></div>${bHtml}

   ${gamesLine}

 </div>`;

}

 

function renderBracket(){

 document.getElementById('playoffPanel').style.display='block';

 document.getElementById('playoffIntroPanel').style.display='none';

 

 const winnersOrder = [

   {label:'Play-In', keys:['PI']},

   {label:'Quarterfinals', keys:['QF1','QF2','QF3','QF4']},

   {label:'Semifinals', keys:['SF1','SF2']},

   {label:'Winners Final', keys:['WF']},

 ];

 document.getElementById('winnersRounds').innerHTML = winnersOrder.map(col=>`

   <div class="round-col">

     <div class="round-label">${col.label}</div>

     ${col.keys.map(k=>matchCardHtmlWithRecords(playoffs.M[k])).join('')}

   </div>`).join('');

 

 const losersOrder = [

   {label:'Round 1', keys:['LR1a','LR1b']},

   {label:'Round 2', keys:['LR2a','LR2b']},

   {label:'Round 3', keys:['LR3a','LR3b']},

   {label:'Losers Final', keys:['LR4']},

 ];

 document.getElementById('losersRounds').innerHTML = losersOrder.map(col=>`

   <div class="round-col">

     <div class="round-label">${col.label}</div>

     ${col.keys.map(k=>matchCardHtmlWithRecords(playoffs.M[k])).join('')}

   </div>`).join('');

 

 document.getElementById('grandFinalRound').innerHTML = `

   <div class="round-col" style="min-width:220px;">

     ${['GF1','GF2','GF3'].map(k=>matchCardHtmlWithRecords(playoffs.M[k])).join('')}

   </div>`;

 

 const played = playoffs.order.filter(k=>playoffs.M[k].played && !playoffs.M[k].skipped).length;

 document.getElementById('playoffSub').textContent = playoffs.champion

   ? 'Champion crowned'

   : `${played} matches complete`;

 

 const finalsReady = !!(winnerOf('WF') && winnerOf('LR4')) && !playoffs.champion;

 const watchFinalsBtn = document.getElementById('btnWatchFinals');

 if(watchFinalsBtn) watchFinalsBtn.disabled = !finalsReady;

 const simToChampBtn = document.getElementById('btnSimToChamp');

 if(simToChampBtn) simToChampBtn.disabled = finalsReady || !!playoffs.champion;

 

 if(playoffs.champion){

   setPlayoffButtonsDisabled(true);

   showChampion();

 }

}

 

function showChampion(){

 const c = playoffs.champion;

 document.getElementById('championPanel').style.display='block';

 document.getElementById('championName').textContent = `${c.emoji} ${c.name}`;

 document.getElementById('championSub').textContent = `Season Champion — Seed #${c.seed}`;

 updateStatus();

 updateResetButtonLabel();

 renderCareerHub();

 autosaveGame();

}

 

/* =========================================================================

  HALL OF FAME

  ========================================================================= */

function recordHallOfFame(){

 if(!playoffs || !playoffs.champion || playoffs.recorded) return;

 playoffs.recorded = true;

 const c = playoffs.champion;

 c.championships = (c.championships||0) + 1;

 const label = careerModeOn ? careerYear : seasonNumber;

 hallOfFame.push({ season: label, playerId:c.id, name: c.name, emoji: c.emoji, seed: c.seed, seasonTotal: c.seasonTotal, careerMode: careerModeOn });

 renderHallOfFame();

}

 

function renderHallOfFame(){
 const wrap = document.getElementById('hallOfFamePanel');
 if(!wrap) return;
 if(hallOfFame.length===0){ wrap.style.display='none'; return; }
 wrap.style.display='block';
 const counts = {};
 hallOfFame.forEach(h=>{ counts[h.name] = (counts[h.name]||0)+1; });
 const topName = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 const rows = hallOfFame.slice().reverse().map(h=>{
   const pl = h.playerId ? PLAYERS[h.playerId] : Object.values(PLAYERS).find(p=>p.name===h.name);
   const extras = pl ? `${pl.championships?`<span class="badge-mini ring">💍 ${pl.championships}</span>`:''}${totalMVPs(pl)?`<span class="badge-mini mvp">★ ${totalMVPs(pl)}</span>`:''}` : '';
   const click = h.careerMode ? ` class="click-row" onclick="window.__openSeasonArchive(${h.season})" title="Open Year ${h.season} archive"` : '';
   return `<tr${click}>
     <td class="odds-seed">${h.careerMode?'Year':'Season'} ${h.season}</td>
     <td class="odds-name">${h.emoji} ${h.name}${extras}</td>
     <td class="odds-seed">Seed #${h.seed}</td>
     <td class="odds-prob" style="text-align:right;">${h.seasonTotal} pins</td>
   </tr>`;
 }).join('');
 document.getElementById('hallOfFameContent').innerHTML = `
   <p class="hint" style="margin:0 0 14px;">${hallOfFame.length} ${careerModeOn?'year':'season'}${hallOfFame.length>1?'s':''} played this session
     ${topName && topName[1]>1 ? ` &nbsp;·&nbsp; <span style="color:var(--gold-bright)">${topName[0]}</span> leads with ${topName[1]} titles` : ''}. ${careerModeOn?'Tap a champion season to open the full archive.':''}</p>
   <table class="odds-table">${rows}</table>`;
}

