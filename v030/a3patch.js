/* BCM Bowling League v0.3.0d — A3 presentation + UX patch */
(function(){
  const badge=document.querySelector('.build-badge');
  if(badge) badge.textContent='Beta v0.3.0d · A3 UX Fixes';
  const clearBtn=document.getElementById('btnClearSave');
  if(clearBtn) clearBtn.textContent='Start Fresh (Year 1)';

  if(!document.getElementById('freshResetModal')){
    const modal=document.createElement('div');
    modal.className='modal-overlay hidden';
    modal.id='freshResetModal';
    modal.innerHTML=`<div class="modal-sheet" style="max-width:520px;">
      <button class="modal-close" id="btnFreshResetClose">✕</button>
      <h3>Start Fresh From Year 1?</h3>
      <p class="hint" style="font-size:15px;line-height:1.5;">This permanently clears this browser's current BCM Bowling League career progress, Hall of Fame, history, rivalries, playoff results, and saved season data.</p>
      <div class="controls" style="margin-top:18px;">
        <button class="primary" id="btnFreshResetConfirm">Yes — Start Fresh</button>
        <button class="ghost" id="btnFreshResetCancel">Cancel</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  }

  function openFreshResetModal(){ const m=document.getElementById('freshResetModal'); if(m)m.classList.remove('hidden'); }
  function closeFreshResetModal(){ const m=document.getElementById('freshResetModal'); if(m)m.classList.add('hidden'); }
  function startFreshCareer(){
    const keepCareerMode=careerModeOn;
    try{localStorage.removeItem(SAVE_KEY);}catch(e){}
    if(typeof arcadeClearTimers==='function') arcadeClearTimers();
    seasonNumber=1; careerYear=1; careerMilestones=[]; careerHistoryLog=[]; rivalryBook={}; weeklyRecaps=[]; hallOfFame=[]; seasonLocked=false; playoffs=null; currentWeek=0; firstInit=true; careerModeOn=keepCareerMode;
    initSeason();
    const toggle=document.getElementById('careerModeToggle'); if(toggle) toggle.checked=careerModeOn;
    document.getElementById('arcadeModal')?.classList.add('hidden'); document.body.style.overflow='';
    renderAllCareerPanels(); autosaveGame();
    const el=document.getElementById('saveStatus'); if(el){ el.textContent='Fresh save started at Year 1'; el.classList.add('good'); }
    try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){}
  }
  function confirmFreshReset(){ closeFreshResetModal(); startFreshCareer(); }

  const btnFresh=document.getElementById('btnClearSave');
  if(btnFresh){
    btnFresh.addEventListener('click',(e)=>{e.preventDefault();e.stopImmediatePropagation();openFreshResetModal();},true);
  }
  document.getElementById('btnFreshResetClose')?.addEventListener('click',closeFreshResetModal);
  document.getElementById('btnFreshResetCancel')?.addEventListener('click',closeFreshResetModal);
  document.getElementById('btnFreshResetConfirm')?.addEventListener('click',confirmFreshReset);

  if(arcade.lowerThirdMinimized===undefined) arcade.lowerThirdMinimized=false;
  arcade.streakTimer=arcade.streakTimer||null;
  arcade.titleBeatKey=null;

  pinPositions = function(){return [[50,70],[43,51],[57,51],[36,32],[50,32],[64,32],[29,13],[43,13],[57,13],[71,13]];};

  function liveBowlingScore(gs){
    if(!gs) return 0; const cs=cumulativeScores(gs); for(let i=9;i>=0;i--){if(cs[i]!==null&&cs[i]!==undefined)return cs[i];}
    return gs.frames.reduce((s,f)=>s+f.reduce((a,b)=>a+b,0),0);
  }
  function diffCell(label,val,type){return `<div class="champ-diff-cell ${type||''}"><span class="champ-diff-label">${label}</span><span class="champ-diff-val">${val}</span></div>`;}
  function differentialRow(pl,gameDiff,totalDiff){
    const gameBehind=gameDiff<0?Math.abs(gameDiff):'—', totalBehind=totalDiff<0?Math.abs(totalDiff):'—';
    const gameAhead=gameDiff>0?gameDiff:'—', totalAhead=totalDiff>0?totalDiff:'—';
    return `<div class="champ-diff-row"><div class="champ-diff-name">${pl.emoji} ${pl.name}</div>${diffCell('Game Behind',gameBehind,gameDiff<0?'behind':'')}${diffCell('Total Behind',totalBehind,totalDiff<0?'behind':'')}${diffCell('Game Ahead',gameAhead,gameDiff>0?'ahead':'')}${diffCell('Total Ahead',totalAhead,totalDiff>0?'ahead':'')}</div>`;
  }
  function updateChampDifferentials(){
    const el=document.getElementById('champDiffStrip'); if(!el||!arcade.gA||!arcade.gB) return;
    const aLive=liveBowlingScore(arcade.gA),bLive=liveBowlingScore(arcade.gB);
    const aPrior=arcade.gamesA.reduce((x,y)=>x+y,0),bPrior=arcade.gamesB.reduce((x,y)=>x+y,0);
    const gameDiff=aLive-bLive,totalDiff=(aPrior+aLive)-(bPrior+bLive);
    el.innerHTML=differentialRow(arcade.pA,gameDiff,totalDiff)+differentialRow(arcade.pB,-gameDiff,-totalDiff);
  }
  function lowerThirdMeta(pl){return `#${pl.seed||'—'} Seed · ${pl.championships||0} Career Ring${(pl.championships||0)===1?'':'s'} · ${tierJerseyText(pl)}`;}
  function toggleLowerThird(){ arcade.lowerThirdMinimized=!arcade.lowerThirdMinimized; const gs=arcade.gA&&arcade.gB?currentGameState():null; if(gs) updateLowerThird(gs.pl); updateChampDifferentials(); }
  function updateLowerThird(pl){
    const el=document.getElementById('arcadeLowerThird'); if(!el||!pl) return;
    el.classList.toggle('minimized',!!arcade.lowerThirdMinimized);
    el.innerHTML=`<div class="lt-tag">BCM SN</div><div class="lt-main"><div class="lt-name">${pl.emoji} ${pl.name}</div><div class="lt-meta">${lowerThirdMeta(pl)}</div></div><button class="lt-toggle" id="btnLowerThirdToggle" type="button">${arcade.lowerThirdMinimized?'Expand':'Minimize'}</button>`;
    const toggleBtn=document.getElementById('btnLowerThirdToggle'); if(toggleBtn) toggleBtn.addEventListener('click',toggleLowerThird);
  }
  function strikeStreakCount(gs){
    const rolls=[];
    gs.frames.forEach((f,idx)=>{ if(!f.length) return; if(idx<9){ if(f[0]===10) rolls.push(10); else rolls.push(-1); } else { f.forEach(v=>rolls.push(v===10?10:-1)); } });
    let count=0; for(let i=rolls.length-1;i>=0;i--){ if(rolls[i]===10) count++; else break; }
    return count;
  }
  function showStreakBanner(label,sub){
    const el=document.getElementById('streakBanner'); if(!el) return;
    if(arcade.streakTimer) clearTimeout(arcade.streakTimer);
    el.innerHTML=`<div class="streak-kicker">Hot Streak</div><div class="streak-main">${label}</div><div class="streak-sub">${sub}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    arcade.streakTimer=setTimeout(()=>el.classList.remove('show'),1325);
  }
  function titleBeatDescriptor(gs){
    const txt=computeNeedsText(gs); const m=txt.match(/Needs (\d+)/); if(!m) return null; const pins=+m[1];
    if(!(arcade.gameIndex===2 && gs.frameIndex>=9 && pins>0 && pins<=gs.pinsStanding)) return null;
    return {pins,text:txt,key:`${arcade.gameIndex}-${arcade.turn}-${gs.frameIndex}-${gs.frames[gs.frameIndex].length}-${pins}`};
  }
  function showTitleBeat(desc,pl){
    const el=document.getElementById('titleBeatOverlay'); if(!el||!desc||!pl) return;
    el.innerHTML=`<div class="title-beat-card"><div class="beat-kicker">Championship Point</div><div class="beat-main">${pl.name} Can Clinch</div><div class="beat-sub">${desc.text} on this shot</div></div>`;
    el.classList.add('show');
  }
  function hideTitleBeat(){ const el=document.getElementById('titleBeatOverlay'); if(el) el.classList.remove('show'); }

  startArcadeGame = function(){
    arcade.gA=newBowlingGame(arcade.pA);arcade.gB=newBowlingGame(arcade.pB);arcade.turn='A';arcade.frameRound=0;arcade.targetAim=Math.round((Math.random()-.5)*34);arcade.rolling=false;
    const stage=document.getElementById('arcadeStage');stage.innerHTML=`<div class="walkout"><div class="series-score">${playoffs.M[arcade.key].roundLabel} · Game ${arcade.gameIndex+1} of 3 · ${arcadeSeriesLabel()}</div><div class="walkout-main">Championship Pair</div></div><div class="tv-scoreboard" id="arcadeScoreboard"></div><div class="champ-diff-strip" id="champDiffStrip"></div><div class="arcade-arena"><div class="lane-scene"><div class="crowd"></div><div class="lane-light"></div><div class="gutter left"></div><div class="gutter right"></div><div class="arcade-lane"></div><div class="foul-line"></div><div class="pocket-marker" id="pocketMarker"></div><div class="pin-deck" id="arcadePinDeck"></div><div class="arcade-ball" id="arcadeBall"></div><div class="release-path" id="releasePath"></div><div class="human-stage" id="arcadeHumanStage"></div><div class="strike-stinger" id="strikeStinger"><div class="wallaby">🦘</div><div class="stinger-copy"><span class="stinger-bcm">BCM Bowling</span><span class="stinger-strike">STRIKE!</span></div></div><div class="streak-banner" id="streakBanner"></div><div class="title-beat-overlay" id="titleBeatOverlay"></div><div class="needs-overlay" id="needsOverlay"></div><div class="arcade-lowerthird" id="arcadeLowerThird"></div><div class="lane-hud"><div class="bowler" id="arcadeBowler"></div><div class="turnmeta" id="arcadeTurnMeta"></div></div></div><div class="arcade-sidepanel"><div class="commentary-box"><div class="commentary-title">Live Commentary</div><div id="arcadeCommentary"></div></div><div><div class="control-title">Bowling Controls</div><div id="arcadeControls"></div></div><div class="controls"><button class="ghost" id="btnArcadeAutoRest">Auto Bowl Rest</button><button class="ghost" id="btnArcadeSimGame">Sim Rest of Game</button></div></div></div>`; arcade.titleBeatKey=null;
    document.getElementById('btnArcadeAutoRest').addEventListener('click',()=>{arcade.controlId=null;advanceArcadeTurn();});
    document.getElementById('btnArcadeSimGame').addEventListener('click',simRestOfArcadeGame);
    renderArcadeLive(); advanceArcadeTurn();
  };

  renderArcadeLive = function(){
    if(!arcade.gA||!arcade.gB)return;
    const gs=currentGameState(),v=playerVisual(gs.pl);
    document.getElementById('arcadeScoreboard').innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
    updateLowerThird(gs.pl); updateChampDifferentials();
    const bow=document.getElementById('arcadeBowler');
    if(bow)bow.innerHTML=`<div class="lane-bowler-copy"><div class="lane-bowler-name">${gs.pl.emoji} ${gs.pl.name}</div><div class="lane-bowler-meta">${v.style} · ${v.shirtLabel}${v.personality?' · '+v.personality:''}</div></div>`;
    const human=document.getElementById('arcadeHumanStage');
    if(human)human.innerHTML=bowlerPreviewHtml(gs.pl,'lane',arcade.rolling?'throwing':'ready');
    const laneBall=document.getElementById('arcadeBall');
    if(laneBall){laneBall.style.background=`radial-gradient(circle at 30% 28%, rgba(255,255,255,.95), color-mix(in srgb, ${v.ball} 82%, #fff 18%) 20%, ${v.ball} 55%, #000 135%)`;if(!arcade.rolling) laneBall.style.opacity='0';}
    const meta=document.getElementById('arcadeTurnMeta');if(meta)meta.textContent=`Frame ${Math.min(10,gs.frameIndex+1)} · ${gs.pinsStanding} pins standing`;
    const marker=document.getElementById('pocketMarker');if(marker)marker.style.left=`calc(50% + ${arcade.targetAim*0.55}px)`;
    renderArcadePins(gs.pinsStanding);
    const comm=document.getElementById('arcadeCommentary');if(comm)comm.innerHTML=arcade.commentary.slice(-4).map((x,i,a)=>`<div class="commentary-line ${i===a.length-1?'latest':''}">${x}</div>`).join('');
    const scene=document.querySelector('.lane-scene');if(scene)scene.classList.toggle('frame-ten',gs.frameIndex>=9||otherGameState().frameIndex>=9);
    updateNeedsOverlay(); renderArcadeControls();
  };

  advanceArcadeTurn = function(){
    if(!arcade.active||arcade.rolling)return;if(arcade.gA.complete&&arcade.gB.complete){finishArcadeGame();return;}
    const gs=currentGameState();if(gs.complete){if(arcade.turn==='A'){arcade.turn='B';}else{arcade.turn='A';arcade.frameRound++;}arcade.targetAim=Math.round((Math.random()-.5)*34);arcade.titleBeatKey=null;renderArcadeLive();return advanceArcadeTurn();}
    renderArcadeLive();
    const beat=titleBeatDescriptor(gs);
    if(beat && arcade.titleBeatKey!==beat.key){arcade.titleBeatKey=beat.key;showTitleBeat(beat,gs.pl);arcade.timers.push(setTimeout(()=>{hideTitleBeat();advanceArcadeTurn();},1100));return;}
    hideTitleBeat();
    if(!arcade.controlId||gs.pl.id!==arcade.controlId){arcade.timers.push(setTimeout(()=>performArcadeRoll(null),820));}
  };

  performArcadeRoll = function(input){
    if(arcade.rolling)return;
    arcade.rolling=true;
    if(arcade.powerRaf)cancelAnimationFrame(arcade.powerRaf);arcade.powerRaf=null;
    const gs=currentGameState(),before=gs.pinsStanding,frame=gs.frameIndex,pins=chooseRollPins(gs.pl,before,input),q=inputQuality(input);let frameDone=false;
    const line=input?(input.aim+input.spin*.34):arcade.targetAim+(Math.random()-.5)*22;
    playArcadeSound('roll');renderArcadeLive();requestAnimationFrame(()=>animateHumanThrow(line));
    arcade.timers.push(setTimeout(()=>{
      const beforeFrame=gs.frameIndex;applyBowlingRoll(gs,pins);frameDone=gs.complete||gs.frameIndex!==beforeFrame;
      playArcadeSound(pins===before?'strike':'pins');arcadeComment(gs.pl,pins,before,frame,q);renderArcadePins(Math.max(0,before-pins));showBowlingReaction(pins,before);
      if(before===10&&pins===10){showStrikeStinger();const streak=strikeStreakCount(gs);if(streak===3) showStreakBanner('Turkey!','Three straight strikes on the title pair');else if(streak===5) showStreakBanner('5-BAGGER!','The crowd is losing it right now');}
      if(frame>=9 || (before===10&&pins===10) || (before<10&&pins===before)) showCrowdPop();
      maybeSignatureSpeech(gs.pl,pins,before);
      const board=document.getElementById('arcadeScoreboard');if(board)board.innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
      const comm=document.getElementById('arcadeCommentary');if(comm)comm.innerHTML=arcade.commentary.slice(-4).map((x,i,a)=>`<div class="commentary-line ${i===a.length-1?'latest':''}">${x}</div>`).join('');
      updateNeedsOverlay();updateChampDifferentials();arcade.titleBeatKey=null;
    },1160));
    arcade.timers.push(setTimeout(()=>{const b=document.getElementById('arcadeBall');if(b){b.getAnimations().forEach(a=>a.cancel());b.classList.remove('rolling');b.style.opacity='0';}if(frameDone){if(arcade.turn==='A')arcade.turn='B';else{arcade.turn='A';arcade.frameRound++;}arcade.targetAim=Math.round((Math.random()-.5)*34);}arcade.rolling=false;advanceArcadeTurn();},1780));
  };

  finishArcadeMatch = function(){
    const res=makeMatchResultFromArcade();playoffs.recordsWL[res.winner.id]=(playoffs.recordsWL[res.winner.id]||0)+1;playoffs.recordsWL[res.loser.id]=(playoffs.recordsWL[res.loser.id]||0);commitMatch(arcade.key,res);renderBracket();const tie=res.tiebreak?'<p class="hint">Aggregate tie was decided by a skill-weighted one-ball roll-off.</p>':'';
    if(playoffs.champion){
      const conf=Array.from({length:60},()=>`<span class="confetti" style="left:${Math.random()*100}%;animation-duration:${2.7+Math.random()*3}s;animation-delay:${Math.random()*1.4}s;transform:rotate(${Math.random()*180}deg)"></span>`).join('');
      const v=playerVisual(res.winner);
      document.getElementById('arcadeStage').innerHTML=`<div class="title-clinch-stage">${conf}<div class="title-clinch-kicker">BCM Bowling League Finals</div><h2>${res.winner.name} Wins The Title</h2><div class="title-clinch-sub">${championQuote(res.winner)}</div><div class="title-clinch-series">Series Total · ${res.totalA} - ${res.totalB}</div><div class="title-clinch-preview">${bowlerPreviewHtml(res.winner,'mini preview',`celebrate celebrate-${reactionKey(v.celebration,'celebrate')}`)}</div><div class="title-clinch-ribbon">#${res.winner.seed} Seed · ${res.winner.championships||1} Career Ring · ${tierJerseyText(res.winner)}</div>${tie}<div class="arcade-choice" style="margin-top:18px;"><button class="primary" id="btnShowTrophy">Trophy Ceremony</button><button class="ghost" onclick="window.__openSeasonArchive(${careerModeOn?careerYear:seasonNumber})">Open Season Archive</button></div></div>`;
      playArcadeSound('cheer');const trophy=document.getElementById('btnShowTrophy');if(trophy)trophy.addEventListener('click',renderTrophyCeremony);return;
    }
    document.getElementById('arcadeStage').innerHTML=`<div class="game-intermission"><div class="broadcast-kicker">Match Final</div><h3>${res.winner.emoji} ${res.winner.name} wins ${playoffs.M[arcade.key].roundLabel}</h3><div class="game-score">${res.gamesA.join(' · ')} (${res.totalA}) &nbsp; vs &nbsp; ${res.gamesB.join(' · ')} (${res.totalB})</div>${tie}<p>Championship series: ${arcadeSeriesLabel()}</p><div class="arcade-choice"><button class="primary" id="btnNextFinalMatch">Continue Championship</button><button class="ghost" onclick="window.__arcadeQuickSim()">Sim Rest</button></div></div>`;
    const next=document.getElementById('btnNextFinalMatch');if(next)next.addEventListener('click',startArcadeNextMatch);
  };

  window.__openFreshResetModal=openFreshResetModal;
  window.__toggleLowerThird=toggleLowerThird;
})();
