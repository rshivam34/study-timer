/* ========== TIMER MODULE (TM + PAST) ========== */
/* Part 2/7 — FIX #9: actual hours tracking on plan-linked sessions */

var SR={easy:[0,3,7,21,45,90,180],medium:[0,1,3,7,14,30,60,120],hard:[0,1,2,4,8,16,32,64]};

var TM=(function(){
  var T={
    study:{iv:null,st:null,el:0,on:false,pau:false,ps:null,tp:0},
    work:{iv:null,st:null,el:0,on:false,pau:false,ps:null,tp:0}
  };
  var pending=null, selDiff='hard';

  function start(type){
    var t=T[type];if(t.on)return;
    var cat=document.getElementById(type==='study'?'studyCat':'workCat').value;
    if(!cat){UI.toast('Select a '+(type==='study'?'subject':'category'));return}
    t.on=true;t.pau=false;t.st=Date.now();t.el=0;t.tp=0;
    t.iv=setInterval(function(){tick(type)},200);
    setUI(type,'run');saveState();
  }

  function pause(type){
    var t=T[type];if(!t.on||t.pau)return;
    t.pau=true;clearInterval(t.iv);t.ps=Date.now();
    setUI(type,'pau');saveState();
  }

  function resume(type){
    var t=T[type];if(!t.pau)return;
    t.pau=false;t.tp+=(Date.now()-t.ps);t.ps=null;
    t.iv=setInterval(function(){tick(type)},200);
    setUI(type,'run');saveState();
  }

  function stop(type){
    var t=T[type];if(!t.on)return;
    if(t.pau)t.tp+=(Date.now()-t.ps);
    clearInterval(t.iv);t.on=false;t.pau=false;
    t.el=Math.floor((Date.now()-t.st-t.tp)/1000);
    clearState();
    if(t.el<1){reset(type);return}
    var cat=document.getElementById(type==='study'?'studyCat':'workCat').value;
    pending={type:type,dur:t.el,cat:cat};
    selDiff='hard';
    document.getElementById('smT').textContent=type==='study'?'Study Session':'Work Session';
    document.getElementById('smDur').textContent=UI.fd(t.el);
    document.getElementById('smCat').textContent=cat;
    document.getElementById('smNote').value='';
    document.querySelectorAll('#smDiffSel .diff-btn').forEach(function(b){b.classList.remove('on')});
    document.querySelectorAll('#smDiffSel .diff-btn')[2].classList.add('on');
    document.getElementById('saveModal').classList.remove('hidden');
  }

  function confirmSave(){
    if(!pending)return;
    var note=document.getElementById('smNote').value.trim();
    if(pending.type==='study'&&!note){
      UI.toast('Topic is required!');
      document.getElementById('smNote').focus();return;
    }
    var now=new Date(),began=new Date(now.getTime()-pending.dur*1000);
    var sess={
      cat:pending.cat,dur:pending.dur,
      start:began.toISOString(),end:now.toISOString(),
      note:note,diff:selDiff
    };

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

    /* [#54] Insights toast — show session count + goal progress */
    var _todaySess=D.getSess(pending.type,D.todayKey());var _todayTotal=0;
    _todaySess.forEach(function(s2){_todayTotal+=s2.dur});_todayTotal+=pending.dur;
    var _cfg=D.getCfg();var _goal=(_cfg.dailyGoals[D.todayKey()]||_cfg.dailyGoals['default']||6)*3600;
    var _goalPct=Math.min(100,Math.round(_todayTotal/_goal*100));
    UI.toast('Saved! Session #'+_todaySess.length+' today. '+_goalPct+'% to your goal!');
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
  }

  function setDiff(d){
    selDiff=d;
    document.querySelectorAll('#smDiffSel .diff-btn').forEach(function(b){
      b.classList.remove('on');
      if(b.textContent.toLowerCase().indexOf(d)>=0)b.classList.add('on');
    });
  }

  function discard(type){
    var t=T[type];
    if(t.on&&t.el>5&&!confirm('Discard?'))return;
    clearInterval(t.iv);t.on=false;t.pau=false;clearState();reset(type);
  }

  function reset(type){
    T[type].el=0;T[type].tp=0;
    document.getElementById('tc-'+type).className=type==='work'?'tc wm':'tc';
    document.getElementById('td-'+type).textContent='00:00:00';
    document.getElementById('ts-'+type).textContent=type==='study'?'Ready to focus':'Ready to work';
    document.title='Study Timer';
    setUI(type,'idle');
  }

  function tick(type){
    var t=T[type];
    t.el=Math.floor((Date.now()-t.st-t.tp)/1000);
    var h=Math.floor(t.el/3600),m=Math.floor((t.el%3600)/60),s=t.el%60;
    var d=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
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
      if(x.on)s[t]={st:x.st,tp:x.tp,pau:x.pau,ps:x.ps,cat:document.getElementById(t==='study'?'studyCat':'workCat').value};
    });
    localStorage.setItem('st3_timer',JSON.stringify(s));
  }

  function clearState(){localStorage.removeItem('st3_timer')}

  function recoverState(){
    try{
      var s=JSON.parse(localStorage.getItem('st3_timer'));
      if(!s)return;
      ['study','work'].forEach(function(type){
        if(s[type]&&Date.now()-s[type].st<12*3600*1000){
          document.getElementById(type==='study'?'studyCat':'workCat').value=s[type].cat;
          var t=T[type];
          t.on=true;t.st=s[type].st;t.tp=s[type].tp;t.pau=s[type].pau;t.ps=s[type].ps;
          if(!t.pau)t.iv=setInterval(function(){tick(type)},200);
          setUI(type,t.pau?'pau':'run');
          UI.toast('Timer recovered!');
        }
      });
    }catch(e){}
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

  function onLecActionChange(){
    var action=document.getElementById('smLecAction').value;
    document.getElementById('smLecNum').style.display=action==='mark'?'':'none';
  }

  return{
    start:start,pause:pause,resume:resume,stop:stop,discard:discard,
    confirmSave:confirmSave,cancelSave:cancelSave,setDiff:setDiff,
    isOn:isOn,activeType:activeType,getState:getState,
    calcNext:calcNext,createRevision:createRevision,recoverState:recoverState,
    onPlanSelect:onPlanSelect,onLecActionChange:onLecActionChange
  };
})();


/* ========== PAST SESSION MODULE ========== */
var PAST=(function(){
  var pastType='study',pastDiff='hard';

  function open(type){
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

  function close(){document.getElementById('pastModal').classList.add('hidden')}

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
    D.addSession(pastType,date,{cat:cat,dur:dur,start:startDt.toISOString(),end:endDt.toISOString(),note:note,diff:pastDiff});
    if(pastType==='study'&&note)TM.createRevision(cat,note,pastDiff);
    UI.toast('Saved ✓');close();UI.renderAll();D.push();
  }

  return{open:open,close:close,setDiff:setDiff,save:save};
})();
