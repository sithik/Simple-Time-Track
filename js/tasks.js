/* 
 * Copyright (c) 2010 Roman Ožana. All rights reserved.
 * @author Roman Ožana <ozana@omdesign.cz>
 * @link www.omdesign.cz
 * @license MIT
 * @version 30.11.2010
 */

var db = openDatabase('timetrack', '1.0', 'Time track database', 2 * 1024 * 1024);

/**
 * Create TASKS table if not exists in local database
 */
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(ID INTEGER PRIMARY KEY ASC, name TEXT, time TEXT, start DATETIME, running BOOLEAN)', [], null, onError); // table creation
// id - unique autoincrement identificator of task
// name - name of taks or caption of task
// time - keep cumulative time from begining to STOP press
// start - we need some guide for calculate time increase
// running - task is in progress now
});

/**
 * Generate NEXT ID for database
 */
function nextID()
{
  var id = localStorage['lastid']; // get last id from local storage
  if (id == undefined)
  {
    id = 1; // generate first ID
  } else {
    id++; // generate next ID
  }
  localStorage['lastid'] = id; // save to localStorage
  return id;
}

/**
 * Update taks name
 */
function updateName(id, name)
{
 
}

/**
 * Start task
 */
function startTask(id)
{
  var start = new Date(); // set start to NOW
  db.transaction(function(tx) {
    tx.executeSql("UPDATE tasks SET running = ?, start = ? WHERE id = ?", [true, start, id], null, onError);
  });
}

/**
 * Add time to cumulative time attribute
 */
function stopTask(id)
{
  // TODO calculate time diff
  db.transaction(function(tx) {
    tx.executeSql("UPDATE tasks SET running = ? WHERE id = ?", [false, id], null, onError);
  });
}

/**
 * Delete all records (drop table)
 */
function dropTable()
{
  db.transaction(function(tx) {
    tx.executeSql("DROP TABLE tasks", [],null, onError);
  });
}

/**
 * Remove database and localStorage from browser
 * @experimental
 */
function uninstall()
{
  dropTable(); 
  localStorage.removeItem("lastid");
}

/**
 * Exception hook
 */
function onError(tx, error)
{
  alert(error.message);
}

/**
 * Time tracking user interface
 */

var taskInterface = {
  
  bind: function () {

    /* common elements
     ------------------------------------------------------------------------ */
    
    // cancel buttons click
    $(".cancel").live("click", function (e) {
      e.preventDefault();
      $("#" + $(this).attr("rel")).hide();
      $("#form-list").show();
    });

    /* create tesk
     ------------------------------------------------------------------------ */
    
    // create new task
    $(".create").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      $("#form-create").slideDown().find("input[name='task-name']").focus();
    });

    // create new task > confirm click
    $("#button-create").live("click", function ()
    {
      var id = nextID(); // render next ID
      var name = $("#form-create :input[name='task-name']").val(); // get name
      
      db.transaction(function(tx) {
        tx.executeSql("INSERT INTO tasks (id, name, time, start, running) VALUES (?, ?, ?, ?, ?)", [id, name, 0, new Date(), false],
          function(tx, result) {
            taskInterface.index();
          },
          onError);
      });
  
      $("#form-create").hide().find("input:text").val("");
    });

    /* delete one task
     ------------------------------------------------------------------------ */
    
    // delete task
    $(".remove").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      $("#button-remove").attr("rel", $(this).attr("rel"));
      $("#remove-confirm").html("Are you sure? You want to delete <strong>" + $(this).attr("title") + "</strong>?");
      $("#form-remove").show();
    });

    // delete task > confirm deletion
    $("#button-remove").live("click", function () {
      $("#form-remove").hide();
      var id = $(this).attr("rel");

      db.transaction(function(tx) {
        tx.executeSql("DELETE FROM tasks WHERE id=?", [id],
          function(tx, result) {
            taskInterface.index();
          },
          onError);
      });
    });
    
    /* delete all tasks
     ------------------------------------------------------------------------ */
    
    // remove all tasks
    $(".remove-all").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      $("#form-remove-all").slideDown();
    });

    // remove all tasks > confirm deletion
    $("#button-remove-all").live("click", function () {
      $("#form-remove-all").hide();

      db.transaction(function(tx) {
        tx.executeSql("DELETE FROM tasks", [], function(tx, results) {
          taskInterface.index();
        },onError);
      });
      
      localStorage.removeItem("lastid"); // remove last id from local storage
    });

    /* update task name
     ------------------------------------------------------------------------ */

    // update task
    $(".update").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();

      var id  = $(this).attr("rel");
      db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM tasks WHERE ID = ?', [id], function (tx, results) {

          if (results.rows.length > 0)
          {
            $("#form-update :input[name='task-id']").val(id);
            $("#form-update :input[name='task-name']").val(results.rows.item(0).name);
            $("#form-update :input[name='task-time']").val(results.rows.item(0).time);
            $("#form-update").slideDown();
          } else
          {
            alert("Task " + id + "not found!");
          }
        }, null);
      });
    });

    // update task > save
    $("#button-update").live("click", function () {
      $("#form-update").hide();
      
      var id = $("#form-update :input[name='task-id']").val(); // get id
      var name = $("#form-update :input[name='task-name']").val(); // get name
      var time = $("#form-update :input[name='task-time']").val(); // get task time

      db.transaction(function(tx) {
        tx.executeSql("UPDATE tasks SET name = ?, time = ? WHERE id = ?", [name, time, id], function (tx, results) {
          taskInterface.index();
        }, onError);
      });
    });

   
  /*

    $(".play").live("click", function (e) {
      e.preventDefault();
    //jTask.toggleTimer($(this), $(this).attr("rel"));
    })

    */

  },

  index: function () {
    var out = "";

    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM tasks', [], function (tx, results) {

        var len = results.rows.length, i;
        
        if (len > 0)
        {
          for (i = 0; i < len; i++){
            out += '<p class="item" id="item' + results.rows.item(i).ID + '">';
            out +='<label>' + results.rows.item(i).name + '</label>';
            out += '<a href="#" class="update" rel="' + results.rows.item(i).ID + '" title="' + results.rows.item(i).name + '">Edit</a> | ';
            out += '<a href="#" class="remove" rel="' + results.rows.item(i).ID + '" title="' + results.rows.item(i).name + '">Delete</a>';
            out += '<span class="timer">' + this.hms(results.rows.item(i).time) + '</span>';
            out += '<a href="#" class="power ' + (results.rows.item(i).running ? 'power-off' : 'power-on') + '" title="Timer on/off" rel="' + results.rows.item(i).ID + '"></a>';
            out += '</p>';
          }
        } else {
          out = "<p class=\"notask\"><label>No tasks</label></p>"
        }
        
        $("#form-list").empty().append(out).show();

      }, null);
    });
  },

  init: function () {
    this.bind();
    this.index();
  },

  timerScheduler: function (namespace) {
    clearInterval(this.intervals[namespace]);
    this.intervals[namespace] = setInterval(function () {
      if ($.DOMCached.get("started", namespace)) {
        jTask.timer[namespace]++;
        $.DOMCached.set("timer", jTask.timer[namespace], false, namespace);
        $(".jtrack-power[rel='" + namespace + "']").siblings(".jtrack-timer").eq(0).text(jTask.hms(jTask.timer[namespace]));
      }
    }, 1000);
  },

  toggleTimer: function (jQ, namespace) {
    if (!$.DOMCached.get("started", namespace)) {
      $.DOMCached.set("started", true, false, namespace);
      this.timer[namespace] = $.DOMCached.get("timer", namespace);
      this.timerScheduler(namespace);
      jQ.addClass("jtrack-power-on");
      chrome.browserAction.setBadgeText({
        text:'RUN'
      });
    } else {
      $.DOMCached.set("started", false, false, namespace);
      jQ.removeClass("jtrack-power-on");
      chrome.browserAction.setBadgeText({
        text:''
      });
    }
  },

  hms: function (secs) {
    secs = secs % 86400;
    var time = [0, 0, secs], i;
    for (i = 2; i > 0; i--) {
      time[i - 1] = Math.floor(time[i] / 60);
      time[i] = time[i] % 60;
      if (time[i] < 10) {
        time[i] = '0' + time[i];
      }
    }
    return time.join(':');
  }
};
