/* =========================================================================

  PLAYER SEASON CARD

  ========================================================================= */


const PLAYER_VISUALS = {
 opus:{height:1.0,build:1.0,shirt:'#6f1f32',shirtLabel:'GARNET',ball:'#712941',skin:'#e2bb97',hairClass:'black',handed:'right',twoHanded:true,style:'Two-Handed Righty',archetype:'Modern high-rev strike artist',bio:"5'11 Asian right-hander with a two-handed release and a quick, modern approach.",x:0},
 carter:{height:.98,build:1.14,shirt:'#b43333',shirtLabel:'RED',ball:'#c84433',skin:'#efc29d',hairClass:'red',handed:'left',twoHanded:false,style:'One-Handed Lefty',archetype:'Compact lefty power bowler',bio:"Red-haired stockier lefty with a compact, powerful one-handed release.",x:0},
 gavin:{height:1.03,build:1.0,shirt:'#b43333',shirtLabel:'RED',ball:'#346cbf',skin:'#e6b690',hairClass:'brown',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Textbook smooth control bowler',bio:"6'0 right-hander with a standard one-handed delivery and a polished, orthodox motion.",x:0},
 farb:{height:1.0,build:1.0,shirt:'#c22d35',shirtLabel:'SCARLET',ball:'#c93044',skin:'#edc39e',hairClass:'curly lightbrown',handed:'left',twoHanded:false,style:'One-Handed Lefty',archetype:'Expressive lefty shot-maker',bio:"Curly-haired lefty in scarlet with more expression and flair in the release.",x:0},
 fademan:{height:.98,build:1.08,shirt:'#f5f5f5',shirtLabel:'KAPPA Σ',ball:'#5c3db7',skin:'#dca97f',hairClass:'curly shortblack',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Athletic power bowler',bio:"Muscular right-hander in a Kappa Sigma shirt with a forceful release and athletic follow-through.",x:0},
 bau:{height:1.08,build:.95,shirt:'#de7f25',shirtLabel:'ORANGE',ball:'#dd7a1f',skin:'#e5b38c',hairClass:'brown',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Tall long-stride smooth power bowler',bio:"6'3 and lanky with an orange shirt, long stride and extended release.",x:0},
 q:{height:1.0,build:1.0,shirt:'#ba3134',shirtLabel:'RED',ball:'#2f2f38',skin:'#dca97f',hairClass:'black',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Compact efficient technician',bio:"Short black hair and a businesslike, compact right-handed delivery.",x:0},
 woo:{height:1.03,build:1.08,shirt:'#27446d',shirtLabel:'NBA',ball:'#d4aa44',skin:'#efc7a4',hairClass:'medium brown',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Relaxed rhythm bowler',bio:"Relaxed right-hander with an NBA shirt, medium-length hair and a looser rhythm.",x:0},
 staub:{height:1.12,build:1.02,shirt:'#2d8b74',shirtLabel:'TAMPA',ball:'#2b8b7a',skin:'#f0c8a8',hairClass:'dirtyblonde',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'Tall high-release power bowler',bio:"6'5 with a University of Tampa shirt, high release point and long-limbed power.",x:0}
};
function playerVisual(pl){return PLAYER_VISUALS[pl.id]||{height:1,build:1,shirt:'#9a3940',shirtLabel:pl.name.toUpperCase(),ball:'#ad6a36',skin:'#e1b38d',hairClass:'brown',handed:'right',twoHanded:false,style:'One-Handed Righty',archetype:'League bowler',bio:'',x:0};}
function bowlerPreviewHtml(pl,mode='lane',state='ready'){
 const v=playerVisual(pl); const cls=[mode,state,v.handed==='left'?'lefty':'',v.twoHanded?'twohanded':''].join(' ').trim();
 const handedLabel=`${v.handed==='left'?'Left':'Right'}-Handed`;
 return `<div class="bowler-avatar ${cls}" style="--shirt:${v.shirt};--ball:${v.ball};--skin:${v.skin};--height:${v.height};--build:${v.build};--x:${v.x||0}px;"><div class="avatar-shadow"></div><div class="avatar-body"><div class="avatar-head"><div class="avatar-hair ${v.hairClass||''}"></div><div class="avatar-face"></div></div><div class="avatar-arm back"></div><div class="avatar-arm release"></div><div class="avatar-support"></div><div class="avatar-torso"><div class="avatar-logo">${v.shirtLabel||''}</div></div><div class="avatar-hips"></div><div class="avatar-leg left"></div><div class="avatar-leg right"></div><div class="avatar-shoe left"></div><div class="avatar-shoe right"></div></div><div class="avatar-ball"></div><div class="avatar-name">${pl.name}</div></div>`;
}
function bowlerStyleSummary(pl){ const v=playerVisual(pl); return `${v.style} · ${v.archetype}`; }
function animateHumanThrow(line){
 const scene=document.querySelector('.lane-scene');
 const stage=document.getElementById('arcadeHumanStage');
 const root=document.querySelector('#arcadeHumanStage .bowler-avatar');
 const avatarBall=root&&root.querySelector('.avatar-ball');
 const laneBall=document.getElementById('arcadeBall');
 const pinDeck=document.getElementById('arcadePinDeck');
 const path=document.getElementById('releasePath');
 if(!scene||!stage||!root||!avatarBall||!laneBall||!pinDeck) return;
 root.classList.remove('ready','celebrate','frustrated','spare-react');
 root.classList.add('throwing');
 root.animate([{bottom:'0px'},{bottom:'5px',offset:.22},{bottom:'13px',offset:.48},{bottom:'22px',offset:.72},{bottom:'18px'}],{duration:950,easing:'cubic-bezier(.2,.72,.22,1)',fill:'forwards'});
 const sceneRect=scene.getBoundingClientRect(), pinRect=pinDeck.getBoundingClientRect();
 if(path){path.classList.add('active');setTimeout(()=>path.classList.remove('active'),720);}
 setTimeout(()=>{
   if(!arcade.rolling) return;
   const handBall=document.querySelector('#arcadeHumanStage .avatar-ball');
   if(!handBall) return;
   const a=handBall.getBoundingClientRect();
   const startX=(a.left-sceneRect.left)+(a.width/2)-15;
   const startY=(a.top-sceneRect.top)+(a.height/2)-15;
   const targetX=(pinRect.left-sceneRect.left)+(pinRect.width/2)-6+(line*.32);
   const targetY=(pinRect.top-sceneRect.top)+(pinRect.height*.54)-6;
   handBall.style.opacity='0';
   laneBall.classList.add('rolling');
   laneBall.style.opacity='1';laneBall.style.width='30px';laneBall.style.height='30px';
   laneBall.style.left=`${startX}px`;laneBall.style.top=`${startY}px`;laneBall.style.transform='none';
   const dx=targetX-startX,dy=targetY-startY;
   laneBall.animate([
     {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1,offset:0},
     {transform:`translate(${dx*.12}px,${dy*.08}px) scale(.95) rotate(110deg)`,opacity:1,offset:.22},
     {transform:`translate(${dx*.48}px,${dy*.43}px) scale(.70) rotate(390deg)`,opacity:1,offset:.52},
     {transform:`translate(${dx*.80}px,${dy*.78}px) scale(.48) rotate(720deg)`,opacity:1,offset:.82},
     {transform:`translate(${dx}px,${dy}px) scale(.36) rotate(980deg)`,opacity:1,offset:1}
   ],{duration:700,easing:'cubic-bezier(.15,.72,.22,1)',fill:'forwards'});
 },430);
}
function showBowlingReaction(pins,before){
 const root=document.querySelector('#arcadeHumanStage .bowler-avatar');
 if(!root)return;
 root.getAnimations().forEach(a=>a.cancel());
 root.classList.remove('throwing','ready','celebrate','frustrated','spare-react');
 if(before===10&&pins===10){root.classList.add('celebrate');playArcadeSound('cheer');}
 else if(before<10&&pins===before){root.classList.add('spare-react');}
 else if(pins===0||(before===10&&pins<=5)){root.classList.add('frustrated');}
 else root.classList.add('spare-react');
}

function showPlayerCard(playerId){
 const pl = PLAYERS[playerId];
 if(!pl) return;
 const hasCurrentSeason = pl.seasonGames && pl.seasonGames.length>0;
 const hasPriorSeason = careerModeOn && pl.lastFinish!==null;
 const regularGames = hasCurrentSeason ? pl.seasonGames.slice(0,Math.min(pl.seasonGames.length,TOTAL_WEEKS*9)) : [];
 const seasonAvg = regularGames.length ? mean(regularGames) : (pl.careerSeasons?.length ? pl.careerSeasons[pl.careerSeasons.length-1].seasonAvg : pl.careerAvg);
 const bestGame = hasCurrentSeason ? Math.max(...pl.seasonGames) : (pl.careerSeasons?.length ? pl.careerSeasons[pl.careerSeasons.length-1].highGame : '—');
 const worstGame = hasCurrentSeason ? Math.min(...pl.seasonGames) : '—';
 const delta = hasCurrentSeason ? seasonAvg - pl.careerAvg : 0;
 const deltaClass = delta>0.5 ? 'up' : delta<-0.5 ? 'down' : 'flat';
 const deltaSymbol = delta>0.5 ? '↑' : delta<-0.5 ? '↓' : '→';
 const displayTotal = hasCurrentSeason ? pl.seasonTotal : pl.lastSeasonTotal;
 const displayWeeks = hasCurrentSeason ? pl.weeklyTotals.length : TOTAL_WEEKS;
 const tRank = Math.max(0, tierRank(pl.tier));
 const finishes = pl.finishHistory||[];
 const top3 = finishes.filter(x=>x<=3).length;
 const avgFinish = finishes.length ? mean(finishes).toFixed(1) : '—';
 const prestige = Math.round(computePrestigeScore(pl));
 const rings = pl.championships||0, mvps=totalMVPs(pl);
 const atg = pl.allTimeGreat;
 const dynasty = dynastyStatus(pl);
 const form = pl.formState==='HOT' ? '🔥 Hot streak' : pl.formState==='COLD' ? '❄️ Cold spell' : 'Steady';
 const html = `
   <div class="stat-row">
     <div><div class="stat-label">Tier</div><div class="stat-value"><span class="tier-pill t${tRank}" style="margin-left:0;">${pl.tier}</span>${pl.seniorTour?' <span class="tier-pill t2">Senior Tour</span>':''}${dynasty?' <span class="badge-mini dynasty">DYNASTY</span>':''}</div></div>
     <div><div class="stat-label">Current Form</div><div class="stat-value">${form}</div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">${hasCurrentSeason?'Season Average':'Latest Season Avg'}</div><div class="stat-value"><span class="accent">${Math.round(seasonAvg||0)}</span></div></div>
     <div><div class="stat-label">vs. Career</div><div class="stat-value"><span class="delta ${deltaClass}">${deltaSymbol} ${Math.abs(delta).toFixed(1)}</span></div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">Best Game (Current)</div><div class="stat-value"><span class="accent">${bestGame}</span></div></div>
     <div><div class="stat-label">All-Time High</div><div class="stat-value"><span class="accent">${pl.allTimeHigh}</span></div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">Career Average</div><div class="stat-value">${Math.round(pl.careerAvg)}</div></div>
     <div><div class="stat-label">Best Season Avg</div><div class="stat-value">${pl.bestSeasonAvg ? pl.bestSeasonAvg.toFixed(1) : '—'}</div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">${hasCurrentSeason?'Season Total':'Prior Season Total'}</div><div class="stat-value"><span class="accent">${displayTotal||0}</span></div></div>
     <div><div class="stat-label">${hasCurrentSeason?'Weeks Active':'Prior Finish'}</div><div class="stat-value">${hasCurrentSeason ? displayWeeks : (pl.lastFinish?'#'+pl.lastFinish:'—')}</div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">Championships</div><div class="stat-value"><span class="accent">${rings}</span></div></div>
     <div><div class="stat-label">MVP Awards</div><div class="stat-value"><span class="accent">${mvps}</span> <span style="font-size:12px;color:var(--polo);">(${pl.regularSeasonMvps||0} RS · ${pl.playoffMvps||0} PO)</span></div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">Top-3 Finishes</div><div class="stat-value">${top3}</div></div>
     <div><div class="stat-label">Average Finish</div><div class="stat-value">${avgFinish}</div></div>
   </div>
   <div class="stat-row">
     <div><div class="stat-label">Best Playoff Run</div><div class="stat-value">${pl.bestPlayoffWins||0} match wins</div></div>
     <div><div class="stat-label">Player of the Week</div><div class="stat-value">${pl.playerOfWeekAwards||0}</div></div>
   </div>
   <div class="atg-track">
     <div class="atg-track-title">All-Time Great Tracker ${atg?'· ACHIEVED':''}</div>
     ${progressRowHtml('Rings',rings,ALL_TIME_GREAT_MIN_RINGS)}
     ${progressRowHtml('MVPs',mvps,ALL_TIME_GREAT_MIN_MVPS)}
     ${progressRowHtml('Prestige',prestige,ALL_TIME_GREAT_MIN_PRESTIGE)}
     <div class="hint" style="margin-top:8px;">All-Time Great requires 8+ rings, 5+ total MVP awards and 225+ prestige. Elite Level Pro is the tier immediately below it.</div>
   </div>
 `;
 document.getElementById('playerCardName').textContent = `${pl.emoji} ${pl.name}`;
 document.getElementById('playerCardContent').innerHTML = html;
 document.getElementById('playerCardModal').classList.remove('hidden');
}

/* =========================================================================

  PLAYOFF ODDS & FAVORITES

  ========================================================================= */

function calcBlendedAvg(pl){

 if(!pl.seasonGames || pl.seasonGames.length===0) return pl.careerAvg;

 return 0.65*mean(pl.seasonGames) + 0.35*pl.careerAvg;

}

function softmaxProb(blend1, blend2){

 const w1 = Math.exp(blend1/25), w2 = Math.exp(blend2/25);

 return w1/(w1+w2);

}

function toAmericanOdds(prob){

 if(prob>=0.5) return '-'+Math.round(prob/(1-prob)*100);

 else return '+'+Math.round((1-prob)/prob*100);

}

 

function buildOddsTable(){

 const ordered = Object.values(PLAYERS).slice().sort((a,b)=>b.seasonTotal-a.seasonTotal);

 const odds = ordered.slice(0,6).map(pl=>{

   const blend = calcBlendedAvg(pl);

   return {pl, blend};

 });

 const totalWeight = odds.reduce((s,o)=>s+Math.exp(o.blend/25),0);

 const html = odds.map((o,i)=>{

   const prob = Math.exp(o.blend/25)/totalWeight;

   const americanOdds = toAmericanOdds(prob);

   return `<tr>

     <td class="odds-seed">#${o.pl.seed}</td>

     <td class="odds-name">${o.pl.emoji} ${o.pl.name}</td>

     <td class="odds-prob">${(prob*100).toFixed(1)}%</td>

     <td class="odds-odds">${americanOdds}</td>

   </tr>`;

 }).join('');

 document.getElementById('oddsTable').innerHTML = html;

 document.getElementById('oddsPanelWrap').style.display='block';

}

 

