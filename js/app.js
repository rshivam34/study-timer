/* ========== APP MODULE + NAVIGATION ========== */
/* Part 3/7 — App init, navigation, focus, quotes, keyboard, save modal wiring */

/* QUOTES fallback — may also be defined in ui.js */
if(typeof QUOTES==='undefined'){
  var QUOTES=["Work the hardest, be the smartest.","Keep working hard — results will show.","Give it your all. Every single day.","Be happy. You deserve it. 😊","Discipline is choosing between what you want now and what you want most.","The pain of discipline weighs ounces; the pain of regret weighs tons.","You didn't come this far to only come this far.","Small daily improvements lead to stunning results.","Don't stop when you're tired. Stop when you're done.","Your future self will thank you for the work you put in today.","Consistency beats talent when talent doesn't work hard.","Stay hungry. Stay foolish. Stay kind.","Remember to breathe and be happy — you're doing great. 🌟"];
}

var App=(function(){var deferredPrompt=null,focusMoveIv=null,quoteIv=null;
function rotateQuote(){var all=getAllQuotes();var q=all[Math.floor(Math.random()*all.length)];var el=document.getElementById('quoteBar');el.style.opacity='0';el.style.transform='translateY(4px)';setTimeout(function(){el.textContent='"'+q+'"';el.style.opacity='1';el.style.transform='translateY(0)'},500)}
function getAllQuotes(){var cfg=D.getCfg();return QUOTES.concat(cfg.customQuotes||[])}
function toggleQuotes(){var p=document.getElementById('quotePanel');p.classList.toggle('hidden');if(!p.classList.contains('hidden'))renderQuotes()}
function renderQuotes(){var all=getAllQuotes(),cfg=D.getCfg(),custom=cfg.customQuotes||[];var el=document.getElementById('quoteList');el.innerHTML=all.map(function(q,i){var isCustom=i>=QUOTES.length;return'<div class="quote-item"><span>"'+esc(q)+'"</span>'+(isCustom?'<button class="quote-rm" onclick="event.stopPropagation();App.rmQuote('+(i-QUOTES.length)+')">✕</button>':'')+'</div>'}).join('')}
function addQuote(){var inp=document.getElementById('addQuote'),val=inp.value.trim();if(!val)return;var cfg=D.getCfg();if(!cfg.customQuotes)cfg.customQuotes=[];cfg.customQuotes.push(val);D.setCfg(cfg);inp.value='';renderQuotes();D.push();UI.toast('Added ✓')}
function rmQuote(idx){var cfg=D.getCfg();if(!cfg.customQuotes)return;cfg.customQuotes.splice(idx,1);D.setCfg(cfg);renderQuotes();D.push()}
function init(){var _dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];document.getElementById('todayD').textContent=_dn[new Date().getDay()]+', '+UI.fdate(D.todayKey());document.getElementById('goalDate').value=D.todayKey();var cfg=D.getCfg();document.documentElement.setAttribute('data-theme',cfg.theme||'dark');rotateQuote();quoteIv=setInterval(rotateQuote,30000);
var wCats=cfg.workCategories;
/* Study dropdown uses exam-grouped subjects */
document.getElementById('studyCat').innerHTML=UI.examSubjectOptions(null,false).replace('<option value="">Select...</option>','');
document.getElementById('workCat').innerHTML=wCats.map(function(s){return'<option>'+s+'</option>'}).join('');
document.getElementById('sylSubj').innerHTML=UI.examSubjectOptions(null,false);
if(D.isCloud()){show('main');syncUI('busy');D.sync().then(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('on');gInfo();TM.recoverState()}).catch(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('err');gInfo();TM.recoverState()})}else if(D.getToken()){show('main');syncUI('busy');D.autoConn().then(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('on');gInfo();TM.recoverState()}).catch(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('err');gInfo();TM.recoverState()})}else{show('setup')}
document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;if(e.key===' '||e.code==='Space'){e.preventDefault();var at=TM.activeType();if(at){var s=TM.getState(at);s.pau?TM.resume(at):TM.pause(at)}else{var ct=document.querySelector('.tp.on').id.replace('p-','');if(ct==='study')TM.start('study');else if(ct==='work')TM.start('work')}}if(e.key==='s'){var a=TM.activeType();if(a)TM.stop(a)}if(e.key==='D'&&e.shiftKey){var a2=TM.activeType();if(a2)TM.discard(a2)}if(e.key==='f')enterFocus();if(e.key==='t')toggleTheme();if(e.key==='Escape')exitFocus();if(e.key==='p')App.navTo('plan');if(e.key==='c')App.navTo('calendar');if(e.key==='d'&&!e.shiftKey)App.navTo('todo');if(e.key==='u')App.navTo('summary');if(e.key==='k')App.navTo('knowledge');if(e.key>='1'&&e.key<='8'){var tabs=['study','work','report','syl','rev','remind','recur','sett'];tab(tabs[parseInt(e.key)-1])}});
document.querySelectorAll('input[type="date"],input[type="datetime-local"]').forEach(function(inp){inp.addEventListener('mouseenter',function(){try{this.showPicker()}catch(e){}})});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(reg){
if('periodicSync' in reg){reg.periodicSync.register('study-timer-check',{minInterval:4*60*60*1000}).catch(function(){})}
navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.type==='check-notifications')NOTIFY.checkAndNotify()})
}).catch(function(e){console.log('SW:',e)})}
NOTIFY.updateStatus();if(Notification.permission==='granted')NOTIFY.scheduleChecks();
var xCfg=D.getCfg();var wkEl=document.getElementById('cfgWakeTime');if(wkEl&&xCfg.wakeTime!==undefined)wkEl.value=xCfg.wakeTime;if(xCfg.bedtime)document.getElementById('cfgBedtime').value=xCfg.bedtime;if(xCfg.effectiveMins)document.getElementById('cfgEffective').value=xCfg.effectiveMins;var prEl2=document.getElementById('cfgPlanRemindHour');if(prEl2&&xCfg.planRemindHour)prEl2.value=xCfg.planRemindHour;
setInterval(function(){if(document.getElementById('p-remind').classList.contains('on'))REM.render()},60000);
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;document.getElementById('pwaStatus').textContent='Ready to install!'});
UI.addInfoBtns()}
function show(w){document.getElementById('setup').classList.toggle('hidden',w!=='setup');document.getElementById('mainApp').classList.toggle('hidden',w!=='main')}
function connect(){var token=document.getElementById('tokIn').value.trim(),hint=document.getElementById('sHint');if(!token){hint.className='shint';hint.textContent='Enter a token.';return}hint.className='shint ok';hint.textContent='Validating...';D.validate(token).then(function(eid){D.setToken(token);if(eid){D.setGistId(eid);hint.textContent='Syncing...';return D.sync()}hint.textContent='Creating...';return D.makeG().then(function(id){D.setGistId(id)})}).then(function(){hint.textContent='Connected ✓';setTimeout(function(){show('main');UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo()},400)}).catch(function(e){hint.className='shint';hint.textContent='Invalid token.';console.error(e)})}
function skip(){show('main');UI.renderAll();RP.renderHeatmap();syncUI('off')}
function tab(id){document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('on')});document.querySelectorAll('.tp').forEach(function(p){p.classList.remove('on')});var tabEl=document.querySelector('.t-'+id);if(tabEl)tabEl.classList.add('on');var panel=document.getElementById('p-'+id);if(panel)panel.classList.add('on');if(id==='report')RP.renderHeatmap();if(id==='rev')REV.render();if(id==='syl')SYL.renderAll();if(id==='recur')RECUR.render();if(id==='remind')REM.render()}
function syncUI(state){var dot=document.getElementById('sDot'),txt=document.getElementById('sTxt'),btn=document.getElementById('sBtn');dot.className='sdot';btn.classList.remove('spin');if(state==='on'){dot.classList.add('on');txt.textContent='Synced'}else if(state==='busy'){dot.classList.add('busy');txt.textContent='Syncing...';btn.classList.add('spin')}else if(state==='err'){dot.classList.add('err');txt.textContent='Error'}else txt.textContent='Local'}
function gInfo(){var el=document.getElementById('gInfo'),btn=document.getElementById('gBtn');if(D.isCloud()){el.textContent='Connected — '+D.getGistId().slice(0,8)+'...';btn.textContent='Disconnect';btn.onclick=function(){if(confirm('Disconnect?')){D.disc();gInfo();syncUI('off');UI.toast('Disconnected')}}}else{el.textContent='Not connected';btn.textContent='Connect';btn.onclick=reconn}}
function manSync(){if(!D.getToken()){UI.toast('Connect first');return}syncUI('busy');(D.isCloud()?D.sync():D.autoConn()).then(function(){UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo();UI.toast('Synced ✓')}).catch(function(){D.autoConn().then(function(){UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo();UI.toast('Synced ✓')}).catch(function(){syncUI('err');UI.toast('Failed')})})}
function reconn(){show('setup')}
function addCat(type){var inp=document.getElementById(type==='study'?'addStudy':type==='work'?'addWork':'addKnowledge');var val=inp.value.trim();if(!val)return;var cfg=D.getCfg();
if(type==='study'){
  /* Add to first exam by default */
  var exams=D.getExams();
  if(exams.length){D.addSubjectToExam(exams[0].id,val)}
  else{if(cfg.studySubjects.indexOf(val)===-1)cfg.studySubjects.push(val);D.setCfg(cfg)}
} else {
  var list=type==='work'?cfg.workCategories:(cfg.knowledgeCategories||(cfg.knowledgeCategories=[]));
  if(list.indexOf(val)===-1)list.push(val);D.setCfg(cfg);
}
inp.value='';UI.renderAll();D.push();UI.toast('Added')}
function rmCat(type,name){if(!confirm('Remove "'+name+'"?'))return;var cfg=D.getCfg();if(type==='study'){
  /* Remove from all exams */
  var exams=D.getExams();exams.forEach(function(ex){ex.subjects=(ex.subjects||[]).filter(function(s){return s!==name})});
  D.setExams(exams);cfg.studySubjects=D.getAllSubjects();D.setCfg(cfg);
} else if(type==='work')cfg.workCategories=cfg.workCategories.filter(function(s){return s!==name});else if(type==='knowledge')cfg.knowledgeCategories=(cfg.knowledgeCategories||[]).filter(function(s){return s!==name});D.setCfg(cfg);UI.renderAll();D.push()}
function toggleTheme(){var cfg=D.getCfg();cfg.theme=cfg.theme==='dark'?'light':'dark';D.setCfg(cfg);document.documentElement.setAttribute('data-theme',cfg.theme);D.push()}
function saveCfgExtra(){var cfg=D.getCfg();cfg.wakeTime=parseFloat(document.getElementById('cfgWakeTime').value)||6;cfg.bedtime=parseFloat(document.getElementById('cfgBedtime').value)||22.5;cfg.effectiveMins=parseInt(document.getElementById('cfgEffective').value)||50;var prEl=document.getElementById('cfgPlanRemindHour');if(prEl)cfg.planRemindHour=parseInt(prEl.value)||0;D.setCfg(cfg);D.push();try{App.renderTimeBudget()}catch(e){}UI.toast('Settings saved')}
function enterFocus(){if(!TM.isOn()){UI.toast('Start timer first');return}document.getElementById('focusMode').classList.remove('hidden');var at=TM.activeType();document.getElementById('focusSub').textContent=at==='study'?'Studying':'Working';document.getElementById('focusCat').textContent=document.getElementById(at==='study'?'studyCat':'workCat').value;updateFocusBtns();moveFocusTimer();focusMoveIv=setInterval(moveFocusTimer,8000)}
function exitFocus(){document.getElementById('focusMode').classList.add('hidden');if(focusMoveIv){clearInterval(focusMoveIv);focusMoveIv=null}}
function moveFocusTimer(){var el=document.getElementById('focusInner');el.style.left=Math.max(20,Math.random()*(window.innerWidth-300))+'px';el.style.top=Math.max(20,Math.random()*(window.innerHeight-200))+'px'}
function focusAction(a){var at=TM.activeType();if(!at)return;if(a==='pause'){TM.pause(at);updateFocusBtns()}else if(a==='resume'){TM.resume(at);updateFocusBtns()}else if(a==='stop'){exitFocus();TM.stop(at)}}
function updateFocusBtns(){var at=TM.activeType();if(!at)return;var s=TM.getState(at);document.getElementById('focusPause').classList.toggle('hidden',s.pau);document.getElementById('focusResume').classList.toggle('hidden',!s.pau)}
function installPWA(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(function(r){deferredPrompt=null;if(r.outcome==='accepted'){document.getElementById('pwaStatus').textContent='Installed! ✓';document.getElementById('pwaInstallBtn').textContent='✓ Done'}else{document.getElementById('pwaManual').classList.remove('hidden')}})}else{var m=document.getElementById('pwaManual');m.classList.toggle('hidden');if(!m.classList.contains('hidden'))UI.toast('Follow the steps below')}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
return{connect:connect,skip:skip,tab:tab,syncUI:syncUI,manSync:manSync,reconn:reconn,addCat:addCat,rmCat:rmCat,toggleTheme:toggleTheme,saveCfgExtra:saveCfgExtra,enterFocus:enterFocus,exitFocus:exitFocus,focusAction:focusAction,installPWA:installPWA,toggleQuotes:toggleQuotes,addQuote:addQuote,rmQuote:rmQuote}})();

/* Exam management functions — attached after IIFE */
App.addExam=function(){var name=prompt('Exam name:');if(!name||!name.trim())return;D.addExam(name.trim());UI.renderManage();UI.fillDD();D.push();UI.toast('Exam added')};
App.rmExam=function(id){if(!confirm('Delete this exam and all its subjects?'))return;D.removeExam(id);var cfg=D.getCfg();cfg.studySubjects=D.getAllSubjects();D.setCfg(cfg);UI.renderManage();UI.fillDD();D.push();UI.toast('Exam removed')};
App.editExamName=function(id){var exams=D.getExams();var ex=exams.find(function(e){return e.id===id});if(!ex)return;var name=prompt('Rename exam:',ex.name);if(!name||!name.trim())return;ex.name=name.trim();D.setExams(exams);UI.renderManage();D.push();UI.toast('Renamed')};
App.addSubjectToExam=function(examId){var inp=document.getElementById('addSubjExam_'+examId);var val=inp?inp.value.trim():'';if(!val)return;D.addSubjectToExam(examId,val);inp.value='';UI.renderManage();UI.fillDD();D.push();UI.toast('Added')};
App.rmSubjectFromExam=function(examId,subject){if(!confirm('Remove "'+subject+'"?'))return;D.removeSubjectFromExam(examId,subject);UI.renderManage();UI.fillDD();D.push();UI.toast('Removed')};


/* ========== ENHANCED APP NAVIGATION + WIRING ========== */
(function(){
  App.openSidePanel = function(){
    document.getElementById('sidePanel').classList.add('open');
    document.getElementById('sideOverlay').classList.add('open');
  };
  App.closeSidePanel = function(){
    document.getElementById('sidePanel').classList.remove('open');
    document.getElementById('sideOverlay').classList.remove('open');
  };
  App.navTo = function(id){
    App.closeSidePanel();
    document.querySelectorAll('.tp').forEach(function(p){p.classList.remove('on')});
    var panel = document.getElementById('p-'+id);
    if(panel) panel.classList.add('on');
    document.querySelectorAll('.sp-nav a').forEach(function(a){a.classList.remove('active')});
    document.querySelectorAll('.sp-nav a').forEach(function(a){
      if(a.getAttribute('onclick') && a.getAttribute('onclick').indexOf("'"+id+"'")>-1) a.classList.add('active');
    });
    if(id==='report'){
      RP.renderHeatmap();
      /* Auto-apply today's report with comparison on first visit */
      if(!document.getElementById('rpFrom').value){
        document.getElementById('rpFrom').value=D.todayKey();
        document.getElementById('rpTo').value=D.todayKey();
        RP.apply();
      }
    }
    if(id==='rev') REV.render();
    if(id==='syl') SYL.renderAll();
    if(id==='recur') RECUR.render();
    if(id==='remind') REM.render();
    if(id==='plan') PLAN.init();
    if(id==='calendar') CAL.init();
    if(id==='todo') TODO.render();
    if(id==='summary') try{SUM.init()}catch(e){}
    if(id==='knowledge') try{KNOW.init()}catch(e){}
  };
  App.tab = App.navTo;

  // Save modal: auto-populate plan dropdown when modal opens
  var _mObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.target.id === 'saveModal' && !m.target.classList.contains('hidden')){
        var cat = document.getElementById('smCat').textContent;
        var type = document.querySelector('#p-study.on') ? 'study' : 'work';

        /* ── Study vs Work field visibility ── */
        var pastTopicWrap = document.getElementById('smPastTopicWrap');
        var sourceWrap = document.getElementById('smSourceWrap');
        var diffWrap = document.getElementById('smDiffWrap');
        var topicLabel = document.getElementById('smTopicLabel');
        var topicAsterisk = document.getElementById('smTopicAsterisk');
        var smNote = document.getElementById('smNote');

        if(type === 'work'){
          if(pastTopicWrap) pastTopicWrap.classList.add('hidden');
          if(sourceWrap) sourceWrap.classList.add('hidden');
          if(diffWrap) diffWrap.classList.add('hidden');
          if(topicAsterisk) topicAsterisk.classList.add('hidden');
          if(topicLabel) topicLabel.childNodes[0].textContent = 'Notes ';
          if(smNote) smNote.placeholder = 'Notes (optional)';
        } else {
          if(pastTopicWrap) pastTopicWrap.classList.remove('hidden');
          if(sourceWrap) sourceWrap.classList.remove('hidden');
          if(diffWrap) diffWrap.classList.remove('hidden');
          if(topicAsterisk) topicAsterisk.classList.remove('hidden');
          if(topicLabel) topicLabel.childNodes[0].textContent = 'Topic studied ';
          if(smNote) smNote.placeholder = 'What did you study? (required)';
        }

        /* ── Populate past topics dropdown (study only) ── */
        if(type === 'study' && pastTopicWrap){
          var ptSel = document.getElementById('smPastTopic');
          var seen = {};
          var pastTopics = [];
          /* From revisions */
          var revs = D.getRevs();
          revs.forEach(function(r){
            if(r.subj !== cat || seen[r.topic]) return;
            seen[r.topic] = 1;
            pastTopics.push(r.topic);
          });
          /* From past sessions */
          var localData = D.getLocal();
          var studyData = localData.study || {};
          Object.keys(studyData).forEach(function(dk){
            (studyData[dk] || []).forEach(function(s){
              if(s.cat !== cat || !s.note || seen[s.note]) return;
              seen[s.note] = 1;
              pastTopics.push(s.note);
            });
          });
          ptSel.innerHTML = '<option value="">— Type new topic below —</option>';
          pastTopics.slice(0, 30).forEach(function(t){
            ptSel.innerHTML += '<option value="'+esc(t)+'">'+esc(t)+'</option>';
          });
        }

        /* ── Show plans matching this category ── */
        var plans = PLAN.getTodayPlansForSubject(cat);
        var sel = document.getElementById('smFromPlan');
        sel.innerHTML = '<option value="">— New topic (not from plan) —</option>';
        plans.forEach(function(p){
          sel.innerHTML += '<option value="'+p.id+'">'+p.topic+(p.lecNum?' (Lec #'+p.lecNum+')':'')+'</option>';
        });
        var syl = D.getSyl();
        var smLecSection = document.getElementById('smLectureSection');
        if(syl[cat] && syl[cat].total){
          smLecSection.classList.remove('hidden');
          var lecSel = document.getElementById('smLecNum');
          lecSel.innerHTML = '';
          for(var i=1;i<=syl[cat].total;i++){
            var done = i <= (syl[cat].done||0);
            lecSel.innerHTML += '<option value="'+i+'"'+(done?' style="color:var(--grn)"':'')+'>Lec '+i+(done?' ✓':'')+'</option>';
          }
          var nextLec = (syl[cat].done||0)+1;
          if(nextLec<=syl[cat].total) lecSel.value = nextLec;
        } else {
          smLecSection.classList.add('hidden');
        }
        /* Populate todo dropdown for session-to-todo linking */
        var todoSel = document.getElementById('smLinkTodo');
        if(todoSel){
          var todos = D.getLocal().todos || {};
          var today = D.todayKey();
          var items = (todos[type] || []).filter(function(i){return i.status !== 'done' && (!i.due || i.due <= today)});
          todoSel.innerHTML = '<option value="">— None —</option>';
          items.slice(0, 15).forEach(function(t){
            todoSel.innerHTML += '<option value="'+t.id+'">'+t.title+'</option>';
          });
        }
      }
    });
  });
  var saveModalEl = document.getElementById('saveModal');
  if(saveModalEl) _mObserver.observe(saveModalEl, {attributes:true,attributeFilter:['class']});

  // Close rating popups when clicking outside
  document.addEventListener('click',function(e){
    if(!e.target.closest('.rating-info-btn')){
      document.querySelectorAll('.rating-popup.show').forEach(function(p){p.classList.remove('show')});
    }
  });

  // [#55] Onboarding hints — show on first launch
  function _showOnboarding(){
    if(localStorage.getItem('st3_onboarded'))return;
    var hints=[
      {key:'plan',text:'🎯 <b>Planning</b> — Plan your study day, set targets, and track progress. Press <b>P</b> to open.'},
      {key:'calendar',text:'📅 <b>Calendar</b> — View your study history day-by-day with heatmap intensity. Press <b>C</b>.'},
      {key:'todo',text:'✅ <b>To-Do</b> — Manage nested tasks with priorities, due dates, and drag-to-reorder. Press <b>D</b>.'},
      {key:'summary',text:'📊 <b>Summary</b> — Analytics dashboard with focus score, streaks, and mood trends. Press <b>U</b>.'}
    ];
    var h='';
    hints.forEach(function(ht){
      h+='<div class="onboard-hint" id="onboard-'+ht.key+'">'+ht.text+'<button onclick="App.dismissHint(\''+ht.key+'\')">Got it</button></div>';
    });
    var el=document.getElementById('onboardContainer');
    if(el)el.innerHTML=h;
  }
  App.dismissHint=function(key){
    var el=document.getElementById('onboard-'+key);
    if(el)el.remove();
    var container=document.getElementById('onboardContainer');
    if(container&&!container.children.length){
      localStorage.setItem('st3_onboarded','1');
    }
  };

  // [#58] Offline indicator
  function _initOffline(){
    var banner=document.getElementById('offlineBanner');
    if(!banner)return;
    function _update(){
      if(navigator.onLine){banner.classList.add('hidden')}
      else{banner.classList.remove('hidden')}
    }
    window.addEventListener('online',_update);
    window.addEventListener('offline',_update);
    _update();
  }

  /* ========== START TIMER FROM PLAN CARD (#2) ========== */
  App.startFromPlan = function(type, subject, date, planId){
    if(TM.isOn()){UI.toast('Timer already running — stop it first');return}
    /* Set dropdown to the plan's subject */
    var sel=document.getElementById(type==='study'?'studyCat':'workCat');
    if(sel)sel.value=subject;
    /* Find plan topic for context */
    var planTopic='';
    try{
      var plans=PLAN.getForDate(date);
      var p=plans.find(function(x){return x.id===planId});
      if(p)planTopic=p.topic||'';
    }catch(e){}
    /* Store plan context on timer for discard-reset + auto-fill */
    TM.setPlanContext({date:date,planId:planId,topic:planTopic,subject:subject});
    /* Mark plan in-progress */
    PLAN.updateStatus(date, planId, 'in-progress');
    /* Start timer — TM.start() reads category from dropdown */
    TM.start(type);
    /* Scroll timer into view */
    var timerCard=document.getElementById('tc-'+type);
    if(timerCard)timerCard.scrollIntoView({behavior:'smooth',block:'center'});
  };

  /* ========== PLANNED TASKS IN STUDY/WORK TAB (#11) ========== */
  App.renderPlans = function(type){
    type=type||'study';
    var dateInputId=type==='study'?'studyPlanDate':'workPlanDate';
    var containerId=type==='study'?'studyPlannedTasks':'workPlannedTasks';
    var dateInput=document.getElementById(dateInputId);
    if(!dateInput)return;
    var dk=dateInput.value||D.todayKey();
    var allPlans=PLAN.getForDate(dk);
    /* Filter plans by type (default 'study' for backward compat) */
    var plans=allPlans.filter(function(p){return(p.planFor||'study')===type});
    var el=document.getElementById(containerId);
    if(!el)return;

    var today=D.todayKey();
    var priOrder={critical:0,high:1,medium:2,low:3};

    /* Also get overdue plans from past dates */
    var allOverdue=[];
    if(dk===today){
      for(var oi=1;oi<=7;oi++){
        var od=new Date();od.setDate(od.getDate()-oi);
        var ok=D.todayKey(od);
        var op=PLAN.getForDate(ok);
        op.forEach(function(p){
          if((p.planFor||'study')===type&&(p.status==='planned'||p.status==='in-progress')){
            p._overdueDays=oi;p._overdueDate=ok;
            allOverdue.push(p);
          }
        });
      }
    }

    /* Sort plans by priority */
    plans.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});
    allOverdue.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});

    if(!plans.length&&!allOverdue.length){
      el.innerHTML='<div style="font-size:.72rem;color:var(--tf);padding:6px 0">No planned tasks for this day</div>';
      return;
    }

    var h='';

    /* Overdue section */
    if(allOverdue.length){
      h+='<div style="font-size:.62rem;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.06em;padding:4px 0;margin-bottom:2px">⚠ Overdue ('+allOverdue.length+')</div>';
      allOverdue.forEach(function(p){
        var priIco={critical:'🔴',high:'🟠',medium:'🟡',low:'🟢'}[p.priority]||'🟡';
        h+='<div class="study-plan-card overdue">';
        h+='<span class="plan-pri">'+priIco+'</span>';
        h+='<div class="plan-info"><div class="plan-title">'+esc(p.topic||p.subject)+'</div>';
        h+='<div class="plan-meta">'+esc(p.subject)+' · '+p.type+' · Est: '+p.estHours+'h</div></div>';
        h+='<span class="study-plan-deadline" style="color:var(--red)">'+p._overdueDays+'d overdue</span>';
        h+='</div>';
      });
    }

    /* Today / selected date plans */
    var dateLabel=dk===today?'Today':UI.fdate(dk);
    var pendingPlans=plans.filter(function(p){return p.status!=='completed'&&p.status!=='skipped'});
    var donePlans=plans.filter(function(p){return p.status==='completed'||p.status==='skipped'});

    if(pendingPlans.length){
      h+='<div style="font-size:.62rem;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.06em;padding:4px 0;margin-bottom:2px">'+dateLabel+' — Pending ('+pendingPlans.length+')</div>';
      pendingPlans.forEach(function(p){
        var priIco={critical:'🔴',high:'🟠',medium:'🟡',low:'🟢'}[p.priority]||'🟡';
        var statusCol=p.status==='in-progress'?'color:var(--acc)':'color:var(--blu)';
        h+='<div class="study-plan-card">';
        h+='<span class="plan-pri">'+priIco+'</span>';
        h+='<div class="plan-info"><div class="plan-title">'+esc(p.topic||p.subject)+'</div>';
        h+='<div class="plan-meta">'+esc(p.subject)+' · '+p.type+' · Est: '+p.estHours+'h · <span style="'+statusCol+';font-weight:600">'+p.status+'</span></div></div>';
        var actualH=(p.actualSecs||0)/3600;
        if(actualH>0)h+='<span class="study-plan-deadline" style="color:var(--grn)">'+actualH.toFixed(1)+'h done</span>';
        /* Start button for pending plans on today */
        if(dk===today&&p.status==='planned')h+='<button class="b b-xs b-acc plan-start-btn" onclick="event.stopPropagation();App.startFromPlan(\''+type+'\',\''+esc(p.subject)+'\',\''+dk+'\',\''+p.id+'\')">▶ Start</button>';
        h+='</div>';
      });
    }

    if(donePlans.length){
      h+='<div style="font-size:.62rem;font-weight:700;color:var(--grn);text-transform:uppercase;letter-spacing:.06em;padding:4px 0;margin-bottom:2px">Completed ('+donePlans.length+')</div>';
      donePlans.forEach(function(p){
        h+='<div class="study-plan-card" style="opacity:.5">';
        h+='<span class="plan-pri">✅</span>';
        h+='<div class="plan-info"><div class="plan-title" style="text-decoration:line-through">'+esc(p.topic||p.subject)+'</div>';
        h+='<div class="plan-meta">'+esc(p.subject)+' · '+p.type+' · '+p.estHours+'h est</div></div>';
        var actualH=(p.actualSecs||0)/3600;
        if(actualH>0)h+='<span class="study-plan-deadline" style="color:var(--grn)">'+actualH.toFixed(1)+'h</span>';
        h+='</div>';
      });
    }

    el.innerHTML=h;
  };

  /* Wrapper — renders both study and work planned tasks */
  App.renderStudyPlans = function(){ App.renderPlans('study'); App.renderPlans('work'); };

  // Initialize new modules after DOM ready
  setTimeout(function(){
    PLAN.init();
    PLAN.renderTemplates();
    CAL.init();
    TODO.render();
    TODO.renderInline();
    SUM.init();
    try{var knDate=document.getElementById('knAddDate');if(knDate)knDate.value=D.todayKey()}catch(e){}
    _showOnboarding();
    _initOffline();
    /* Initialize study/work plan dates and render */
    var spd=document.getElementById('studyPlanDate');
    if(spd){spd.value=D.todayKey()}
    var wpd=document.getElementById('workPlanDate');
    if(wpd){wpd.value=D.todayKey()}
    App.renderStudyPlans();
    /* Attach topic autocomplete to save modal */
    var smNoteEl=document.getElementById('smNote');
    if(smNoteEl)UI.autocomplete(smNoteEl,function(){return document.getElementById('smCat').textContent});
  }, 100);

  /* ========== TIME BUDGET CARD (#6) ========== */
  App.renderTimeBudget = function(){
    var cfg=D.getCfg();
    var wakeTime=cfg.wakeTime||6;
    var bedtime=cfg.bedtime||22.5;
    var effectiveMins=cfg.effectiveMins||50;
    var effectiveRatio=effectiveMins/60;
    /* Awake hours × effective ratio = productive hours in the day */
    var awakeHours=bedtime-wakeTime;
    var available=awakeHours*effectiveRatio;

    var today=D.todayKey();

    /* ── Plans: total est hours and remaining (not completed/skipped) ── */
    var plans=PLAN.getForDate(today);
    var planTotalH=0,planRemainingH=0;
    plans.forEach(function(p){
      if(p.status==='skipped')return;
      var est=p.estHours||0;
      planTotalH+=est;
      if(p.status!=='completed')planRemainingH+=est;
    });

    /* ── Todos: total est hours for pending items due today/overdue ── */
    var todoEstH=0;
    try{todoEstH=TODO.getTodayEstHours()}catch(e){}

    /* ── Utilized = actual study + work + knowledge time today ── */
    var studySess=D.todayS('study'),workSess=D.todayS('work');
    var studySecs=0,workSecs=0;
    studySess.forEach(function(s){studySecs+=s.dur});
    workSess.forEach(function(s){workSecs+=s.dur});
    var knowledgeMins=0;
    try{knowledgeMins=KNOW.getTodayMins()}catch(e){}
    var knowledgeSecs=knowledgeMins*60;
    var utilized=(studySecs+workSecs+knowledgeSecs)/3600;

    /* ── Committed = remaining plan hours + todo est hours (what's left to do) ── */
    var committed=planRemainingH+todoEstH;

    /* ── Wasted: time elapsed since wake × effective ratio - utilized ── */
    var now=new Date();
    var hoursSinceWake=Math.max(0,(now.getHours()+now.getMinutes()/60)-wakeTime);
    var wasted=Math.max(0,hoursSinceWake*effectiveRatio-utilized);

    /* ── Free = available - utilized - committed - wasted (actual remaining free time) ── */
    var free=available-utilized-committed-wasted;

    var pct=available>0?Math.min(100,Math.round((utilized/available)*100)):0;

    /* Over-planning detection */
    var overPlanned=free<0;
    var overBy=Math.abs(free);

    /* Motivation message */
    var msg='';
    if(overPlanned)msg='Over-planned by '+overBy.toFixed(1)+'h! Reduce tasks or extend your day.';
    else if(pct>=90)msg='Outstanding! You\'re crushing it today!';
    else if(pct>=70)msg='Great progress! Keep the momentum going!';
    else if(pct>=50)msg='Halfway there. Push harder!';
    else if(pct>=25)msg='Good start. Stay focused!';
    else if(utilized>0)msg='Just getting started. Let\'s go!';
    else msg='Start your first session today!';

    var barColor=pct>=70?'var(--grn)':pct>=40?'var(--acc)':'var(--yel)';

    var h='<div class="time-budget-card">';
    /* Header: awake hours and effective hours */
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    h+='<span style="font-family:JetBrains Mono,monospace;font-size:.68rem;font-weight:700;color:var(--heading);letter-spacing:.08em;text-transform:uppercase">Time Budget</span>';
    h+='<span style="font-family:JetBrains Mono,monospace;font-size:.72rem;font-weight:700;color:var(--acc)">'+available.toFixed(1)+'h effective</span>';
    h+='</div>';
    /* Format time values like 6.5 → "6:30 AM", 22.5 → "10:30 PM" */
    function _fmtTime(t){
      var h=Math.floor(t),m=Math.round((t-h)*60);
      var ampm=h>=12?'PM':'AM';
      var h12=h>12?h-12:(h===0?12:h);
      return h12+(m>0?':'+String(m).padStart(2,'0'):'')+' '+ampm;
    }
    h+='<div style="font-size:.58rem;color:var(--td);margin-bottom:8px;text-align:right">'+awakeHours.toFixed(1)+'h awake ('+_fmtTime(wakeTime)+' \u2013 '+_fmtTime(bedtime>=24?bedtime-24:bedtime)+') \u00d7 '+effectiveMins+'min/hr</div>';
    /* Progress bar — stacked: green for utilized, purple for committed */
    var utilPct=available>0?Math.min(100,Math.round((utilized/available)*100)):0;
    var commitPct=available>0?Math.min(100-utilPct,Math.round((committed/available)*100)):0;
    var commitColor=overPlanned?'var(--red)':'var(--pur)';
    var commitOpacity=overPlanned?'.8':'.6';
    var commitLabel=overPlanned?'Over-committed':'Committed';
    h+='<div style="height:10px;background:var(--s3);border-radius:5px;overflow:hidden;margin-bottom:10px;display:flex">';
    h+='<div style="width:'+utilPct+'%;height:100%;background:var(--grn);transition:width .5s ease"></div>';
    h+='<div style="width:'+commitPct+'%;height:100%;background:'+commitColor+';opacity:'+commitOpacity+';transition:width .5s ease"></div>';
    h+='</div>';
    h+='<div style="display:flex;gap:10px;font-size:.52rem;color:var(--td);margin-bottom:8px;justify-content:center">';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--grn);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Done</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:'+commitColor+';opacity:'+commitOpacity+';border-radius:2px;vertical-align:middle;margin-right:3px"></span>'+commitLabel+'</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--s3);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Free</span>';
    h+='</div>';
    /* Stats grid — 4 col × 2 rows */
    var studyH=(studySecs/3600);
    var workH=(workSecs/3600);
    var knowH=(knowledgeSecs/3600);
    var dailyGoal=D.getGoalForDate(D.todayKey());
    var goalPctStudy=dailyGoal>0?Math.min(999,Math.round(studyH/dailyGoal*100)):0;

    /* Plans done/total count */
    var plansDone=plans.filter(function(p){return p.status==='completed'}).length;
    var plansTotal=plans.length;
    /* Todos pending count */
    var todoPending=0;
    try{
      var _todos=D.getLocal().todos||{};
      ['study','work'].forEach(function(g){
        (_todos[g]||[]).forEach(function(t){
          if(t.status!=='done'&&(!t.due||t.due<=today))todoPending++;
        });
      });
    }catch(e){}

    h+='<div class="tb-stats tb-stats-8">';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--acc)">'+studyH.toFixed(1)+'h</span><span class="tb-lbl">Study</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--cyn)">'+workH.toFixed(1)+'h</span><span class="tb-lbl">Work</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--yel)">'+knowH.toFixed(1)+'h</span><span class="tb-lbl">Know</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:'+(goalPctStudy>=100?'var(--grn)':'var(--acc)')+'">'+goalPctStudy+'%</span><span class="tb-lbl">Goal</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--grn)">'+plansDone+'/'+plansTotal+'</span><span class="tb-lbl">Plans</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--pur)">'+todoPending+'</span><span class="tb-lbl">To-Dos</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:'+(overPlanned?'var(--red)':'var(--blu)')+'">'+Math.abs(free).toFixed(1)+'h</span><span class="tb-lbl">'+(overPlanned?'Over!':'Free')+'</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--red)">'+wasted.toFixed(1)+'h</span><span class="tb-lbl">Wasted</span></div>';
    h+='</div>';
    /* Over-planning warning */
    if(overPlanned){
      h+='<div style="margin-top:8px;padding:6px 10px;background:var(--red2);border:1px solid rgba(248,113,113,.3);border-radius:6px;font-size:.68rem;color:var(--red);font-weight:600;text-align:center">⚠ Over-planned by '+overBy.toFixed(1)+'h — reduce plans/todos or extend hours</div>';
    }
    /* Message */
    h+='<div style="font-size:.68rem;font-weight:600;color:var(--t2);text-align:center;margin-top:8px;font-style:italic">'+msg+'</div>';
    h+='</div>';

    /* Render to all containers */
    ['timeBudgetStudy','timeBudgetWork','timeBudgetPlan','timeBudgetTodo'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)el.innerHTML=h;
    });
  };

  /* Day Overview merged into Time Budget — no-op */
  App.renderDayOverview = function(){};

  /* ========== BATTLE CRY MOTIVATION WIDGET ========== */
  App.renderBattleCry = function(){
    var el=document.getElementById('battleCry');
    if(!el)return;
    var cfg=D.getCfg();
    var today=D.todayKey();
    var goalH=D.getGoalForDate(today);
    if(!goalH||goalH<=0){el.innerHTML='';return}

    /* Study time done today */
    var ss=D.todayS('study'),totalSecs=0;
    ss.forEach(function(s){totalSecs+=s.dur});
    var doneH=totalSecs/3600;
    var goalS=goalH*3600;
    var pct=Math.min(100,Math.round((totalSecs/goalS)*100));
    var remH=Math.max(0,goalH-doneH);

    /* Time/feasibility calculations */
    var now=new Date();
    var hr=now.getHours();
    var wakeTime=cfg.wakeTime||6;
    var bedtime=cfg.bedtime||22.5;
    var effectiveMins=cfg.effectiveMins||50;
    var effectiveRatio=effectiveMins/60;
    var endOfDay=new Date(now);
    var bedH=Math.floor(bedtime),bedM=Math.round((bedtime-bedH)*60);
    endOfDay.setHours(bedH,bedM,0,0);
    if(bedtime>=24){endOfDay.setDate(endOfDay.getDate()+1);endOfDay.setHours(bedH-24,bedM,0,0)}
    var secsLeft=Math.max(0,Math.floor((endOfDay-now)/1000));
    var hrsLeft=secsLeft/3600;
    var maxPossH=hrsLeft*effectiveRatio;
    var canFinish=maxPossH>=remH;

    /* Determine urgency level */
    var level,icon,bgColor,borderColor,textColor;
    if(pct>=100){level='dominating';icon='👑';bgColor='rgba(34,197,94,.08)';borderColor='rgba(34,197,94,.3)';textColor='var(--grn)'}
    else if(pct>=70){level='strong';icon='🔥';bgColor='rgba(34,197,94,.06)';borderColor='rgba(34,197,94,.25)';textColor='var(--grn)'}
    else if(pct>=40||(canFinish&&pct>=20)){level='average';icon='⚡';bgColor='rgba(255,107,53,.06)';borderColor='rgba(255,107,53,.25)';textColor='var(--acc)'}
    else if(canFinish){level='behind';icon='⚠️';bgColor='rgba(250,204,21,.06)';borderColor='rgba(250,204,21,.25)';textColor='var(--yel)'}
    else{level='critical';icon='💀';bgColor='rgba(248,113,113,.08)';borderColor='rgba(248,113,113,.3)';textColor='var(--red)'}

    /* Time-of-day segment */
    var tod;
    if(hr<6)tod='night';
    else if(hr<10)tod='early';
    else if(hr<12)tod='late_morning';
    else if(hr<17)tod='afternoon';
    else if(hr<21)tod='evening';
    else tod='night';

    /* Rotation index — changes every 15 min */
    var rotIdx=Math.floor(now.getMinutes()/15);

    /* Message pools — distinct from getCoachMsg() in tasks.js */
    var msgs={
      dominating:[
        'Goal CRUSHED. You\'re in a league of your own today.',
        'Target destroyed. Keep this energy — tomorrow needs it too.',
        doneH.toFixed(1)+'h logged. The best don\'t stop at the finish line.',
        'You owned today. Bank this momentum for tomorrow.'
      ],
      strong:{
        early:['Dawn grinder energy. '+pct+'% before most people wake up.','Morning discipline hits different. '+remH.toFixed(1)+'h to close it out.','Strong start — '+pct+'%. Don\'t coast, finish what you started.','Early lead! '+remH.toFixed(1)+'h left. The gap is shrinking fast.'],
        late_morning:['Solid morning push — '+pct+'%. Lunch break, then destroy the rest.','You\'re ahead of schedule. '+remH.toFixed(1)+'h to seal the deal.',''+pct+'% and climbing. Afternoon will be your victory lap.','Great pace! '+remH.toFixed(1)+'h remains. You know what to do.'],
        afternoon:[''+pct+'% in the bag. Afternoon push will close this out.','You can taste the finish line — '+remH.toFixed(1)+'h left. DON\'T STOP.','Strong position at '+pct+'%. Finish strong, no regrets.','Post-lunch dip is for quitters. You\'re at '+pct+'%. PUSH.'],
        evening:[''+pct+'% — evening sprint time. '+remH.toFixed(1)+'h and you WIN today.','Almost there. '+remH.toFixed(1)+'h is nothing for someone at '+pct+'%.','Evening warrior mode ON. Close out that last '+remH.toFixed(1)+'h.',''+pct+'% by evening? That\'s momentum. Finish it NOW.'],
        night:[''+pct+'% done tonight. Every extra minute counts.','Night session grind — '+pct+'% and counting.','Late-night warrior: '+remH.toFixed(1)+'h from glory.',''+pct+'% under moonlight. Legends are made at night.']
      },
      average:{
        early:[''+pct+'%. Decent start but the day is LONG. Step on the gas.','Morning is gold. '+remH.toFixed(1)+'h to go — you have plenty of time. USE IT.',''+pct+'% so far. Average pace. The question: will you stay average?','Good foundation at '+pct+'%. Now build the tower. '+remH.toFixed(1)+'h awaits.'],
        late_morning:[''+pct+'%. Half the morning gone. Accelerate NOW or fall behind.',''+remH.toFixed(1)+'h remaining. You still have the hours — but they\'re ticking.','Midpoint check: '+pct+'%. Solid but not safe. Keep pushing.','Clock\'s moving. '+pct+'% at this hour means you need to grind harder.'],
        afternoon:['Afternoon reality: '+pct+'%. Still '+remH.toFixed(1)+'h to go. Time to lock in.',''+pct+'%. The gap is closeable but ONLY if you focus NOW.',''+remH.toFixed(1)+'h left. The afternoon decides if today was worth it.',''+pct+'% — not bad, not great. Make the next 2 hours count.'],
        evening:['Evening check: '+pct+'%. You\'ve got '+Math.floor(hrsLeft)+'h left. GO ALL IN.',''+pct+'% with '+remH.toFixed(1)+'h to go. This is crunch time.','The day isn\'t over. '+pct+'% → 100% is still possible. Grind now.',''+remH.toFixed(1)+'h by bedtime. Tight but doable. No distractions.'],
        night:[''+pct+'% in the books. Every extra rep counts.','Night mode. '+remH.toFixed(1)+'h left — make it count.',''+pct+'%. Still time to push the needle before bed.','Late night grind: '+pct+'% done. Can you squeeze more?']
      },
      behind:{
        early:[''+pct+'% only. The morning is slipping. Every hour you waste, someone takes your seat.','Slow start at '+pct+'%. Recovery is possible — but ONLY if you start NOW.',''+remH.toFixed(1)+'h to go. You\'re behind but the day is young. ACT.',''+pct+'%? Your competition is at 40% right now. Catch up or fall behind.'],
        late_morning:[''+pct+'% by late morning. That\'s behind schedule. Time to sprint.','Warning: '+remH.toFixed(1)+'h remaining with '+Math.floor(hrsLeft)+'h of day left. Move FAST.',''+pct+'%. Every wasted minute makes the evening harder. START.','Behind pace at '+pct+'%. The good news: '+maxPossH.toFixed(1)+'h is still reachable.'],
        afternoon:[''+pct+'% at this hour is a RED flag. '+remH.toFixed(1)+'h left — start NOW or regret it tonight.','Afternoon and only '+pct+'%? Lock your phone. Close everything. STUDY.',''+remH.toFixed(1)+'h still needed. Tight but achievable. No more excuses.',''+pct+'% — you\'re behind. Accept it, then ATTACK the rest of the day.'],
        evening:[''+pct+'% by evening. Uncomfortable? Good. Use that fire. '+remH.toFixed(1)+'h to go.',''+Math.floor(hrsLeft)+'h left in your day. Every minute is precious at '+pct+'%.','Evening rescue mission: '+remH.toFixed(1)+'h. Hard but not impossible. GO.',''+pct+'%. The evening decides everything. Make it count.'],
        night:[''+pct+'% tonight. Not ideal, but don\'t go to bed defeated — study something.','Late but not lost. Even 30 more minutes moves the needle.',''+pct+'%. Tomorrow starts fresh, but squeeze what you can from tonight.','Don\'t end the day at '+pct+'%. Even a small push matters.']
      },
      critical:[
        '💀 '+pct+'% with only '+Math.floor(hrsLeft)+'h left. The math is brutal. Study what you can — every minute matters.',
        ''+pct+'%. Can\'t hit goal today. But giving up is NOT an option. Study SOMETHING.',
        'Red zone: '+pct+'%. Today\'s lost, but tomorrow is a new war. Salvage what you can.',
        ''+pct+'% — your future self is watching. Even 1 hour now is better than zero.'
      ]
    };

    /* Pick message */
    var pool;
    if(level==='dominating')pool=msgs.dominating;
    else if(level==='critical')pool=msgs.critical;
    else pool=(msgs[level]||{})[tod]||msgs[level].afternoon||msgs.average.afternoon;
    var msg=pool[rotIdx%pool.length];

    var h='<div class="battle-cry" style="background:'+bgColor+';border-color:'+borderColor+'">';
    h+='<span class="bc-icon">'+icon+'</span>';
    h+='<span class="bc-text" style="color:'+textColor+'">'+msg+'</span>';
    h+='</div>';
    el.innerHTML=h;
  };

  // Patch renderAll to include new modules
  var _origRenderAll = UI.renderAll;
  UI.renderAll = function(){
    _origRenderAll();
    try{TODO.renderInline()}catch(e){}
    try{App.renderStudyPlans()}catch(e){}
    try{App.renderTimeBudget()}catch(e){}
    try{App.renderBattleCry()}catch(e){}
  };

  /* Patch renderGoal to also update battle cry on timer ticks */
  var _origRenderGoal = UI.renderGoal;
  UI.renderGoal = function(){
    _origRenderGoal();
    try{App.renderBattleCry()}catch(e){}
  };
})();
