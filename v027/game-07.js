function renderArcadeLive(){
 if(!arcade.gA||!arcade.gB)return;
 const gs=currentGameState(),v=playerVisual(gs.pl);
 document.getElementById('arcadeScoreboard').innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
 const bow=document.getElementById('arcadeBowler');
 if(bow)bow.innerHTML=`<div class="lane-bowler-copy"><div class="lane-bowler-name">${gs.pl.emoji} ${gs.pl.name}</div><div class="lane-bowler-meta">${v.style} · ${v.shirtLabel}${v.personality?' · '+v.personality:''}</div></div>`;
 const human=document.getElementById('arcadeHumanStage');
 if(human)human.innerHTML=bowlerPreviewHtml(gs.pl,'lane',arcade.rolling?'throwing':'ready');
 const laneBall=document.getElementById('arcadeBall');
 if(laneBall){
   laneBall.style.background=`radial-gradient(circle at 30% 28%, rgba(255,255,255,.95), color-mix(in srgb, ${v.ball} 82%, #fff 18%) 20%, ${v.ball} 55%, #000 135%)`;
   if(!arcade.rolling) laneBall.style.opacity='0';
 }
 const meta=document.getElementById('arcadeTurnMeta');if(meta)meta.textContent=`Frame ${Math.min(10,gs.frameIndex+1)} · ${gs.pinsStanding} pins standing`;
 const marker=document.getElementById('pocketMarker');if(marker)marker.style.left=`calc(50% + ${arcade.targetAim*0.55}px)`;
 renderArcadePins(gs.pinsStanding);
 const comm=document.getElementById('arcadeCommentary');if(comm)comm.innerHTML=arcade.commentary.slice(-4).map((x,i,a)=>`<div class="commentary-line ${i===a.length-1?'latest':''}">${x}</div>`).join('');
 renderArcadeControls();
}
function pinPositions(){return [[50,12],[43,31],[57,31],[36,50],[50,50],[64,50],[29,70],[43,70],[57,70],[71,70]];}
function renderArcadePins(standing,knockCount=0){const deck=document.getElementById('arcadePinDeck');if(!deck)return;const pos=pinPositions();deck.innerHTML=pos.map((p,i)=>`<div class="arcade-pin ${i>=standing?'down':''}" style="left:${p[0]}%;top:${p[1]}%;"></div>`).join('');}
function renderArcadeControls(){
 const box=document.getElementById('arcadeControls');if(!box)return;const gs=currentGameState();
 if(arcade.rolling){box.innerHTML='<div class="cpu-thinking">Ball on the lane…</div>';return;}
 if(!arcade.controlId||gs.pl.id!==arcade.controlId){const v=playerVisual(gs.pl);box.innerHTML=`<div class="cpu-thinking">${gs.pl.name} is lining up the shot…<div class="hint" style="margin-top:8px;">${v.approach||"Smooth"} approach · ${v.personality||"Composed"}</div></div>`;return;}
 box.innerHTML=`<div class="arcade-controls"><div class="arcade-control-row"><label><span>Aim</span><span id="aimVal">0</span></label><input id="arcadeAim" type="range" min="-100" max="100" value="0"></div><div class="arcade-control-row"><label><span>Spin</span><span id="spinVal">0</span></label><input id="arcadeSpin" type="range" min="-100" max="100" value="0"></div><div><label style="display:flex;justify-content:space-between;font-family:'Roboto Mono',monospace;font-size:9px;color:var(--polo);margin-bottom:4px;"><span>Power / timing</span><span>sweet spot 76–85</span></label><div class="power-meter"><div class="power-sweet"></div><div class="power-needle" id="powerNeedle"></div></div></div><button class="primary roll-btn" id="btnArcadeRoll">ROLL</button></div>`;
 const aim=document.getElementById('arcadeAim'),spin=document.getElementById('arcadeSpin');aim.addEventListener('input',()=>document.getElementById('aimVal').textContent=aim.value);spin.addEventListener('input',()=>document.getElementById('spinVal').textContent=spin.value);document.getElementById('btnArcadeRoll').addEventListener('click',()=>performArcadeRoll({aim:+aim.value,spin:+spin.value,power:currentArcadePower()}));startPowerMeter();
}
function startPowerMeter(){if(arcade.powerRaf)cancelAnimationFrame(arcade.powerRaf);arcade.powerStart=performance.now();const tick=()=>{const needle=document.getElementById('powerNeedle');if(!needle)return;needle.style.left=`${currentArcadePower()}%`;arcade.powerRaf=requestAnimationFrame(tick);};arcade.powerRaf=requestAnimationFrame(tick);}
function currentArcadePower(){const t=(performance.now()-arcade.powerStart)/850;return Math.round(50+49*Math.sin(t*Math.PI*2-Math.PI/2));}
function inputQuality(input){if(!input)return .58;const line=input.aim+input.spin*.34;const lineQ=Math.max(0,1-Math.abs(line-arcade.targetAim)/72);const powerQ=Math.max(0,1-Math.abs(input.power-81)/58);return Math.max(0,Math.min(1,.57*lineQ+.43*powerQ));}
function chooseRollPins(pl,standing,input){
 const avg=calcBlendedAvg(pl)+(pl.formModifier||0),skill=Math.max(0,Math.min(1,(avg-70)/170)),q=inputQuality(input);
 if(standing===10){const strikeP=Math.max(.035,Math.min(.62,.045+skill*.47+(q-.5)*.18));if(Math.random()<strikeP)return 10;const mu=5.1+skill*3.15+(q-.5)*1.4;return Math.max(0,Math.min(9,Math.round(mu+gaussian()*1.45)));}
 const spareP=Math.max(.07,Math.min(.9,.2+skill*.53+(q-.5)*.24-standing*.012));if(Math.random()<spareP)return standing;const mu=standing*(.38+skill*.38+q*.13);return Math.max(0,Math.min(standing-1,Math.round(mu+gaussian()*Math.max(.7,standing*.14))));
}
function advanceArcadeTurn(){
 if(!arcade.active||arcade.rolling)return;if(arcade.gA.complete&&arcade.gB.complete){finishArcadeGame();return;}
 const gs=currentGameState();if(gs.complete){if(arcade.turn==='A'){arcade.turn='B';}else{arcade.turn='A';arcade.frameRound++;}arcade.targetAim=Math.round((Math.random()-.5)*34);renderArcadeLive();return advanceArcadeTurn();}
 renderArcadeLive();if(!arcade.controlId||gs.pl.id!==arcade.controlId){arcade.timers.push(setTimeout(()=>performArcadeRoll(null),820));}
}
function performArcadeRoll(input){
 if(arcade.rolling)return;
 arcade.rolling=true;
 if(arcade.powerRaf)cancelAnimationFrame(arcade.powerRaf);
 arcade.powerRaf=null;
 const gs=currentGameState(),before=gs.pinsStanding,frame=gs.frameIndex,pins=chooseRollPins(gs.pl,before,input),q=inputQuality(input);
 let frameDone=false;
 const line=input?(input.aim+input.spin*.34):arcade.targetAim+(Math.random()-.5)*22;
 playArcadeSound('roll');
 renderArcadeLive();
 requestAnimationFrame(()=>animateHumanThrow(line));
 // Impact happens after the visible release + ball travel, so the pins now fall when the ball reaches them.
 arcade.timers.push(setTimeout(()=>{
   const beforeFrame=gs.frameIndex;
   applyBowlingRoll(gs,pins);
   frameDone=gs.complete||gs.frameIndex!==beforeFrame;
   playArcadeSound(pins===before?'strike':'pins');
   arcadeComment(gs.pl,pins,before,frame,q);
   renderArcadePins(Math.max(0,before-pins));
   showBowlingReaction(pins,before);
   const board=document.getElementById('arcadeScoreboard');if(board)board.innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
   const comm=document.getElementById('arcadeCommentary');if(comm)comm.innerHTML=arcade.commentary.slice(-4).map((x,i,a)=>`<div class="commentary-line ${i===a.length-1?'latest':''}">${x}</div>`).join('');
 },1160));
 arcade.timers.push(setTimeout(()=>{
   const b=document.getElementById('arcadeBall');if(b){b.getAnimations().forEach(a=>a.cancel());b.classList.remove('rolling');b.style.opacity='0';}
   if(frameDone){if(arcade.turn==='A')arcade.turn='B';else{arcade.turn='A';arcade.frameRound++;}arcade.targetAim=Math.round((Math.random()-.5)*34);}
   arcade.rolling=false;
   advanceArcadeTurn();
 },1780));
}
function arcadeComment(pl,pins,before,frame,q){
 const v=playerVisual(pl);
 let text;
 if(before===10&&pins===10){text=`💥 STRIKE! ${pl.emoji} ${pl.name} flushes the pocket in frame ${frame+1}.`;if(v.quoteStrike)text+=` ${v.quoteStrike}`;}
 else if(pins===before){text=`✅ ${pl.name} cleans up the spare in frame ${frame+1}.`;if(v.quoteSpare)text+=` ${v.quoteSpare}`;else if(v.personality==='Businesslike')text+=` Clean, simple, and professional from ${pl.name}.`;}
 else if(pins===0){text=`😬 Gutter ball for ${pl.name}. Nothing down.`;if(v.quoteBad)text+=` ${v.quoteBad}`;}
 else if(before===10&&pins===9)text=`🎯 ${pl.name} leaves a lonely pin after a nine-count.`;
 else if(before===10&&pins<=5)text=`⚠️ Trouble for ${pl.name}: only ${pins} on the first ball. ${v.quoteBad||''}`.trim();
 else{text=`${pl.emoji} ${pl.name} knocks down ${pins}${before<10?` of the ${before} remaining`:''}.`;if(pl.id==='woo')text+=` ${v.quoteBad}`;else if(pl.id==='gavin'&&pins>=7)text+=` That trademark spin did some work.`;else if(pl.id==='carter'&&pins>=8)text+=` Carter stayed way left and loved the result.`;}
 if(q>.9&&pins<before)text+=` The release was nearly perfect, but the pins didn't cooperate.`;
 arcade.commentary.push(text);
}

function finishArcadeGame(){
 const a=finalBowlingScore(arcade.gA),b=finalBowlingScore(arcade.gB);recordArcadeGameScore(arcade.pA,a);recordArcadeGameScore(arcade.pB,b);arcade.gamesA.push(a);arcade.gamesB.push(b);arcade.commentary.push(`📺 Game ${arcade.gameIndex+1} final: ${arcade.pA.name} ${a}, ${arcade.pB.name} ${b}.`);arcade.gameIndex++;
 if(arcade.gameIndex<3){document.getElementById('arcadeStage').innerHTML=`<div class="game-intermission"><div class="broadcast-kicker">${playoffs.M[arcade.key].roundLabel}</div><h3>Game ${arcade.gameIndex} Complete</h3><div class="game-score">${arcade.pA.emoji} ${arcade.pA.name} ${a} · ${b} ${arcade.pB.name} ${arcade.pB.emoji}</div><p>Match aggregate: ${arcade.gamesA.reduce((x,y)=>x+y,0)}–${arcade.gamesB.reduce((x,y)=>x+y,0)}</p><div class="arcade-choice"><button class="primary" id="btnNextArcadeGame">Bowl Game ${arcade.gameIndex+1}</button><button class="ghost" onclick="window.__arcadeSimMatch()">Sim Rest of Match</button></div></div>`;document.getElementById('btnNextArcadeGame').addEventListener('click',startArcadeGame);}else finishArcadeMatch();
}
function recordArcadeGameScore(pl,score){pl.seasonGames.push(score);if(score>pl.allTimeHigh){const prev=pl.allTimeHigh;pl.allTimeHigh=score;logMilestone(`🎳 NEW CAREER HIGH — ${pl.emoji} ${pl.name} rolls ${score}, breaking the previous record of ${prev}!`);}}
function makeMatchResultFromArcade(){
 const totalA=arcade.gamesA.reduce((a,b)=>a+b,0),totalB=arcade.gamesB.reduce((a,b)=>a+b,0);let winner,loser,tiebreak=false;if(totalA===totalB){tiebreak=true;const pa=calcBlendedAvg(arcade.pA),pb=calcBlendedAvg(arcade.pB),prob=softmaxProb(pa,pb);winner=Math.random()<prob?arcade.pA:arcade.pB;loser=winner.id===arcade.pA.id?arcade.pB:arcade.pA;}else{winner=totalA>totalB?arcade.pA:arcade.pB;loser=winner.id===arcade.pA.id?arcade.pB:arcade.pA;}return {pA:arcade.pA,pB:arcade.pB,gamesA:arcade.gamesA.slice(),gamesB:arcade.gamesB.slice(),totalA,totalB,winner,loser,winScore:winner.id===arcade.pA.id?totalA:totalB,loseScore:winner.id===arcade.pA.id?totalB:totalA,tiebreak};
}
function finishArcadeMatch(){
 const res=makeMatchResultFromArcade();playoffs.recordsWL[res.winner.id]=(playoffs.recordsWL[res.winner.id]||0)+1;playoffs.recordsWL[res.loser.id]=(playoffs.recordsWL[res.loser.id]||0);commitMatch(arcade.key,res);renderBracket();const tie=res.tiebreak?'<p class="hint">Aggregate tie was decided by a skill-weighted one-ball roll-off.</p>':'';
 document.getElementById('arcadeStage').innerHTML=`<div class="game-intermission"><div class="broadcast-kicker">Match Final</div><h3>${res.winner.emoji} ${res.winner.name} wins ${playoffs.M[arcade.key].roundLabel}</h3><div class="game-score">${res.gamesA.join(' · ')} (${res.totalA}) &nbsp; vs &nbsp; ${res.gamesB.join(' · ')} (${res.totalB})</div>${tie}<p>Championship series: ${arcadeSeriesLabel()}</p><div class="arcade-choice">${playoffs.champion?'<button class="primary" id="btnShowTrophy">Trophy Ceremony</button>':'<button class="primary" id="btnNextFinalMatch">Continue Championship</button>'}<button class="ghost" onclick="window.__arcadeQuickSim()">Sim Rest</button></div></div>`;
 const trophy=document.getElementById('btnShowTrophy');if(trophy)trophy.addEventListener('click',renderTrophyCeremony);const next=document.getElementById('btnNextFinalMatch');if(next)next.addEventListener('click',startArcadeNextMatch);
}
function simRestOfArcadeGame(){
 arcadeClearTimers();const gsA=arcade.gA,gsB=arcade.gB;if(!gsA.complete){const score=simulateArcadeGameInstant(arcade.pA);gsA.frames=score.frames;gsA.complete=true;}if(!gsB.complete){const score=simulateArcadeGameInstant(arcade.pB);gsB.frames=score.frames;gsB.complete=true;}finishArcadeGame();
}
function simulateArcadeGameInstant(pl){const gs=newBowlingGame(pl);while(!gs.complete){const pins=chooseRollPins(pl,gs.pinsStanding,null);applyBowlingRoll(gs,pins);}return gs;}
function simArcadeMatch(){
 arcadeClearTimers();while(arcade.gamesA.length<3){const a=simulateArcadeGameInstant(arcade.pA),b=simulateArcadeGameInstant(arcade.pB),sa=finalBowlingScore(a),sb=finalBowlingScore(b);recordArcadeGameScore(arcade.pA,sa);recordArcadeGameScore(arcade.pB,sb);arcade.gamesA.push(sa);arcade.gamesB.push(sb);}finishArcadeMatch();
}
function quickSimArcadeFinals(){
 arcadeClearTimers();if(!arcade.active){arcade.active=true;const f=finalCompetitors();arcade.pA=f.A;arcade.pB=f.B;}
 if(arcade.key&&arcade.gamesA.length<3)simArcadeMatch();
 let guard=0;while(playoffs&&!playoffs.champion&&guard<6){const key=getNextPlayableMatchKey();if(!key)break;if(['GF1','GF2','GF3'].includes(key)){const res=resolveMatch(key);commitMatch(key,res);}else playNextMatch();guard++;}renderBracket();if(playoffs.champion)renderTrophyCeremony();
}
function renderTrophyCeremony(){
 if(!playoffs.champion)return;arcade.active=false;arcadeClearTimers();const c=playoffs.champion;const v=playerVisual(c);const gf=['GF1','GF2','GF3'].map(k=>playoffs.M[k]).filter(m=>m&&m.result);const games=[];gf.forEach(m=>{const r=m.result;const arr=r.pA.id===c.id?r.gamesA:r.gamesB;games.push(...arr);});const best=games.length?Math.max(...games):'—';const avg=games.length?(games.reduce((a,b)=>a+b,0)/games.length).toFixed(1):'—';const conf=Array.from({length:55},(_,i)=>`<span class="confetti" style="left:${Math.random()*100}%;animation-duration:${2.7+Math.random()*3}s;animation-delay:${Math.random()*1.4}s;transform:rotate(${Math.random()*180}deg)"></span>`).join('');
 document.getElementById('arcadeTopTitle').textContent='Champion Crowned';document.getElementById('arcadeStage').innerHTML=`<div class="trophy-stage">${conf}<div class="champ-sub">BCM Bowling League Champion</div><div class="trophy-icon">🏆</div><div class="finalist-preview-wrap" style="margin:0 auto 8px;">${bowlerPreviewHtml(c,'mini preview','ready')}</div><h2>${c.emoji} ${c.name}</h2><div class="champ-sub">Seed #${c.seed} · Career Ring #${c.championships||1} · ${tierJerseyText(c)}</div><div class="champ-kicker">${v.approach||'Smooth'} approach · ${v.personality||'Composed'} personality</div><div class="champ-style">${bowlerStyleSummary(c)}</div><div class="trophy-quote">${championQuote(c)}</div><div class="trophy-stats"><div class="trophy-stat"><b>${playoffs.gfWins[c.id]||2}</b><span>Finals Match Wins</span></div><div class="trophy-stat"><b>${avg}</b><span>Finals Game Avg</span></div><div class="trophy-stat"><b>${best}</b><span>Best Finals Game</span></div></div><div class="arcade-choice"><button class="primary" id="btnCloseTrophy">Return to League</button><button class="ghost" onclick="window.__openSeasonArchive(${careerModeOn?careerYear:seasonNumber})">Open Season Archive</button></div></div>`;playArcadeSound('cheer');document.getElementById('btnCloseTrophy').addEventListener('click',closeArcadeModal);
}

function closeArcadeModal(){
 if(arcade.active&&!playoffs.champion){if(!confirm('Exit the championship broadcast? The remaining finals will be simulated so the season stays valid.'))return;quickSimArcadeFinals();if(!playoffs.champion)return;}
 arcade.active=false;arcadeClearTimers();document.getElementById('arcadeModal').classList.add('hidden');document.body.style.overflow='';renderBracket();if(playoffs.champion)showChampion();
}
function playArcadeSound(type){
 if(!arcade.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;window.__bcmAudio=window.__bcmAudio||new AC();const ctx=window.__bcmAudio;if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);const now=ctx.currentTime;if(type==='roll'){o.type='sine';o.frequency.setValueAtTime(130,now);o.frequency.exponentialRampToValueAtTime(65,now+.25);g.gain.setValueAtTime(.045,now);g.gain.exponentialRampToValueAtTime(.001,now+.28);o.start(now);o.stop(now+.3);}else if(type==='cheer'){o.type='triangle';o.frequency.setValueAtTime(260,now);o.frequency.exponentialRampToValueAtTime(520,now+.45);g.gain.setValueAtTime(.055,now);g.gain.exponentialRampToValueAtTime(.001,now+.8);o.start(now);o.stop(now+.82);}else{o.type='square';o.frequency.setValueAtTime(type==='strike'?95:120,now);g.gain.setValueAtTime(.025,now);g.gain.exponentialRampToValueAtTime(.001,now+.18);o.start(now);o.stop(now+.2);}}catch(e){}
}

/* =========================================================================

  EVENTS

  ========================================================================= */

document.getElementById('btnSimWeek').addEventListener('click', ()=>{ simulateWeek(); });

document.getElementById('btnSimAll').addEventListener('click', ()=>{

 while(currentWeek < TOTAL_WEEKS){ simulateWeek(); }

});

document.getElementById('btnReset').addEventListener('click', ()=>{ careerModeOn ? advanceCareerYear(true) : initSeason(); });

document.getElementById('careerModeToggle').addEventListener('change', (e)=>{

 careerModeOn = e.target.checked;

 updateResetButtonLabel();

 updateStatus();

 document.getElementById('btnSim5Years').style.display = careerModeOn ? '' : 'none';

 document.getElementById('btnSim10Years').style.display = careerModeOn ? '' : 'none';

 renderCareerHub(); autosaveGame();

});

document.getElementById('btnSim5Years').addEventListener('click', ()=>{ simulateCareerYears(5); });

document.getElementById('btnSim10Years').addEventListener('click', ()=>{ simulateCareerYears(10); });

document.getElementById('followPlayerSelect').addEventListener('change', (e)=>{

 followedPlayerId = e.target.value || null;

});

document.getElementById('btnStartPlayoffs').addEventListener('click', ()=>{

 document.getElementById('playoffIntroPanel').style.display='none';

 renderBracket();

});

document.querySelectorAll('[data-role="nextMatch"]').forEach(btn=>{

 btn.addEventListener('click', ()=>{

   const key = getNextPlayableMatchKey();

   if(!key){ setPlayoffButtonsDisabled(true); return; }

   if(['GF1','GF2','GF3'].includes(key)){ launchChampionshipArcade(); return; }

   openMatchForKey(key, false);

 });

});

document.querySelectorAll('[data-role="simAllPlayoffs"]').forEach(btn=>{

 btn.addEventListener('click', ()=>{ simulateAllPlayoffs(); });

});

document.getElementById('btnWatchFinals').addEventListener('click', launchChampionshipArcade);

document.getElementById('btnSimToChamp').addEventListener('click', ()=>{ simToChampionship(); });

document.getElementById('matchModalCloseBtn').addEventListener('click', closeMatchModal);

 


document.getElementById('btnExportSave').addEventListener('click',()=>openSaveCode('export'));