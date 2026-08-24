/* BCM Bowling League v0.2.9 — A2 corrective patch on stable v0.2.7 */

function computeFinalPlayoffOrder(){
  if(!playoffs || !playoffs.M || !playoffs.champion) return null;
  const champ=playoffs.champion;
  const gfKeys=['GF1','GF2','GF3'];
  const clincher=gfKeys.slice().reverse().find(k=>{
    const m=playoffs.M[k]; return m && m.played && !m.skipped && m.result && m.result.winner && m.result.winner.id===champ.id;
  });
  const runner=clincher ? playoffs.M[clincher].result.loser : null;
  const loserAt = key => {
    const m=playoffs.M[key]; return m && m.played && m.result ? m.result.loser : null;
  };
  const bySeed = arr => arr.filter(Boolean).sort((a,b)=>(a.seed||99)-(b.seed||99));
  const order=[champ];
  if(runner && runner.id!==champ.id) order.push(runner);
  const stages=[['LR4'],['LR3a','LR3b'],['LR2a','LR2b'],['LR1a','LR1b']];
  stages.forEach(keys=>{
    bySeed(keys.map(loserAt)).forEach(pl=>{ if(pl && !order.some(x=>x.id===pl.id)) order.push(pl); });
  });
  Object.values(PLAYERS).slice().sort((a,b)=>(a.seed||99)-(b.seed||99)).forEach(pl=>{
    if(!order.some(x=>x.id===pl.id)) order.push(pl);
  });
  return order.slice(0,Object.keys(PLAYERS).length);
}

function saveFinalPlayoffRanks(year){
  const order=computeFinalPlayoffOrder();
  if(!order || order.length!==Object.keys(PLAYERS).length) return false;
  order.forEach((pl,i)=>{
    const rank=i+1;
    pl.playoffFinishHistory=pl.playoffFinishHistory||[];
    pl.playoffFinishHistory[year-1]=rank;
    pl.lastPlayoffFinish=rank;
  });
  if(playoffs) playoffs.finalOrderIds=order.map(pl=>pl.id);
  return true;
}

const __v027AdvanceCareerYear = advanceCareerYear;
advanceCareerYear = function(autoComplete=true){
  if(!careerModeOn) return false;
  if(autoComplete && !ensureCareerYearComplete()) return false;
  if(currentWeek < TOTAL_WEEKS || !playoffs || !playoffs.champion){
    console.warn(`Career Year ${careerYear} is incomplete; advancement was blocked.`);
    return false;
  }
  saveFinalPlayoffRanks(careerYear);
  return __v027AdvanceCareerYear(false);
};

renderStandings = function(initial){
  const tbody = document.getElementById('standingsBody');
  const players = Object.values(PLAYERS);
  const showingPriorSeason = careerModeOn && currentWeek===0 && players.some(pl=>pl.lastPlayoffFinish!==null && pl.lastPlayoffFinish!==undefined);
  const ordered = players.slice().sort((a,b)=>{
    if(showingPriorSeason) return (a.lastPlayoffFinish ?? 99) - (b.lastPlayoffFinish ?? 99);
    return (b.seasonTotal-a.seasonTotal) || (b.careerAvg-a.careerAvg);
  });
  ordered.forEach((pl,i)=> pl.rank = showingPriorSeason ? (pl.lastPlayoffFinish || i+1) : i+1);
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
    ? `Year ${careerYear} preseason · showing Year ${careerYear-1} final playoff standings`
    : (currentWeek===0 ? 'Season not yet started' : `Through Week ${currentWeek} of ${TOTAL_WEEKS}`);
};

bowlerPreviewHtml = function(pl,mode='lane',state='ready'){
  const v=playerVisual(pl); const cls=[mode,state,v.handed==='left'?'lefty':'',v.twoHanded?'twohanded':''].join(' ').trim();
  const speech=String(mode).includes('lane')?'<div class="bowler-speech" id="bowlerSpeech"></div>':'';
  return `<div class="bowler-avatar ${cls}" style="--shirt:${v.shirt};--ball:${v.ball};--skin:${v.skin};--height:${v.height};--build:${v.build};--x:${v.x||0}px;"><div class="avatar-shadow"></div><div class="avatar-body"><div class="avatar-head"><div class="avatar-hair ${v.hairClass||''}"></div><div class="avatar-face"></div></div><div class="avatar-arm back"></div><div class="avatar-arm release"></div><div class="avatar-support"></div><div class="avatar-torso"><div class="avatar-logo">${v.shirtLabel||''}</div></div><div class="avatar-hips"></div><div class="avatar-leg left"></div><div class="avatar-leg right"></div><div class="avatar-shoe left"></div><div class="avatar-shoe right"></div></div><div class="avatar-ball"></div><div class="avatar-name">${pl.name}</div>${speech}</div>`;
};

function cloneBowlingGame(gs){ return {pl:gs.pl,frames:gs.frames.map(f=>f.slice()),frameIndex:gs.frameIndex,pinsStanding:gs.pinsStanding,complete:gs.complete}; }
function minFuturePinsForScore(gs,targetFinalScore){
  if(gs.complete) return finalBowlingScore(gs)>=targetFinalScore ? 0 : null;
  if(gs.frameIndex<9) return null;
  let best=null;
  function dfs(state,pinSum){
    if(best!==null && pinSum>=best) return;
    if(state.complete){ if(finalBowlingScore(state)>=targetFinalScore) best=pinSum; return; }
    const max=state.pinsStanding;
    for(let pins=0;pins<=max;pins++){
      const next=cloneBowlingGame(state); applyBowlingRoll(next,pins); dfs(next,pinSum+pins);
    }
  }
  dfs(cloneBowlingGame(gs),0); return best;
}
function computeNeedsText(gs){
  if(arcade.gameIndex!==2 || gs.frameIndex<9) return '';
  const other=otherGameState(); if(!other || !other.complete) return '';
  const isA=gs.pl.id===arcade.pA.id;
  const ownPrior=(isA?arcade.gamesA:arcade.gamesB).reduce((a,b)=>a+b,0);
  const oppPrior=(isA?arcade.gamesB:arcade.gamesA).reduce((a,b)=>a+b,0);
  const targetCurrentGame=(oppPrior+finalBowlingScore(other)+1)-ownPrior;
  if(targetCurrentGame<=0) return '';
  const pins=minFuturePinsForScore(gs,targetCurrentGame);
  if(pins===null || pins<=0) return '';
  return `Needs ${pins} pin${pins===1?'':'s'} to win`;
}
function updateNeedsOverlay(){
  const el=document.getElementById('needsOverlay'); if(!el || !arcade.gA || !arcade.gB) return;
  const text=computeNeedsText(currentGameState()); el.textContent=text; el.classList.toggle('show',!!text);
}
function showBowlerSpeech(text,cls=''){
  const el=document.getElementById('bowlerSpeech'); if(!el || !text) return;
  if(arcade.speechTimer) clearTimeout(arcade.speechTimer);
  el.className='bowler-speech'; if(cls) el.classList.add(cls); el.textContent=text; el.classList.add('show');
  arcade.speechTimer=setTimeout(()=>{ const live=document.getElementById('bowlerSpeech'); if(live) live.classList.remove('show'); },1450);
}
function maybeSignatureSpeech(pl,pins,before){
  if(pl.id==='bau' && before===10 && pins===10) return showBowlerSpeech('WHO DO YOU THINK YOU ARE? I AM!','bau');
  if(pl.id==='farb' && before<10 && pins===before) return showBowlerSpeech('BANG.','farb');
  if(pl.id==='woo' && !(before===10 && pins===10)) return showBowlerSpeech('HOW IS THAT NOT A STRIKE?','woo');
}
function showStrikeStinger(){
  const el=document.getElementById('strikeStinger'); if(!el) return;
  if(arcade.stingerTimer) clearTimeout(arcade.stingerTimer);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  arcade.stingerTimer=setTimeout(()=>el.classList.remove('show'),900);
}
function showCrowdPop(){
  const scene=document.querySelector('.lane-scene'); if(!scene) return;
  scene.classList.remove('crowd-pop'); void scene.offsetWidth; scene.classList.add('crowd-pop');
  setTimeout(()=>scene.classList.remove('crowd-pop'),930);
}

startArcadeGame = function(){
  arcade.gA=newBowlingGame(arcade.pA);arcade.gB=newBowlingGame(arcade.pB);arcade.turn='A';arcade.frameRound=0;arcade.targetAim=Math.round((Math.random()-.5)*34);arcade.rolling=false;
  const stage=document.getElementById('arcadeStage');stage.innerHTML=`<div class="walkout"><div class="series-score">${playoffs.M[arcade.key].roundLabel} · Game ${arcade.gameIndex+1} of 3 · ${arcadeSeriesLabel()}</div><div class="walkout-main">Championship Pair</div></div><div class="tv-scoreboard" id="arcadeScoreboard"></div><div class="arcade-arena"><div class="lane-scene"><div class="crowd"></div><div class="lane-light"></div><div class="gutter left"></div><div class="gutter right"></div><div class="arcade-lane"></div><div class="foul-line"></div><div class="pocket-marker" id="pocketMarker"></div><div class="pin-deck" id="arcadePinDeck"></div><div class="arcade-ball" id="arcadeBall"></div><div class="release-path" id="releasePath"></div><div class="human-stage" id="arcadeHumanStage"></div><div class="strike-stinger" id="strikeStinger"><div class="wallaby">🦘</div><div class="stinger-copy"><span class="stinger-bcm">BCM Bowling</span><span class="stinger-strike">STRIKE!</span></div></div><div class="needs-overlay" id="needsOverlay"></div><div class="lane-hud"><div class="bowler" id="arcadeBowler"></div><div class="turnmeta" id="arcadeTurnMeta"></div></div></div><div class="arcade-sidepanel"><div class="commentary-box"><div class="commentary-title">Live Commentary</div><div id="arcadeCommentary"></div></div><div><div class="control-title">Bowling Controls</div><div id="arcadeControls"></div></div><div class="controls"><button class="ghost" id="btnArcadeAutoRest">Auto Bowl Rest</button><button class="ghost" id="btnArcadeSimGame">Sim Rest of Game</button></div></div></div>`;
  document.getElementById('btnArcadeAutoRest').addEventListener('click',()=>{arcade.controlId=null;advanceArcadeTurn();});
  document.getElementById('btnArcadeSimGame').addEventListener('click',simRestOfArcadeGame);
  renderArcadeLive(); advanceArcadeTurn();
};

renderArcadeLive = function(){
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
  const scene=document.querySelector('.lane-scene');if(scene)scene.classList.toggle('frame-ten',gs.frameIndex>=9||otherGameState().frameIndex>=9);
  updateNeedsOverlay();
  renderArcadeControls();
};

performArcadeRoll = function(input){
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
  arcade.timers.push(setTimeout(()=>{
    const beforeFrame=gs.frameIndex;
    applyBowlingRoll(gs,pins);
    frameDone=gs.complete||gs.frameIndex!==beforeFrame;
    playArcadeSound(pins===before?'strike':'pins');
    arcadeComment(gs.pl,pins,before,frame,q);
    renderArcadePins(Math.max(0,before-pins));
    showBowlingReaction(pins,before);
    if(before===10&&pins===10) showStrikeStinger();
    if(frame>=9 || (before===10&&pins===10) || (before<10&&pins===before)) showCrowdPop();
    maybeSignatureSpeech(gs.pl,pins,before);
    const board=document.getElementById('arcadeScoreboard');if(board)board.innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
    const comm=document.getElementById('arcadeCommentary');if(comm)comm.innerHTML=arcade.commentary.slice(-4).map((x,i,a)=>`<div class="commentary-line ${i===a.length-1?'latest':''}">${x}</div>`).join('');
  },1160));
  arcade.timers.push(setTimeout(()=>{
    const b=document.getElementById('arcadeBall');if(b){b.getAnimations().forEach(a=>a.cancel());b.classList.remove('rolling');b.style.opacity='0';}
    if(frameDone){if(arcade.turn==='A')arcade.turn='B';else{arcade.turn='A';arcade.frameRound++;}arcade.targetAim=Math.round((Math.random()-.5)*34);}
    arcade.rolling=false;
    advanceArcadeTurn();
  },1780));
};
