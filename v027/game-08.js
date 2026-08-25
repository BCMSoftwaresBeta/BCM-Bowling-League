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

/* Load approved v0.3.0d A3 patch after the A2 patch has finished loading. */
(function(){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='v030/a3patch.css?v=030d';
  document.head.appendChild(css);
  window.addEventListener('load',()=>{
    const s=document.createElement('script');
    s.src='v030/a3patch.js?v=030d';
    s.defer=true;
    document.body.appendChild(s);
  },{once:true});
})();

/* init */

if(!tryLoadAutosave()){ initSeason(); autosaveGame(); }
