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

  function renderDayDetail(dk){
    var el=document.getElementById('calDayDetail');
    var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
    var plans=PLAN.getForDate(dk);
    var dayName=new Date(dk).toLocaleDateString([],{weekday:'long',month:'short',day:'numeric',year:'numeric'});

    var h='<div class="day-detail">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h+='<span style="font-size:.85rem;font-weight:700;color:var(--heading)">'+dayName+'</span>';
    h+='<div style="display:flex;gap:6px">';
    h+='<button class="b b-xs" onclick="CAL.addPlanForDay(\''+dk+'\')">+ Plan</button>';
    h+='<button class="b b-xs" onclick="CAL.addSessionForDay(\''+dk+'\')">+ Session</button>';
    h+='</div>';
    h+='</div>';

    // Plans section
    if(plans.length){
      var planDone=plans.filter(function(p){return p.status==='completed'}).length;
      h+='<h4 style="font-size:.7rem;font-weight:700;color:var(--pur);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">📋 Plans ('+planDone+'/'+plans.length+' done)</h4>';
      plans.forEach(function(p){
        var priIco={critical:'🔴',high:'🟠',medium:'🟡',low:'🟢'}[p.priority]||'🟡';
        h+='<div style="font-size:.72rem;padding:4px 0;border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:6px">';
        h+='<span>'+priIco+'</span>';
        h+='<span style="font-weight:600;flex:1">'+esc(p.subject)+': '+esc(p.topic)+'</span>';
        h+='<span class="plan-status '+p.status+'">'+p.status+'</span>';
        h+='</div>';
      });
    }

    // Sessions timeline
    var allSess=[];
    studySess.forEach(function(s){allSess.push(Object.assign({_type:'study'},s))});
    workSess.forEach(function(s){allSess.push(Object.assign({_type:'work'},s))});
    allSess.sort(function(a,b){return new Date(a.start)-new Date(b.start)});

    if(allSess.length){
      var totalStudy=0,totalWork=0;
      studySess.forEach(function(s){totalStudy+=s.dur});
      workSess.forEach(function(s){totalWork+=s.dur});

      h+='<h4 style="font-size:.7rem;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.1em;margin:10px 0 6px">⏱ Sessions ('+allSess.length+') · Study '+UI.fd(totalStudy)+' · Work '+UI.fd(totalWork)+'</h4>';
      h+='<div class="timeline">';
      allSess.forEach(function(s){
        var st=new Date(s.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        var en=new Date(s.end).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        h+='<div class="tl-item'+(s._type==='work'?' work-tl':'')+'">';
        h+='<span style="font-family:JetBrains Mono,monospace;font-size:.62rem;color:var(--td);font-weight:600">'+st+' → '+en+'</span> ';
        h+='<span style="font-size:.65rem;font-weight:700;padding:1px 6px;border-radius:3px;background:var(--s3);color:var(--t2)">'+esc(s.cat)+'</span> ';
        h+='<span style="font-weight:600;color:var(--heading)">'+(s.note?esc(s.note):'—')+'</span> ';
        h+='<span style="font-family:JetBrains Mono,monospace;font-size:.68rem;font-weight:700;color:var(--grn)">'+UI.fd(s.dur)+'</span>';
        h+='</div>';
      });
      h+='</div>';
    }

    if(!plans.length&&!allSess.length){
      h+='<div class="empty"><p>No plans or sessions</p></div>';
    }

    h+='</div>';
    el.innerHTML=h;
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

  return{init:init,prev:prev,next:next,render:render,selectDay:selectDay,addPlanForDay:addPlanForDay,addSessionForDay:addSessionForDay,toggleView:toggleView,exportICS:exportICS};
})();
