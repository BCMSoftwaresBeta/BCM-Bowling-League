function renderArcadeLive(){
 if(!arcade.gA||!arcade.gB)return;
 const gs=currentGameState(),v=playerVisual(gs.pl);
 document.getElementById('arcadeScoreboard').innerHTML=scoreRowHtml(arcade.gA)+scoreRowHtml(arcade.gB);
 const bow=document.getElementById('arcadeBowler');
 if(bow)bow.innerHTML=`<div class="lane-bowler-copy"><div class="lane-bowler-name">${gs.pl.emoji} ${gs.pl.name}</div><div class="lane-bowler-meta">${v.style} · ${v.shirtLabel}</div></div>`;
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
 if(!arcade.controlId||gs.pl.id!==arcade.controlId){box.innerHTML=`<div class="cpu-thinking">${gs.pl.name} is lining up the shot…</div>`;return;}
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
 let text;if(before===10&&pins===10)text=`💥 STRIKE! ${pl.emoji} ${pl.name} flushes the pocket in frame ${frame+1}.`;else if(pins===before)text=`✅ ${pl.name} cleans up the spare in frame ${frame+1}.`;else if(pins===0)text=`😬 Gutter ball for ${pl.name}. Nothing down.`;else if(before===10&&pins===9)text=`🎯 ${pl.name} leaves a lonely pin after a nine-count.`;else if(before===10&&pins<=5)text=`⚠️ Trouble for ${pl.name}: only ${pins} on the first ball.`;else text=`${pl.emoji} ${pl.name} knocks down ${pins}${before<10?` of the ${before} remaining`:''}.`;
 if(q>.9&&pins<before)text+=` The release was nearly perfect, but the pins didn't cooperate.`;arcade.commentary.push(text);
}
