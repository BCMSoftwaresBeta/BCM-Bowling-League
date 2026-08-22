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
document.getElementById('btnImportSave').addEventListener('click',()=>openSaveCode('import'));
document.getElementById('btnClearSave').addEventListener('click',()=>{if(confirm('Clear the locally saved BCM Bowling League career?')){try{localStorage.removeItem(SAVE_KEY);}catch(e){}initSeason();autosaveGame();}});
document.getElementById('btnCopySaveCode').addEventListener('click',async()=>{const txt=document.getElementById('saveCodeText');txt.select();try{await navigator.clipboard.writeText(txt.value);document.getElementById('saveCodeHint').textContent='Copied. Send this code to another device or friend.';}catch(e){document.execCommand('copy');}});
document.getElementById('btnApplySaveCode').addEventListener('click',()=>{try{loadSnapshot(decodeSave(document.getElementById('saveCodeText').value));document.getElementById('saveCodeModal').classList.add('hidden');}catch(e){alert('That save code could not be read. Make sure the entire code was pasted.');}});
document.getElementById('btnArcadeExit').addEventListener('click',closeArcadeModal);
document.getElementById('btnArcadeSound').addEventListener('click',()=>{arcade.sound=!arcade.sound;document.getElementById('btnArcadeSound').textContent=arcade.sound?'Sound On':'Sound Off';});

window.__openSeasonArchive = openSeasonArchive;
window.__arcadeStart = arcadeStart;
window.__arcadeQuickSim = quickSimArcadeFinals;
window.__arcadeSimMatch = simArcadeMatch;

window.__showPlayerCard = showPlayerCard;

 

/* init */

if(!tryLoadAutosave()){ initSeason(); autosaveGame(); }

