/* ========== CALENDAR MODULE ========== */
/* Heatmap cells, hourly view, clickable blocks, detail modal, rich plan cards */

var CAL=(function(){
  var viewYear,viewMonth,selectedDate=null;
  var viewMode='month'; // 'month' or 'week'
  var weekStart=null; // Date object for week view start (Sunday)

  function init(){
    var now=new Date();
    viewYear=now.getFullYear();viewMonth=now.getMonth();
    weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());
    render();
  }

  function toggleView(){
    viewMode=viewMode==='month'?'week':'month';
    render();
  }

  function prev(){
    if(viewMode==='week'){weekStart.setDate(weekStart.getDate()-7);viewYear=weekStart.getFullYear();viewMonth=weekStart.getMonth()}
    else{viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--}}
    render();
  }
  function next(){
    if(viewMode==='week'){weekStart.setDate(weekStart.getDate()+7);viewYear=weekStart.getFullYear();viewMonth=weekStart.getMonth()}
    else{viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++}}
    render();
  }

  /* Heatmap intensity color based on hours */
  function _heatColor(totalH){
    if(totalH<=0)return'';
    var intensity=Math.min(totalH/8,1);
    var alpha=0.08+intensity*0.32;
    return'rgba(52,211,153,'+alpha.toFixed(2)+')';
  }

  /* Priority icon helper */
  function _priIco(p){return{critical:'\u{1F534}',high:'\u{1F7E0}',medium:'\u{1F7E1}',low:'\u{1F7E2}'}[p]||'\u{1F7E1}'}

  /* =====================================================
     BLOCK LAYOUT — column assignment for overlapping blocks
     ===================================================== */
  function _layoutBlocks(blocks){
    if(!blocks.length)return;
    /* Minimum visual span — 24px min-height at 48px/row = 0.5 hours.
       Short sessions (1 sec, 1 min) render at this height, so overlap
       detection must use visual bounds, not actual time bounds. */
    var MIN_VIS_H=24/48; // 0.5 hours

    /* Sort by start time, then by longer duration first */
    blocks.sort(function(a,b){return a.startH-b.startH||(b.endH-b.startH)-(a.endH-a.startH)});

    /* Compute visual end height for each block */
    blocks.forEach(function(b){b._visEndH=Math.max(b.endH,b.startH+MIN_VIS_H)});

    /* Greedy column assignment — use _visEndH so short blocks don't stack */
    var colEnds=[]; // colEnds[i] = visual end hour of last block in column i
    blocks.forEach(function(b){
      var placed=false;
      for(var c=0;c<colEnds.length;c++){
        if(b.startH>=colEnds[c]-0.01){ // small epsilon for floating point
          b._col=c;colEnds[c]=b._visEndH;placed=true;break;
        }
      }
      if(!placed){b._col=colEnds.length;colEnds.push(b._visEndH)}
    });

    /* Find connected overlap groups using visual bounds */
    var groupEnd=-Infinity,group=[];
    var groups=[];
    blocks.forEach(function(b){
      if(b.startH>=groupEnd-0.01&&group.length){groups.push(group);group=[];groupEnd=-Infinity}
      group.push(b);
      if(b._visEndH>groupEnd)groupEnd=b._visEndH;
    });
    if(group.length)groups.push(group);

    groups.forEach(function(g){
      var maxCol=0;
      g.forEach(function(b){if(b._col>maxCol)maxCol=b._col});
      var totalCols=maxCol+1;
      g.forEach(function(b){b._maxCols=totalCols});
    });
  }

  function render(){
    if(viewMode==='week')return renderWeek();
    renderMonth();
  }

  /* ==================== MONTH VIEW ==================== */
  function renderMonth(){
    var months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('calTitle').textContent=months[viewMonth]+' '+viewYear;
    _updateViewToggle();

    var first=new Date(viewYear,viewMonth,1);
    var startDay=first.getDay();
    var daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
    var prevDays=new Date(viewYear,viewMonth,0).getDate();
    var today=D.todayKey();

    var h='';
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function(d){h+='<div class="cal-hdr-cell">'+d+'</div>'});

    // Previous month padding
    for(var i=startDay-1;i>=0;i--){
      var d=prevDays-i;
      h+='<div class="cal-cell other-month"><span class="cal-day-num">'+d+'</span></div>';
    }

    // Current month
    for(var d=1;d<=daysInMonth;d++){
      var dk=viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var isToday=dk===today;
      var isSel=dk===selectedDate;
      var cls='cal-cell'+(isToday?' today':'')+(isSel?' selected':'');

      var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
      var plans=(PLAN.getPlans()[dk]||[]);
      var totalStudy=0,totalWork=0;
      studySess.forEach(function(s){totalStudy+=s.dur});
      workSess.forEach(function(s){totalWork+=s.dur});
      var totalH=(totalStudy+totalWork)/3600;
      var sessCount=studySess.length+workSess.length;

      var heatBg=_heatColor(totalH);
      var heatStyle=heatBg?'background:'+heatBg+';':'';

      h+='<div class="'+cls+'" style="'+heatStyle+'" onclick="CAL.selectDay(\''+dk+'\')" data-dk="'+dk+'">';
      h+='<span class="cal-day-num">'+d+'</span>';

      // Dots
      var dots='';
      if(plans.length){
        var allDone=plans.filter(function(p){return p.status==='completed'}).length===plans.length;
        dots+=allDone?'<span class="cal-dot cal-dot-filled"></span>':'<span class="cal-dot cal-dot-hollow"></span>';
      }
      if(totalStudy>0)dots+='<span class="cal-dot" style="background:var(--acc)"></span>';
      if(totalWork>0)dots+='<span class="cal-dot" style="background:var(--cyn)"></span>';
      if(dots)h+='<div class="cal-dots">'+dots+'</div>';

      if(totalH>0){
        h+='<div class="cal-hrs">'+totalH.toFixed(1)+'h</div>';
        if(sessCount>1)h+='<div class="cal-sess-count">'+sessCount+'s</div>';
      }

      // Plan summary hint
      if(plans.length){
        var doneCount=plans.filter(function(p){return p.status==='completed'}).length;
        var subjs=[];
        plans.forEach(function(p){if(subjs.indexOf(p.subject)===-1&&subjs.length<2)subjs.push(p.subject)});
        var hint=plans.length+'p';
        if(doneCount>0)hint+=' \u00B7 '+doneCount+'\u2713';
        h+='<div class="cal-plan-hint" title="'+subjs.join(', ')+(plans.length>2?' +more':'')+'">'+hint+'</div>';
      }

      h+='</div>';
    }

    // Next month padding
    var totalCells=startDay+daysInMonth;
    var rem=totalCells%7?7-(totalCells%7):0;
    for(var i=1;i<=rem;i++){
      h+='<div class="cal-cell other-month"><span class="cal-day-num">'+i+'</span></div>';
    }

    document.getElementById('calGrid').innerHTML=h;
    if(selectedDate)renderDayDetail(selectedDate);
    _scrollToToday();
  }

  function _scrollToToday(){
    setTimeout(function(){
      var todayCell=document.querySelector('#calGrid .cal-cell.today');
      if(todayCell)todayCell.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
    },50);
  }

  function selectDay(dk){
    selectedDate=dk;render();
  }

  var _quickAddHour=null;

  /* ==================== DAY DETAIL (HOURLY VIEW) ==================== */
  function renderDayDetail(dk){
    var el=document.getElementById('calDayDetail');
    var cfg=D.getCfg();
    var wakeH=cfg.wakeTime||6;var bedH=cfg.bedtime||22.5;
    var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
    var plans=PLAN.getForDate(dk);
    var _dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var _dd=new Date(dk+'T12:00:00');
    var dayName=_dayNames[_dd.getDay()]+', '+UI.fdate(dk);
    var today=D.todayKey();var isToday=dk===today;var nowH=new Date().getHours()+new Date().getMinutes()/60;

    /* Compute day stats */
    var totalStudyS=0,totalWorkS=0;
    studySess.forEach(function(s){totalStudyS+=s.dur});
    workSess.forEach(function(s){totalWorkS+=s.dur});
    var totalStudyH=totalStudyS/3600;var totalWorkH=totalWorkS/3600;
    var totalSessH=totalStudyH+totalWorkH;

    var plannedH=0;
    plans.forEach(function(p){if(p.status!=='completed'&&p.status!=='skipped')plannedH+=p.estHours});

    var awakeH=bedH-wakeH;
    var sleepH=24-awakeH;
    var usedH=totalSessH+plannedH;
    var freeH=Math.max(0,awakeH-usedH);
    var goalH=D.getGoalForDate(dk);

    var h='<div class="hourly-view">';
    /* Header */
    h+='<div class="hv-header">';
    h+='<div><span class="hv-title">'+dayName+'</span></div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="b b-xs" onclick="CAL.addPlanForDay(\''+dk+'\')">+ Plan</button>';
    h+='<button class="b b-xs" onclick="CAL.addSessionForDay(\''+dk+'\')">+ Session</button>';
    h+='<button class="b b-xs b-grn" onclick="CAL.addKnowledgeForDay(\''+dk+'\')">+ Knowledge</button>';
    h+='</div>';
    h+='</div>';

    /* Stats bar */
    h+='<div class="hv-stats">';
    h+='<div class="hv-stat"><span class="hv-stat-val" style="color:var(--acc)">'+totalSessH.toFixed(1)+'h</span><span class="hv-stat-lbl">Done</span></div>';
    h+='<div class="hv-stat"><span class="hv-stat-val" style="color:var(--pur)">'+plannedH.toFixed(1)+'h</span><span class="hv-stat-lbl">Planned</span></div>';
    h+='<div class="hv-stat"><span class="hv-stat-val" style="color:var(--grn)">'+freeH.toFixed(1)+'h</span><span class="hv-stat-lbl">Free</span></div>';
    h+='<div class="hv-stat"><span class="hv-stat-val" style="color:var(--td)">'+sleepH.toFixed(1)+'h</span><span class="hv-stat-lbl">Sleep</span></div>';
    h+='</div>';

    /* Goal progress */
    /* Goal uses study hours only */
    var goalStudyH=totalStudyH;
    var goalPct=goalH>0?Math.min(100,Math.round(goalStudyH/goalH*100)):0;
    h+='<div style="padding:6px 14px;border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:8px">';
    h+='<span style="font-size:.6rem;font-weight:700;color:var(--td)">GOAL</span>';
    h+='<div style="flex:1;height:6px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="width:'+goalPct+'%;height:100%;background:'+(goalPct>=100?'var(--grn)':'var(--acc)')+';border-radius:3px;transition:width .3s"></div></div>';
    h+='<span style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:700;color:'+(goalPct>=100?'var(--grn)':'var(--acc)')+'">'+goalStudyH.toFixed(1)+'/'+goalH+'h study ('+goalPct+'%)</span>';
    h+='</div>';

    /* Unscheduled plans — rich cards */
    var unscheduled=plans.filter(function(p){return !p.startTime});
    if(unscheduled.length){
      h+='<div style="padding:8px 14px;border-bottom:1px solid var(--brd)">';
      h+='<div style="font-size:.6rem;font-weight:700;color:var(--pur);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Unscheduled Plans ('+unscheduled.length+')</div>';
      unscheduled.forEach(function(p){
        var priIco=_priIco(p.priority);
        h+='<div class="usp-card" onclick="CAL.openPlanDetail(\''+dk+'\',\''+p.id+'\')">';
        h+='<span style="font-size:.8rem">'+priIco+'</span>';
        h+='<div class="usp-info">';
        h+='<div class="usp-title">'+esc(p.subject)+': '+esc(p.topic)+'</div>';
        h+='<div class="usp-meta">';
        h+='<span style="font-family:JetBrains Mono,monospace">'+p.estHours+'h</span>';
        h+='<span class="plan-status '+p.status+'">'+p.status+'</span>';
        if(p.source)h+='<span>'+esc(p.source)+'</span>';
        h+='</div></div>';
        h+='<div class="usp-actions" onclick="event.stopPropagation()">';
        if(p.status!=='in-progress'&&p.status!=='completed')h+='<button class="b b-xs" onclick="CAL.startPlanFromCal(\''+dk+'\',\''+p.id+'\')" title="Start Timer">&#9654;</button>';
        if(p.status!=='completed')h+='<button class="b b-xs" onclick="CAL.setPlanStatus(\''+dk+'\',\''+p.id+'\',\'completed\')" title="Complete">\u2713</button>';
        h+='</div>';
        h+='</div>';
      });
      h+='</div>';
    }

    /* Build blocks data for sessions + scheduled plans */
    var blocks=[];
    var allSess=[];
    studySess.forEach(function(s,i){allSess.push({type:'study',sessIdx:i,start:s.start,end:s.end,dur:s.dur,cat:s.cat,note:s.note||'',diff:s.diff||''})});
    workSess.forEach(function(s,i){allSess.push({type:'work',sessIdx:i,start:s.start,end:s.end,dur:s.dur,cat:s.cat,note:s.note||'',diff:s.diff||''})});
    allSess.forEach(function(s){
      var sd=new Date(s.start),ed=new Date(s.end);
      var sH=sd.getHours()+sd.getMinutes()/60;
      var eH=ed.getHours()+ed.getMinutes()/60;
      /* Handle sessions that cross midnight or have 0 end (same time) */
      if(eH<=sH)eH=sH+s.dur/3600;
      blocks.push({
        kind:'session',type:s.type,sessIdx:s.sessIdx,startH:sH,endH:eH,
        title:s.cat||s.type,sub:s.note,dur:s.dur,cat:s.cat,
        startISO:s.start,endISO:s.end,diff:s.diff
      });
    });
    plans.filter(function(p){return p.startTime&&p.endTime}).forEach(function(p){
      var sp=p.startTime.split(':'),ep=p.endTime.split(':');
      var sH=parseInt(sp[0])+parseInt(sp[1])/60,eH=parseInt(ep[0])+parseInt(ep[1])/60;
      if(eH<=sH)eH=sH+p.estHours;
      blocks.push({
        kind:'plan',type:'plan',startH:sH,endH:eH,
        title:p.subject+': '+p.topic,
        sub:p.estHours+'h \u00B7 '+p.status,
        status:p.status,planId:p.id,planDk:dk,
        priority:p.priority,source:p.source||'',notes:p.notes||'',
        subject:p.subject,topic:p.topic,estHours:p.estHours,
        startTime:p.startTime,endTime:p.endTime
      });
    });

    /* Run column layout algorithm */
    _layoutBlocks(blocks);

    /* Hourly grid — render rows + overlay blocks */
    var startHour=Math.floor(wakeH);var endHour=Math.ceil(bedH);
    var ROW_H=48; // pixels per hour row (must match .hv-row height including border via box-sizing)

    h+='<div class="hv-grid">';
    /* Inner wrapper: normal-flow container so everything scrolls together.
       position:relative makes it the positioning context for absolute blocks. */
    h+='<div style="position:relative">';

    /* Hour rows (background grid) */
    for(var hr=startHour;hr<endHour;hr++){
      var isPast=isToday&&hr<Math.floor(nowH);
      var timeLabel=String(hr).padStart(2,'0')+':00';
      h+='<div class="hv-row'+(isPast?' past-hour':'')+'" data-hour="'+hr+'" onclick="CAL.onHourClick(\''+dk+'\','+hr+')">';
      h+='<div class="hv-time">'+timeLabel+'</div>';
      h+='<div class="hv-slot"><span class="hv-add-hint">+ tap to plan</span></div>';
      h+='</div>';
    }

    /* Block overlay — absolutely positioned within the inner wrapper (scrolls with content) */
    h+='<div style="position:absolute;top:0;left:48px;right:0;bottom:0;pointer-events:none;z-index:3">';

    blocks.forEach(function(b,idx){
      /* Clamp block to visible hour range */
      var visStart=Math.max(b.startH,startHour);
      var visEnd=Math.min(b.endH,endHour);
      if(visEnd<=visStart)return;

      var topPx=(visStart-startHour)*ROW_H;
      var heightPx=Math.max((visEnd-visStart)*ROW_H,24);

      /* Column-based width & position for overlapping blocks */
      var maxCols=b._maxCols||1;
      var col=(typeof b._col==='number')?b._col:0;
      var colGap=2; // px gap between columns
      var widthPct=(100/maxCols);
      var leftPct=(col*widthPct);

      var style='top:'+topPx+'px;height:'+heightPx+'px;'
        +'left:calc('+leftPct+'% + '+colGap+'px);'
        +'width:calc('+widthPct+'% - '+(colGap*2)+'px);'
        +'pointer-events:auto';

      var clickAttr='onclick="event.stopPropagation();CAL.showItemDetail('+idx+')"';
      h+='<div class="hv-block '+b.type+'" style="'+style+'" '+clickAttr+' data-bidx="'+idx+'">';

      /* Content adapts to available height */
      h+='<div class="hv-block-title">'+esc(b.title)+'</div>';
      if(heightPx>=36){
        if(b.kind==='session'){
          h+='<div class="hv-block-sub">'+(b.sub?esc(b.sub)+' \u00B7 ':'')+UI.fd(b.dur)+'</div>';
        } else {
          h+='<div class="hv-block-sub">'+esc(b.sub)+'</div>';
        }
      }
      if(heightPx>=54){
        if(b.kind==='session'&&b.diff){
          h+='<div class="hv-block-detail">'+esc(b.diff)+'</div>';
        } else if(b.kind==='plan'&&b.priority){
          h+='<div class="hv-block-detail">'+_priIco(b.priority)+' '+esc(b.priority)+'</div>';
        }
      }
      h+='</div>';
    });

    h+='</div>'; // block overlay

    /* Now indicator line (inside inner wrapper so it scrolls correctly) */
    if(isToday&&nowH>=wakeH&&nowH<=bedH){
      var nowOffset=(nowH-startHour)*ROW_H;
      h+='<div class="hv-now-line" style="top:'+nowOffset+'px"></div>';
      h+='<div class="hv-now-dot" style="top:'+nowOffset+'px"></div>';
    }

    h+='</div>'; // inner wrapper
    h+='</div>'; // hv-grid

    /* Quick add form */
    h+='<div id="hvQuickAdd" class="hidden" style="padding:8px 14px"></div>';

    h+='</div>'; // hourly-view
    el.innerHTML=h;

    /* Store blocks data for click handler access */
    el._blocks=blocks;
    el._dk=dk;

    /* Scroll to current hour if today */
    if(isToday){
      setTimeout(function(){
        var grid=el.querySelector('.hv-grid');
        if(grid){var scrollTo=Math.max(0,(nowH-startHour-2)*ROW_H);grid.scrollTop=scrollTo}
      },50);
    }
  }

  /* ==================== ITEM DETAIL MODAL ==================== */

  function showItemDetail(blockIdx){
    var el=document.getElementById('calDayDetail');
    if(!el||!el._blocks)return;
    var b=el._blocks[blockIdx];
    if(!b)return;

    var modal=document.getElementById('calItemModal');
    var hdrEl=document.getElementById('ciModalHeader');
    var bodyEl=document.getElementById('ciModalBody');
    var actEl=document.getElementById('ciModalActions');
    if(!modal)return;

    var kind=b.kind;
    var typeLabel=kind==='session'?(b.type==='study'?'Study Session':'Work Session'):'Planned Task';
    var typeClass=kind==='session'?b.type:'plan';
    var typeIco=kind==='session'?(b.type==='study'?'\u{1F4D6}':'\u{1F4BC}'):'\u{1F4CB}';

    /* Header with colored icon */
    var hh='<div class="ci-type-ico '+typeClass+'">'+typeIco+'</div>';
    hh+='<div class="ci-hdr-info"><div class="ci-hdr-title">'+esc(b.title)+'</div><div class="ci-hdr-sub">'+typeLabel+'</div></div>';
    hh+='<button class="ci-close" onclick="CAL.closeCIModal()">&times;</button>';
    hdrEl.innerHTML=hh;

    /* Body rows */
    var bh='';
    if(kind==='session'){
      if(b.sub)bh+=_ciRow('Topic / Note',esc(b.sub));
      bh+=_ciRow('Duration',UI.fd(b.dur));
      var sd=new Date(b.startISO),ed=new Date(b.endISO);
      var startT=String(sd.getHours()).padStart(2,'0')+':'+String(sd.getMinutes()).padStart(2,'0');
      var endT=String(ed.getHours()).padStart(2,'0')+':'+String(ed.getMinutes()).padStart(2,'0');
      bh+=_ciRow('Time',startT+' \u2014 '+endT);
      if(b.diff)bh+=_ciRow('Difficulty',esc(b.diff));
    } else {
      if(b.topic)bh+=_ciRow('Topic',esc(b.topic));
      if(b.source)bh+=_ciRow('Source',esc(b.source));
      bh+=_ciRow('Est. Hours',b.estHours+'h');
      bh+=_ciRow('Priority',_priIco(b.priority)+' '+esc(b.priority||'medium'));
      bh+=_ciRow('Status','<span class="plan-status '+(b.status||'planned')+'">'+(b.status||'planned')+'</span>');
      if(b.startTime&&b.endTime)bh+=_ciRow('Time',b.startTime+' \u2014 '+b.endTime);
      if(b.notes)bh+=_ciRow('Notes',esc(b.notes));
    }
    bodyEl.innerHTML=bh;

    /* Action buttons */
    var ah='<button class="b" onclick="CAL.closeCIModal()">Close</button>';
    if(kind==='plan'){
      ah+='<button class="b b-acc" onclick="CAL.closeCIModal();PLAN.openEdit(\''+b.planDk+'\',\''+b.planId+'\')">Edit Plan</button>';
    } else if(kind==='session'){
      ah+='<button class="b b-acc" onclick="CAL.editSession(\''+el._dk+'\',\''+b.type+'\','+b.sessIdx+')">Edit</button>';
      ah+='<button class="b" style="color:var(--red)" onclick="CAL.deleteSession(\''+el._dk+'\',\''+b.type+'\','+b.sessIdx+')">Delete</button>';
    }
    actEl.innerHTML=ah;
    modal.classList.remove('hidden');
  }

  /* Helper to build a modal detail row */
  function _ciRow(label,valueHtml){
    return'<div class="ci-row"><span class="ci-label">'+label+'</span><span class="ci-value">'+valueHtml+'</span></div>';
  }

  /* Open detail modal for a specific plan by dk + planId */
  function openPlanDetail(dk,planId){
    var plans=PLAN.getForDate(dk);
    var p=plans.find(function(x){return x.id===planId});
    if(!p)return;

    var modal=document.getElementById('calItemModal');
    var hdrEl=document.getElementById('ciModalHeader');
    var bodyEl=document.getElementById('ciModalBody');
    var actEl=document.getElementById('ciModalActions');
    if(!modal)return;

    /* Header */
    var hh='<div class="ci-type-ico plan">\u{1F4CB}</div>';
    hh+='<div class="ci-hdr-info"><div class="ci-hdr-title">'+esc(p.subject)+': '+esc(p.topic)+'</div><div class="ci-hdr-sub">Planned Task</div></div>';
    hh+='<button class="ci-close" onclick="CAL.closeCIModal()">&times;</button>';
    hdrEl.innerHTML=hh;

    /* Body */
    var bh='';
    bh+=_ciRow('Subject',esc(p.subject));
    bh+=_ciRow('Topic',esc(p.topic));
    if(p.source)bh+=_ciRow('Source',esc(p.source));
    bh+=_ciRow('Est. Hours',p.estHours+'h');
    bh+=_ciRow('Priority',_priIco(p.priority)+' '+esc(p.priority||'medium'));
    bh+=_ciRow('Status','<span class="plan-status '+(p.status||'planned')+'">'+(p.status||'planned')+'</span>');
    if(p.startTime&&p.endTime)bh+=_ciRow('Time',p.startTime+' \u2014 '+p.endTime);
    if(p.lecNum)bh+=_ciRow('Lecture #',''+p.lecNum);
    if(p.notes)bh+=_ciRow('Notes',esc(p.notes));
    bodyEl.innerHTML=bh;

    /* Actions */
    var ah='<button class="b" onclick="CAL.closeCIModal()">Close</button>';
    ah+='<button class="b b-acc" onclick="CAL.closeCIModal();PLAN.openEdit(\''+dk+'\',\''+planId+'\')">Edit Plan</button>';
    actEl.innerHTML=ah;
    modal.classList.remove('hidden');
  }

  function closeCIModal(){
    var modal=document.getElementById('calItemModal');
    if(modal)modal.classList.add('hidden');
  }

  /* Quick status change for unscheduled plan cards */
  function setPlanStatus(dk,planId,status){
    var plans=PLAN.getPlans();
    if(!plans[dk])return;
    var p=plans[dk].find(function(x){return x.id===planId});
    if(!p)return;
    p.status=status;
    PLAN.setPlans(plans);
    renderDayDetail(dk);
    try{PLAN.render()}catch(e){}
    D.push();
    UI.toast(status==='completed'?'Plan completed \u2713':'Plan started \u25B6');
  }

  /* ==================== HOUR CLICK — QUICK ADD ==================== */
  function onHourClick(dk,hour){
    _quickAddHour=hour;
    var el=document.getElementById('hvQuickAdd');
    if(!el)return;
    var startT=String(hour).padStart(2,'0')+':00';
    var endT=String(hour+1).padStart(2,'0')+':00';
    var h='<div class="hv-quick-add">';
    h+='<div style="font-size:.72rem;font-weight:700;color:var(--heading);margin-bottom:6px">Quick Add for '+startT+' \u2014 '+endT+'</div>';
    /* Type selector */
    h+='<div class="df"><span class="df-lbl" style="font-size:.65rem">Type</span>';
    h+='<select class="cat-sel" id="hvType" style="flex:1;font-size:.72rem" onchange="CAL.updateQuickAddFields()">';
    h+='<option value="study">\u{1F4D6} Study</option>';
    h+='<option value="work">\u{1F4BC} Work</option>';
    h+='<option value="knowledge">\u{1F4A1} Knowledge</option>';
    h+='</select></div>';
    /* Subject/Category dropdown — populated dynamically */
    h+='<div class="df" style="margin-top:4px"><span class="df-lbl" id="hvSubjLbl" style="font-size:.65rem">Subject</span><select class="cat-sel" id="hvSubj" style="flex:1;font-size:.72rem">';
    h+=UI.examSubjectOptions(null,false);
    h+='</select></div>';
    /* Topic input */
    h+='<div class="df" style="margin-top:4px"><span class="df-lbl" style="font-size:.65rem">Topic</span>';
    h+='<div class="ac-wrap" style="flex:1;position:relative"><input type="text" class="inp" id="hvTopic" placeholder="What to study..." style="font-size:.72rem;padding:6px 10px" autocomplete="off"></div></div>';
    /* Time range */
    h+='<div class="df" style="margin-top:4px">';
    h+='<span class="df-lbl" style="font-size:.65rem">Start</span><input type="time" class="inp" id="hvStart" value="'+startT+'" style="width:80px;font-size:.72rem;padding:6px 8px">';
    h+='<span class="df-lbl" style="font-size:.65rem">End</span><input type="time" class="inp" id="hvEnd" value="'+endT+'" style="width:80px;font-size:.72rem;padding:6px 8px">';
    h+='</div>';
    h+='<div style="display:flex;gap:6px;margin-top:6px;justify-content:flex-end">';
    h+='<button class="b b-xs" onclick="document.getElementById(\'hvQuickAdd\').classList.add(\'hidden\')">Cancel</button>';
    h+='<button class="b b-xs b-acc" onclick="CAL.quickAddPlan(\''+dk+'\')">Add</button>';
    h+='</div></div>';
    el.innerHTML=h;
    el.classList.remove('hidden');
    var topicEl=document.getElementById('hvTopic');
    if(topicEl)UI.autocomplete(topicEl,function(){return document.getElementById('hvSubj').value});
    topicEl.focus();
  }

  /* Update subject/category dropdown when type changes */
  function updateQuickAddFields(){
    var type=(document.getElementById('hvType')||{}).value||'study';
    var subjEl=document.getElementById('hvSubj');
    var lblEl=document.getElementById('hvSubjLbl');
    var topicEl=document.getElementById('hvTopic');
    if(!subjEl)return;
    var cfg=D.getCfg();
    if(type==='study'){
      if(lblEl)lblEl.textContent='Subject';
      subjEl.innerHTML=UI.examSubjectOptions(null,false);
      if(topicEl)topicEl.placeholder='What to study...';
    } else if(type==='work'){
      if(lblEl)lblEl.textContent='Category';
      var opts='<option value="">Select...</option>';
      (cfg.workCategories||[]).forEach(function(c){opts+='<option>'+esc(c)+'</option>'});
      subjEl.innerHTML=opts;
      if(topicEl)topicEl.placeholder='What to work on...';
    } else {
      /* knowledge */
      if(lblEl)lblEl.textContent='Category';
      var opts='<option value="">Select...</option>';
      (cfg.knowledgeCategories||['Health & Fitness','Current Affairs','Technology','Finance','Life Skills','Other']).forEach(function(c){opts+='<option>'+esc(c)+'</option>'});
      subjEl.innerHTML=opts;
      if(topicEl)topicEl.placeholder='What did you learn?';
    }
  }

  function quickAddPlan(dk){
    var type=(document.getElementById('hvType')||{}).value||'study';
    var subj=document.getElementById('hvSubj').value;
    var topic=document.getElementById('hvTopic').value.trim();
    var startTime=document.getElementById('hvStart').value;
    var endTime=document.getElementById('hvEnd').value;
    if(!subj||!topic){UI.toast('Fill '+(type==='study'?'subject':'category')+' & topic');return}
    var sp=startTime.split(':'),ep=endTime.split(':');
    var sh=parseInt(sp[0])*60+parseInt(sp[1]),eh=parseInt(ep[0])*60+parseInt(ep[1]);
    var hours=eh>sh?Math.round((eh-sh)/60*10)/10:1;

    if(type==='knowledge'){
      /* Save as knowledge entry (same structure as KNOW.add()) */
      try{
        var entries=KNOW.getEntries();
        entries.push({
          id:'kn_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
          date:dk,category:subj,topic:topic,
          duration:Math.round(hours*60),
          source:'',notes:'',
          createdAt:new Date().toISOString()
        });
        KNOW.setEntries(entries);
        document.getElementById('hvQuickAdd').classList.add('hidden');
        renderDayDetail(dk);
        try{KNOW.render()}catch(e){}
        D.push();
        UI.toast('Knowledge added \u2713');
      }catch(e){UI.toast('Error adding knowledge')}
      return;
    }

    /* Study or Work — save as plan */
    var plans=PLAN.getPlans();
    if(!plans[dk])plans[dk]=[];
    plans[dk].push({
      id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
      subject:subj,planFor:type,type:'topic',topic:topic,estHours:hours,priority:'medium',
      lecNum:null,status:'planned',notes:'',actualSecs:0,
      startTime:startTime,endTime:endTime,
      createdAt:new Date().toISOString()
    });
    PLAN.setPlans(plans);
    document.getElementById('hvQuickAdd').classList.add('hidden');
    renderDayDetail(dk);
    try{PLAN.render()}catch(e){}
    D.push();
    UI.toast((type==='work'?'Work':'Study')+' plan added \u2713');
  }

  function addPlanForDay(dk){
    document.getElementById('planDate').value=dk;
    document.getElementById('planViewDate').value=dk;
    App.navTo('plan');
  }

  function addSessionForDay(dk){
    PAST.open('study');
    document.getElementById('pastDate').value=dk;
  }

  /* Navigate to Knowledge tab with date pre-filled */
  function addKnowledgeForDay(dk){
    App.navTo('knowledge');
    var el=document.getElementById('knAddDate');
    if(el)el.value=dk;
  }

  /* Start timer from a calendar plan card — starts timer + navigates to study tab */
  function startPlanFromCal(dk,planId){
    var plans=PLAN.getForDate(dk);
    var p=plans.find(function(x){return x.id===planId});
    if(!p){UI.toast('Plan not found');return}
    var type=p.planFor||'study';
    App.startFromPlan(type,p.subject,dk,planId);
    App.navTo(type);
  }

  function _updateViewToggle(){
    var btn=document.getElementById('calViewToggle');
    if(btn)btn.textContent=viewMode==='month'?'Week':'Month';
  }

  /* ==================== WEEK VIEW ==================== */
  function renderWeek(){
    var ws=new Date(weekStart);
    var we=new Date(ws);we.setDate(ws.getDate()+6);
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    document.getElementById('calTitle').textContent=months[ws.getMonth()]+' '+ws.getDate()+' \u2014 '+months[we.getMonth()]+' '+we.getDate()+', '+we.getFullYear();
    _updateViewToggle();

    var today=D.todayKey();
    var h='';
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(function(d){h+='<div class="cal-hdr-cell">'+d+'</div>'});

    for(var i=0;i<7;i++){
      var dd=new Date(ws);dd.setDate(ws.getDate()+i);
      var dk=D.todayKey(dd);
      var isToday=dk===today;var isSel=dk===selectedDate;
      var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
      var plans=PLAN.getPlans()[dk]||[];
      var totalStudy=0,totalWork=0;
      studySess.forEach(function(s){totalStudy+=s.dur});
      workSess.forEach(function(s){totalWork+=s.dur});
      var totalH=(totalStudy+totalWork)/3600;
      var heatBg=_heatColor(totalH);
      var heatStyle=heatBg?'background:'+heatBg+';':'';
      var cls='cal-cell week-cell'+(isToday?' today':'')+(isSel?' selected':'');

      h+='<div class="'+cls+'" style="'+heatStyle+'" onclick="CAL.selectDay(\''+dk+'\')">';
      h+='<span class="cal-day-num">'+dd.getDate()+'</span>';

      /* Mini session blocks */
      var allSess=[];
      studySess.forEach(function(s){allSess.push({type:'study',start:s.start,dur:s.dur,cat:s.cat})});
      workSess.forEach(function(s){allSess.push({type:'work',start:s.start,dur:s.dur})});
      allSess.sort(function(a,b){return new Date(a.start)-new Date(b.start)});

      if(allSess.length){
        h+='<div class="week-blocks">';
        allSess.slice(0,4).forEach(function(s){
          var col=s.type==='study'?'var(--acc)':'var(--cyn)';
          var st=new Date(s.start);
          h+='<div class="week-block" style="background:'+col+'" title="'+st.getHours()+':'+String(st.getMinutes()).padStart(2,'0')+' '+UI.fd(s.dur)+(s.cat?' '+esc(s.cat):'')+'"></div>';
        });
        if(allSess.length>4)h+='<div style="font-size:.42rem;color:var(--tf)">+'+(allSess.length-4)+'</div>';
        h+='</div>';
      }

      /* Plan count */
      if(plans.length){
        var allDoneW=plans.filter(function(p){return p.status==='completed'}).length===plans.length;
        var doneW=plans.filter(function(p){return p.status==='completed'}).length;
        var dotW=allDoneW?'<span class="cal-dot cal-dot-filled" style="display:inline-block;vertical-align:middle;margin-right:3px"></span>':'<span class="cal-dot cal-dot-hollow" style="display:inline-block;vertical-align:middle;margin-right:3px"></span>';
        h+='<div style="font-size:.46rem;color:var(--pur);font-weight:700;margin-top:1px">'+dotW+plans.length+'p';
        if(doneW>0&&!allDoneW)h+=' \u00B7 '+doneW+'\u2713';
        h+='</div>';
      }
      if(totalH>0)h+='<div class="cal-hrs">'+totalH.toFixed(1)+'h</div>';
      h+='</div>';
    }

    document.getElementById('calGrid').innerHTML=h;
    if(selectedDate)renderDayDetail(selectedDate);
  }

  /* ==================== ICS EXPORT ==================== */
  function exportICS(){
    var daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
    var events=[];

    for(var d=1;d<=daysInMonth;d++){
      var dk=viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var studySess=D.getSess('study',dk);
      var workSess=D.getSess('work',dk);
      studySess.forEach(function(s){events.push({type:'Study',cat:s.cat,note:s.note||'',start:s.start,end:s.end})});
      workSess.forEach(function(s){events.push({type:'Work',cat:s.cat,note:s.note||'',start:s.start,end:s.end})});
    }

    if(!events.length){UI.toast('No sessions to export this month');return}

    function _icsDate(dateStr){
      var dt=new Date(dateStr);
      return dt.getUTCFullYear()+
        String(dt.getUTCMonth()+1).padStart(2,'0')+
        String(dt.getUTCDate()).padStart(2,'0')+'T'+
        String(dt.getUTCHours()).padStart(2,'0')+
        String(dt.getUTCMinutes()).padStart(2,'0')+
        String(dt.getUTCSeconds()).padStart(2,'0')+'Z';
    }

    var cal='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//StudyTimer//EN\r\n';
    events.forEach(function(e,idx){
      cal+='BEGIN:VEVENT\r\n';
      cal+='UID:studytimer-'+viewYear+viewMonth+'-'+idx+'@local\r\n';
      cal+='DTSTART:'+_icsDate(e.start)+'\r\n';
      cal+='DTEND:'+_icsDate(e.end)+'\r\n';
      cal+='SUMMARY:'+e.type+': '+(e.cat||'General')+'\r\n';
      if(e.note)cal+='DESCRIPTION:'+e.note.replace(/\n/g,'\\n')+'\r\n';
      cal+='END:VEVENT\r\n';
    });
    cal+='END:VCALENDAR\r\n';

    var blob=new Blob([cal],{type:'text/calendar;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download='study-timer-'+viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('Exported '+events.length+' sessions to .ics');
  }

  /* ==================== SESSION EDIT / DELETE ==================== */

  /* Edit a session — opens PAST modal pre-filled with session data */
  function editSession(dk,type,idx){
    closeCIModal();
    var sessions=D.getSess(type,dk);
    var s=sessions[idx];
    if(!s){UI.toast('Session not found');return}
    PAST.openEdit(dk,type,idx,s);
  }

  /* Delete a session from any date */
  function deleteSession(dk,type,idx){
    if(!confirm('Delete this session?'))return;
    var d=D.getLocal();
    if(!d[type]||!d[type][dk]||!d[type][dk][idx]){UI.toast('Session not found');return}
    d[type][dk].splice(idx,1);
    if(!d[type][dk].length)delete d[type][dk];
    D.saveLocal(d);
    closeCIModal();
    renderDayDetail(dk);
    renderMonth();
    UI.renderAll();
    D.push();
    UI.toast('Session deleted');
  }

  return{
    init:init,prev:prev,next:next,render:render,selectDay:selectDay,
    addPlanForDay:addPlanForDay,addSessionForDay:addSessionForDay,
    addKnowledgeForDay:addKnowledgeForDay,startPlanFromCal:startPlanFromCal,
    toggleView:toggleView,exportICS:exportICS,
    onHourClick:onHourClick,quickAddPlan:quickAddPlan,updateQuickAddFields:updateQuickAddFields,
    showItemDetail:showItemDetail,openPlanDetail:openPlanDetail,
    closeCIModal:closeCIModal,setPlanStatus:setPlanStatus,
    editSession:editSession,deleteSession:deleteSession
  };
})();
