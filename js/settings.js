/* ========== RESET + NOTIFY MODULES ========== */
/* Part 3/7 — RESET + NOTIFY extracted */

var RESET=(function(){
function openSelective(){var t=D.todayKey();document.getElementById('resetFrom').value=t;document.getElementById('resetTo').value=t;document.getElementById('rstStudy').checked=true;document.getElementById('rstWork').checked=true;document.getElementById('rstRevisions').checked=false;document.getElementById('rstSyllabus').checked=false;document.getElementById('rstDeadlines').checked=false;document.getElementById('rstRecurring').checked=false;document.getElementById('rstPlans').checked=false;document.getElementById('rstTodos').checked=false;document.getElementById('rstKnowledge').checked=false;document.getElementById('rstJournal').checked=false;document.getElementById('resetModal').classList.remove('hidden')}
function preset(n){if(n===0){document.getElementById('resetFrom').value='2020-01-01';document.getElementById('resetTo').value=D.todayKey()}else{var f=new Date();f.setDate(f.getDate()-n);document.getElementById('resetFrom').value=D.todayKey(f);document.getElementById('resetTo').value=D.todayKey()}
/* Highlight active preset button */
['presetBtn7','presetBtn30','presetBtn0'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('preset-active')});
var activeId=n===7?'presetBtn7':n===30?'presetBtn30':'presetBtn0';
var activeBtn=document.getElementById(activeId);if(activeBtn)activeBtn.classList.add('preset-active');
var desc=n===0?'Range set to all time':('Range set to last '+n+' days');
var descEl=document.getElementById('presetDesc');if(descEl)descEl.textContent=desc}
function execSelective(){if(!confirm('Clear selected data in this range?'))return;if(!confirm('This cannot be undone. Really proceed?'))return;var from=document.getElementById('resetFrom').value,to=document.getElementById('resetTo').value;var d=D.getLocal();if(document.getElementById('rstStudy').checked&&d.study)Object.keys(d.study).forEach(function(k){if(k>=from&&k<=to)delete d.study[k]});if(document.getElementById('rstWork').checked&&d.work)Object.keys(d.work).forEach(function(k){if(k>=from&&k<=to)delete d.work[k]});if(document.getElementById('rstRevisions').checked)d.revisions=(d.revisions||[]).filter(function(r){return r.created<from||r.created>to});if(document.getElementById('rstSyllabus').checked)d.syllabus={};if(document.getElementById('rstDeadlines').checked)d.deadlines=[];if(document.getElementById('rstRecurring').checked){d.recurring=[];d.recurringDone={}}if(document.getElementById('rstPlans').checked){if(d.plans)Object.keys(d.plans).forEach(function(k){if(k>=from&&k<=to)delete d.plans[k]});localStorage.removeItem('st3_planTemplates')}if(document.getElementById('rstTodos').checked)d.todos={study:[],work:[]};if(document.getElementById('rstKnowledge').checked){d.knowledge=(d.knowledge||[]).filter(function(e){return e.date<from||e.date>to})}if(document.getElementById('rstJournal').checked){if(d.journal)Object.keys(d.journal).forEach(function(k){if(k>=from&&k<=to)delete d.journal[k]})}D.saveLocal(d);document.getElementById('resetModal').classList.add('hidden');UI.renderAll();D.push();UI.toast('Cleared ✓')}
function freshStart(){if(!confirm('Delete ALL sessions, revisions, syllabus, deadlines, recurring, plans, to-dos, knowledge log & journal?\nSubjects, categories & settings will be kept.'))return;if(!confirm('LAST CHANCE. This cannot be undone!'))return;var d=D.getLocal();d.study={};d.work={};d.revisions=[];d.syllabus={};d.deadlines=[];d.recurring=[];d.recurringDone={};d.todos={study:[],work:[]};d.plans={};d.knowledge=[];d.journal={};localStorage.removeItem('st3_planTemplates');D.saveLocal(d);UI.renderAll();D.push();UI.toast('Fresh start ✓')}
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
// Deadlines — enhanced: 30d, 7d, daily ≤7d, day-of
D.getDL().filter(function(d){return!d.done}).forEach(function(dl){var diff=Math.ceil((new Date(dl.date+'T00:00:00')-now)/(864e5));
if(diff===30&&hr===8&&min<5&&!sent['dl30_'+dl.id]){fire('📅 Deadline in 1 month',dl.title+' is due on '+UI.fdate(dl.date));sent['dl30_'+dl.id]=1}
if(diff===7&&hr===8&&min<5&&!sent['dl7_'+dl.id]){fire('⚠️ Deadline in 1 week',dl.title+' is due on '+UI.fdate(dl.date));sent['dl7_'+dl.id]=1}
if(diff>0&&diff<7&&hr===8&&min<5&&!sent['dld_'+dl.id+'_'+today]){fire('🔥 '+diff+' day'+(diff>1?'s':'')+' left',dl.title+' is due on '+UI.fdate(dl.date));sent['dld_'+dl.id+'_'+today]=1}
if(diff===0&&hr>=8&&!sent['dl0_'+dl.id+'_'+today]){fire('🚨 Due TODAY',dl.title+' is due today!');sent['dl0_'+dl.id+'_'+today]=1}
});
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
// [#35] Todo due date reminders at 8 AM — tasks due today (not just overdue)
if(hr===8&&min<5&&!sent.todoDue){
  var _todos=D.getLocal().todos||{};var _dueToday=0;
  ['study','work'].forEach(function(g){(_todos[g]||[]).forEach(function(t){if(t.status!=='done'&&t.due===today)_dueToday++})});
  if(_dueToday>0){fire('📋 '+_dueToday+' To-Do'+((_dueToday>1)?'s':'')+' due today','Check your to-do list!');sent.todoDue=1}
}
// [#36] Plan reminder at configurable hour — unfinished plans today
var _planRemHr=parseInt((D.getCfg().planRemindHour)||0);
if(_planRemHr>0&&hr===_planRemHr&&min<5&&!sent.planRem){
  var _plans=PLAN.getForDate(today);
  var _unfinished=_plans.filter(function(p){return p.status!=='completed'&&p.status!=='skipped'}).length;
  if(_unfinished>0){fire('🎯 '+_unfinished+' unfinished plan'+((_unfinished>1)?'s':'')+' today','Open Planning to review!');sent.planRem=1}
}
// Plan start-time alerts — 5 min before scheduled plans
var _todayPlans=PLAN.getForDate(today);
_todayPlans.forEach(function(p){
  if(!p.startTime||p.status==='completed'||p.status==='skipped')return;
  var _sp=p.startTime.split(':');
  var planMin=parseInt(_sp[0])*60+parseInt(_sp[1]);
  var nowMin=hr*60+min;
  var diff=planMin-nowMin;
  if(diff>=0&&diff<=5&&!sent['planStart_'+p.id]){
    fireWithSound('\u{1F4CB} Plan starting in '+diff+' min',
      p.subject+': '+(p.topic||'')+' at '+p.startTime);
    sent['planStart_'+p.id]=1;
  }
});
localStorage.setItem(lastKey,JSON.stringify(sent))}
function fire(title,body){try{if('serviceWorker' in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(function(reg){reg.showNotification(title,{body:body,icon:'icon192.png',badge:'icon192.png',vibrate:[200,100,200]})})}else{new Notification(title,{body:body,icon:'icon192.png'})}}catch(e){new Notification(title,{body:body})}}
function fireWithSound(title,body){fire(title,body);try{var ctx=new(window.AudioContext||window.webkitAudioContext)();var osc=ctx.createOscillator();var gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=880;gain.gain.value=0.3;osc.start();osc.stop(ctx.currentTime+0.15);setTimeout(function(){var o2=ctx.createOscillator();var g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.frequency.value=1046;g2.gain.value=0.3;o2.start();o2.stop(ctx.currentTime+0.15)},200)}catch(e){}}
return{requestPerm:requestPerm,updateStatus:updateStatus,scheduleChecks:scheduleChecks,checkAndNotify:checkAndNotify}})();
