/* ========== PLANNING MODULE ========== */
/* Part 2/7 — FIX #1: edit modal, FIX #2: notes field, actual vs estimated display */

var PLAN=(function(){
  var editingPlan=null; // {date, id} for edit mode

  function getPlans(){return D.getLocal().plans||{}}
  function setPlans(p){var d=D.getLocal();d.plans=p;D.saveLocal(d)}
  function getForDate(dk){return(getPlans()[dk]||[]).slice()}
  /* Notify other modules after plan data changes — keeps calendar etc. in sync */
  function _afterChange(){try{CAL.render()}catch(e){}try{if(typeof SUM!=='undefined')SUM.render()}catch(e){}}

  function init(){
    document.getElementById('planDate').value=D.todayKey();
    document.getElementById('planViewDate').value=D.todayKey();
    _populateSubjects();
    onSubjChange();
    render();
    renderGoalPresets();
    // Attach topic autocomplete
    UI.autocomplete(document.getElementById('planTopic'),function(){return document.getElementById('planSubj').value});
  }

  /* Populate subject dropdown based on planFor selection */
  function _populateSubjects(){
    var cfg=D.getCfg();
    var planFor=(document.getElementById('planFor')||{}).value||'study';
    var list=planFor==='work'?cfg.workCategories:cfg.studySubjects;
    document.getElementById('planSubj').innerHTML='<option value="">Select...</option>'+list.map(function(s){return'<option>'+esc(s)+'</option>'}).join('');
  }

  function onPlanForChange(){
    var planFor=document.getElementById('planFor').value;
    _populateSubjects();
    /* Hide lecture-related fields and revision type for work */
    var lecRow=document.getElementById('planLecRow');
    var typeRow=document.getElementById('planTypeRow');
    var typeEl=document.getElementById('planType');
    if(planFor==='work'){
      if(lecRow)lecRow.style.display='none';
      /* Reset type to 'topic' and hide lecture/revision options */
      typeEl.value='topic';
      Array.from(typeEl.options).forEach(function(o){
        o.style.display=(o.value==='lecture'||o.value==='revision')?'none':'';
      });
    } else {
      Array.from(typeEl.options).forEach(function(o){o.style.display=''});
    }
    onSubjChange();
  }

  function onSubjChange(){
    var subj=document.getElementById('planSubj').value;
    var syl=D.getSyl();var el=document.getElementById('planLecChecklist');
    if(!el)return;
    el.innerHTML='';
    if(syl[subj]&&syl[subj].total){
      for(var i=1;i<=syl[subj].total;i++){
        var done=i<=(syl[subj].done||0);
        var color=done?'color:var(--grn)':'';
        el.innerHTML+='<label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:.75rem;cursor:pointer;'+color+'">'
          +'<input type="checkbox" class="plan-lec-cb" value="'+i+'" style="accent-color:var(--acc)" onchange="PLAN.onLecCheckChange()">'
          +'Lec '+i+(done?' ✓':'')+'</label>';
      }
      document.getElementById('planLecRow').style.display='';
    } else {
      document.getElementById('planLecRow').style.display='none';
    }
    _updateMultiTopics();
  }
  /* Show per-lecture topic fields when multiple lectures are checked */
  function onLecCheckChange(){_updateMultiTopics()}
  function _updateMultiTopics(){
    var checked=document.querySelectorAll('.plan-lec-cb:checked');
    var box=document.getElementById('planMultiTopics');
    if(!box)return;
    if(checked.length<=1){box.style.display='none';box.innerHTML='';return}
    box.style.display='block';
    var subj=document.getElementById('planSubj').value;
    var h='<div style="font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:4px">Per-lecture topics <span style="color:var(--tf)">(optional — leave blank to use main topic for all)</span></div>';
    checked.forEach(function(cb){
      var lecN=cb.value;
      h+='<div class="multi-topic-row"><span class="lec-label">Lec '+lecN+'</span>';
      h+='<div class="ac-wrap" style="flex:1;position:relative"><input type="text" class="inp multi-lec-topic" data-lec="'+lecN+'" placeholder="Topic for Lec '+lecN+'..." autocomplete="off" style="font-size:.75rem;padding:6px 10px"></div></div>';
    });
    box.innerHTML=h;
    /* Attach autocomplete to each per-lecture topic field */
    box.querySelectorAll('.multi-lec-topic').forEach(function(inp){
      UI.autocomplete(inp,function(){return document.getElementById('planSubj').value});
    });
  }

  function add(){
    var date=document.getElementById('planDate').value;
    var subj=document.getElementById('planSubj').value;
    var planFor=(document.getElementById('planFor')||{}).value||'study';
    var type=document.getElementById('planType').value;
    var topic=document.getElementById('planTopic').value.trim();
    var source=(document.getElementById('planSource')||{}).value||'';
    source=source.trim();
    var hours=parseFloat(document.getElementById('planHours').value)||2;
    var priority=document.getElementById('planPriority').value;
    var startTime=(document.getElementById('planStartTime')||{}).value||'';
    var endTime=(document.getElementById('planEndTime')||{}).value||'';
    /* Auto-calc hours from start/end if both set */
    if(startTime&&endTime){
      var sp=startTime.split(':'),ep=endTime.split(':');
      var sh=parseInt(sp[0])*60+parseInt(sp[1]),eh=parseInt(ep[0])*60+parseInt(ep[1]);
      if(eh>sh)hours=Math.round((eh-sh)/60*10)/10;
    }
    /* FIX #2: notes field */
    var notes=(document.getElementById('planNotes')||{}).value||'';
    notes=notes.trim();

    if(!date||!subj){UI.toast('Select date & subject');return}

    /* Multi-lecture selection via checkboxes */
    if(type==='lecture'){
      var checked=document.querySelectorAll('.plan-lec-cb:checked');
      if(checked.length>0){
        var plans=getPlans();
        if(!plans[date])plans[date]=[];
        /* Check for per-lecture topics */
        var perLecTopics={};
        document.querySelectorAll('.multi-lec-topic').forEach(function(inp){
          var v=inp.value.trim();
          if(v)perLecTopics[inp.getAttribute('data-lec')]=v;
        });
        checked.forEach(function(cb){
          var lecN=parseInt(cb.value);
          var lecTopic=perLecTopics[String(lecN)]||topic||('Lecture '+lecN);
          plans[date].push({
            id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
            subject:subj,planFor:planFor,type:type,topic:lecTopic,source:source,estHours:hours,priority:priority,
            lecNum:lecN,status:'planned',notes:notes,actualSecs:0,
            startTime:startTime||null,endTime:endTime||null,
            createdAt:new Date().toISOString()
          });
        });
        setPlans(plans);
        /* Uncheck all checkboxes and clear multi-topic fields */
        document.querySelectorAll('.plan-lec-cb').forEach(function(cb){cb.checked=false});
        document.getElementById('planTopic').value='';
        if(document.getElementById('planSource'))document.getElementById('planSource').value='';
        if(document.getElementById('planNotes'))document.getElementById('planNotes').value='';
        var mtBox=document.getElementById('planMultiTopics');
        if(mtBox){mtBox.style.display='none';mtBox.innerHTML=''}
        render();_afterChange();D.push();
        UI.toast(checked.length>1?checked.length+' plans added ✓':'Plan added ✓');
        return;
      }
    }

    if(!topic&&type!=='lecture'){UI.toast('Enter topic');return}
    if(type==='lecture'&&!topic) topic='Lecture';

    var plans=getPlans();
    if(!plans[date])plans[date]=[];
    plans[date].push({
      id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
      subject:subj,planFor:planFor,type:type,topic:topic,source:source,estHours:hours,priority:priority,
      lecNum:null,status:'planned',notes:notes,actualSecs:0,
      startTime:startTime||null,endTime:endTime||null,
      createdAt:new Date().toISOString()
    });
    setPlans(plans);
    document.getElementById('planTopic').value='';
    if(document.getElementById('planSource'))document.getElementById('planSource').value='';
    if(document.getElementById('planNotes'))document.getElementById('planNotes').value='';
    if(document.getElementById('planStartTime'))document.getElementById('planStartTime').value='';
    if(document.getElementById('planEndTime'))document.getElementById('planEndTime').value='';
    render();_afterChange();D.push();UI.toast('Plan added ✓');
  }

  function updateStatus(date,id,status){
    var plans=getPlans();
    if(!plans[date])return;
    var p=plans[date].find(function(x){return x.id===id});
    if(p)p.status=status;
    setPlans(plans);render();_afterChange();D.push();
  }

  function remove(date,id){
    if(!confirm('Remove this plan item?'))return;
    var plans=getPlans();
    if(!plans[date])return;
    plans[date]=plans[date].filter(function(x){return x.id!==id});
    if(!plans[date].length)delete plans[date];
    setPlans(plans);render();_afterChange();D.push();UI.toast('Removed');
  }

  function completePlan(date,id){
    updateStatus(date,id,'completed');
    UI.toast('Completed ✓');
  }

  function carryForward(){
    var viewDate=document.getElementById('planViewDate').value;
    var plans=getForDate(viewDate);
    var pending=plans.filter(function(p){return p.status==='planned'||p.status==='in-progress'});
    if(!pending.length){UI.toast('Nothing to carry forward');return}
    var tom=new Date(viewDate);tom.setDate(tom.getDate()+1);var tomK=D.todayKey(tom);
    var allPlans=getPlans();
    if(!allPlans[tomK])allPlans[tomK]=[];
    pending.forEach(function(p){
      var np=JSON.parse(JSON.stringify(p));
      np.id='pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
      np.status='carried';
      np.actualSecs=0;
      allPlans[tomK].push(np);
    });
    setPlans(allPlans);
    document.getElementById('planViewDate').value=tomK;
    render();_afterChange();D.push();UI.toast(pending.length+' items carried forward');
  }

  /* Copy Day's Plans — clone all plans from source date to target date */
  function copyDayPlans(){
    var targetDate=document.getElementById('planCopyDate').value;
    var sourceDate=document.getElementById('planViewDate').value;
    if(!targetDate){UI.toast('Select a target date');return}
    if(!sourceDate){UI.toast('Select a source date');return}
    if(targetDate===sourceDate){UI.toast('Target and source dates are the same');return}
    var sourcePlans=getForDate(sourceDate);
    if(!sourcePlans.length){UI.toast('No plans to copy from '+sourceDate);return}
    var allPlans=getPlans();
    if(!allPlans[targetDate])allPlans[targetDate]=[];
    sourcePlans.forEach(function(p){
      var np=JSON.parse(JSON.stringify(p));
      np.id='pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
      np.status='planned';
      np.actualSecs=0;
      allPlans[targetDate].push(np);
    });
    setPlans(allPlans);
    document.getElementById('planViewDate').value=targetDate;
    render();_afterChange();D.push();UI.toast(sourcePlans.length+' plans copied ✓');
  }

  /* ========== GOAL PRESETS (Rule-based daily goals) ========== */
  var _defaultPresets=[
    {id:'gp_office',name:'Office Day',hours:3,dayRules:[{day:1,pattern:'all'},{day:2,pattern:'all'},{day:3,pattern:'all'},{day:4,pattern:'all'},{day:5,pattern:'all'}],active:true},
    {id:'gp_wfh',name:'WFH',hours:5.5,dayRules:[],active:false},
    {id:'gp_evensat',name:'Even Saturday',hours:7,dayRules:[{day:6,pattern:'even'}],active:true},
    {id:'gp_fullday',name:'Full Day',hours:13,dayRules:[{day:0,pattern:'all'},{day:6,pattern:'odd'}],active:true}
  ];
  var _dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function _getPresets(){
    var cfg=D.getCfg();
    if(!cfg.goalPresets||!cfg.goalPresets.length){
      cfg.goalPresets=JSON.parse(JSON.stringify(_defaultPresets));
      D.setCfg(cfg);
    }
    /* Migrate old days[]+weekPattern format to new dayRules[] format */
    var migrated=false;
    cfg.goalPresets.forEach(function(p){
      if(p.days&&!p.dayRules){
        p.dayRules=p.days.map(function(d){return{day:d,pattern:p.weekPattern||'all'}});
        delete p.days;delete p.weekPattern;
        migrated=true;
      }
    });
    if(migrated)D.setCfg(cfg);
    return cfg.goalPresets;
  }
  function _setPresets(presets){var cfg=D.getCfg();cfg.goalPresets=presets;D.setCfg(cfg);D.push()}

  /* Cycle: off → all → even → odd → off */
  var _patternCycle=['','all','even','odd'];
  var _patternLabels={'':'','all':'','even':'2/4','odd':'1/3/5'};
  function cycleDayChip(el){
    var cur=el.getAttribute('data-pattern')||'';
    var idx=_patternCycle.indexOf(cur);
    var next=_patternCycle[(idx+1)%_patternCycle.length];
    if(next){
      el.classList.add('on');
      el.setAttribute('data-pattern',next);
    } else {
      el.classList.remove('on');
      el.setAttribute('data-pattern','');
    }
    _updateChipLabel(el,next);
  }
  function _updateChipLabel(el,pattern){
    var ind=el.querySelector('.dc-pat');
    if(ind)ind.textContent=_patternLabels[pattern||'']||'';
  }

  function renderGoalPresets(){
    var el=document.getElementById('goalPresetList');
    if(!el)return;
    var presets=_getPresets();
    var today=D.todayKey();
    var todayGoal=D.getGoalForDate(today);
    /* Find which preset is active today */
    var todayDow=new Date().getDay();var nth=Math.ceil(new Date().getDate()/7);
    var activePresetId=null;
    var cfg=D.getCfg();
    var hasManual=cfg.dailyGoals&&cfg.dailyGoals[today]!==undefined;
    if(!hasManual){
      for(var i=0;i<presets.length;i++){
        var p=presets[i];if(!p.active)continue;
        var rules=p.dayRules||[];
        for(var j=0;j<rules.length;j++){
          var r=rules[j];if(r.day!==todayDow)continue;
          if(r.pattern&&r.pattern!=='all'){
            if(r.pattern==='even'&&nth%2!==0)continue;
            if(r.pattern==='odd'&&nth%2!==1)continue;
          }
          activePresetId=p.id;break;
        }
      }
    }

    var h='<div style="font-size:.62rem;color:var(--grn);font-weight:700;margin-bottom:6px">Today\'s goal: '+todayGoal+'h'+(hasManual?' (manual override)':activePresetId?' (from preset)':' (default)')+'</div>';
    presets.forEach(function(p){
      var isToday=p.id===activePresetId;
      var rules=p.dayRules||[];
      var dayStr='';
      if(rules.length){
        dayStr=rules.map(function(r){
          var s=_dayNames[r.day];
          if(r.pattern==='even')s+=' <span style="color:var(--acc);font-size:.5rem">(2/4)</span>';
          if(r.pattern==='odd')s+=' <span style="color:var(--acc);font-size:.5rem">(1/3/5)</span>';
          return s;
        }).join(', ');
      } else {
        dayStr='<span style="color:var(--tf)">No days set</span>';
      }

      h+='<div class="gp-card'+(isToday?' gp-active':'')+'">';
      h+='<div style="display:flex;align-items:center;gap:8px">';
      h+='<button class="gp-toggle'+(p.active?' on':'')+'" onclick="PLAN.toggleGoalPreset(\''+p.id+'\')">'+(p.active?'ON':'OFF')+'</button>';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="font-size:.78rem;font-weight:700;color:var(--heading)">'+esc(p.name)+' — <span style="color:var(--acc)">'+p.hours+'h</span></div>';
      h+='<div style="font-size:.6rem;color:var(--td)">'+dayStr+'</div>';
      h+='</div>';
      h+='<button class="b b-xs" onclick="PLAN.openEditPreset(\''+p.id+'\')">✏️</button>';
      h+='<button class="b b-xs b-danger" onclick="PLAN.deleteGoalPreset(\''+p.id+'\')">✕</button>';
      h+='</div></div>';
    });
    el.innerHTML=h;
  }

  function toggleGoalPreset(id){
    var presets=_getPresets();
    var p=presets.find(function(x){return x.id===id});
    if(p)p.active=!p.active;
    _setPresets(presets);renderGoalPresets();UI.renderGoal();UI.toast(p.active?'Enabled':'Disabled')
  }

  function openAddPreset(){
    document.getElementById('gpModalTitle').textContent='Add Goal Rule';
    document.getElementById('gpName').value='';
    document.getElementById('gpHours').value='';
    document.getElementById('gpEditId').value='';
    document.querySelectorAll('#gpDayChips .day-chip').forEach(function(c){
      c.classList.remove('on');c.setAttribute('data-pattern','');
      _updateChipLabel(c,'');
    });
    document.getElementById('goalPresetModal').classList.remove('hidden');
  }

  function openEditPreset(id){
    var presets=_getPresets();
    var p=presets.find(function(x){return x.id===id});
    if(!p)return;
    document.getElementById('gpModalTitle').textContent='Edit Goal Rule';
    document.getElementById('gpName').value=p.name;
    document.getElementById('gpHours').value=p.hours;
    document.getElementById('gpEditId').value=p.id;
    var rules=p.dayRules||[];
    document.querySelectorAll('#gpDayChips .day-chip').forEach(function(c){
      var day=parseInt(c.getAttribute('data-day'));
      var rule=rules.find(function(r){return r.day===day});
      if(rule){
        c.classList.add('on');
        c.setAttribute('data-pattern',rule.pattern||'all');
        _updateChipLabel(c,rule.pattern||'all');
      } else {
        c.classList.remove('on');
        c.setAttribute('data-pattern','');
        _updateChipLabel(c,'');
      }
    });
    document.getElementById('goalPresetModal').classList.remove('hidden');
  }

  function saveGoalPreset(){
    var name=document.getElementById('gpName').value.trim();
    var hours=parseFloat(document.getElementById('gpHours').value);
    if(!name||isNaN(hours)){UI.toast('Fill name and hours');return}
    var dayRules=[];
    document.querySelectorAll('#gpDayChips .day-chip.on').forEach(function(c){
      dayRules.push({day:parseInt(c.getAttribute('data-day')),pattern:c.getAttribute('data-pattern')||'all'});
    });
    var editId=document.getElementById('gpEditId').value;
    var presets=_getPresets();

    if(editId){
      var p=presets.find(function(x){return x.id===editId});
      if(p){p.name=name;p.hours=hours;p.dayRules=dayRules;delete p.days;delete p.weekPattern}
    } else {
      presets.push({
        id:'gp_'+Date.now(),name:name,hours:hours,dayRules:dayRules,active:true
      });
    }
    _setPresets(presets);
    document.getElementById('goalPresetModal').classList.add('hidden');
    renderGoalPresets();UI.renderGoal();UI.toast('Saved ✓');
  }

  function deleteGoalPreset(id){
    if(!confirm('Delete this goal rule?'))return;
    var presets=_getPresets().filter(function(x){return x.id!==id});
    _setPresets(presets);renderGoalPresets();UI.renderGoal();UI.toast('Deleted');
  }

  /* FIX #1: Edit modal — open with pre-filled fields */
  function openEdit(date,id){
    var plans=getPlans();
    if(!plans[date])return;
    var p=plans[date].find(function(x){return x.id===id});
    if(!p)return;
    editingPlan={date:date,id:id};

    var modal=document.getElementById('planEditModal');
    var pf=p.planFor||'study';
    document.getElementById('pePlanFor').value=pf;
    document.getElementById('peType').value=p.type;
    document.getElementById('peTopic').value=p.topic;
    document.getElementById('peSource').value=p.source||'';
    document.getElementById('peHours').value=p.estHours;
    document.getElementById('pePriority').value=p.priority;
    document.getElementById('peNotes').value=p.notes||'';
    document.getElementById('peStatus').value=p.status;
    document.getElementById('peStartTime').value=p.startTime||'';
    document.getElementById('peEndTime').value=p.endTime||'';

    // Populate subject dropdown based on planFor
    _populateEditSubjects(pf,p.subject);

    // Show/hide lecture & revision type based on planFor
    _updateEditTypeOptions(pf);

    // Lecture number
    var syl=D.getSyl();
    var lecRow=document.getElementById('peLecRow');
    var lecSel=document.getElementById('peLecNum');
    lecSel.innerHTML='';
    if(pf==='study'&&syl[p.subject]&&syl[p.subject].total){
      lecRow.classList.remove('hidden');
      for(var i=1;i<=syl[p.subject].total;i++){
        var done=i<=(syl[p.subject].done||0);
        lecSel.innerHTML+='<option value="'+i+'"'+(done?' style="color:var(--grn)"':'')+(p.lecNum===i?' selected':'')+'>Lec '+i+(done?' ✓':'')+'</option>';
      }
    } else {
      lecRow.classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  function _populateEditSubjects(planFor,selected){
    var cfg=D.getCfg();
    var list=planFor==='work'?cfg.workCategories:cfg.studySubjects;
    var subjSel=document.getElementById('peSubj');
    subjSel.innerHTML=list.map(function(s){return'<option'+(s===selected?' selected':'')+'>'+esc(s)+'</option>'}).join('');
  }

  function _updateEditTypeOptions(planFor){
    var typeEl=document.getElementById('peType');
    Array.from(typeEl.options).forEach(function(o){
      o.style.display=(planFor==='work'&&(o.value==='lecture'||o.value==='revision'))?'none':'';
    });
    if(planFor==='work'&&(typeEl.value==='lecture'||typeEl.value==='revision'))typeEl.value='topic';
    document.getElementById('peLecRow').classList.add('hidden');
  }

  function onEditPlanForChange(){
    var pf=document.getElementById('pePlanFor').value;
    _populateEditSubjects(pf,null);
    _updateEditTypeOptions(pf);
  }

  /* FIX #1: Save edits */
  function saveEdit(){
    if(!editingPlan)return;
    var plans=getPlans();
    var dk=editingPlan.date;
    if(!plans[dk])return;
    var p=plans[dk].find(function(x){return x.id===editingPlan.id});
    if(!p)return;

    p.planFor=document.getElementById('pePlanFor').value||'study';
    p.subject=document.getElementById('peSubj').value;
    p.type=document.getElementById('peType').value;
    p.topic=document.getElementById('peTopic').value.trim();
    p.source=(document.getElementById('peSource').value||'').trim();
    p.estHours=parseFloat(document.getElementById('peHours').value)||2;
    p.priority=document.getElementById('pePriority').value;
    p.notes=document.getElementById('peNotes').value.trim();
    p.status=document.getElementById('peStatus').value;
    p.startTime=document.getElementById('peStartTime').value||null;
    p.endTime=document.getElementById('peEndTime').value||null;
    if(p.type==='lecture')p.lecNum=parseInt(document.getElementById('peLecNum').value)||null;

    setPlans(plans);
    closeEdit();
    render();_afterChange();D.push();
    UI.toast('Plan updated ✓');
  }

  function closeEdit(){
    editingPlan=null;
    document.getElementById('planEditModal').classList.add('hidden');
  }

  /* Color Coding — hash subject name to a palette color */
  var _colorPalette=['var(--acc)','var(--cyn)','var(--pur)','var(--grn)','var(--yel)','var(--blu)','var(--red)','#ec4899'];
  function _hashColor(str){
    var hash=0;
    for(var i=0;i<str.length;i++) hash+=str.charCodeAt(i);
    return _colorPalette[hash%_colorPalette.length];
  }

  function render(){
    var viewDate=document.getElementById('planViewDate').value||D.todayKey();
    var plans=getForDate(viewDate);
    var el=document.getElementById('planList');

    if(!plans.length){
      el.innerHTML='<div class="empty"><div class="empty-ico">🎯</div><p>No plans for this day</p></div>';
      return;
    }

    /* Sort by sortOrder if set, else by priority */
    var hasSortOrder=plans.some(function(p){return typeof p.sortOrder==='number'});
    if(hasSortOrder){
      plans.sort(function(a,b){return(a.sortOrder||0)-(b.sortOrder||0)});
    } else {
      var priOrder={critical:0,high:1,medium:2,low:3};
      plans.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});
    }

    var h='';
    plans.forEach(function(p,idx){
      var priIco={critical:'🔴',high:'🟠',medium:'🟡',low:'🟢'}[p.priority]||'🟡';
      var typeIco={topic:'📝',lecture:'🎓',revision:'🧠',practice:'✍️',other:'📌'}[p.type]||'📌';
      var statusCls=p.status==='completed'?' completed':p.status==='in-progress'?' in-progress':'';

      var subjColor=_hashColor(p.subject);
      h+='<div class="plan-card'+statusCls+'" draggable="true" data-plan-id="'+p.id+'" data-plan-idx="'+idx+'" data-color="'+subjColor+'" style="border-left:3px solid '+subjColor+'">';
      h+='<div class="drag-handle" title="Drag to reorder">⠿</div>';
      h+='<div style="flex:1;min-width:0">';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">';
      h+='<span>'+priIco+'</span><span>'+typeIco+'</span>';
      h+='<span style="font-size:.82rem;font-weight:700;color:var(--heading);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.subject)+'</span>';
      if(p.planFor==='work')h+='<span style="font-size:.55rem;background:var(--cyn2);color:var(--cyn);padding:1px 5px;border-radius:4px;font-weight:700">💼 Work</span>';
      h+='<span class="plan-status '+p.status+'">'+p.status+'</span>';
      h+='</div>';
      h+='<div style="font-size:.72rem;color:var(--t2);font-weight:500">'+esc(p.topic)+(p.lecNum?' · Lec #'+p.lecNum:'')+'</div>';
      if(p.source){
        var srcHtml=esc(p.source);
        if(/^https?:\/\//i.test(p.source))srcHtml='<a href="'+esc(p.source)+'" target="_blank" rel="noopener" style="color:var(--acc);text-decoration:underline">'+srcHtml+'</a>';
        h+='<div style="font-size:.6rem;color:var(--td);margin-top:1px">📎 '+srcHtml+'</div>';
      }
      if(p.startTime&&p.endTime)h+='<div style="font-size:.6rem;color:var(--cyn);font-weight:600;font-family:JetBrains Mono,monospace;margin-top:1px">🕐 '+p.startTime+' — '+p.endTime+'</div>';
      if(p.notes)h+='<div style="font-size:.62rem;color:var(--td);font-style:italic;margin-top:1px">'+esc(p.notes)+'</div>';

      var estStr='Est: '+p.estHours+'h';
      var actualSecs=p.actualSecs||0;
      if(actualSecs>0){
        var actualH=(actualSecs/3600).toFixed(1);
        var diff=actualSecs/3600-p.estHours;
        var diffStr=diff>=0?'+'+diff.toFixed(1)+'h':diff.toFixed(1)+'h';
        var diffColor=diff>=0?'var(--grn)':'var(--red)';
        estStr+=' · Actual: '+actualH+'h <span style="color:'+diffColor+';font-weight:700">('+diffStr+')</span>';
      }
      h+='<div style="font-size:.62rem;color:var(--td)">'+estStr+'</div>';

      h+='</div>';
      h+='<div style="display:flex;gap:3px">';
      if(p.status!=='completed')h+='<button class="b b-xs b-grn" onclick="PLAN.completePlan(\''+viewDate+'\',\''+p.id+'\')">✓</button>';
      if(p.status==='planned')h+='<button class="b b-xs" onclick="PLAN.updateStatus(\''+viewDate+'\',\''+p.id+'\',\'in-progress\')">▶</button>';
      h+='<button class="b b-xs" onclick="PLAN.openEdit(\''+viewDate+'\',\''+p.id+'\')">✏️</button>';
      h+='<button class="b b-xs b-danger" onclick="PLAN.remove(\''+viewDate+'\',\''+p.id+'\')">✕</button>';
      h+='</div></div>';
    });
    el.innerHTML=h;
    _initDrag(viewDate);
  }

  /* Drag-to-Reorder */
  var _dragId=null;
  function _initDrag(viewDate){
    var el=document.getElementById('planList');
    el.addEventListener('dragstart',function(e){
      var card=e.target.closest('.plan-card');
      if(!card)return;
      _dragId=card.getAttribute('data-plan-id');
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
    });
    el.addEventListener('dragover',function(e){
      e.preventDefault();
      var card=e.target.closest('.plan-card');
      if(card&&!card.classList.contains('dragging'))card.classList.add('drag-over');
    });
    el.addEventListener('dragleave',function(e){
      var card=e.target.closest('.plan-card');
      if(card)card.classList.remove('drag-over');
    });
    el.addEventListener('drop',function(e){
      e.preventDefault();
      var target=e.target.closest('.plan-card');
      if(!target||!_dragId)return;
      var targetId=target.getAttribute('data-plan-id');
      if(targetId===_dragId){_dragId=null;return}
      _reorder(viewDate,_dragId,targetId);
      _dragId=null;
    });
    el.addEventListener('dragend',function(){
      _dragId=null;
      el.querySelectorAll('.plan-card').forEach(function(c){c.classList.remove('dragging','drag-over')});
    });
  }
  function _reorder(date,fromId,toId){
    var plans=getPlans();if(!plans[date])return;
    var arr=plans[date];
    var fromIdx=arr.findIndex(function(p){return p.id===fromId});
    var toIdx=arr.findIndex(function(p){return p.id===toId});
    if(fromIdx<0||toIdx<0)return;
    var item=arr.splice(fromIdx,1)[0];
    arr.splice(toIdx,0,item);
    arr.forEach(function(p,i){p.sortOrder=i});
    setPlans(plans);render();_afterChange();D.push();
  }

  /* Plan Templates — Save / Load */
  function getTemplates(){return JSON.parse(localStorage.getItem('st3_planTemplates')||'[]')}
  function setTemplates(t){localStorage.setItem('st3_planTemplates',JSON.stringify(t))}

  function saveAsTemplate(){
    var viewDate=document.getElementById('planViewDate').value||D.todayKey();
    var plans=getForDate(viewDate);
    if(!plans.length){UI.toast('No plans to save as template');return}
    var name=prompt('Template name:');
    if(!name)return;
    var tpls=getTemplates();
    var items=plans.map(function(p){return{subject:p.subject,planFor:p.planFor||'study',type:p.type,topic:p.topic,source:p.source||'',estHours:p.estHours,priority:p.priority,lecNum:p.lecNum,notes:p.notes||''}});
    tpls.push({id:'tpl_'+Date.now(),name:name.trim(),items:items,createdAt:new Date().toISOString()});
    setTemplates(tpls);UI.toast('Template "'+name+'" saved ✓');renderTemplates();
  }

  function loadTemplate(id){
    var tpls=getTemplates();var tpl=tpls.find(function(t){return t.id===id});
    if(!tpl){UI.toast('Template not found');return}
    var date=document.getElementById('planDate').value||D.todayKey();
    var plans=getPlans();if(!plans[date])plans[date]=[];
    tpl.items.forEach(function(item){
      plans[date].push({
        id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        subject:item.subject,planFor:item.planFor||'study',type:item.type,topic:item.topic,
        source:item.source||'',estHours:item.estHours,
        priority:item.priority,lecNum:item.lecNum,status:'planned',notes:item.notes||'',
        actualSecs:0,createdAt:new Date().toISOString()
      });
    });
    setPlans(plans);document.getElementById('planViewDate').value=date;
    render();_afterChange();D.push();UI.toast('Template "'+tpl.name+'" applied ✓');
  }

  function deleteTemplate(id){
    if(!confirm('Delete this template?'))return;
    var tpls=getTemplates().filter(function(t){return t.id!==id});
    setTemplates(tpls);renderTemplates();UI.toast('Template deleted');
  }

  function renderTemplates(){
    var el=document.getElementById('planTemplateList');
    if(!el)return;
    var tpls=getTemplates();
    if(!tpls.length){el.innerHTML='<span style="font-size:.65rem;color:var(--tf)">No saved templates</span>';return}
    var h='';
    tpls.forEach(function(t){
      h+='<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--brd)">';
      h+='<span style="flex:1;font-size:.7rem;font-weight:600;color:var(--heading)">'+esc(t.name)+' <span style="color:var(--tf);font-weight:400">('+t.items.length+' items)</span></span>';
      h+='<button class="b b-xs b-acc" onclick="PLAN.loadTemplate(\''+t.id+'\')">Use</button>';
      h+='<button class="b b-xs b-danger" onclick="PLAN.deleteTemplate(\''+t.id+'\')">✕</button>';
      h+='</div>';
    });
    el.innerHTML=h;
  }

  function getTodayPlansForSubject(subj){
    return getForDate(D.todayKey()).filter(function(p){
      return p.subject===subj&&p.status!=='completed'&&p.status!=='skipped';
    });
  }

  return{
    init:init,add:add,render:render,updateStatus:updateStatus,remove:remove,
    completePlan:completePlan,carryForward:carryForward,copyDayPlans:copyDayPlans,
    renderGoalPresets:renderGoalPresets,toggleGoalPreset:toggleGoalPreset,
    openAddPreset:openAddPreset,openEditPreset:openEditPreset,saveGoalPreset:saveGoalPreset,deleteGoalPreset:deleteGoalPreset,cycleDayChip:cycleDayChip,
    onSubjChange:onSubjChange,onLecCheckChange:onLecCheckChange,onPlanForChange:onPlanForChange,onEditPlanForChange:onEditPlanForChange,
    getForDate:getForDate,getTodayPlansForSubject:getTodayPlansForSubject,
    getPlans:getPlans,setPlans:setPlans,
    openEdit:openEdit,saveEdit:saveEdit,closeEdit:closeEdit,
    saveAsTemplate:saveAsTemplate,loadTemplate:loadTemplate,deleteTemplate:deleteTemplate,renderTemplates:renderTemplates
  };
})();
