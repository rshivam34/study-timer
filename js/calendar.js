/* ========== CALENDAR MODULE ========== */
/* Part 2/7 — FIX #5: heatmap cell coloring, FIX #7: scroll to today, FIX #8: session count on cells */

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

  /* FIX #5: Calculate heatmap intensity color based on hours */
  function _heatColor(totalH){
    if(totalH<=0)return'';
    // 0-1h = very light, 1-3h = light, 3-5h = medium, 5-8h = strong, 8+ = very strong
    var intensity=Math.min(totalH/8,1);
    var alpha=0.08+intensity*0.32; // range 0.08 to 0.40
    return'rgba(52,211,153,'+alpha.toFixed(2)+')';
  }

  function render(){
    if(viewMode==='week')return renderWeek();
    renderMonth();
  }

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

    var todayCellIndex=-1;
    var cellCount=0;

    // Current month
    for(var d=1;d<=daysInMonth;d++){
      var dk=viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var isToday=dk===today;
      var isSel=dk===selectedDate;
      var cls='cal-cell'+(isToday?' today':'')+(isSel?' selected':'');

      // Get data for this day
      var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
      var plans=(PLAN.getPlans()[dk]||[]);
      var totalStudy=0,totalWork=0;
      studySess.forEach(function(s){totalStudy+=s.dur});
      workSess.forEach(function(s){totalWork+=s.dur});
      var totalH=(totalStudy+totalWork)/3600;
      var sessCount=studySess.length+workSess.length;

      /* FIX #5: heatmap cell coloring */
      var heatBg=_heatColor(totalH);
      var heatStyle=heatBg?'background:'+heatBg+';':'';

      if(isToday)todayCellIndex=cellCount;
      cellCount++;

      h+='<div class="'+cls+'" style="'+heatStyle+'" onclick="CAL.selectDay(\''+dk+'\')" data-dk="'+dk+'">';
      h+='<span class="cal-day-num">'+d+'</span>';

      // Dots — FIX #41: plan status colors (filled green = all done, hollow purple = pending)
      var dots='';
      if(plans.length){
        var allDone=plans.filter(function(p){return p.status==='completed'}).length===plans.length;
        dots+=allDone?'<span class="cal-dot cal-dot-filled"></span>':'<span class="cal-dot cal-dot-hollow"></span>';
      }
      if(totalStudy>0)dots+='<span class="cal-dot" style="background:var(--acc)"></span>';
      if(totalWork>0)dots+='<span class="cal-dot" style="background:var(--cyn)"></span>';
      if(dots)h+='<div class="cal-dots">'+dots+'</div>';

      /* FIX #8: session count + hours */
      if(totalH>0){
        h+='<div class="cal-hrs">'+totalH.toFixed(1)+'h</div>';
        if(sessCount>1)h+='<div class="cal-sess-count">'+sessCount+'s</div>';
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

    /* FIX #7: scroll to today on load */
    _scrollToToday();
  }

  /* FIX #7: Scroll to today's cell if it exists */
  function _scrollToToday(){
    setTimeout(function(){
      var todayCell=document.querySelector('#calGrid .cal-cell.today');
      if(todayCell){
        todayCell.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
      }
    },50);
  }

  function selectDay(dk){
    selectedDate=dk;render();
  }

  var _quickAddHour=null; // hour being quick-added

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
    var completedPlanH=0;
    plans.forEach(function(p){if(p.status==='completed')completedPlanH+=p.estHours});

    var awakeH=bedH-wakeH;
    var sleepH=24-awakeH;
    var usedH=totalSessH+plannedH;
    var freeH=Math.max(0,awakeH-usedH);
    var goalH=D.getGoalForDate(dk);

    /* Build hourly view */
    var h='<div class="hourly-view">';
    /* Header */
    h+='<div class="hv-header">';
    h+='<div><span class="hv-title">'+dayName+'</span></div>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="b b-xs" onclick="CAL.addPlanForDay(\''+dk+'\')">+ Plan</button>';
    h+='<button class="b b-xs" onclick="CAL.addSessionForDay(\''+dk+'\')">+ Session</button>';
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
    var goalPct=goalH>0?Math.min(100,Math.round(totalSessH/goalH*100)):0;
    h+='<div style="padding:6px 14px;border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:8px">';
    h+='<span style="font-size:.6rem;font-weight:700;color:var(--td)">GOAL</span>';
    h+='<div style="flex:1;height:6px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="width:'+goalPct+'%;height:100%;background:'+( goalPct>=100?'var(--grn)':'var(--acc)')+';border-radius:3px;transition:width .3s"></div></div>';
    h+='<span style="font-family:JetBrains Mono,monospace;font-size:.62rem;font-weight:700;color:'+(goalPct>=100?'var(--grn)':'var(--acc)')+'">'+totalSessH.toFixed(1)+'/'+goalH+'h ('+goalPct+'%)</span>';
    h+='</div>';

    /* Unscheduled plans (no start time) */
    var unscheduled=plans.filter(function(p){return !p.startTime});
    if(unscheduled.length){
      h+='<div style="padding:6px 14px;border-bottom:1px solid var(--brd)">';
      h+='<div style="font-size:.6rem;font-weight:700;color:var(--pur);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Unscheduled Plans ('+unscheduled.length+')</div>';
      unscheduled.forEach(function(p){
        var priIco={critical:'🔴',high:'🟠',medium:'🟡',low:'🟢'}[p.priority]||'🟡';
        h+='<div style="font-size:.7rem;padding:3px 0;display:flex;align-items:center;gap:6px">';
        h+='<span>'+priIco+'</span>';
        h+='<span style="font-weight:600;flex:1;color:var(--heading)">'+esc(p.subject)+': '+esc(p.topic)+'</span>';
        h+='<span style="font-family:JetBrains Mono,monospace;font-size:.6rem;color:var(--td)">'+p.estHours+'h</span>';
        h+='<span class="plan-status '+p.status+'">'+p.status+'</span>';
        h+='</div>';
      });
      h+='</div>';
    }

    /* Hourly grid */
    h+='<div class="hv-grid">';
    var startHour=Math.floor(wakeH);var endHour=Math.ceil(bedH);

    /* Build session and plan blocks data for positioning */
    var blocks=[];
    var allSess=[];
    studySess.forEach(function(s){allSess.push({type:'study',start:s.start,end:s.end,dur:s.dur,cat:s.cat,note:s.note||''})});
    workSess.forEach(function(s){allSess.push({type:'work',start:s.start,end:s.end,dur:s.dur,cat:s.cat,note:s.note||''})});
    allSess.forEach(function(s){
      var sd=new Date(s.start),ed=new Date(s.end);
      blocks.push({type:s.type,startH:sd.getHours()+sd.getMinutes()/60,endH:ed.getHours()+ed.getMinutes()/60,title:s.cat,sub:s.note,dur:s.dur});
    });

    /* Scheduled plans as blocks */
    plans.filter(function(p){return p.startTime&&p.endTime}).forEach(function(p){
      var sp=p.startTime.split(':'),ep=p.endTime.split(':');
      var sH=parseInt(sp[0])+parseInt(sp[1])/60,eH=parseInt(ep[0])+parseInt(ep[1])/60;
      blocks.push({type:'plan',startH:sH,endH:eH,title:p.subject+': '+p.topic,sub:p.estHours+'h · '+p.status,status:p.status,planId:p.id});
    });

    for(var hr=startHour;hr<endHour;hr++){
      var isPast=isToday&&hr<Math.floor(nowH);
      var timeLabel=String(hr).padStart(2,'0')+':00';
      h+='<div class="hv-row'+(isPast?' past-hour':'')+'" data-hour="'+hr+'" onclick="CAL.onHourClick(\''+dk+'\','+hr+')">';
      h+='<div class="hv-time">'+timeLabel+'</div>';
      h+='<div class="hv-slot" id="hvSlot-'+hr+'">';

      /* Render blocks that fall in this hour */
      blocks.forEach(function(b){
        if(b.startH>=hr&&b.startH<hr+1){
          var topPct=((b.startH-hr)*100);
          var heightH=Math.max(b.endH-b.startH,0.25);
          var heightPx=Math.max(heightH*48,20);
          h+='<div class="hv-block '+b.type+'" style="top:'+topPct+'%;height:'+heightPx+'px">';
          h+='<div class="hv-block-title">'+esc(b.title)+'</div>';
          h+='<div class="hv-block-sub">'+esc(b.sub||(b.dur?UI.fd(b.dur):''))+'</div>';
          h+='</div>';
        }
      });

      h+='<span class="hv-add-hint">+ tap to plan</span>';
      h+='</div></div>';
    }

    /* Now indicator line */
    if(isToday&&nowH>=wakeH&&nowH<=bedH){
      var nowOffset=(nowH-startHour)*48;
      h+='<div class="hv-now-line" style="top:'+nowOffset+'px"></div>';
      h+='<div class="hv-now-dot" style="top:'+nowOffset+'px"></div>';
    }

    h+='</div>'; // hv-grid

    /* Quick add form (hidden by default, shown on hour click) */
    h+='<div id="hvQuickAdd" class="hidden" style="padding:8px 14px"></div>';

    h+='</div>'; // hourly-view
    el.innerHTML=h;

    /* Scroll to current hour if today */
    if(isToday){
      setTimeout(function(){
        var grid=el.querySelector('.hv-grid');
        if(grid){var scrollTo=Math.max(0,(nowH-startHour-2)*48);grid.scrollTop=scrollTo}
      },50);
    }
  }

  /* Handle hour slot click — show quick add form */
  function onHourClick(dk,hour){
    _quickAddHour=hour;
    var el=document.getElementById('hvQuickAdd');
    if(!el)return;
    var cfg=D.getCfg();var cats=cfg.studySubjects;
    var startT=String(hour).padStart(2,'0')+':00';
    var endT=String(hour+1).padStart(2,'0')+':00';
    var h='<div class="hv-quick-add">';
    h+='<div style="font-size:.72rem;font-weight:700;color:var(--heading);margin-bottom:6px">Plan for '+startT+' — '+endT+'</div>';
    h+='<div class="df"><span class="df-lbl" style="font-size:.65rem">Subject</span><select class="cat-sel" id="hvSubj" style="flex:1;font-size:.72rem">';
    cats.forEach(function(s){h+='<option>'+esc(s)+'</option>'});
    h+='</select></div>';
    h+='<div class="df" style="margin-top:4px"><span class="df-lbl" style="font-size:.65rem">Topic</span>';
    h+='<div class="ac-wrap" style="flex:1;position:relative"><input type="text" class="inp" id="hvTopic" placeholder="What to study..." style="font-size:.72rem;padding:6px 10px" autocomplete="off"></div></div>';
    h+='<div class="df" style="margin-top:4px">';
    h+='<span class="df-lbl" style="font-size:.65rem">Start</span><input type="time" class="inp" id="hvStart" value="'+startT+'" style="width:80px;font-size:.72rem;padding:6px 8px">';
    h+='<span class="df-lbl" style="font-size:.65rem">End</span><input type="time" class="inp" id="hvEnd" value="'+endT+'" style="width:80px;font-size:.72rem;padding:6px 8px">';
    h+='</div>';
    h+='<div style="display:flex;gap:6px;margin-top:6px;justify-content:flex-end">';
    h+='<button class="b b-xs" onclick="document.getElementById(\'hvQuickAdd\').classList.add(\'hidden\')">Cancel</button>';
    h+='<button class="b b-xs b-acc" onclick="CAL.quickAddPlan(\''+dk+'\')">Add Plan</button>';
    h+='</div></div>';
    el.innerHTML=h;
    el.classList.remove('hidden');
    /* Attach autocomplete */
    var topicEl=document.getElementById('hvTopic');
    if(topicEl)UI.autocomplete(topicEl,function(){return document.getElementById('hvSubj').value});
    topicEl.focus();
  }

  /* Quick add plan from hourly view */
  function quickAddPlan(dk){
    var subj=document.getElementById('hvSubj').value;
    var topic=document.getElementById('hvTopic').value.trim();
    var startTime=document.getElementById('hvStart').value;
    var endTime=document.getElementById('hvEnd').value;
    if(!subj||!topic){UI.toast('Fill subject & topic');return}
    /* Calculate hours from start/end */
    var sp=startTime.split(':'),ep=endTime.split(':');
    var sh=parseInt(sp[0])*60+parseInt(sp[1]),eh=parseInt(ep[0])*60+parseInt(ep[1]);
    var hours=eh>sh?Math.round((eh-sh)/60*10)/10:1;

    var plans=PLAN.getPlans();
    if(!plans[dk])plans[dk]=[];
    plans[dk].push({
      id:'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
      subject:subj,type:'topic',topic:topic,estHours:hours,priority:'medium',
      lecNum:null,status:'planned',notes:'',actualSecs:0,
      startTime:startTime,endTime:endTime,
      createdAt:new Date().toISOString()
    });
    PLAN.setPlans(plans);
    document.getElementById('hvQuickAdd').classList.add('hidden');
    renderDayDetail(dk);
    PLAN.render();
    D.push();
    UI.toast('Plan added ✓');
  }

  function addPlanForDay(dk){
    document.getElementById('planDate').value=dk;
    document.getElementById('planViewDate').value=dk;
    App.navTo('plan');
  }

  /* FIX #42: Quick-add session from calendar day detail */
  function addSessionForDay(dk){
    PAST.open('study');
    document.getElementById('pastDate').value=dk;
  }

  function _updateViewToggle(){
    var btn=document.getElementById('calViewToggle');
    if(btn)btn.textContent=viewMode==='month'?'Week':'Month';
  }

  /* Week View — 7-day strip with session blocks */
  function renderWeek(){
    var ws=new Date(weekStart);
    var we=new Date(ws);we.setDate(ws.getDate()+6);
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    document.getElementById('calTitle').textContent=months[ws.getMonth()]+' '+ws.getDate()+' — '+months[we.getMonth()]+' '+we.getDate()+', '+we.getFullYear();
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
      var sessCount=studySess.length+workSess.length;
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
        if(allSess.length>4)h+='<div style="font-size:.4rem;color:var(--tf)">+'+( allSess.length-4)+'</div>';
        h+='</div>';
      }

      /* FIX #41: plan status colors in week view */
      if(plans.length){
        var allDoneW=plans.filter(function(p){return p.status==='completed'}).length===plans.length;
        var dotW=allDoneW?'<span class="cal-dot cal-dot-filled" style="display:inline-block;vertical-align:middle;margin-right:3px"></span>':'<span class="cal-dot cal-dot-hollow" style="display:inline-block;vertical-align:middle;margin-right:3px"></span>';
        h+='<div style="font-size:.42rem;color:var(--pur);font-weight:600">'+dotW+plans.length+' plan'+(plans.length>1?'s':'')+'</div>';
      }
      if(totalH>0)h+='<div class="cal-hrs">'+totalH.toFixed(1)+'h</div>';
      h+='</div>';
    }

    document.getElementById('calGrid').innerHTML=h;
    if(selectedDate)renderDayDetail(selectedDate);
  }

  /* FIX #43: Export current month's sessions as .ics calendar file */
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

    /* Convert Date to ICS UTC format: YYYYMMDDTHHmmssZ */
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

    /* Trigger download */
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

  return{init:init,prev:prev,next:next,render:render,selectDay:selectDay,addPlanForDay:addPlanForDay,addSessionForDay:addSessionForDay,toggleView:toggleView,exportICS:exportICS,onHourClick:onHourClick,quickAddPlan:quickAddPlan};
})();
