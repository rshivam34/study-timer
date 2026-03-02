/* ========== APP MODULE + NAVIGATION ========== */
/* Part 3/7 — App init, navigation, focus, quotes, keyboard, save modal wiring */

/* QUOTES fallback — may also be defined in ui.js */
if(typeof QUOTES==='undefined'){
  var QUOTES=["Work the hardest, be the smartest.","Keep working hard — results will show.","Give it your all. Every single day.","Be happy. You deserve it. 😊","Discipline is choosing between what you want now and what you want most.","The pain of discipline weighs ounces; the pain of regret weighs tons.","You didn't come this far to only come this far.","Small daily improvements lead to stunning results.","Don't stop when you're tired. Stop when you're done.","Your future self will thank you for the work you put in today.","Consistency beats talent when talent doesn't work hard.","Stay hungry. Stay foolish. Stay kind.","Remember to breathe and be happy — you're doing great. 🌟"];
}

var App=(function(){var deferredPrompt=null,focusMoveIv=null,quoteIv=null;
function rotateQuote(){var all=getAllQuotes();var q=all[Math.floor(Math.random()*all.length)];var el=document.getElementById('quoteBar');el.style.opacity='0';setTimeout(function(){el.textContent='"'+q+'"';el.style.opacity='.7'},500)}
function getAllQuotes(){var cfg=D.getCfg();return QUOTES.concat(cfg.customQuotes||[])}
function toggleQuotes(){var p=document.getElementById('quotePanel');p.classList.toggle('hidden');if(!p.classList.contains('hidden'))renderQuotes()}
function renderQuotes(){var all=getAllQuotes(),cfg=D.getCfg(),custom=cfg.customQuotes||[];var el=document.getElementById('quoteList');el.innerHTML=all.map(function(q,i){var isCustom=i>=QUOTES.length;return'<div class="quote-item"><span>"'+esc(q)+'"</span>'+(isCustom?'<button class="quote-rm" onclick="event.stopPropagation();App.rmQuote('+(i-QUOTES.length)+')">✕</button>':'')+'</div>'}).join('')}
function addQuote(){var inp=document.getElementById('addQuote'),val=inp.value.trim();if(!val)return;var cfg=D.getCfg();if(!cfg.customQuotes)cfg.customQuotes=[];cfg.customQuotes.push(val);D.setCfg(cfg);inp.value='';renderQuotes();D.push();UI.toast('Added ✓')}
function rmQuote(idx){var cfg=D.getCfg();if(!cfg.customQuotes)return;cfg.customQuotes.splice(idx,1);D.setCfg(cfg);renderQuotes();D.push()}
function init(){document.getElementById('todayD').textContent=new Date().toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});document.getElementById('goalDate').value=D.todayKey();var cfg=D.getCfg();document.documentElement.setAttribute('data-theme',cfg.theme||'dark');rotateQuote();quoteIv=setInterval(rotateQuote,30000);
var cats=cfg.studySubjects,wCats=cfg.workCategories;document.getElementById('studyCat').innerHTML=cats.map(function(s){return'<option>'+s+'</option>'}).join('');document.getElementById('workCat').innerHTML=wCats.map(function(s){return'<option>'+s+'</option>'}).join('');
document.getElementById('sylSubj').innerHTML='<option value="">Select...</option>'+cats.map(function(s){return'<option>'+s+'</option>'}).join('');
if(D.isCloud()){show('main');syncUI('busy');D.sync().then(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('on');gInfo();TM.recoverState()}).catch(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('err');gInfo();TM.recoverState()})}else if(D.getToken()){show('main');syncUI('busy');D.autoConn().then(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('on');gInfo();TM.recoverState()}).catch(function(){UI.renderAll();RP.renderHeatmap();DL.startTick();syncUI('err');gInfo();TM.recoverState()})}else{show('setup')}}
document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;if(e.key===' '||e.code==='Space'){e.preventDefault();var at=TM.activeType();if(at){var s=TM.getState(at);s.pau?TM.resume(at):TM.pause(at)}else{var ct=document.querySelector('.tp.on').id.replace('p-','');if(ct==='study')TM.start('study');else if(ct==='work')TM.start('work')}}if(e.key==='s'){var a=TM.activeType();if(a)TM.stop(a)}if(e.key==='d'){var a2=TM.activeType();if(a2)TM.discard(a2)}if(e.key==='f')enterFocus();if(e.key==='t')toggleTheme();if(e.key==='Escape')exitFocus();if(e.key>='1'&&e.key<='8'){var tabs=['study','work','report','syl','rev','remind','recur','sett'];tab(tabs[parseInt(e.key)-1])}});
document.querySelectorAll('input[type="date"],input[type="datetime-local"]').forEach(function(inp){inp.addEventListener('mouseenter',function(){try{this.showPicker()}catch(e){}})});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').then(function(reg){
if('periodicSync' in reg){reg.periodicSync.register('study-timer-check',{minInterval:4*60*60*1000}).catch(function(){})}
navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.type==='check-notifications')NOTIFY.checkAndNotify()})
}).catch(function(e){console.log('SW:',e)})}
NOTIFY.updateStatus();if(Notification.permission==='granted')NOTIFY.scheduleChecks();
var xCfg=D.getCfg();if(xCfg.bedtime)document.getElementById('cfgBedtime').value=xCfg.bedtime;if(xCfg.effectiveMins)document.getElementById('cfgEffective').value=xCfg.effectiveMins;
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
function addCat(type){var inp=document.getElementById(type==='study'?'addStudy':'addWork');var val=inp.value.trim();if(!val)return;var cfg=D.getCfg();var list=type==='study'?cfg.studySubjects:cfg.workCategories;if(list.indexOf(val)===-1)list.push(val);D.setCfg(cfg);inp.value='';UI.renderAll();D.push();UI.toast('Added')}
function rmCat(type,name){if(!confirm('Remove "'+name+'"?'))return;var cfg=D.getCfg();if(type==='study')cfg.studySubjects=cfg.studySubjects.filter(function(s){return s!==name});else cfg.workCategories=cfg.workCategories.filter(function(s){return s!==name});D.setCfg(cfg);UI.renderAll();D.push()}
function toggleTheme(){var cfg=D.getCfg();cfg.theme=cfg.theme==='dark'?'light':'dark';D.setCfg(cfg);document.documentElement.setAttribute('data-theme',cfg.theme);D.push()}
function saveCfgExtra(){var cfg=D.getCfg();cfg.bedtime=parseInt(document.getElementById('cfgBedtime').value)||23;cfg.effectiveMins=parseInt(document.getElementById('cfgEffective').value)||45;D.setCfg(cfg);D.push();UI.toast('Settings saved')}
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
  };
  App.tab = App.navTo;

  // Save modal: auto-populate plan dropdown when modal opens
  var _mObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.target.id === 'saveModal' && !m.target.classList.contains('hidden')){
        var cat = document.getElementById('smCat').textContent;
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

  // Initialize new modules after DOM ready
  setTimeout(function(){
    PLAN.init();
    PLAN.renderTemplates();
    CAL.init();
    TODO.render();
    TODO.renderInline();
    SUM.init();
  }, 100);

  // Patch renderAll to include new modules
  var _origRenderAll = UI.renderAll;
  UI.renderAll = function(){
    _origRenderAll();
    try{TODO.renderInline()}catch(e){}
  };
})();
