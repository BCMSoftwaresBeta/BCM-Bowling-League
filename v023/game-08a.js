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
