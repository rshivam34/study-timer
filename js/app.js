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
var cats=cfg.studySubjects,wCats=cfg.workCategories;document.getElementById('studyCat').innerHTML=cats.map(function(s){return'<option>'+s+'</option>'}).join('');document.getElementById('workCat').innerHTML=wCats.map(function(s){return'<option>'+s+'</option>'}).join('');
document.getElementById('sylSubj').innerHTML='<option value="">Select...</option>'+cats.map(function(s){return'<option>'+s+'</option>'}).join('');
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
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;document.getElementById('pwaStatus').textContent='Ready to install!'})}
function show(w){document.getElementById('setup').classList.toggle('hidden',w!=='setup');document.getElementById('mainApp').classList.toggle('hidden',w!=='main')}
function connect(){var token=document.getElementById('tokIn').value.trim(),hint=document.getElementById('sHint');if(!token){hint.className='shint';hint.textContent='Enter a token.';return}hint.className='shint ok';hint.textContent='Validating...';D.validate(token).then(function(eid){D.setToken(token);if(eid){D.setGistId(eid);hint.textContent='Syncing...';return D.sync()}hint.textContent='Creating...';return D.makeG().then(function(id){D.setGistId(id)})}).then(function(){hint.textContent='Connected ✓';setTimeout(function(){show('main');UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo()},400)}).catch(function(e){hint.className='shint';hint.textContent='Invalid token.';console.error(e)})}
function skip(){show('main');UI.renderAll();RP.renderHeatmap();syncUI('off')}
function tab(id){document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('on')});document.querySelectorAll('.tp').forEach(function(p){p.classList.remove('on')});var tabEl=document.querySelector('.t-'+id);if(tabEl)tabEl.classList.add('on');var panel=document.getElementById('p-'+id);if(panel)panel.classList.add('on');if(id==='report')RP.renderHeatmap();if(id==='rev')REV.render();if(id==='syl')SYL.renderAll();if(id==='recur')RECUR.render();if(id==='remind')REM.render()}
function syncUI(state){var dot=document.getElementById('sDot'),txt=document.getElementById('sTxt'),btn=document.getElementById('sBtn');dot.className='sdot';btn.classList.remove('spin');if(state==='on'){dot.classList.add('on');txt.textContent='Synced'}else if(state==='busy'){dot.classList.add('busy');txt.textContent='Syncing...';btn.classList.add('spin')}else if(state==='err'){dot.classList.add('err');txt.textContent='Error'}else txt.textContent='Local'}
function gInfo(){var el=document.getElementById('gInfo'),btn=document.getElementById('gBtn');if(D.isCloud()){el.textContent='Connected — '+D.getGistId().slice(0,8)+'...';btn.textContent='Disconnect';btn.onclick=function(){if(confirm('Disconnect?')){D.disc();gInfo();syncUI('off');UI.toast('Disconnected')}}}else{el.textContent='Not connected';btn.textContent='Connect';btn.onclick=reconn}}
function manSync(){if(!D.getToken()){UI.toast('Connect first');return}syncUI('busy');(D.isCloud()?D.sync():D.autoConn()).then(function(){UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo();UI.toast('Synced ✓')}).catch(function(){D.autoConn().then(function(){UI.renderAll();RP.renderHeatmap();syncUI('on');gInfo();UI.toast('Synced ✓')}).catch(function(){syncUI('err');UI.toast('Failed')})})}
function reconn(){show('setup')}
function addCat(type){var inp=document.getElementById(type==='study'?'addStudy':type==='work'?'addWork':'addKnowledge');var val=inp.value.trim();if(!val)return;var cfg=D.getCfg();var list=type==='study'?cfg.studySubjects:type==='work'?cfg.workCategories:(cfg.knowledgeCategories||(cfg.knowledgeCategories=[]));if(list.indexOf(val)===-1)list.push(val);D.setCfg(cfg);inp.value='';UI.renderAll();D.push();UI.toast('Added')}
function rmCat(type,name){if(!confirm('Remove "'+name+'"?'))return;var cfg=D.getCfg();if(type==='study')cfg.studySubjects=cfg.studySubjects.filter(function(s){return s!==name});else if(type==='work')cfg.workCategories=cfg.workCategories.filter(function(s){return s!==name});else if(type==='knowledge')cfg.knowledgeCategories=(cfg.knowledgeCategories||[]).filter(function(s){return s!==name});D.setCfg(cfg);UI.renderAll();D.push()}
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
    if(id==='report') RP.renderHeatmap();
    if(id==='rev') REV.render();
    if(id==='syl') SYL.renderAll();
    if(id==='recur') RECUR.render();
    if(id==='remind') REM.render();
    if(id==='plan') PLAN.init();
    if(id==='calendar') CAL.init();
    if(id==='todo') TODO.render();
    if(id==='summary') SUM.init();
    if(id==='knowledge') try{KNOW.init()}catch(e){}
  };
  App.tab = App.navTo;

  // Save modal: auto-populate plan dropdown when modal opens
  var _mObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.target.id === 'saveModal' && !m.target.classList.contains('hidden')){
        var cat = document.getElementById('smCat').textContent;
        /* Show plans matching this category (both study & work plans) */
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
        var type = document.querySelector('#p-study.on') ? 'study' : 'work';
        var todoSel = document.getElementById('smLinkTodo');
        if(todoSel){
          var todos = D.getLocal().todos || {};
          var items = (todos[type] || []).filter(function(i){return i.status !== 'done'});
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

  /* ========== PLANNED TASKS IN STUDY TAB (#11) ========== */
  App.renderStudyPlans = function(){
    var dateInput=document.getElementById('studyPlanDate');
    if(!dateInput)return;
    var dk=dateInput.value||D.todayKey();
    var plans=PLAN.getForDate(dk);
    var el=document.getElementById('studyPlannedTasks');
    if(!el)return;

    var today=D.todayKey();
    var todayDate=new Date(today);
    var priOrder={critical:0,high:1,medium:2,low:3};

    /* Also get overdue plans from past dates */
    var allOverdue=[];
    if(dk===today){
      /* Show overdue from last 7 days */
      for(var oi=1;oi<=7;oi++){
        var od=new Date();od.setDate(od.getDate()-oi);
        var ok=D.todayKey(od);
        var op=PLAN.getForDate(ok);
        op.forEach(function(p){
          if(p.status==='planned'||p.status==='in-progress'){
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
    /* Initialize study plan date and render */
    var spd=document.getElementById('studyPlanDate');
    if(spd){spd.value=D.todayKey();App.renderStudyPlans()}
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
    /* Stats grid — 3 col × 2 rows */
    var studyH=(studySecs/3600);
    var workH=(workSecs/3600);
    var knowH=(knowledgeSecs/3600);
    var dailyGoal=D.getGoalForDate(D.todayKey());
    var goalPctStudy=dailyGoal>0?Math.min(999,Math.round(studyH/dailyGoal*100)):0;
    h+='<div class="tb-stats tb-stats-6">';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--acc)">'+studyH.toFixed(1)+'h</span><span class="tb-lbl">Study</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--cyn)">'+workH.toFixed(1)+'h</span><span class="tb-lbl">Work</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:var(--yel)">'+knowH.toFixed(1)+'h</span><span class="tb-lbl">Know</span></div>';
    h+='<div class="tb-stat"><span class="tb-val" style="color:'+(goalPctStudy>=100?'var(--grn)':'var(--acc)')+'">'+goalPctStudy+'%</span><span class="tb-lbl">Goal</span></div>';
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

  /* ========== DAY OVERVIEW WIDGET (#4) ========== */
  App.renderDayOverview = function(){
    var el=document.getElementById('dayOverview');
    if(!el)return;
    var today=D.todayKey();

    /* Study time */
    var studySess=D.todayS('study'),studySecs=0;
    studySess.forEach(function(s){studySecs+=s.dur});
    var studyH=(studySecs/3600).toFixed(1);

    /* Work time */
    var workSess=D.todayS('work'),workSecs=0;
    workSess.forEach(function(s){workSecs+=s.dur});
    var workH=(workSecs/3600).toFixed(1);

    /* Knowledge time */
    var knowledgeMins=0;
    try{knowledgeMins=KNOW.getTodayMins()}catch(e){}
    var knowH=(knowledgeMins/60).toFixed(1);

    /* Plans done/total + remaining plan hours */
    var plans=PLAN.getForDate(today);
    var plansDone=plans.filter(function(p){return p.status==='completed'}).length;
    var plansTotal=plans.length;
    var planRemH=0;
    plans.forEach(function(p){if(p.status!=='completed'&&p.status!=='skipped')planRemH+=p.estHours||0});

    /* Todos pending + est hours */
    var todos=D.getLocal().todos||{};
    var todoPending=0;
    var todoEstH=0;
    try{todoEstH=TODO.getTodayEstHours()}catch(e){}
    ['study','work'].forEach(function(g){
      (todos[g]||[]).forEach(function(t){if(t.status!=='done')todoPending++});
    });

    var h='<div class="day-overview" style="grid-template-columns:repeat(5,1fr)">';
    h+='<div class="do-item"><span class="do-val" style="color:var(--acc)">'+studyH+'h</span><span class="do-lbl">Study</span></div>';
    h+='<div class="do-item"><span class="do-val" style="color:var(--cyn)">'+workH+'h</span><span class="do-lbl">Work</span></div>';
    h+='<div class="do-item"><span class="do-val" style="color:var(--yel)">'+knowH+'h</span><span class="do-lbl">Know</span></div>';
    h+='<div class="do-item"><span class="do-val" style="color:var(--grn)">'+plansDone+'/'+plansTotal+'</span><span class="do-lbl">Plans</span>';
    if(planRemH>0)h+='<span class="do-sub">'+planRemH.toFixed(1)+'h left</span>';
    h+='</div>';
    h+='<div class="do-item"><span class="do-val" style="color:var(--pur)">'+todoPending+'</span><span class="do-lbl">To-Dos</span>';
    if(todoEstH>0)h+='<span class="do-sub">~'+todoEstH.toFixed(1)+'h</span>';
    h+='</div>';
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
    try{App.renderDayOverview()}catch(e){}
  };
})();
