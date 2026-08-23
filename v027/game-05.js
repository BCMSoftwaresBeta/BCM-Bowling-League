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

/* =========================================================================
   ARCADE EDITION HELPERS — career archive, forms, rivalries, save system
   ========================================================================= */
function progressRowHtml(label,value,target){
 const pct = Math.max(0,Math.min(100,(value/target)*100));
 return `<div class="progress-row"><span>${label}</span><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><span>${Math.round(value)}/${target}</span></div>`;
}

function accoladeMiniHtml(pl){
 let html='';
 if((pl.championships||0)>0) html += `<span class="badge-mini ring">💍${pl.championships}</span>`;
 if(totalMVPs(pl)>0) html += `<span class="badge-mini mvp">★${totalMVPs(pl)}</span>`;
 if(dynastyStatus(pl)) html += `<span class="badge-mini dynasty">DYNASTY</span>`;
 if(pl.formState==='HOT') html += `<span class="badge-mini hot">HOT</span>`;
 if(pl.formState==='COLD') html += `<span class="badge-mini cold">COLD</span>`;
 return html;
}

function dynastyStatus(pl){
 const years=(pl.championshipYears||[]).slice();
 if(!years.length) return false;
 const lastCompleted = careerModeOn ? (careerYear - ((playoffs&&playoffs.champion)?0:1)) : seasonNumber;
 for(let end=Math.max(5,lastCompleted);end>=5;end--){
   const count=years.filter(y=>y>=end-4 && y<=end).length;
   if(count>=3) return true;
 }
 return false;
}

function prepareWeeklyForms(){
 const events=[];
 Object.values(PLAYERS).forEach(pl=>{
   if((pl.formWeeksLeft||0)<=0){
     pl.formState='NORMAL'; pl.formModifier=0; pl.formWeeksLeft=0;
     const r=Math.random();
     if(r<0.075){
       pl.formState='HOT'; pl.formModifier=Math.round(7+Math.random()*7); pl.formWeeksLeft=2+Math.floor(Math.random()*2);
       events.push(`🔥 ${pl.emoji} ${pl.name} catches fire: a ${pl.formWeeksLeft}-week hot streak begins.`);
     } else if(r<0.125){
       pl.formState='COLD'; pl.formModifier=-Math.round(7+Math.random()*7); pl.formWeeksLeft=2+Math.floor(Math.random()*2);
       events.push(`❄️ ${pl.emoji} ${pl.name} hits a cold spell expected to last ${pl.formWeeksLeft} weeks.`);
     }
   }
 });
 return events;
}

function decayWeeklyForms(){
 Object.values(PLAYERS).forEach(pl=>{
   if((pl.formWeeksLeft||0)>0){
     pl.formWeeksLeft--;
     if(pl.formWeeksLeft<=0){ pl.formState='NORMAL'; pl.formModifier=0; }
   }
 });
}

function generateWeeklyStorylines(weekData, ordered, formEvents){
 const stories=[];
 const byWeek=Object.values(PLAYERS).slice().sort((a,b)=>weekData[b.id].weekTotal-weekData[a.id].weekTotal);
 if(byWeek[0]) stories.push(`🏅 Player of the Week: ${byWeek[0].emoji} ${byWeek[0].name} led the league with ${weekData[byWeek[0].id].weekTotal} pins.`);
 const careerRank=Object.values(PLAYERS).slice().sort((a,b)=>b.careerAvg-a.careerAvg);
 const lowerHalf=new Set(careerRank.slice(Math.floor(careerRank.length/2)).map(p=>p.id));
 const upset=byWeek.find((p,i)=>i<3 && lowerHalf.has(p.id));
 if(upset) stories.push(`🚨 Upset Alert: ${upset.emoji} ${upset.name} crashed the weekly top three despite entering as a lower-half career-average bowler.`);
 let meltdown=null, meltDelta=Infinity;
 Object.values(PLAYERS).forEach(pl=>{
   const expected=(pl.careerAvg+(pl.formModifier||0))*9;
   const d=weekData[pl.id].weekTotal-expected;
   if(d<meltDelta){meltDelta=d;meltdown=pl;}
 });
 if(meltdown && meltDelta<-70) stories.push(`📉 Meltdown Watch: ${meltdown.emoji} ${meltdown.name} finished ${Math.abs(Math.round(meltDelta))} pins below expectation.`);
 stories.push(...(formEvents||[]).slice(0,2));
 if(currentWeek>=8 && ordered.length>=9){
   const seventh=ordered[6], eighth=ordered[7], ninth=ordered[8];
   stories.push(`🔎 Play-In Watch: #7 ${seventh.name} holds a ${seventh.seasonTotal-eighth.seasonTotal}-pin cushion over #8 ${eighth.name}; ${ninth.name} sits ${eighth.seasonTotal-ninth.seasonTotal} behind the first play-in spot.`);
 }
 return stories.slice(0,5);
}

function renderRacePanel(){
 const wrap=document.getElementById('racePanel');
 if(!wrap) return;
 if(currentWeek<7 || !Object.keys(PLAYERS).length){wrap.style.display='none';return;}
 wrap.style.display='block';
 const ordered=Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);
 const projected=ordered.map(pl=>({pl,proj:currentWeek?Math.round(pl.seasonTotal/currentWeek*TOTAL_WEEKS):0})).sort((a,b)=>b.proj-a.proj);
 const eighthNow=ordered[7];
 const chips=projected.map((o,i)=>{
   const final=currentWeek>=TOTAL_WEEKS;
   const status=final ? (i<7?`Clinched #${i+1}`:`Play-In #${i+1}`) : (i<6?'Projected Safe':i<8?'Bubble':'Projected Play-In');
   const cls=i<6?'race-safe':i<8?'race-bubble':'race-danger';
   const gap=eighthNow ? o.pl.seasonTotal-eighthNow.seasonTotal : 0;
   return `<div class="race-chip ${cls}"><div class="r-seed">PROJECTED #${i+1}</div><div class="r-name">${o.pl.emoji} ${o.pl.name}</div><div class="r-meta">${o.proj} projected pins · ${status}${i<7&&eighthNow?` · ${gap>=0?'+':''}${gap} vs #8`:''}</div></div>`;
 }).join('');
 document.getElementById('racePanelSub').textContent=currentWeek===10?'Final seeding locked':'Projected final order · seeds 8–9 face the play-in';
 document.getElementById('racePanelContent').innerHTML=`<div class="race-grid">${chips}</div><p class="hint">Projection = current scoring pace over 10 weeks. “Safe/Bubble” is a projection, while clinched labels only appear once the regular season is complete.</p>`;
}

function recordRivalryMatch(res,isChampionship){
 if(!res||!res.pA||!res.pB||!res.winner) return;
 const ids=[res.pA.id,res.pB.id].sort(); const key=ids.join('|');
 if(!rivalryBook[key]) rivalryBook[key]={ids,meetings:0,wins:{},championshipMeetings:0,lastYear:null};
 const r=rivalryBook[key]; r.meetings++; r.wins[res.winner.id]=(r.wins[res.winner.id]||0)+1;
 if(isChampionship) r.championshipMeetings++;
 r.lastYear=careerModeOn?careerYear:seasonNumber;
}

function finalizeCareerSeasonMetrics(year){
 const hist=careerHistoryLog.find(y=>y.year===year);
 Object.values(PLAYERS).forEach(pl=>{
   if((pl.careerSeasons||[]).some(s=>s.year===year)) return;
   const regGames=(pl.seasonGames||[]).slice(0,TOTAL_WEEKS*9);
   const snap={year,rank:pl.finishHistory[year-1]||pl.rank||null,seasonTotal:pl.seasonTotal,seasonAvg:regGames.length?mean(regGames):0,highGame:pl.seasonGames.length?Math.max(...pl.seasonGames):0,playoffWins:(playoffs&&playoffs.recordsWL&&playoffs.recordsWL[pl.id])||0,champion:!!(hist&&hist.champion&&hist.champion.name===pl.name),mvp:!!(hist&&hist.mvp&&hist.mvp.name===pl.name),playoffMvp:!!(hist&&hist.playoffMVP&&hist.playoffMVP.name===pl.name),seed:pl.seed||null};
   pl.careerSeasons=pl.careerSeasons||[]; pl.careerSeasons.push(snap);
   pl.bestSeasonAvg=Math.max(pl.bestSeasonAvg||0,snap.seasonAvg||0);
   pl.bestSeasonTotal=Math.max(pl.bestSeasonTotal||0,snap.seasonTotal||0);
   pl.bestPlayoffWins=Math.max(pl.bestPlayoffWins||0,snap.playoffWins||0);
   if(snap.champion && !(pl.championshipYears||[]).includes(year)){pl.championshipYears=pl.championshipYears||[];pl.championshipYears.push(year);}
 });
 renderCareerHub();
}

function currentTitleDrought(pl){
 const completed=careerHistoryLog.length;
 const years=(pl.championshipYears||[]).slice().sort((a,b)=>a-b);
 if(!completed) return 0;
 let longest=years.length?Math.max(0,years[0]-1):completed;
 for(let i=1;i<years.length;i++) longest=Math.max(longest,years[i]-years[i-1]-1);
 if(years.length) longest=Math.max(longest,completed-years[years.length-1]);
 return longest;
}

function renderCareerHub(){
 const wrap=document.getElementById('careerHubPanel'); if(!wrap) return;
 if(!careerModeOn){wrap.style.display='none';return;} wrap.style.display='block';
 const players=Object.values(PLAYERS);
 const rows=players.slice().sort((a,b)=>computePrestigeScore(b)-computePrestigeScore(a)).map(pl=>{
   const top3=(pl.finishHistory||[]).filter(x=>x<=3).length;
   const avgFinish=pl.finishHistory?.length?mean(pl.finishHistory).toFixed(1):'—';
   return `<tr class="click-row" onclick="window.__showPlayerCard('${pl.id}')"><td class="odds-name">${pl.emoji} ${pl.name}${dynastyStatus(pl)?'<span class="badge-mini dynasty">DYNASTY</span>':''}</td><td>${pl.tier}</td><td class="num">${pl.championships||0}</td><td class="num">${pl.regularSeasonMvps||0}</td><td class="num">${pl.playoffMvps||0}</td><td class="num">${top3}</td><td class="num">${avgFinish}</td><td class="num">${pl.bestSeasonAvg?pl.bestSeasonAvg.toFixed(1):'—'}</td><td class="num">${pl.bestPlayoffWins||0}</td></tr>`;
 }).join('');
 const highGame=players.slice().sort((a,b)=>b.allTimeHigh-a.allTimeHigh)[0];
 const highSeason=players.slice().sort((a,b)=>(b.bestSeasonTotal||0)-(a.bestSeasonTotal||0))[0];
 const ringKing=players.slice().sort((a,b)=>(b.championships||0)-(a.championships||0))[0];
 const mvpKing=players.slice().sort((a,b)=>totalMVPs(b)-totalMVPs(a))[0];
 const drought=players.slice().sort((a,b)=>currentTitleDrought(b)-currentTitleDrought(a))[0];
 const playoffKing=players.slice().sort((a,b)=>(b.bestPlayoffWins||0)-(a.bestPlayoffWins||0))[0];
 const rivalries=Object.values(rivalryBook).sort((a,b)=>b.meetings-a.meetings).slice(0,5);
 const rivalryHtml=rivalries.length?rivalries.map(r=>{const a=PLAYERS[r.ids[0]],b=PLAYERS[r.ids[1]];if(!a||!b)return'';return `<div class="metric-card"><div class="metric-kicker">${r.meetings} playoff meetings${r.championshipMeetings?` · ${r.championshipMeetings} finals`:''}</div><div class="metric-main">${a.emoji} ${a.name} vs ${b.emoji} ${b.name}</div><div class="metric-sub">Series: ${r.wins[a.id]||0}–${r.wins[b.id]||0} · last met Year ${r.lastYear}</div></div>`;}).join(''):'<p class="hint">Rivalries appear after players meet in the playoffs.</p>';
 document.getElementById('careerHubContent').innerHTML=`
   <div class="career-grid">
     <div class="metric-card"><div class="metric-kicker">All-Time High Game</div><div class="metric-main">${highGame?highGame.emoji+' '+highGame.name+' · '+highGame.allTimeHigh:'—'}</div><div class="metric-sub">Includes the historical score database and simulated career.</div></div>
     <div class="metric-card"><div class="metric-kicker">Best Season Total</div><div class="metric-main">${highSeason&&highSeason.bestSeasonTotal?highSeason.emoji+' '+highSeason.name+' · '+highSeason.bestSeasonTotal:'—'}</div><div class="metric-sub">Highest completed regular-season pinfall.</div></div>
     <div class="metric-card"><div class="metric-kicker">Ring Leader</div><div class="metric-main">${ringKing?ringKing.emoji+' '+ringKing.name+' · '+(ringKing.championships||0):'—'}</div><div class="metric-sub">${dynastyStatus(ringKing||{})?'Active dynasty: 3+ titles in a five-year window.':'Most career championships.'}</div></div>
     <div class="metric-card"><div class="metric-kicker">MVP Leader</div><div class="metric-main">${mvpKing?mvpKing.emoji+' '+mvpKing.name+' · '+totalMVPs(mvpKing):'—'}</div><div class="metric-sub">Regular season + playoff MVP awards.</div></div>
     <div class="metric-card"><div class="metric-kicker">Longest Title Drought</div><div class="metric-main">${drought?drought.emoji+' '+drought.name+' · '+currentTitleDrought(drought)+' yrs':'—'}</div><div class="metric-sub">Longest completed championship drought to date.</div></div>
     <div class="metric-card"><div class="metric-kicker">Best Playoff Run</div><div class="metric-main">${playoffKing?playoffKing.emoji+' '+playoffKing.name+' · '+(playoffKing.bestPlayoffWins||0)+'W':'—'}</div><div class="metric-sub">Most match wins in a completed postseason.</div></div>
   </div>
   <details class="past-weeks" open style="margin-top:16px;"><summary>▸ Career résumé table</summary><div class="career-table-wrap"><table class="odds-table career-table"><thead><tr><th>Bowler</th><th>Tier</th><th>Rings</th><th>RS MVP</th><th>PO MVP</th><th>Top 3</th><th>Avg Finish</th><th>Best Avg</th><th>Best PO</th></tr></thead><tbody>${rows}</tbody></table></div></details>
   <details class="past-weeks" style="margin-top:12px;"><summary>▸ Rivalry board</summary><div class="career-grid" style="margin-top:10px;">${rivalryHtml}</div></details>`;
}

function renderAllCareerPanels(){
 renderStandings(true); updateStatus(); renderHallOfFame(); renderCareerMilestones(); renderHistoryChannel(); renderCareerHub(); renderRacePanel(); updateResetButtonLabel();
 if(weeklyRecaps.length) renderRecap();
 if(playoffs){ if(!bulkSimMode){ buildOddsTable(); populateFollowPlayerSelect(playoffs.seeds); renderBracket(); if(playoffs.champion){showChampion();buildPlayoffRecap();} } }
}
