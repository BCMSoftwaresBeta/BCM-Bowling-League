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

/* Load approved presentation patches in order: A3 first, then A4. */
(function(){
  const a3css=document.createElement('link');
  a3css.rel='stylesheet';
  a3css.href='v030/a3patch.css?v=030d';
  document.head.appendChild(a3css);

  const a4css=document.createElement('link');
  a4css.rel='stylesheet';
  a4css.href='v031/a4patch.css?v=031d';
  document.head.appendChild(a4css);

  window.addEventListener('load',()=>{
    const a3=document.createElement('script');
    a3.src='v030/a3patch.js?v=030d';
    a3.async=false;
    a3.onload=()=>{
      const a4=document.createElement('script');
      a4.src='v031/a4patch.js?v=031d';
      a4.async=false;
      document.body.appendChild(a4);
    };
    document.body.appendChild(a3);
  },{once:true});
})();

/* init */

if(!tryLoadAutosave()){ initSeason(); autosaveGame(); }
