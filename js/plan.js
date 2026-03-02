/* ========== PLANNING MODULE ========== */
/* Part 2/7 — FIX #1: edit modal, FIX #2: notes field, actual vs estimated display */

var PLAN=(function(){
  var editingPlan=null; // {date, id} for edit mode

  function getPlans(){return D.getLocal().plans||{}}
  function setPlans(p){var d=D.getLocal();d.plans=p;D.saveLocal(d)}
  function getForDate(dk){return(getPlans()[dk]||[]).slice()}

  function init(){
    document.getElementById('planDate').value=D.todayKey();
    document.getElementById('planViewDate').value=D.todayKey();
    onSubjChange();
    render();
    // Fill subject dropdown
    var cfg=D.getCfg();
    document.getElementById('planSubj').innerHTML='<option value="">Select...</option>'+cfg.studySubjects.map(function(s){return'<option>'+esc(s)+'</option>'}).join('');
  }

  function onSubjChange(){
    var subj=document.getElementById('planSubj').value;
    var syl=D.getSyl();var el=document.getElementById('planLecNum');
    el.innerHTML='';
    if(syl[subj]&&syl[subj].total){
      for(var i=1;i<=syl[subj].total;i++){
        var done=i<=(syl[subj].done||0);
        el.innerHTML+='<option value="'+i+'"'+(done?' style="color:var(--grn)"':'')+'>Lec '+i+(done?' ✓':'')+'</option>';
      }
    }
  }

  function add(){
    var date=document.getElementById('planDate').value;
    var subj=document.getElementById('planSubj').value;
    var type=document.getElementById('planType').value;
    var topic=document.getElementById('planTopic').value.trim();
    var hours=parseFloat(document.getElementById('planHours').value)||2;
    var priority=document.getElementById('planPriority').value;
    var lecNum=type==='lecture'?parseInt(document.getElementById('planLecNum').value)||null:null;
    /* FIX #2: notes field */
    var notes=(document.getElementById('planNotes')||{}).value||'';
    notes=notes.trim();

    if(!date||!subj){UI.toast('Select date & subject');return}
    if(!topic&&type!=='lecture'){UI.toast('Enter topic');return}
    if(type==='lecture'&&!topic) topic='Lecture '+(lecNum||'');

    var plans=getPlans();
    if(!plans[date])plans[date]=[];
    plans[date].push({
      id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
      subject:subj,type:type,topic:topic,estHours:hours,priority:priority,
      lecNum:lecNum,status:'planned',notes:notes,actualSecs:0,
      createdAt:new Date().toISOString()
    });
    setPlans(plans);
    document.getElementById('planTopic').value='';
    if(document.getElementById('planNotes'))document.getElementById('planNotes').value='';
    render();D.push();UI.toast('Plan added ✓');
  }

  function updateStatus(date,id,status){
    var plans=getPlans();
    if(!plans[date])return;
    var p=plans[date].find(function(x){return x.id===id});
    if(p)p.status=status;
    setPlans(plans);render();D.push();
  }

  function remove(date,id){
    if(!confirm('Remove this plan item?'))return;
    var plans=getPlans();
    if(!plans[date])return;
    plans[date]=plans[date].filter(function(x){return x.id!==id});
    if(!plans[date].length)delete plans[date];
    setPlans(plans);render();D.push();UI.toast('Removed');
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
    render();D.push();UI.toast(pending.length+' items carried forward');
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
    render();D.push();UI.toast(sourcePlans.length+' plans copied ✓');
  }

  function applyTemplate(type){
    var date=document.getElementById('planDate').value;
    if(!date){UI.toast('Select date first');return}
    var cfg=D.getCfg(),subjs=cfg.studySubjects;
    if(!subjs.length){UI.toast('Add subjects in settings');return}
    var blocks={'office':3,'wfh':5.5,'evensat':7,'fullday':13};
    var hours=blocks[type]||6;
    UI.toast(type+' template: '+hours+'h — add your subjects!');
  }

  /* FIX #1: Edit modal — open with pre-filled fields */
  function openEdit(date,id){
    var plans=getPlans();
    if(!plans[date])return;
    var p=plans[date].find(function(x){return x.id===id});
    if(!p)return;
    editingPlan={date:date,id:id};

    var modal=document.getElementById('planEditModal');
    document.getElementById('peSubj').value=p.subject;
    document.getElementById('peType').value=p.type;
    document.getElementById('peTopic').value=p.topic;
    document.getElementById('peHours').value=p.estHours;
    document.getElementById('pePriority').value=p.priority;
    document.getElementById('peNotes').value=p.notes||'';
    document.getElementById('peStatus').value=p.status;

    // Populate subject dropdown
    var cfg=D.getCfg();
    var subjSel=document.getElementById('peSubj');
    subjSel.innerHTML=cfg.studySubjects.map(function(s){return'<option'+(s===p.subject?' selected':'')+'>'+esc(s)+'</option>'}).join('');

    // Lecture number
    var syl=D.getSyl();
    var lecRow=document.getElementById('peLecRow');
    var lecSel=document.getElementById('peLecNum');
    lecSel.innerHTML='';
    if(syl[p.subject]&&syl[p.subject].total){
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

  /* FIX #1: Save edits */
  function saveEdit(){
    if(!editingPlan)return;
    var plans=getPlans();
    var dk=editingPlan.date;
    if(!plans[dk])return;
    var p=plans[dk].find(function(x){return x.id===editingPlan.id});
    if(!p)return;

    p.subject=document.getElementById('peSubj').value;
    p.type=document.getElementById('peType').value;
    p.topic=document.getElementById('peTopic').value.trim();
    p.estHours=parseFloat(document.getElementById('peHours').value)||2;
    p.priority=document.getElementById('pePriority').value;
    p.notes=document.getElementById('peNotes').value.trim();
    p.status=document.getElementById('peStatus').value;
    if(p.type==='lecture')p.lecNum=parseInt(document.getElementById('peLecNum').value)||null;

    setPlans(plans);
    closeEdit();
    render();D.push();
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
      h+='<span class="plan-status '+p.status+'">'+p.status+'</span>';
      h+='</div>';
      h+='<div style="font-size:.72rem;color:var(--t2);font-weight:500">'+esc(p.topic)+(p.lecNum?' · Lec #'+p.lecNum:'')+'</div>';

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
    setPlans(plans);render();D.push();
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
    var items=plans.map(function(p){return{subject:p.subject,type:p.type,topic:p.topic,estHours:p.estHours,priority:p.priority,lecNum:p.lecNum,notes:p.notes||''}});
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
        subject:item.subject,type:item.type,topic:item.topic,estHours:item.estHours,
        priority:item.priority,lecNum:item.lecNum,status:'planned',notes:item.notes||'',
        actualSecs:0,createdAt:new Date().toISOString()
      });
    });
    setPlans(plans);document.getElementById('planViewDate').value=date;
    render();D.push();UI.toast('Template "'+tpl.name+'" applied ✓');
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
    completePlan:completePlan,carryForward:carryForward,copyDayPlans:copyDayPlans,applyTemplate:applyTemplate,
    onSubjChange:onSubjChange,getForDate:getForDate,getTodayPlansForSubject:getTodayPlansForSubject,
    getPlans:getPlans,setPlans:setPlans,
    openEdit:openEdit,saveEdit:saveEdit,closeEdit:closeEdit,
    saveAsTemplate:saveAsTemplate,loadTemplate:loadTemplate,deleteTemplate:deleteTemplate,renderTemplates:renderTemplates
  };
})();
