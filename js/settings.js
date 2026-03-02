/* ========== RESET + NOTIFY MODULES ========== */
/* Part 3/7 — RESET + NOTIFY extracted */

var RESET=(function(){
function openSelective(){var t=D.todayKey();document.getElementById('resetFrom').value=t;document.getElementById('resetTo').value=t;document.getElementById('rstStudy').checked=true;document.getElementById('rstWork').checked=true;document.getElementById('rstRevisions').checked=false;document.getElementById('rstSyllabus').checked=false;document.getElementById('resetModal').classList.remove('hidden')}
function preset(n){if(n===0){document.getElementById('resetFrom').value='2020-01-01';document.getElementById('resetTo').value=D.todayKey();return}var f=new Date();f.setDate(f.getDate()-n);document.getElementById('resetFrom').value=D.todayKey(f);document.getElementById('resetTo').value=D.todayKey()}
function execSelective(){if(!confirm('Clear selected data in this range?'))return;if(!confirm('This cannot be undone. Really proceed?'))return;var from=document.getElementById('resetFrom').value,to=document.getElementById('resetTo').value;var d=D.getLocal();if(document.getElementById('rstStudy').checked&&d.study)Object.keys(d.study).forEach(function(k){if(k>=from&&k<=to)delete d.study[k]});if(document.getElementById('rstWork').checked&&d.work)Object.keys(d.work).forEach(function(k){if(k>=from&&k<=to)delete d.work[k]});if(document.getElementById('rstRevisions').checked)d.revisions=(d.revisions||[]).filter(function(r){return r.created<from||r.created>to});if(document.getElementById('rstSyllabus').checked)d.syllabus={};D.saveLocal(d);document.getElementById('resetModal').classList.add('hidden');UI.renderAll();D.push();UI.toast('Cleared ✓')}
function freshStart(){if(!confirm('Delete ALL sessions, revisions, syllabus, deadlines, recurring?\nSubjects, categories & settings will be kept.'))return;if(!confirm('LAST CHANCE. This cannot be undone!'))return;var d=D.getLocal();d.study={};d.work={};d.revisions=[];d.syllabus={};d.deadlines=[];d.recurring=[];d.recurringDone={};D.saveLocal(d);UI.renderAll();D.push();UI.toast('Fresh start ✓')}
function clearCache(){if(!confirm('Clear offline cache?'))return;if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister()})});caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})});UI.toast('Cache cleared ✓ — reload page')}
return{openSelective:openSelective,preset:preset,execSelective:execSelective,freshStart:freshStart,clearCache:clearCache}})();

var NOTIFY=(function(){
function requestPerm(){if(!('Notification' in window)){UI.toast('Notifications not supported');return}Notification.requestPermission().then(function(p){updateStatus();if(p==='granted'){UI.toast('Notifications enabled ✓');scheduleChecks()}else UI.toast('Permission denied')})}
function updateStatus(){var el=document.getElementById('notifStatus');if(!('Notification' in window)){el.textContent='Notifications: Not supported';return}el.textContent='Notifications: '+Notification.permission}
function scheduleChecks(){setInterval(checkAndNotify,5*60*1000);checkAndNotify()}
function checkAndNotify(){if(Notification.permission!=='granted')return;var now=new Date(),today=D.todayKey(),hr=now.getHours(),min=now.getMinutes(),lastKey='st3_notif_'+today;var sent=JSON.parse(localStorage.getItem(lastKey)||'{}');
// Recurring tasks
D.getRC().filter(function(r){return r.active!==false}).forEach(function(rc){if(!RECUR.isDueOn(rc,now))return;var rH=parseInt(rc.time.split(':')[0]),rM=parseInt(rc.time.split(':')[1]||0);if(hr===rH&&min>=rM&&min<rM+5&&!sent['rc_'+rc.id]){fire('🔄 '+rc.title,rc.rcType+' — Time for your task!');sent['rc_'+rc.id]=1}});
// Revisions at 8 AM
if(hr===8&&min<5&&!sent.rev){var rd=D.getRevs().filter(function(r){return r.active&&r.nextDate<=today});if(rd.length){fire('🧠 '+rd.length+' topic'+(rd.length>1?'s':'')+' due','Go to Revision tab!');sent.rev=1}}
// Deadlines
D.getDL().forEach(function(dl){var target=new Date(dl.date),diff=Math.ceil((target-now)/(864e5));if(diff===7&&hr===8&&min<5&&!sent['dl7_'+dl.id]){fire('⏰ '+dl.title+' in 1 week','Prepare now!');sent['dl7_'+dl.id]=1}if(diff===1&&hr===8&&min<5&&!sent['dl1_'+dl.id]){fire('🚨 '+dl.title+' TOMORROW','Final prep time!');sent['dl1_'+dl.id]=1}});
// [6] End-of-day journal reminder — fires 30 min before bedtime
var bedtime=D.getCfg().bedtime||23;
if(hr===(bedtime-1>=0?bedtime-1:23)&&min>=30&&min<35&&!sent.journal){
  var jrnl=D.getLocal().journal||{};
  if(!jrnl[today]||(!jrnl[today].rating&&!jrnl[today].mood)){
    fire('📝 Daily Journal','Fill your journal before bed — rate your day!');sent.journal=1;
  }
}
// Overdue to-do alerts at 9 AM
if(hr===9&&min<5&&!sent.overdue){
  var oc=TODO.getOverdueCount();
  if(oc>0){fire('⚠️ '+oc+' Overdue To-Do'+(oc>1?'s':''),'Open your to-do list and clear the backlog!');sent.overdue=1}
}
localStorage.setItem(lastKey,JSON.stringify(sent))}
function fire(title,body){try{if('serviceWorker' in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(function(reg){reg.showNotification(title,{body:body,icon:'icon192.png',badge:'icon192.png',vibrate:[200,100,200]})})}else{new Notification(title,{body:body,icon:'icon192.png'})}}catch(e){new Notification(title,{body:body})}}
return{requestPerm:requestPerm,updateStatus:updateStatus,scheduleChecks:scheduleChecks,checkAndNotify:checkAndNotify}})();
