 

/* =========================================================================

  PLAYER DATA — historical scores pulled from MASTER_HISTORICAL_DATA.md

  ========================================================================= */

const RAW_PLAYERS = [

 { id:'opus',    name:'Opus',    emoji:'♠️', history:[81,147,146,100,130,79,124,131,115,123,143,134,132,163,127,118,191,94,143,97,94,135,151,157,149,154,121,181,180,180,207,156,149,208,219,168,146,147,143,133,182,145,193,129,190,89,124,135,248,109,179,147,130,150,174,157] },

 { id:'carter',  name:'Carter',  emoji:'🔥', history:[114,168,111,117,137,117,166,171,145,133,155,148,155,161,128,128] },

 { id:'gavin',   name:'Gavin',   emoji:'🎯', history:[122,150,133,115,158,136,151,142,171,131,141,104] },

 { id:'fademan', name:'Fademan', emoji:'🐰', history:[117,134,164,111,163,147,133,143,124,127,102,85,187,90,143,128,135,134,122,151,136,136,177,133,135,119] },

 { id:'farb',    name:'Farb',    emoji:'☭', history:[106,139,120,116,112,109,118,116,118,115,98,112,98,111,100,89,74,99,93,132,88,133,95,159,101,134,134,175,120,187,117,166,131,91,95,204] },

 { id:'bau',     name:'Bau',     emoji:'🌿', history:[91,107,79,120,120,119,97,98,130,107,144,81,91,109,98,99,82,103,93,81,123,80,93,104,98,131,129,129,117,137,113,105,140,160,98,124,114,112,82,115,116,105,124,127,103,93,101,117,111,156,117] },

 { id:'q',       name:'Q',       emoji:'🏆', history:[134,79,90,103,87,100,135] },

 { id:'woo',     name:'Woo',     emoji:'🎥', history:[87,104,79,64,89,102,72,123,59,108,100,133,94,92,100,96,84,75,94,99,119,107,100,135,118,105,40,98,86,75,97,98,96,133,122,84,84,66,106,92,103,110,93,96,119,130,107,120] },

 { id:'staub',   name:'Staub',   emoji:'🎲', history:[121,100,83,84] },

];

// Note: Farb's history includes the corrected all-time-high 204 game (never 187).

 

/* =========================================================================

  RANDOM / STATS HELPERS

  ========================================================================= */

function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }

function stdev(arr){

 const m = mean(arr);

 const v = arr.reduce((a,b)=>a+(b-m)*(b-m),0)/arr.length;

 return Math.sqrt(v);

}

// Box-Muller transform for a normally distributed random value

function gaussian(){

 let u=0, v=0;

 while(u===0) u = Math.random();

 while(v===0) v = Math.random();

 return Math.sqrt(-2.0*Math.log(u)) * Math.cos(2.0*Math.PI*v);

}

function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

 

/* =========================================================================

  SIMULATION STATE

  ========================================================================= */

let PLAYERS = {}; // id -> player state object

let currentWeek = 0;

const TOTAL_WEEKS = 10;

let standingsSnapshotPrev = null; // for computing weekly rank movement

let weeklyRecaps = [];

let playoffs = null; // playoff bracket state

let seasonLocked = false;

 

function freshPlayerState(p){

 const careerAvg = mean(p.history);

 const careerSd = clamp(stdev(p.history), 10, 38);

 const startHigh = Math.max(...p.history);

 return {

   id:p.id, name:p.name, emoji:p.emoji,

   careerHistory: p.history.slice(),

   careerAvg, careerSd,

   startAvg: careerAvg,        // frozen original level, used for career-mode floors/targets

   allTimeHigh: startHigh,

   tier: null, tierGroup:null, targetYear:null, proTarget:null,

   seniorTour: false,

   championships: 0,           // total career titles won

   regularSeasonMvps: 0,       // regular-season MVP awards

   playoffMvps: 0,             // playoff MVP awards

   allTimeGreat: false,        // permanent legacy designation once earned

   careerSeasons: [],          // archived per-year résumé snapshots

   bestSeasonAvg: 0, bestSeasonTotal: 0, bestPlayoffWins: 0,

   championshipYears: [], playerOfWeekAwards: 0,

   formState: 'NORMAL', formModifier: 0, formWeeksLeft: 0,

   finishHistory: [],          // final standings rank (1-9) for each completed year

   lastFinish: null,           // prior year's final regular-season rank

   lastSeasonTotal: 0,

   lastSeasonWeeklyAvg: 0,

   lastSeasonLastWeekTotal: 0,

   seasonGames: [],       // flat chronological list of games played this season

   weeklyTotals: [],      // total pins per week

   seasonTotal: 0,

   lastWeekTotal: 0,

   rank: 0, prevRank: 0,

 };

}

 

