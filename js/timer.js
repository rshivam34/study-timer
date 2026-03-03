/* ========== TIMER MODULE (TM + PAST) ========== */
/* Part 2/7 — FIX #9: actual hours tracking on plan-linked sessions */

var SR={easy:[0,3,7,21,45,90,180],medium:[0,1,3,7,14,30,60,120],hard:[0,1,2,4,8,16,32,64]};

var TM=(function(){
  var T={
    study:{iv:null,st:null,el:0,on:false,pau:false,ps:null,tp:0,mode:'timer',cdSecs:0,alarmed:false},
    work:{iv:null,st:null,el:0,on:false,pau:false,ps:null,tp:0,mode:'timer',cdSecs:0,alarmed:false}
  };
  var pending=null, selDiff='hard';
  var planCtx=null; /* {date, planId, topic, subject} */

  /* Screen Wake Lock — keeps screen on while timer is running */
  var _wakeLock=null;
  function _acquireWakeLock(){if(!('wakeLock' in navigator))return;navigator.wakeLock.request('screen').then(function(wl){_wakeLock=wl;_wakeLock.addEventListener('release',function(){_wakeLock=null})}).catch(function(){})}
  function _releaseWakeLock(){if(_wakeLock){_wakeLock.release().catch(function(){});_wakeLock=null}}
  /* Re-acquire wake lock when tab becomes visible again (browser auto-releases on hide) */
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&(T.study.on&&!T.study.pau||T.work.on&&!T.work.pau))_acquireWakeLock()});

  function setMode(type,mode){
    var t=T[type];
    if(t.on){UI.toast('Can\'t switch while running');return}
    t.mode=mode;
    var timerBtn=document.getElementById('tmt-timer-'+type);
    var cdBtn=document.getElementById('tmt-cd-'+type);
    var presets=document.getElementById('cdp-'+type);
    if(mode==='countdown'){
      timerBtn.classList.remove('on');cdBtn.classList.add('on');
      presets.classList.remove('hidden');
      if(t.cdSecs>0)_showCountdownDisplay(type);
    } else {
      cdBtn.classList.remove('on');timerBtn.classList.add('on');
      presets.classList.add('hidden');
      document.getElementById('td-'+type).textContent='00:00:00';
    }
  }

  function setCountdown(type,mins){
    if(!mins||mins<1)return;
    var t=T[type];
    if(t.on){UI.toast('Can\'t change while running');return}
    t.cdSecs=mins*60;
    /* Highlight selected chip */
    var presets=document.getElementById('cdp-'+type);
    presets.querySelectorAll('.cd-chip').forEach(function(c){c.classList.remove('on')});
    var chipMap={'25m':25,'45m':45,'1h':60,'2h':120};
    presets.querySelectorAll('.cd-chip').forEach(function(c){
      if(chipMap[c.textContent]===mins)c.classList.add('on');
    });
    document.getElementById('cdc-'+type).value=mins;
    _showCountdownDisplay(type);
  }

  function _showCountdownDisplay(type){
    var t=T[type];
    var rem=t.cdSecs;
    var h=Math.floor(rem/3600),m=Math.floor((rem%3600)/60),s=rem%60;
    document.getElementById('td-'+type).textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }

  function playAlarm(){
    try{
      var ctx=new(window.AudioContext||window.webkitAudioContext)();
      [0,0.3,0.6].forEach(function(delay){
        var osc=ctx.createOscillator();
        var gain=ctx.createGain();
        osc.connect(gain);gain.connect(ctx.destination);
        osc.frequency.value=880;osc.type='square';
        gain.gain.value=0.3;
        osc.start(ctx.currentTime+delay);
        osc.stop(ctx.currentTime+delay+0.15);
      });
    }catch(e){}
    try{navigator.vibrate([200,100,200,100,200])}catch(e){}
  }

  function start(type){
    var t=T[type];if(t.on)return;
    var cat=document.getElementById(type==='study'?'studyCat':'workCat').value;
    if(!cat){UI.toast('Select a '+(type==='study'?'subject':'category'));return}
    if(t.mode==='countdown'&&!t.cdSecs){UI.toast('Set countdown duration first');return}
    t.on=true;t.pau=false;t.st=Date.now();t.el=0;t.tp=0;t.alarmed=false;
    t.iv=setInterval(function(){tick(type)},200);
    setUI(type,'run');saveState();_acquireWakeLock();
  }

  function pause(type){
    var t=T[type];if(!t.on||t.pau)return;
    t.pau=true;clearInterval(t.iv);t.ps=Date.now();
    setUI(type,'pau');saveState();_releaseWakeLock();
  }

  function resume(type){
    var t=T[type];if(!t.pau)return;
    t.pau=false;t.tp+=(Date.now()-t.ps);t.ps=null;
    t.iv=setInterval(function(){tick(type)},200);
    setUI(type,'run');saveState();_acquireWakeLock();
  }

  function stop(type){
    var t=T[type];if(!t.on)return;
    if(t.pau)t.tp+=(Date.now()-t.ps);
    clearInterval(t.iv);t.on=false;t.pau=false;
    t.el=Math.floor((Date.now()-t.st-t.tp)/1000);
    clearState();_releaseWakeLock();
    if(t.el<1){reset(type);return}
    var cat=document.getElementById(type==='study'?'studyCat':'workCat').value;
    pending={type:type,dur:t.el,cat:cat};
    selDiff='hard';
    document.getElementById('smT').textContent=type==='study'?'Study Session':'Work Session';
    document.getElementById('smDur').textContent=UI.fd(t.el);
    document.getElementById('smCat').textContent=cat;
    document.getElementById('smNote').value='';
    var srcEl=document.getElementById('smSource');if(srcEl)srcEl.value='';
    document.querySelectorAll('#smDiffSel .diff-btn').forEach(function(b){b.classList.remove('on')});
    document.querySelectorAll('#smDiffSel .diff-btn')[2].classList.add('on');
    document.getElementById('saveModal').classList.remove('hidden');
    /* Auto-fill from plan context if started from a plan */
    if(planCtx){
      setTimeout(function(){
        var fpSel=document.getElementById('smFromPlan');
        if(fpSel){fpSel.value=planCtx.planId;onPlanSelect()}
      },80);
    }
  }

  function confirmSave(){
    if(!pending)return;
    var note=document.getElementById('smNote').value.trim();
    if(pending.type==='study'&&!note){
      UI.toast('Topic is required!');
      document.getElementById('smNote').focus();return;
    }
    var source=(document.getElementById('smSource')||{}).value;
    source=source?source.trim():'';
    if(pending.type==='study'&&!source){
      UI.toast('Source is required!');
      document.getElementById('smSource').focus();return;
    }
    var now=new Date(),began=new Date(now.getTime()-pending.dur*1000);
    var sess={
      cat:pending.cat,dur:pending.dur,
      start:began.toISOString(),end:now.toISOString(),
      note:note,diff:selDiff
    };
    if(pending.type==='study'&&source)sess.source=source;

    /* FIX #9: Track plan linkage on session for actual hours */
    var planId=document.getElementById('smFromPlan').value;
    if(planId) sess.planId=planId;

    D.addSession(pending.type,D.todayKey(),sess);
    if(pending.type==='study'&&note)createRevision(pending.cat,note,selDiff);

    /* FIX #9: Accumulate actual hours on the linked plan item */
    if(planId){
      _accumulateActualHours(D.todayKey(),planId,pending.dur);
      PLAN.completePlan(D.todayKey(),planId);
    }

    /* Handle lecture marking */
    var lecAction=document.getElementById('smLecAction').value;
    var lecNum=parseInt(document.getElementById('smLecNum').value);
    var cat=document.getElementById('smCat').textContent;
    if(lecAction==='mark'&&lecNum){
      var syl=D.getSyl();
      if(syl[cat]){
        syl[cat].done=Math.max(syl[cat].done||0,lecNum);
        D.setSyl(syl);
        try{SYL.renderAll()}catch(e){}
      }
    }

    /* [#54] Insights toast — show session count + study goal progress */
    var _todaySess=D.getSess(pending.type,D.todayKey());
    var _studySess=D.getSess('study',D.todayKey());var _studyTotal=0;
    _studySess.forEach(function(s2){_studyTotal+=s2.dur});
    if(pending.type==='study')_studyTotal+=pending.dur;
    var _goal=D.getGoalForDate(D.todayKey())*3600;
    var _goalPct=Math.min(100,Math.round(_studyTotal/_goal*100));
    UI.toast('Saved! Session #'+_todaySess.length+' today. '+_goalPct+'% study goal!');
    document.getElementById('saveModal').classList.add('hidden');

    /* Session-to-Todo linking: mark linked todo as done */
    var linkedTodo=document.getElementById('smLinkTodo').value;
    if(linkedTodo){
      try{TODO.toggleDone(linkedTodo,pending.type==='study'?'study':'work')}catch(e){}
    }

    reset(pending.type);
    UI.renderAll();
    try{TODO.renderInline()}catch(e){}
    D.push().then(function(){App.syncUI('on')}).catch(function(){App.syncUI('err')});
    pending=null;
    clearPlanContext();
  }

  /* FIX #9: Accumulate actual hours on a plan item */
  function _accumulateActualHours(dk,planId,durSecs){
    var plans=PLAN.getPlans();
    if(!plans[dk])return;
    var p=plans[dk].find(function(x){return x.id===planId});
    if(p){
      p.actualSecs=(p.actualSecs||0)+durSecs;
    }
    PLAN.setPlans(plans);
  }

  function cancelSave(){
    document.getElementById('saveModal').classList.add('hidden');
    if(pending)reset(pending.type);pending=null;
    clearPlanContext();
  }

  function setDiff(d){
    selDiff=d;
    document.querySelectorAll('#smDiffSel .diff-btn').forEach(function(b){
      b.classList.remove('on');
      if(b.textContent.toLowerCase().indexOf(d)>=0)b.classList.add('on');
    });
  }

  function setPlanContext(ctx){planCtx=ctx;saveState()}
  function clearPlanContext(){planCtx=null}

  function discard(type){
    var t=T[type];
    if(t.on&&t.el>5){
      if(!confirm('Discard this session? All progress will be lost.'))return;
      if(!confirm('Are you really sure? This cannot be undone.'))return;
    }
    /* Reset linked plan back to 'planned' */
    if(planCtx){
      try{PLAN.updateStatus(planCtx.date,planCtx.planId,'planned')}catch(e){}
      clearPlanContext();
    }
    clearInterval(t.iv);t.on=false;t.pau=false;clearState();_releaseWakeLock();reset(type);
  }

  function reset(type){
    var t=T[type];
    t.el=0;t.tp=0;t.alarmed=false;
    document.getElementById('tc-'+type).className=type==='work'?'tc wm':'tc';
    document.getElementById('td-'+type).style.color='';
    if(t.mode==='countdown'&&t.cdSecs>0){
      _showCountdownDisplay(type);
    } else {
      document.getElementById('td-'+type).textContent='00:00:00';
    }
    document.getElementById('ts-'+type).textContent=type==='study'?'Ready to focus':'Ready to work';
    document.title='Study Timer';
    setUI(type,'idle');
  }

  function tick(type){
    var t=T[type];
    t.el=Math.floor((Date.now()-t.st-t.tp)/1000);
    var d;
    if(t.mode==='countdown'&&t.cdSecs>0){
      var rem=t.cdSecs-t.el;
      if(rem<=0){
        /* Alarm on first crossover */
        if(!t.alarmed){t.alarmed=true;playAlarm();document.getElementById('ts-'+type).textContent='Time\'s up! Keep going or save.'}
        /* Show overtime as +MM:SS in red */
        var over=Math.abs(rem);
        var om=Math.floor(over/60),os=over%60;
        d='+'+String(om).padStart(2,'0')+':'+String(os).padStart(2,'0');
        document.getElementById('td-'+type).style.color='var(--red)';
      } else {
        var rh=Math.floor(rem/3600),rm=Math.floor((rem%3600)/60),rs=rem%60;
        d=String(rh).padStart(2,'0')+':'+String(rm).padStart(2,'0')+':'+String(rs).padStart(2,'0');
        document.getElementById('td-'+type).style.color='';
      }
    } else {
      var h=Math.floor(t.el/3600),m=Math.floor((t.el%3600)/60),s=t.el%60;
      d=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
      document.getElementById('td-'+type).style.color='';
    }
    document.getElementById('td-'+type).textContent=d;
    document.title='\u23F1 '+d;
    if(!document.getElementById('focusMode').classList.contains('hidden'))
      document.getElementById('focusTimer').textContent=d;
  }

  function setUI(type,state){
    var card=document.getElementById('tc-'+type),ctrl=document.getElementById('ct-'+type),sub=document.getElementById('ts-'+type);
    var cls=type==='work'?'tc wm':'tc';
    if(state==='run'){
      card.className=cls+' run';
      sub.textContent=type==='study'?'Studying...':'Working...';
      ctrl.innerHTML='<button class="b b-pause" onclick="TM.pause(\''+type+'\')">Pause</button><button class="b b-stop" onclick="TM.stop(\''+type+'\')">Save</button><button class="b" onclick="TM.discard(\''+type+'\')">Discard</button>';
    } else if(state==='pau'){
      card.className=cls+' pau';
      sub.textContent='Paused';
      ctrl.innerHTML='<button class="b b-resume" onclick="TM.resume(\''+type+'\')">Resume</button><button class="b b-stop" onclick="TM.stop(\''+type+'\')">Save</button><button class="b" onclick="TM.discard(\''+type+'\')">Discard</button>';
    } else {
      ctrl.innerHTML='<button '+(type==='work'?'class="b b-cyn"':'class="b b-start"')+' onclick="TM.start(\''+type+'\')">Start</button>';
    }
  }

  function createRevision(subj,topic,diff){
    var existing=D.getRevs().find(function(r){return r.active&&r.subj===subj&&r.topic===topic});
    if(existing)return;
    D.addRev({
      id:'rev_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      subj:subj,topic:topic,diff:diff,created:D.todayKey(),revCount:0,
      history:[{date:D.todayKey(),diff:diff,type:'learned'}],
      nextDate:calcNext(diff,0),active:true
    });
  }

  function calcNext(diff,cnt){
    var days=SR[diff]||SR.hard;
    var idx=Math.min(cnt,days.length-1);
    var d=new Date();d.setDate(d.getDate()+days[idx]);
    return D.todayKey(d);
  }

  function saveState(){
    var s={};
    ['study','work'].forEach(function(t){
      var x=T[t];
      if(x.on)s[t]={st:x.st,tp:x.tp,pau:x.pau,ps:x.ps,cat:document.getElementById(t==='study'?'studyCat':'workCat').value,mode:x.mode||'timer',cdSecs:x.cdSecs||0};
    });
    if(planCtx)s.planCtx=planCtx;
    localStorage.setItem('st3_timer',JSON.stringify(s));
  }

  function clearState(){localStorage.removeItem('st3_timer')}

  function recoverState(){
    try{
      var s=JSON.parse(localStorage.getItem('st3_timer'));
      if(!s)return;
      if(s.planCtx)planCtx=s.planCtx;
      ['study','work'].forEach(function(type){
        if(s[type]&&Date.now()-s[type].st<12*3600*1000){
          document.getElementById(type==='study'?'studyCat':'workCat').value=s[type].cat;
          var t=T[type];
          t.on=true;t.st=s[type].st;t.tp=s[type].tp;t.pau=s[type].pau;t.ps=s[type].ps;
          t.mode=s[type].mode||'timer';t.cdSecs=s[type].cdSecs||0;
          if(!t.pau){t.iv=setInterval(function(){tick(type)},200);_acquireWakeLock()}
          setUI(type,t.pau?'pau':'run');
          /* Restore countdown UI if needed */
          if(t.mode==='countdown')_restoreCountdownUI(type);
          UI.toast('Timer recovered!');
        }
      });
    }catch(e){}
  }

  function _restoreCountdownUI(type){
    var timerBtn=document.getElementById('tmt-timer-'+type);
    var cdBtn=document.getElementById('tmt-cd-'+type);
    if(timerBtn)timerBtn.classList.remove('on');
    if(cdBtn)cdBtn.classList.add('on');
  }

  function activeType(){return T.study.on?'study':T.work.on?'work':null}
  function isOn(){return T.study.on||T.work.on}
  function getState(type){return T[type]}

  /* Plan select handler for save modal */
  function onPlanSelect(){
    var sel=document.getElementById('smFromPlan');
    if(sel.value){
      var cat=document.getElementById('smCat').textContent;
      var plans=PLAN.getTodayPlansForSubject(cat);
      var plan=plans.find(function(p){return p.id===sel.value});
      if(plan){
        document.getElementById('smNote').value=plan.topic;
        if(plan.lecNum){
          document.getElementById('smLecAction').value='mark';
          document.getElementById('smLecNum').value=plan.lecNum;
        }
      }
    }
  }

  function onPastTopicSelect(){
    var sel=document.getElementById('smPastTopic');
    if(sel&&sel.value){
      document.getElementById('smNote').value=sel.value;
    }
  }

  function onLecActionChange(){
    var action=document.getElementById('smLecAction').value;
    document.getElementById('smLecNum').style.display=action==='mark'?'':'none';
  }

  return{
    start:start,pause:pause,resume:resume,stop:stop,discard:discard,
    setMode:setMode,setCountdown:setCountdown,
    confirmSave:confirmSave,cancelSave:cancelSave,setDiff:setDiff,
    isOn:isOn,activeType:activeType,getState:getState,
    calcNext:calcNext,createRevision:createRevision,recoverState:recoverState,
    setPlanContext:setPlanContext,clearPlanContext:clearPlanContext,
    onPlanSelect:onPlanSelect,onPastTopicSelect:onPastTopicSelect,onLecActionChange:onLecActionChange
  };
})();


/* ========== PAST SESSION MODULE ========== */
var PAST=(function(){
  var pastType='study',pastDiff='hard';
  /* Edit context: when set, save() updates existing session instead of adding */
  var _editCtx=null; // {dk, type, idx}

  function open(type){
    _editCtx=null; // clear edit mode
    pastType=type;pastDiff='hard';
    document.getElementById('pastTitle').textContent='Add Past '+(type==='study'?'Study':'Work');
    document.getElementById('pastDate').value=D.todayKey();
    document.getElementById('pastStart').value='';
    document.getElementById('pastHrs').value='';
    document.getElementById('pastMins').value='30';
    document.getElementById('pastNote').value='';
    var cfg=D.getCfg(),list=type==='study'?cfg.studySubjects:cfg.workCategories;
    document.getElementById('pastCat').innerHTML=list.map(function(s){return'<option>'+esc(s)+'</option>'}).join('');
    document.querySelectorAll('#pastDiffSel .diff-btn').forEach(function(b){b.classList.remove('on')});
    document.querySelectorAll('#pastDiffSel .diff-btn')[2].classList.add('on');
    document.getElementById('pastModal').classList.remove('hidden');
  }

  /* Open in edit mode — pre-fill with existing session data */
  function openEdit(dk,type,idx,sess){
    _editCtx={dk:dk,type:type,idx:idx};
    pastType=type;pastDiff=sess.diff||'hard';
    document.getElementById('pastTitle').textContent='Edit '+(type==='study'?'Study':'Work')+' Session';
    document.getElementById('pastDate').value=dk;
    /* Pre-fill start time from session */
    var sd=new Date(sess.start);
    document.getElementById('pastStart').value=String(sd.getHours()).padStart(2,'0')+':'+String(sd.getMinutes()).padStart(2,'0');
    /* Pre-fill duration */
    var totalMins=Math.round(sess.dur/60);
    document.getElementById('pastHrs').value=Math.floor(totalMins/60)||'';
    document.getElementById('pastMins').value=totalMins%60||'';
    document.getElementById('pastNote').value=sess.note||'';
    /* Populate category dropdown and select the right one */
    var cfg=D.getCfg(),list=type==='study'?cfg.studySubjects:cfg.workCategories;
    document.getElementById('pastCat').innerHTML=list.map(function(s){return'<option'+(s===sess.cat?' selected':'')+'>'+esc(s)+'</option>'}).join('');
    /* Set difficulty button */
    document.querySelectorAll('#pastDiffSel .diff-btn').forEach(function(b){
      b.classList.remove('on');
      if(b.textContent.toLowerCase().indexOf(pastDiff)>=0)b.classList.add('on');
    });
    document.getElementById('pastModal').classList.remove('hidden');
  }

  function close(){_editCtx=null;document.getElementById('pastModal').classList.add('hidden')}

  function setDiff(d){
    pastDiff=d;
    document.querySelectorAll('#pastDiffSel .diff-btn').forEach(function(b){
      b.classList.remove('on');
      if(b.textContent.toLowerCase().indexOf(d)>=0)b.classList.add('on');
    });
  }

  function save(){
    var date=document.getElementById('pastDate').value,startTime=document.getElementById('pastStart').value;
    var hrs=parseInt(document.getElementById('pastHrs').value)||0,mins=parseInt(document.getElementById('pastMins').value)||0;
    var dur=hrs*3600+mins*60;
    if(!date||dur<60){UI.toast('Fill date & at least 1 min');return}
    var cat=document.getElementById('pastCat').value,note=document.getElementById('pastNote').value.trim();
    if(pastType==='study'&&!note){UI.toast('Topic required for study!');return}
    var startDt=startTime?new Date(date+'T'+startTime+':00'):new Date(date+'T09:00:00');
    var endDt=new Date(startDt.getTime()+dur*1000);
    var sessObj={cat:cat,dur:dur,start:startDt.toISOString(),end:endDt.toISOString(),note:note,diff:pastDiff};

    if(_editCtx){
      /* Edit mode — update session in-place */
      var d=D.getLocal();
      var oldDk=_editCtx.dk,oldType=_editCtx.type,oldIdx=_editCtx.idx;
      /* Remove old session */
      if(d[oldType]&&d[oldType][oldDk]){
        d[oldType][oldDk].splice(oldIdx,1);
        if(!d[oldType][oldDk].length)delete d[oldType][oldDk];
      }
      /* Add updated session (may be different date/type) */
      if(!d[pastType])d[pastType]={};
      if(!d[pastType][date])d[pastType][date]=[];
      d[pastType][date].push(sessObj);
      D.saveLocal(d);
      _editCtx=null;
      UI.toast('Session updated \u2713');
    } else {
      /* Add mode */
      D.addSession(pastType,date,sessObj);
      if(pastType==='study'&&note)TM.createRevision(cat,note,pastDiff);
      UI.toast('Saved \u2713');
    }
    close();UI.renderAll();D.push();
  }

  return{open:open,openEdit:openEdit,close:close,setDiff:setDiff,save:save};
})();
