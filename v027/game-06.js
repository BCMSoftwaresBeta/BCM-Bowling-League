function openSeasonArchive(year){
 const hist=careerHistoryLog.find(y=>y.year===year);
 const snaps=Object.values(PLAYERS).map(pl=>({pl,s:(pl.careerSeasons||[]).find(x=>x.year===year)})).filter(x=>x.s).sort((a,b)=>a.s.rank-b.s.rank);
 if(!hist && year===careerYear && currentWeek>=TOTAL_WEEKS){
   // Current completed-but-not-yet-archived year can still be inspected.
   const live=Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);
   const mvp=live[0]; let pomvp=null,pow=-1;Object.entries(playoffs?.recordsWL||{}).forEach(([id,w])=>{if(w>pow){pow=w;pomvp=PLAYERS[id];}});
   let high=null,highVal=-1;live.forEach(pl=>(pl.seasonGames||[]).forEach(g=>{if(g>highVal){highVal=g;high=pl;}}));
   document.getElementById('seasonArchiveTitle').textContent=`Year ${year} · Current Season`;
   document.getElementById('seasonArchiveContent').innerHTML=`<p class="hint">This championship is complete but the year has not yet been advanced into permanent career history.</p><div class="career-grid"><div class="metric-card"><div class="metric-kicker">Champion</div><div class="metric-main">${playoffs?.champion?playoffs.champion.emoji+' '+playoffs.champion.name:'—'}</div></div><div class="metric-card"><div class="metric-kicker">Regular Season MVP</div><div class="metric-main">${mvp?mvp.emoji+' '+mvp.name:'—'}</div><div class="metric-sub">${mvp?mvp.seasonTotal+' pins':''}</div></div><div class="metric-card"><div class="metric-kicker">Playoff MVP Pace</div><div class="metric-main">${pomvp?pomvp.emoji+' '+pomvp.name:'—'}</div><div class="metric-sub">${pow>=0?pow+' match wins':''}</div></div><div class="metric-card"><div class="metric-kicker">High Game</div><div class="metric-main">${high?high.emoji+' '+high.name+' · '+highVal:'—'}</div></div></div><table class="odds-table archive-standings"><thead><tr><th>#</th><th>Bowler</th><th>Season Avg</th><th>Total</th><th>PO Wins</th></tr></thead><tbody>${live.map((pl,i)=>`<tr><td class="odds-seed">#${i+1}</td><td class="odds-name">${pl.emoji} ${pl.name}${playoffs?.champion?.id===pl.id?'<span class="badge-mini ring">CHAMP</span>':''}</td><td class="num">${mean((pl.seasonGames||[]).slice(0,TOTAL_WEEKS*9)).toFixed(1)}</td><td class="num">${pl.seasonTotal}</td><td class="num">${(playoffs?.recordsWL&&playoffs.recordsWL[pl.id])||0}</td></tr>`).join('')}</tbody></table>`;
 } else if(hist){
   document.getElementById('seasonArchiveTitle').textContent=`Year ${year} · Season Archive`;
   const awards=`<div class="career-grid"><div class="metric-card"><div class="metric-kicker">Champion</div><div class="metric-main">${hist.champion?hist.champion.emoji+' '+hist.champion.name:'—'}</div></div><div class="metric-card"><div class="metric-kicker">Regular Season MVP</div><div class="metric-main">${hist.mvp?hist.mvp.emoji+' '+hist.mvp.name:'—'}</div><div class="metric-sub">${hist.mvp?hist.mvp.total+' pins':''}</div></div><div class="metric-card"><div class="metric-kicker">Playoff MVP</div><div class="metric-main">${hist.playoffMVP?hist.playoffMVP.emoji+' '+hist.playoffMVP.name:'—'}</div><div class="metric-sub">${hist.playoffMVP?hist.playoffMVP.wins+' match wins':''}</div></div><div class="metric-card"><div class="metric-kicker">High Game</div><div class="metric-main">${hist.highRound?hist.highRound.emoji+' '+hist.highRound.name+' · '+hist.highRound.score:'—'}</div></div></div>`;
   const standings=snaps.length?`<table class="odds-table archive-standings"><thead><tr><th>#</th><th>Bowler</th><th>Season Avg</th><th>Total</th><th>PO Wins</th></tr></thead><tbody>${snaps.map(({pl,s})=>`<tr><td class="odds-seed">#${s.rank}</td><td class="odds-name">${pl.emoji} ${pl.name}${s.champion?'<span class="badge-mini ring">CHAMP</span>':''}</td><td class="num">${s.seasonAvg.toFixed(1)}</td><td class="num">${s.seasonTotal}</td><td class="num">${s.playoffWins}</td></tr>`).join('')}</tbody></table>`:'<p class="hint">Detailed standings snapshot unavailable for this early archive entry.</p>';
   document.getElementById('seasonArchiveContent').innerHTML=awards+standings;
 } else return;
 document.getElementById('seasonArchiveModal').classList.remove('hidden');
}

function serializeMatchResult(r){
 if(!r) return null;
 return {pA:r.pA.id,pB:r.pB.id,gamesA:r.gamesA,gamesB:r.gamesB,totalA:r.totalA,totalB:r.totalB,winner:r.winner.id,loser:r.loser.id,winScore:r.winScore,loseScore:r.loseScore,tiebreak:!!r.tiebreak};
}
function serializePlayoffs(){
 if(!playoffs) return null;
 const matches={};
 if(playoffs.M && playoffs.order) playoffs.order.forEach(k=>{const m=playoffs.M[k];matches[k]={played:!!m.played,skipped:!!m.skipped,result:serializeMatchResult(m.result)};});
 return {seedIds:(playoffs.seeds||[]).map(p=>p.id),recordsWL:playoffs.recordsWL||{},gfWins:playoffs.gfWins||{},championId:playoffs.champion?.id||null,recorded:!!playoffs.recorded,matches};
}
function snapshotGame(){
 return {version:4,savedAt:new Date().toISOString(),careerModeOn,careerYear,careerMilestones,careerHistoryLog,rivalryBook,seasonNumber,firstInit,currentWeek,weeklyRecaps,seasonLocked,hallOfFame,players:PLAYERS,playoffs:serializePlayoffs()};
}
function encodeSave(obj){return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));}
function decodeSave(code){return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));}
function autosaveGame(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshotGame()));const el=document.getElementById('saveStatus');if(el){el.textContent=`Autosaved locally · ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;el.classList.add('good');}}catch(e){const el=document.getElementById('saveStatus');if(el)el.textContent='Autosave unavailable in this browser';}
}
function restorePlayoffs(ps){
 if(!ps){playoffs=null;return;}
 const seeds=(ps.seedIds||[]).map(id=>PLAYERS[id]).filter(Boolean);
 playoffs={seeds,matches:[],idx:0,champion:null,buildOnly:true,recordsWL:{...(ps.recordsWL||{})}};
 buildBracketStructure();
 playoffs.recordsWL={...(ps.recordsWL||{})}; playoffs.gfWins={...(ps.gfWins||{})}; playoffs.recorded=!!ps.recorded; playoffs.pending=null;
 Object.entries(ps.matches||{}).forEach(([k,ms])=>{const m=playoffs.M[k];if(!m)return;m.played=!!ms.played;m.skipped=!!ms.skipped;if(ms.result){const rr=ms.result;m.result={pA:PLAYERS[rr.pA],pB:PLAYERS[rr.pB],gamesA:rr.gamesA||[],gamesB:rr.gamesB||[],totalA:rr.totalA,totalB:rr.totalB,winner:PLAYERS[rr.winner],loser:PLAYERS[rr.loser],winScore:rr.winScore,loseScore:rr.loseScore,tiebreak:!!rr.tiebreak};}});
 playoffs.champion=ps.championId?PLAYERS[ps.championId]:null;
}
function loadSnapshot(data){
 if(!data||!data.players) throw new Error('Invalid save');
 careerModeOn=!!data.careerModeOn;careerYear=data.careerYear||1;careerMilestones=data.careerMilestones||[];careerHistoryLog=data.careerHistoryLog||[];rivalryBook=data.rivalryBook||{};seasonNumber=data.seasonNumber||1;firstInit=false;currentWeek=data.currentWeek||0;weeklyRecaps=data.weeklyRecaps||[];seasonLocked=!!data.seasonLocked;hallOfFame=data.hallOfFame||[];
 PLAYERS={}; RAW_PLAYERS.forEach(raw=>{const saved=data.players[raw.id];PLAYERS[raw.id]=Object.assign(freshPlayerState(raw),saved||{});});
 restorePlayoffs(data.playoffs);
 const toggle=document.getElementById('careerModeToggle');toggle.checked=careerModeOn;document.getElementById('btnSim5Years').style.display=careerModeOn?'':'none';document.getElementById('btnSim10Years').style.display=careerModeOn?'':'none';document.getElementById('btnSimWeek').disabled=seasonLocked;document.getElementById('btnSimAll').disabled=seasonLocked;
 document.getElementById('recapPanel').style.display=weeklyRecaps.length?'block':'none';document.getElementById('championPanel').style.display='none';document.getElementById('playoffPanel').style.display='none';document.getElementById('playoffIntroPanel').style.display='none';
 renderAllCareerPanels(); autosaveGame();
}
function tryLoadAutosave(){
 try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;loadSnapshot(JSON.parse(raw));return true;}catch(e){console.warn('Autosave could not be restored',e);return false;}
}
function openSaveCode(mode){
 const modal=document.getElementById('saveCodeModal'),txt=document.getElementById('saveCodeText'),apply=document.getElementById('btnApplySaveCode'),copy=document.getElementById('btnCopySaveCode');
 if(mode==='import'){document.getElementById('saveCodeTitle').textContent='Import Save Code';document.getElementById('saveCodeHint').textContent='Paste a BCM Bowling League save code below. This replaces the current in-browser state.';txt.value='';apply.style.display='';copy.style.display='none';}
 else{document.getElementById('saveCodeTitle').textContent='Share Save Code';document.getElementById('saveCodeHint').textContent='Copy this code to another device or send it to a friend. Importing it recreates this career.';txt.value=encodeSave(snapshotGame());apply.style.display='none';copy.style.display='';}
 modal.classList.remove('hidden');txt.focus();
}

/* =========================================================================
   CHAMPIONSHIP ARCADE — real 10-frame bowling scoreboard & playable controls
   ========================================================================= */
let arcade={active:false,key:null,pA:null,pB:null,controlId:null,gameIndex:0,gamesA:[],gamesB:[],gA:null,gB:null,turn:'A',frameRound:0,targetAim:0,powerStart:0,powerRaf:null,timers:[],commentary:[],sound:true,rolling:false};
function arcadeClearTimers(){arcade.timers.forEach(clearTimeout);arcade.timers=[];if(arcade.powerRaf)cancelAnimationFrame(arcade.powerRaf);arcade.powerRaf=null;}
function arcadeSeriesLabel(){const a=arcade.pA,b=arcade.pB;return `${a.name} ${playoffs.gfWins[a.id]||0} · ${playoffs.gfWins[b.id]||0} ${b.name}`;}
function finalCompetitors(){return {A:winnerOf('WF'),B:winnerOf('LR4')};}
function seasonAvgFor(pl){const g=(pl.seasonGames||[]).slice(0,TOTAL_WEEKS*9);return g.length?mean(g):pl.careerAvg;}
function launchChampionshipArcade(){
 const f=finalCompetitors();if(!f.A||!f.B||playoffs.champion)return;
 arcadeClearTimers(); arcade={...arcade,active:false,key:null,pA:f.A,pB:f.B,controlId:null,gameIndex:0,gamesA:[],gamesB:[],gA:null,gB:null,turn:'A',frameRound:0,targetAim:0,powerStart:0,powerRaf:null,timers:[],commentary:[],rolling:false};
 document.getElementById('arcadeModal').classList.remove('hidden'); document.body.style.overflow='hidden'; renderArcadeIntro();
}
function finalistCardHtml(pl){
 const rivalry=getRivalry(pl.id,pl.id===arcade.pA.id?arcade.pB.id:arcade.pA.id); const form=pl.formState==='HOT'?'HOT':pl.formState==='COLD'?'COLD':'STEADY'; const v=playerVisual(pl);
 return `<div class="finalist-card"><div class="finalist-seed">SEED #${pl.seed} · ${form}</div><div class="finalist-preview-wrap">${bowlerPreviewHtml(pl,'mini preview','ready')}</div><div class="finalist-emoji">${pl.emoji}</div><div class="finalist-name">${pl.name}</div><div class="bowler-style-chip">${v.style}</div><div class="finalist-stats"><div class="finalist-stat"><b>${seasonAvgFor(pl).toFixed(1)}</b><span>Season Avg</span></div><div class="finalist-stat"><b>${pl.championships||0}</b><span>Rings</span></div><div class="finalist-stat"><b>${totalMVPs(pl)}</b><span>MVPs</span></div><div class="finalist-stat"><b>${(playoffs.recordsWL&&playoffs.recordsWL[pl.id])||0}W</b><span>Playoff Run</span></div></div><div class="bowler-bio">${v.bio}</div>${rivalry?`<div class="hint" style="position:relative;margin-top:10px;">Rivalry series ${rivalry.wins[pl.id]||0}–${rivalry.wins[pl.id===arcade.pA.id?arcade.pB.id:arcade.pA.id]||0}</div>`:''}</div>`;
}
function getRivalry(a,b){return rivalryBook[[a,b].sort().join('|')]||null;}
function renderArcadeIntro(){
 document.getElementById('arcadeTopTitle').textContent='BCM Championship · Live';
 document.getElementById('arcadeStage').innerHTML=`<div class="broadcast-intro"><div class="broadcast-kicker">BCM Sports Network Presents</div><h2>Championship Bowling</h2><p>Best of three matches. Each match is three full ten-frame games by aggregate pinfall.</p></div><div class="finalist-grid">${finalistCardHtml(arcade.pA)}<div class="vs-medallion">VS</div>${finalistCardHtml(arcade.pB)}</div><div class="arcade-choice"><button class="primary" onclick="window.__arcadeStart('${arcade.pA.id}')">Play as ${arcade.pA.name}</button><button class="ghost" onclick="window.__arcadeStart('')">Watch CPU vs CPU</button><button class="primary" onclick="window.__arcadeStart('${arcade.pB.id}')">Play as ${arcade.pB.name}</button><button class="ghost" onclick="window.__arcadeQuickSim()">Quick Sim Finals</button></div><p class="hint" style="text-align:center;">Playable mode: set aim and spin, then time the power meter and hit ROLL. Your bowler's underlying skill still matters, so inputs help without turning a 100-average player into a guaranteed 300 machine.</p>`;
}
function arcadeStart(controlId){arcade.controlId=controlId||null;arcade.active=true;startArcadeNextMatch();}
function startArcadeNextMatch(){
 const key=getNextPlayableMatchKey(); if(!key||!['GF1','GF2','GF3'].includes(key)){if(playoffs.champion)renderTrophyCeremony();return;}
 const m=playoffs.M[key]; arcade.key=key;arcade.pA=m.getA();arcade.pB=m.getB();arcade.gameIndex=0;arcade.gamesA=[];arcade.gamesB=[];arcade.commentary=[`🎙️ ${m.roundLabel}: ${arcade.pA.name} and ${arcade.pB.name} walk onto the championship pair.`];
 renderArcadeWalkout();
}
function renderArcadeWalkout(){
 const m=playoffs.M[arcade.key];document.getElementById('arcadeTopTitle').textContent=`Championship · ${m.roundLabel}`;
 document.getElementById('arcadeStage').innerHTML=`<div class="walkout"><div class="series-score">Series · ${arcadeSeriesLabel()}</div><div class="walkout-main">${arcade.pA.emoji} ${arcade.pA.name} vs ${arcade.pB.emoji} ${arcade.pB.name}</div><div class="hint">${m.roundLabel} · three-game aggregate</div></div><div class="finalist-grid" style="margin-top:10px;">${finalistCardHtml(arcade.pA)}<div class="vs-medallion">${m.roundLabel}</div>${finalistCardHtml(arcade.pB)}</div><div class="arcade-choice"><button class="primary" id="btnArcadeBeginMatch">Bowl Game 1</button><button class="ghost" onclick="window.__arcadeSimMatch()">Sim This Match</button></div>`;
 document.getElementById('btnArcadeBeginMatch').addEventListener('click',startArcadeGame);
}
function newBowlingGame(pl){return {pl,frames:Array.from({length:10},()=>[]),frameIndex:0,pinsStanding:10,complete:false};}
function startArcadeGame(){
 arcade.gA=newBowlingGame(arcade.pA);arcade.gB=newBowlingGame(arcade.pB);arcade.turn='A';arcade.frameRound=0;arcade.targetAim=Math.round((Math.random()-.5)*34);arcade.rolling=false;
 const stage=document.getElementById('arcadeStage');stage.innerHTML=`<div class="walkout"><div class="series-score">${playoffs.M[arcade.key].roundLabel} · Game ${arcade.gameIndex+1} of 3 · ${arcadeSeriesLabel()}</div><div class="walkout-main">Championship Pair</div></div><div class="tv-scoreboard" id="arcadeScoreboard"></div><div class="arcade-arena"><div class="lane-scene"><div class="crowd"></div><div class="lane-light"></div><div class="gutter left"></div><div class="gutter right"></div><div class="arcade-lane"></div><div class="foul-line"></div><div class="pocket-marker" id="pocketMarker"></div><div class="pin-deck" id="arcadePinDeck"></div><div class="arcade-ball" id="arcadeBall"></div><div class="release-path" id="releasePath"></div><div class="human-stage" id="arcadeHumanStage"></div><div class="lane-hud"><div class="bowler" id="arcadeBowler"></div><div class="turnmeta" id="arcadeTurnMeta"></div></div></div><div class="arcade-sidepanel"><div class="commentary-box"><div class="commentary-title">Live Commentary</div><div id="arcadeCommentary"></div></div><div><div class="control-title">Bowling Controls</div><div id="arcadeControls"></div></div><div class="controls"><button class="ghost" id="btnArcadeAutoRest">Auto Bowl Rest</button><button class="ghost" id="btnArcadeSimGame">Sim Rest of Game</button></div></div></div>`;
 document.getElementById('btnArcadeAutoRest').addEventListener('click',()=>{arcade.controlId=null;advanceArcadeTurn();});
 document.getElementById('btnArcadeSimGame').addEventListener('click',simRestOfArcadeGame);
 renderArcadeLive(); advanceArcadeTurn();
}
function currentGameState(){return arcade.turn==='A'?arcade.gA:arcade.gB;}
function otherGameState(){return arcade.turn==='A'?arcade.gB:arcade.gA;}
function frameIsComplete(gs,idx){
 const f=gs.frames[idx];if(idx<9)return f[0]===10||f.length>=2;
 if(f.length<2)return false;if(f[0]===10||f[0]+f[1]===10)return f.length>=3;return true;
}
function applyBowlingRoll(gs,pins){
 const i=gs.frameIndex,f=gs.frames[i];f.push(pins);
 if(i<9){if(f[0]===10||f.length===2){gs.frameIndex++;gs.pinsStanding=10;}else gs.pinsStanding=10-f[0];if(gs.frameIndex>=10)gs.complete=true;return;}
 if(f.length===1){gs.pinsStanding=f[0]===10?10:10-f[0];}
 else if(f.length===2){if(f[0]===10){gs.pinsStanding=f[1]===10?10:10-f[1];}else if(f[0]+f[1]===10){gs.pinsStanding=10;}else gs.complete=true;}
 else gs.complete=true;
}
function flattenRolls(frames){const out=[];frames.forEach(f=>f.forEach(x=>out.push(x)));return out;}
function cumulativeScores(gs){
 const rolls=flattenRolls(gs.frames), scores=Array(10).fill(null);let idx=0,total=0;
 for(let f=0;f<10;f++){
   if(f===9){const fr=gs.frames[9];const need=(fr[0]===10||(fr.length>=2&&fr[0]+fr[1]===10))?3:2;if(fr.length>=need){total+=fr.reduce((a,b)=>a+b,0);scores[f]=total;}break;}
   const fr=gs.frames[f];if(!fr.length)break;
   if(fr[0]===10){if(rolls[idx+1]===undefined||rolls[idx+2]===undefined)break;total+=10+rolls[idx+1]+rolls[idx+2];idx+=1;scores[f]=total;}
   else{if(fr.length<2)break;const sum=fr[0]+fr[1];if(sum===10){if(rolls[idx+2]===undefined)break;total+=10+rolls[idx+2];}else total+=sum;idx+=2;scores[f]=total;}
 }
 return scores;
}
function finalBowlingScore(gs){const c=cumulativeScores(gs);return c[9]??0;}
function pinMark(n){return n===0?'–':String(n);}
function frameMarks(gs,i){
 const f=gs.frames[i];if(!f.length)return'';
 if(i<9){if(f[0]===10)return'X';if(f.length===1)return pinMark(f[0]);return `${pinMark(f[0])} ${f[0]+f[1]===10?'/':pinMark(f[1])}`;}
 const out=[];for(let r=0;r<f.length;r++){if(f[r]===10)out.push('X');else if(r===1&&f[0]!==10&&f[0]+f[1]===10)out.push('/');else if(r===2&&f[1]!==10&&f[1]+f[2]===10&&(f[0]===10))out.push('/');else out.push(pinMark(f[r]));}return out.join(' ');
}
function scoreRowHtml(gs){
 const cs=cumulativeScores(gs);return `<div class="score-row"><div class="score-cell score-name">${gs.pl.emoji} ${gs.pl.name}</div>${Array.from({length:10},(_,i)=>`<div class="score-cell"><span class="frame-num">${i+1}</span><div class="frame-marks">${frameMarks(gs,i)}</div><div class="frame-cume">${cs[i]??''}</div></div>`).join('')}<div class="score-cell score-total">${gs.complete?finalBowlingScore(gs):(cs.filter(x=>x!==null).pop()??0)}</div></div>`;
}
