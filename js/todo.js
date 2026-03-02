/* ========== TO-DO MODULE (UNLIMITED NESTING) ========== */
/* Part 3/7 — FIX #4: completion timestamps, FIX #10: search bar */

var TODO=(function(){
  function getTodos(){return D.getLocal().todos||{study:[],work:[]}}
  function setTodos(t){var d=D.getLocal();d.todos=t;D.saveLocal(d)}

  function findItem(items,id){
    for(var i=0;i<items.length;i++){
      if(items[i].id===id)return items[i];
      if(items[i].children){var f=findItem(items[i].children,id);if(f)return f}
    }return null;
  }
  function findParentAndIndex(items,id,parent){
    for(var i=0;i<items.length;i++){
      if(items[i].id===id)return{parent:parent,index:i,arr:items};
      if(items[i].children){var f=findParentAndIndex(items[i].children,id,items[i]);if(f)return f}
    }return null;
  }

  /* Validation helper: find any child with due date after given dueDate */
  function _findChildAfterDue(children,dueDate){
    for(var i=0;i<children.length;i++){
      if(children[i].due&&children[i].due>dueDate)return children[i];
      if(children[i].children){var f=_findChildAfterDue(children[i].children,dueDate);if(f)return f}
    }
    return null;
  }

  /* Validation helper: sum estMins of children, optionally excluding one id */
  function _sumChildrenEst(children,excludeId){
    var total=0;
    children.forEach(function(c){if(c.id!==excludeId)total+=(c.estMins||0)});
    return total;
  }

  /* DRY helper: re-render + refresh time budget + day overview after any mutation */
  function _afterMutation(){
    render();renderInline();
    try{App.renderTimeBudget()}catch(e){}
    try{App.renderDayOverview()}catch(e){}
  }

  function quickAdd(group){
    document.getElementById('todoInpTitle').value='';
    document.getElementById('todoInpType').value='todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value='medium';
    document.getElementById('todoInpDue').value='';
    document.getElementById('todoInpContent').value='';
    document.getElementById('todoInpParent').value='';
    document.getElementById('todoInpEditId').value='';
    var estEl=document.getElementById('todoInpEstMins');if(estEl)estEl.value='';
    document.getElementById('todoModalTitle').textContent='Add To-Do';
    document.getElementById('todoExtraFields').classList.remove('hidden');
    document.getElementById('todoNoteArea').classList.add('hidden');
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function openAddModal(){quickAdd(document.getElementById('todoTypeFilter').value)}

  function addChild(parentId,group){
    document.getElementById('todoInpTitle').value='';
    document.getElementById('todoInpType').value='todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value='medium';
    document.getElementById('todoInpDue').value='';
    document.getElementById('todoInpContent').value='';
    document.getElementById('todoInpParent').value=parentId;
    document.getElementById('todoInpEditId').value='';
    var estEl=document.getElementById('todoInpEstMins');if(estEl)estEl.value='';
    document.getElementById('todoModalTitle').textContent='Add Sub-Item';
    document.getElementById('todoExtraFields').classList.remove('hidden');
    document.getElementById('todoNoteArea').classList.add('hidden');
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function editItem(id,group){
    var todos=getTodos();
    var item=findItem(todos[group]||[],id);
    if(!item)return;
    document.getElementById('todoInpTitle').value=item.title;
    document.getElementById('todoInpType').value=item.type||'todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value=item.priority||'medium';
    document.getElementById('todoInpDue').value=item.due||'';
    document.getElementById('todoInpContent').value=item.content||'';
    if(document.getElementById('todoInpRepeat'))document.getElementById('todoInpRepeat').value=item.repeat||'';
    var estEl=document.getElementById('todoInpEstMins');if(estEl)estEl.value=item.estMins||'';
    document.getElementById('todoInpParent').value='';
    document.getElementById('todoInpEditId').value=id;
    document.getElementById('todoModalTitle').textContent='Edit Item';
    onTypeChange();
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function onTypeChange(){
    var type=document.getElementById('todoInpType').value;
    document.getElementById('todoExtraFields').classList.toggle('hidden',type==='note');
    document.getElementById('todoNoteArea').classList.toggle('hidden',type!=='note');
  }

  function closeModal(){document.getElementById('todoModal').classList.add('hidden')}

  function saveFromModal(){
    var title=document.getElementById('todoInpTitle').value.trim();
    if(!title){UI.toast('Enter title');return}
    var type=document.getElementById('todoInpType').value;
    var group=document.getElementById('todoInpGroup').value;
    var priority=document.getElementById('todoInpPriority').value;
    var due=document.getElementById('todoInpDue').value;
    var content=document.getElementById('todoInpContent').value.trim();
    var parentId=document.getElementById('todoInpParent').value;
    var editId=document.getElementById('todoInpEditId').value;

    var todos=getTodos();
    if(!todos[group])todos[group]=[];
    var repeat=(document.getElementById('todoInpRepeat')||{}).value||'';
    var estMins=parseInt((document.getElementById('todoInpEstMins')||{}).value)||0;

    /* Validate: estMins required when due date is set (for todos, not notes) */
    if(type==='todo'&&due&&!estMins){
      UI.toast('Set estimated time when due date is selected');
      var estEl=document.getElementById('todoInpEstMins');
      if(estEl)estEl.focus();
      return;
    }

    /* ── Sub-task date validation ── */
    if(parentId&&!editId){
      /* Adding a sub-task: check due date doesn't exceed parent */
      var parentItem=findItem(todos[group],parentId);
      if(parentItem&&parentItem.due&&due&&due>parentItem.due){
        UI.toast('Sub-task due date cannot be after parent ('+UI.fdate(parentItem.due)+')');return;
      }
      /* Adding sub-task: check estMins doesn't exceed parent budget */
      if(parentItem&&parentItem.estMins&&estMins){
        var siblingSum=_sumChildrenEst(parentItem.children||[],'');
        var avail=parentItem.estMins-siblingSum;
        if(estMins>avail){UI.toast('Max available: '+avail+'min (parent: '+parentItem.estMins+'m)');return}
      }
    }

    if(editId){
      var item=findItem(todos[group],editId);
      if(item){
        /* Editing parent: check new due isn't before any child's due */
        if(item.children&&item.children.length&&due){
          var childAfter=_findChildAfterDue(item.children,due);
          if(childAfter){UI.toast('Child "'+childAfter.title+'" has a later due date');return}
        }
        /* Editing parent: check new estMins isn't below children total */
        if(item.children&&item.children.length&&estMins){
          var childrenTotal=_sumChildrenEst(item.children,'');
          if(estMins<childrenTotal){UI.toast('Cannot reduce below children total ('+childrenTotal+'min)');return}
        }
        /* Editing a child: check constraints against actual parent */
        var pInfo=findParentAndIndex(todos[group],editId,null);
        if(pInfo&&pInfo.parent){
          /* Date constraint: child due can't exceed parent due */
          if(pInfo.parent.due&&due&&due>pInfo.parent.due){
            UI.toast('Due date cannot be after parent ('+UI.fdate(pInfo.parent.due)+')');return;
          }
          /* EstMins constraint: sibling sum + this can't exceed parent estMins */
          if(pInfo.parent.estMins&&estMins){
            var sibSum=_sumChildrenEst(pInfo.parent.children||[],editId);
            var maxAvail=pInfo.parent.estMins-sibSum;
            if(estMins>maxAvail){UI.toast('Max available: '+maxAvail+'min (parent: '+pInfo.parent.estMins+'m)');return}
          }
        }
        item.title=title;item.type=type;item.priority=priority;item.due=due;item.content=content;
        item.repeat=repeat;item.estMins=estMins||undefined;
      }
    } else {
      var newItem={
        id:'td_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        title:title,type:type,priority:priority,due:due,content:content,
        status:'pending',children:[],createdAt:D.todayKey(),repeat:repeat,
        estMins:estMins||undefined
      };
      if(parentId){
        var parent=findItem(todos[group],parentId);
        if(parent){if(!parent.children)parent.children=[];parent.children.push(newItem)}
      } else {
        todos[group].push(newItem);
      }
    }

    setTodos(todos);closeModal();_afterMutation();D.push();UI.toast('Saved ✓');
  }

  /* FIX #4: Completion timestamps + Recurring To-Do re-creation */
  function toggleDone(id,group){
    var todos=getTodos();
    var item=findItem(todos[group]||[],id);
    if(item){
      if(item.status==='done'){
        item.status='pending';
        delete item.completedAt;
      } else {
        item.status='done';
        item.completedAt=new Date().toISOString();
        /* Recurring: create next occurrence */
        if(item.repeat&&item.due){
          var nextDue=_nextRepeatDate(item.due,item.repeat);
          var clone={
            id:'td_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
            title:item.title,type:item.type,priority:item.priority,
            due:nextDue,content:item.content||'',status:'pending',
            children:[],createdAt:D.todayKey(),repeat:item.repeat,estMins:item.estMins||undefined
          };
          if(!todos[group])todos[group]=[];
          todos[group].push(clone);
        }
      }
    }
    setTodos(todos);_afterMutation();D.push();
  }

  function _nextRepeatDate(due,repeat){
    var d=new Date(due);
    if(repeat==='daily')d.setDate(d.getDate()+1);
    else if(repeat==='weekly')d.setDate(d.getDate()+7);
    else if(repeat==='monthly')d.setMonth(d.getMonth()+1);
    return D.todayKey(d);
  }

  function deleteItem(id,group){
    if(!confirm('Delete this item and all children?'))return;
    var todos=getTodos();
    var info=findParentAndIndex(todos[group]||[],id,null);
    if(info)info.arr.splice(info.index,1);
    setTodos(todos);_afterMutation();D.push();UI.toast('Deleted');
  }

  function sortItems(items,mode){
    var priOrder={critical:0,high:1,medium:2,low:3};
    var sorted=items.slice();
    if(mode==='priority'){
      sorted.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});
    } else if(mode==='date'){
      sorted.sort(function(a,b){return(a.due||'9999')>(b.due||'9999')?1:-1});
    } else {
      var today=D.todayKey();
      sorted.sort(function(a,b){
        var aOD=a.due&&a.due<today?0:a.due===today?1:2;
        var bOD=b.due&&b.due<today?0:b.due===today?1:2;
        if(aOD!==bOD)return aOD-bOD;
        return(priOrder[a.priority]||2)-(priOrder[b.priority]||2);
      });
    }
    return sorted;
  }

  /* FIX #10: Search helper — matches item or any descendant */
  function _matchesSearch(item,query){
    if(!query)return true;
    var q=query.toLowerCase();
    if(item.title.toLowerCase().indexOf(q)!==-1)return true;
    if(item.content&&item.content.toLowerCase().indexOf(q)!==-1)return true;
    if(item.children){
      for(var i=0;i<item.children.length;i++){
        if(_matchesSearch(item.children[i],q))return true;
      }
    }
    return false;
  }

  /* Overdue counter — recursive */
  function _countOverdue(items){
    var today=D.todayKey();var count=0;
    items.forEach(function(i){
      if(i.status!=='done'&&i.due&&i.due<today)count++;
      if(i.children)count+=_countOverdue(i.children);
    });
    return count;
  }
  function getOverdueCount(){
    var todos=getTodos();
    return _countOverdue(todos.study||[])+_countOverdue(todos.work||[]);
  }

  /* Drag-to-Reorder (#44) */
  var _dragId=null;

  function _initDrag(){
    var el=document.getElementById('todoFullList');
    /* HTML5 Drag API for desktop */
    el.addEventListener('dragstart',function(e){
      var card=e.target.closest('.todo-item');
      if(!card)return;
      _dragId=card.getAttribute('data-todo-id');
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
    });
    el.addEventListener('dragover',function(e){
      e.preventDefault();
      var card=e.target.closest('.todo-item');
      if(card&&!card.classList.contains('dragging'))card.classList.add('drag-over');
    });
    el.addEventListener('dragleave',function(e){
      var card=e.target.closest('.todo-item');
      if(card)card.classList.remove('drag-over');
    });
    el.addEventListener('drop',function(e){
      e.preventDefault();
      var target=e.target.closest('.todo-item');
      if(!target||!_dragId)return;
      var targetId=target.getAttribute('data-todo-id');
      if(targetId===_dragId){_dragId=null;return}
      var group=document.getElementById('todoTypeFilter').value;
      _reorder(group,_dragId,targetId);
      _dragId=null;
    });
    el.addEventListener('dragend',function(){
      _dragId=null;
      el.querySelectorAll('.todo-item').forEach(function(c){c.classList.remove('dragging','drag-over')});
    });

    /* Touch-based drag for mobile */
    var _touchDragId=null,_ghost=null,_startY=0,_placeholder=null,_origItem=null;

    el.addEventListener('touchstart',function(e){
      var handle=e.target.closest('.todo-drag-handle');
      if(!handle)return;
      var card=handle.closest('.todo-item');
      if(!card)return;
      e.preventDefault();
      _touchDragId=card.getAttribute('data-todo-id');
      _origItem=card;
      _startY=e.touches[0].clientY;

      /* Create floating ghost */
      _ghost=card.cloneNode(true);
      _ghost.classList.add('todo-drag-ghost');
      _ghost.style.width=card.offsetWidth+'px';
      document.body.appendChild(_ghost);
      _ghost.style.top=e.touches[0].clientY-20+'px';
      _ghost.style.left=card.getBoundingClientRect().left+'px';
      card.classList.add('dragging');
      try{navigator.vibrate(30)}catch(err){}
    },{passive:false});

    el.addEventListener('touchmove',function(e){
      if(!_touchDragId||!_ghost)return;
      e.preventDefault();
      var ty=e.touches[0].clientY;
      _ghost.style.top=ty-20+'px';

      /* Find item under touch point */
      _ghost.style.display='none';
      var elUnder=document.elementFromPoint(e.touches[0].clientX,ty);
      _ghost.style.display='';
      var targetCard=elUnder?elUnder.closest('.todo-item'):null;

      /* Remove old placeholder */
      if(_placeholder){_placeholder.remove();_placeholder=null}

      if(targetCard&&targetCard!==_origItem&&targetCard.getAttribute('data-todo-id')!==_touchDragId){
        _placeholder=document.createElement('div');
        _placeholder.className='drag-placeholder';
        var rect=targetCard.getBoundingClientRect();
        if(ty<rect.top+rect.height/2){
          targetCard.parentNode.insertBefore(_placeholder,targetCard);
        } else {
          targetCard.parentNode.insertBefore(_placeholder,targetCard.nextSibling);
        }
      }
    },{passive:false});

    el.addEventListener('touchend',function(e){
      if(!_touchDragId)return;
      /* Find target from placeholder position */
      if(_ghost){_ghost.remove();_ghost=null}
      if(_origItem)_origItem.classList.remove('dragging');

      /* Find nearest item to the placeholder */
      if(_placeholder){
        var nextEl=_placeholder.nextElementSibling;
        var prevEl=_placeholder.previousElementSibling;
        _placeholder.remove();_placeholder=null;
        var targetId=null;
        if(nextEl&&nextEl.classList.contains('todo-item'))targetId=nextEl.getAttribute('data-todo-id');
        else if(prevEl&&prevEl.classList.contains('todo-item'))targetId=prevEl.getAttribute('data-todo-id');
        if(targetId&&targetId!==_touchDragId){
          var group=document.getElementById('todoTypeFilter').value;
          _reorder(group,_touchDragId,targetId);
        }
      }
      _touchDragId=null;_origItem=null;
    },{passive:true});

    el.addEventListener('touchcancel',function(){
      if(_ghost){_ghost.remove();_ghost=null}
      if(_placeholder){_placeholder.remove();_placeholder=null}
      if(_origItem)_origItem.classList.remove('dragging');
      _touchDragId=null;_origItem=null;
    },{passive:true});
  }

  function _reorder(group,fromId,toId){
    var todos=getTodos();
    if(!todos[group])return;
    var fromInfo=findParentAndIndex(todos[group],fromId,null);
    var toInfo=findParentAndIndex(todos[group],toId,null);
    if(!fromInfo||!toInfo)return;
    /* Only reorder within the same parent level */
    if(fromInfo.parent!==toInfo.parent)return;
    var item=fromInfo.arr.splice(fromInfo.index,1)[0];
    /* Recalculate toIndex after removal (index may have shifted) */
    var toIdx=toInfo.arr.indexOf(toInfo.arr.filter(function(i){return i.id===toId})[0]);
    if(toIdx<0)toIdx=toInfo.arr.length;
    toInfo.arr.splice(toIdx,0,item);
    setTodos(todos);_afterMutation();D.push();
  }

  /* Bulk Actions (#47) */
  var _selected={};
  var _bulkMode=false;

  function _collectIds(items,out){
    items.forEach(function(i){
      out.push(i.id);
      if(i.children)_collectIds(i.children,out);
    });
  }

  function toggleSelect(id){
    if(_selected[id])delete _selected[id];
    else _selected[id]=true;
    _updateBulkBar();
  }

  function toggleSelectAll(){
    var group=document.getElementById('todoTypeFilter').value;
    var todos=getTodos();
    var allIds=[];
    _collectIds(todos[group]||[],allIds);
    /* If all are selected, deselect all; otherwise select all */
    var allSelected=allIds.length>0&&allIds.every(function(id){return _selected[id]});
    if(allSelected){
      _selected={};
    } else {
      allIds.forEach(function(id){_selected[id]=true});
    }
    _updateBulkBar();
    render();
  }

  function markSelectedDone(){
    var ids=Object.keys(_selected);
    if(!ids.length)return;
    var group=document.getElementById('todoTypeFilter').value;
    var todos=getTodos();
    ids.forEach(function(id){
      var item=findItem(todos[group]||[],id);
      if(item&&item.status!=='done'){
        item.status='done';
        item.completedAt=new Date().toISOString();
      }
    });
    setTodos(todos);_selected={};_bulkMode=false;_updateBulkBar();_afterMutation();D.push();
    UI.toast(ids.length+' items marked done');
  }

  function removeSelected(){
    var ids=Object.keys(_selected);
    if(!ids.length)return;
    if(!confirm('Delete '+ids.length+' selected items and all their children?'))return;
    var group=document.getElementById('todoTypeFilter').value;
    var todos=getTodos();
    ids.forEach(function(id){
      var info=findParentAndIndex(todos[group]||[],id,null);
      if(info)info.arr.splice(info.index,1);
    });
    setTodos(todos);_selected={};_bulkMode=false;_updateBulkBar();_afterMutation();D.push();
    UI.toast(ids.length+' items deleted');
  }

  function _updateBulkBar(){
    var count=Object.keys(_selected).length;
    var bar=document.getElementById('todoBulkActions');
    var countEl=document.getElementById('todoBulkCount');
    var list=document.getElementById('todoFullList');
    if(bar){
      if(count>0){bar.classList.remove('hidden')}
      else{bar.classList.add('hidden')}
    }
    if(countEl){
      countEl.textContent=count+' selected';
    }
    /* Sync bulk mode with selection state */
    if(count>0){
      _bulkMode=true;
      if(list)list.classList.add('todo-bulk-active');
    } else {
      _bulkMode=false;
      if(list)list.classList.remove('todo-bulk-active');
    }
  }

  function renderItem(item,group,depth,parentDue){
    var isDone=item.status==='done';
    var isNote=item.type==='note';
    var hasChildren=item.children&&item.children.length>0;
    var priCls=item.priority||'medium';
    /* Sub-tasks show on parent's date — use parent due if this is a child (depth>0) */
    var effectiveDue=depth>0?(parentDue||item.due):item.due;

    var h='<div class="todo-item todo-pri-'+priCls+'" draggable="true" data-todo-id="'+item.id+'" style="position:relative">';
    /* Swipe action icons — hidden by default, shown during swipe */
    h+='<span class="swipe-icon swipe-icon-left">✓</span>';
    h+='<span class="swipe-icon swipe-icon-right">🗑</span>';
    h+='<div class="todo-header">';

    /* Row 1: expand + select checkbox + priority circle + title */
    h+='<div class="todo-row1">';
    if(hasChildren){
      h+='<button class="todo-expand-btn open" onclick="event.stopPropagation();this.classList.toggle(\'open\');this.closest(\'.todo-item\').querySelector(\'.todo-children\').classList.toggle(\'hidden\')" title="Collapse/Expand">‹</button>';
    } else {
      h+='<span class="todo-expand-spacer"></span>';
    }
    if(_bulkMode){h+='<input type="checkbox" class="todo-select-cb" '+(_selected[item.id]?'checked':'')+' onclick="event.stopPropagation();TODO.toggleSelect(\''+item.id+'\')" title="Select for bulk action">';}
    if(!isNote){
      h+='<div class="todo-cb'+(isDone?' done':' p-'+priCls)+'" onclick="event.stopPropagation();TODO.toggleDone(\''+item.id+'\',\''+group+'\')">'+(isDone?'✓':'')+'</div>';
    } else {
      h+='<span class="todo-note-icon">📝</span>';
    }
    h+='<span class="todo-title'+(isDone?' completed':'')+'">'+esc(item.title)+'</span>';
    h+='</div>';

    /* Row 2: metadata + actions */
    h+='<div class="todo-row2">';
    if(!isNote)h+='<span class="todo-badge '+priCls+'">'+priCls+'</span>';
    if(effectiveDue)h+='<span class="todo-due'+(item.status!=='done'&&effectiveDue<D.todayKey()?' overdue':'')+'">'+UI.fdate(effectiveDue)+'</span>';
    if(item.estMins)h+='<span class="todo-est-badge">~'+item.estMins+'m</span>';
    if(item.repeat)h+='<span class="todo-repeat">🔄 '+item.repeat+'</span>';
    if(isDone&&item.completedAt){
      var cAt=new Date(item.completedAt);
      h+='<span class="todo-completed-at">✓ '+UI.fdate(D.todayKey(cAt))+'</span>';
    }
    h+='<div class="todo-actions">';
    h+='<span class="todo-drag-handle" title="Drag to reorder">⠿</span>';
    h+='<button class="todo-act-btn" onclick="event.stopPropagation();TODO.addChild(\''+item.id+'\',\''+group+'\')" title="Add sub-task">+</button>';
    h+='<button class="todo-act-btn" onclick="event.stopPropagation();TODO.editItem(\''+item.id+'\',\''+group+'\')" title="Edit">✎</button>';
    h+='<button class="todo-act-btn todo-act-del" onclick="event.stopPropagation();TODO.deleteItem(\''+item.id+'\',\''+group+'\')" title="Delete">✕</button>';
    h+='</div>';
    h+='</div>';

    h+='</div>';

    if(isNote&&item.content){
      h+='<div class="todo-note-body">'+esc(item.content)+'</div>';
    }

    if(hasChildren){
      h+='<div class="todo-children">';
      /* Pass this item's due date down so children show on parent's date */
      var childDue=item.due||parentDue;
      item.children.forEach(function(child){h+=renderItem(child,group,depth+1,childDue)});
      h+='</div>';
    }

    h+='</div>';
    return h;
  }

  /* Long-press to enter select mode */
  var _longPressTimer=null;

  /* Swipe Gestures (#19) — swipe right = done, swipe left = delete */
  function _initSwipe(){
    var todoList=document.getElementById('todoFullList');
    if(!todoList)return;
    var startX=0,startY=0,swiping=false,swipeEl=null,threshold=80;

    todoList.addEventListener('touchstart',function(e){
      var item=e.target.closest('.todo-item');
      if(!item)return;
      /* Don't swipe if touching a button, checkbox, drag handle, or input */
      var tag=e.target.tagName;
      if(tag==='BUTTON'||tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
      if(e.target.closest('.todo-actions'))return;
      var touch=e.touches[0];
      startX=touch.clientX;
      startY=touch.clientY;
      swiping=false;
      swipeEl=item;

      /* Long-press: 500ms to enter select mode */
      _longPressTimer=setTimeout(function(){
        _longPressTimer=null;
        var id=item.getAttribute('data-todo-id');
        if(id){
          /* Enter select mode and check this item */
          var list=document.getElementById('todoFullList');
          if(!_bulkMode){_bulkMode=true;list.classList.add('todo-bulk-active');var bar=document.getElementById('todoBulkActions');if(bar)bar.classList.remove('hidden')}
          if(!_selected[id]){_selected[id]=true;_updateBulkBar();render()}
          try{navigator.vibrate(30)}catch(err){}
        }
        /* Prevent swipe from firing */
        swipeEl=null;swiping=false;
      },500);
    },{passive:true});

    todoList.addEventListener('touchmove',function(e){
      if(!swipeEl)return;
      var touch=e.touches[0];
      var dx=touch.clientX-startX;
      var dy=touch.clientY-startY;
      /* Cancel long-press if finger moves >10px */
      if(_longPressTimer&&(Math.abs(dx)>10||Math.abs(dy)>10)){clearTimeout(_longPressTimer);_longPressTimer=null}
      /* Only start swiping if horizontal movement dominates */
      if(!swiping&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.5){
        swiping=true;
      }
      if(!swiping)return;
      e.preventDefault();
      /* Clamp translation */
      var tx=Math.max(-120,Math.min(120,dx));
      swipeEl.style.transform='translateX('+tx+'px)';
      swipeEl.style.transition='none';
      /* Visual feedback + swipe icons */
      var iconL=swipeEl.querySelector('.swipe-icon-left');
      var iconR=swipeEl.querySelector('.swipe-icon-right');
      if(dx>30){
        swipeEl.style.background='rgba(52,211,153,0.15)';
        if(iconL)iconL.style.opacity=Math.min(1,(dx-30)/50);
        if(iconR)iconR.style.opacity='0';
      }else if(dx<-30){
        swipeEl.style.background='rgba(248,113,113,0.15)';
        if(iconR)iconR.style.opacity=Math.min(1,(Math.abs(dx)-30)/50);
        if(iconL)iconL.style.opacity='0';
      }else{
        swipeEl.style.background='';
        if(iconL)iconL.style.opacity='0';
        if(iconR)iconR.style.opacity='0';
      }
    },{passive:false});

    todoList.addEventListener('touchend',function(e){
      if(_longPressTimer){clearTimeout(_longPressTimer);_longPressTimer=null}
      if(!swipeEl){return}
      var touch=e.changedTouches[0];
      var dx=touch.clientX-startX;
      var id=swipeEl.getAttribute('data-todo-id');
      var group=document.getElementById('todoTypeFilter').value;

      /* Reset visual */
      swipeEl.style.transition='transform 0.2s ease, background 0.2s ease';
      swipeEl.style.transform='';
      swipeEl.style.background='';

      if(swiping&&id){
        if(dx>threshold){
          /* Swipe right = mark done */
          toggleDone(id,group);
        }else if(dx<-threshold){
          /* Swipe left = delete */
          deleteItem(id,group);
        }
      }
      swipeEl=null;
      swiping=false;
    },{passive:true});

    todoList.addEventListener('touchcancel',function(){
      if(_longPressTimer){clearTimeout(_longPressTimer);_longPressTimer=null}
      if(swipeEl){
        swipeEl.style.transition='transform 0.2s ease, background 0.2s ease';
        swipeEl.style.transform='';
        swipeEl.style.background='';
      }
      swipeEl=null;
      swiping=false;
    },{passive:true});
  }

  /* Progress Bar (#48) */
  function _countAll(items){
    var c=0;
    items.forEach(function(i){
      c++;
      if(i.children)c+=_countAll(i.children);
    });
    return c;
  }

  function _countDone(items){
    var c=0;
    items.forEach(function(i){
      if(i.status==='done')c++;
      if(i.children)c+=_countDone(i.children);
    });
    return c;
  }

  function _renderProgress(groupItems){
    var bar=document.getElementById('todoProgressBar');
    if(!bar)return;
    var total=_countAll(groupItems);
    var done=_countDone(groupItems);
    var pct=total>0?Math.round((done/total)*100):0;
    /* Gradient color based on progress level */
    var grad=pct>=70?'linear-gradient(90deg,var(--grn),#34d399)':pct>=40?'linear-gradient(90deg,var(--acc),var(--yel))':'linear-gradient(90deg,var(--yel),var(--acc))';
    var glow=pct>=70?'0 0 8px rgba(52,211,153,.4)':pct>=40?'0 0 8px rgba(255,107,53,.3)':'0 0 8px rgba(250,204,21,.3)';
    bar.innerHTML='<div style="display:flex;align-items:center;gap:8px;font-size:.72rem;color:var(--t2);font-weight:600">'
      +'<div style="flex:1;height:8px;border-radius:4px;background:var(--brd);overflow:hidden">'
      +'<div style="width:'+pct+'%;height:100%;border-radius:4px;background:'+grad+';transition:width .3s ease;box-shadow:'+glow+'"></div>'
      +'</div>'
      +'<span>'+done+'/'+total+' done ('+pct+'%)</span>'
      +'</div>';
  }

  function render(){
    var group=document.getElementById('todoTypeFilter').value;
    var sortMode=document.getElementById('todoSortMode').value;
    var statusFilter=document.getElementById('todoStatusFilter').value;
    var todos=getTodos();
    var items=(todos[group]||[]).slice();

    /* FIX #10: Apply search filter */
    var searchEl=document.getElementById('todoSearch');
    var query=searchEl?searchEl.value.trim():'';
    if(query){
      items=items.filter(function(i){return _matchesSearch(i,query)});
    }

    if(statusFilter==='pending')items=items.filter(function(i){return i.status!=='done'});
    else if(statusFilter==='done')items=items.filter(function(i){return i.status==='done'});

    items=sortItems(items,sortMode);

    /* Overdue badge */
    var overdueCount=_countOverdue(todos[group]||[]);
    var badgeEl=document.getElementById('todoOverdueBadge');
    if(badgeEl){
      if(overdueCount>0){badgeEl.textContent=overdueCount+' overdue';badgeEl.classList.remove('hidden')}
      else badgeEl.classList.add('hidden');
    }

    var el=document.getElementById('todoFullList');
    if(!items.length){
      el.innerHTML='<div class="empty"><div class="empty-ico">✅</div><p>'+(query?'No matches for "'+esc(query)+'"':'No to-dos yet')+'</p></div>';
      _renderProgress(todos[group]||[]);
      return;
    }
    var h='';
    items.forEach(function(item){h+=renderItem(item,group,0,null)});
    el.innerHTML=h;
    _initDrag();
    _initSwipe();
    _renderProgress(todos[group]||[]);
  }

  function _deadlineHtml(due,today){
    if(!due)return'';
    var dueDate=new Date(due);var todayDate=new Date(today);
    var diffDays=Math.round((dueDate-todayDate)/(1000*60*60*24));
    if(diffDays<0)return'<span style="font-family:JetBrains Mono,monospace;font-size:.5rem;font-weight:700;color:var(--red)">'+Math.abs(diffDays)+'d overdue</span>';
    if(diffDays===0)return'<span style="font-family:JetBrains Mono,monospace;font-size:.5rem;font-weight:700;color:var(--acc)">Today</span>';
    if(diffDays<=3)return'<span style="font-family:JetBrains Mono,monospace;font-size:.5rem;font-weight:700;color:var(--yel)">'+diffDays+'d left</span>';
    return'<span style="font-family:JetBrains Mono,monospace;font-size:.5rem;font-weight:600;color:var(--td)">'+diffDays+'d</span>';
  }

  /* Render a single child item row for inline view */
  function _renderInlineChild(child,group,parentDue,today){
    var isDone=child.status==='done';
    /* Sub-tasks use parent date for deadline display */
    var effectiveDue=parentDue;
    var dlHtml=_deadlineHtml(effectiveDue,today);
    var h='<div style="display:flex;align-items:center;gap:5px;padding:3px 0 3px 22px;font-size:.66rem;border-bottom:1px solid var(--brd);opacity:'+(isDone?'.5':'1')+'">';
    h+='<div class="todo-cb'+(isDone?' done':' p-'+(child.priority||'medium'))+'" onclick="TODO.toggleDone(\''+child.id+'\',\''+group+'\')" style="width:13px;height:13px;font-size:.4rem">'+(isDone?'✓':'')+'</div>';
    h+='<span style="flex:1;font-weight:500;color:var(--t2);'+(isDone?'text-decoration:line-through':'')+'">'+esc(child.title)+'</span>';
    if(child.estMins)h+='<span style="font-family:JetBrains Mono,monospace;font-size:.4rem;color:var(--cyn);font-weight:700;background:var(--cyn2);padding:1px 3px;border-radius:3px">~'+child.estMins+'m</span>';
    if(dlHtml)h+=dlHtml;
    h+='</div>';
    return h;
  }

  function renderInline(){
    var today=D.todayKey();
    ['study','work'].forEach(function(group){
      var el=document.getElementById('todoInline'+group.charAt(0).toUpperCase()+group.slice(1));
      if(!el)return;
      var todos=getTodos();
      var items=(todos[group]||[]).filter(function(i){return i.status!=='done'&&(!i.due||i.due<=today)}).slice(0,8);
      var priOrder={critical:0,high:1,medium:2,low:3};
      items.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});

      if(!items.length){el.innerHTML='<div style="font-size:.72rem;color:var(--tf);padding:6px 0">No pending to-dos</div>';return}
      var h='';
      items.forEach(function(item){
        var dlHtml=_deadlineHtml(item.due,today);
        var hasChildren=item.children&&item.children.length>0;
        var childCount=hasChildren?item.children.length:0;
        var childDone=hasChildren?item.children.filter(function(c){return c.status==='done'}).length:0;
        var inlineId='inl_'+item.id;

        h+='<div style="border-bottom:1px solid var(--brd)">';
        h+='<div style="display:flex;align-items:center;gap:6px;padding:5px 0;font-size:.73rem">';
        /* Expand arrow for items with children */
        if(hasChildren){
          h+='<span class="inl-toggle" onclick="this.classList.toggle(\'open\');document.getElementById(\''+inlineId+'\').classList.toggle(\'hidden\')" style="cursor:pointer;font-size:.6rem;color:var(--acc);font-weight:700;width:12px;text-align:center;transition:transform .15s;display:inline-block">▶</span>';
        }
        h+='<div class="todo-cb p-'+item.priority+'" onclick="TODO.toggleDone(\''+item.id+'\',\''+group+'\')" style="width:16px;height:16px;font-size:.5rem"></div>';
        h+='<span style="flex:1;font-weight:600;color:var(--heading)">'+esc(item.title);
        if(hasChildren)h+=' <span style="font-size:.5rem;color:var(--td);font-weight:500">('+childDone+'/'+childCount+')</span>';
        h+='</span>';
        h+='<span class="todo-badge '+item.priority+'" style="font-size:.45rem">'+item.priority+'</span>';
        if(item.estMins)h+='<span style="font-family:JetBrains Mono,monospace;font-size:.45rem;color:var(--cyn);font-weight:700;background:var(--cyn2);padding:1px 4px;border-radius:3px">~'+item.estMins+'m</span>';
        if(dlHtml)h+=dlHtml;
        h+='</div>';

        /* Collapsible children list — hidden by default */
        if(hasChildren){
          h+='<div id="'+inlineId+'" class="hidden" style="border-top:1px dashed var(--brd)">';
          item.children.forEach(function(child){
            h+=_renderInlineChild(child,group,item.due,today);
          });
          h+='</div>';
        }
        h+='</div>';
      });
      el.innerHTML=h;
    });
  }

  /* Collapse All / Expand All */
  function collapseAll(){
    document.querySelectorAll('#todoFullList .todo-children').forEach(function(c){c.classList.add('hidden')});
    document.querySelectorAll('#todoFullList .todo-expand-btn').forEach(function(b){b.classList.remove('open')});
  }
  function expandAll(){
    document.querySelectorAll('#todoFullList .todo-children').forEach(function(c){c.classList.remove('hidden')});
    document.querySelectorAll('#todoFullList .todo-expand-btn').forEach(function(b){b.classList.add('open')});
  }

  /* Toggle selection mode (show/hide checkboxes for bulk actions) */
  function enterSelectMode(){
    var list=document.getElementById('todoFullList');
    var bar=document.getElementById('todoBulkActions');
    /* If already in select mode, exit it */
    if(_bulkMode){
      _bulkMode=false;
      _selected={};
      if(list)list.classList.remove('todo-bulk-active');
      if(bar)bar.classList.add('hidden');
      var countEl=document.getElementById('todoBulkCount');
      if(countEl)countEl.textContent='';
      render();
      return;
    }
    _bulkMode=true;
    if(list)list.classList.add('todo-bulk-active');
    if(bar)bar.classList.remove('hidden');
    render();
  }

  /* Get todos for external modules */
  function getTodosExternal(){return getTodos()}

  /* Helper: sum estMins for all pending todos (due today, overdue, or no due date)
     Used by Time Budget to calculate committed todo time */
  function _sumEstMins(items,today){
    var total=0;
    items.forEach(function(i){
      if(i.status!=='done'&&i.estMins){
        /* Count if: due today, overdue, or no due date */
        if(!i.due||i.due<=today)total+=i.estMins;
      }
      if(i.children)total+=_sumEstMins(i.children,today);
    });
    return total;
  }

  function getTodayEstHours(){
    var today=D.todayKey();
    var todos=getTodos();
    var totalMins=0;
    ['study','work'].forEach(function(g){
      totalMins+=_sumEstMins(todos[g]||[],today);
    });
    return totalMins/60;
  }

  return{quickAdd:quickAdd,openAddModal:openAddModal,addChild:addChild,editItem:editItem,
    onTypeChange:onTypeChange,closeModal:closeModal,saveFromModal:saveFromModal,
    toggleDone:toggleDone,deleteItem:deleteItem,render:render,renderInline:renderInline,
    getOverdueCount:getOverdueCount,getTodos:getTodosExternal,getTodayEstHours:getTodayEstHours,
    toggleSelect:toggleSelect,toggleSelectAll:toggleSelectAll,
    markSelectedDone:markSelectedDone,removeSelected:removeSelected,
    collapseAll:collapseAll,expandAll:expandAll,enterSelectMode:enterSelectMode};
})();
