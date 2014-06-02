/* 
 * Copyright (c) 2010 Roman Ožana. All rights reserved.
 * @author Roman Ožana <ozana@omdesign.cz>
 * @link www.omdesign.cz
 * @license MIT
 * @version 3.12.2010
 *
 * Special thanks to jTrack for inspiration !
 * http://bulgaria-web-developers.com/projects/javascript/jtrack/
 *
 */

var db = openDatabase('timetrack', '1.0', 'Time track database', 2 * 1024 * 1024);

/**
 * Create TASKS table if not exists in local database
 */
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(ID INTEGER PRIMARY KEY ASC, project_name TEXT, name TEXT, time INTEGER, start DATETIME, running BOOLEAN)', [], null, onError); // table creation
// id - unique autoincrement identificator of task
// project_name - project name or caption of the project
// name - name of taks or caption of task
// time - keep cumulative time from begining to STOP press
// start - we need some guide for calculate time increase
// running - task is in progress now
});

/**
 * Create SETTINGS table if not exists in local database
 */
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS settings(ID INTEGER PRIMARY KEY ASC, api_url TEXT, user_id TEXT)', [], null, onError); // table creation
// id - unique autoincrement identificator of task
// api_url - api url to upload times
// user_id - email id or user id to be uploaded to api
});

/**
 * Delete all records (drop table)
 */
function dropTaskTable()
{
  db.transaction(function(tx) {
    tx.executeSql("DROP TABLE tasks", [],function (tx, results) {
      alert('Table tasks was droped');
    }, onError);
  });
  db.transaction(function(tx) {
    tx.executeSql("DROP TABLE settings", [],function (tx, results) {
      alert('Table settings was droped');
    }, onError);
  });
}
// dropTaskTable();

/**
 * Exception hook
 */
function onError(tx, error)
{
  console.log(tx.message);
  alert(error.message);
}

var tasks = {
  
  insert : function (id, project_name, name) {
    db.transaction(function(tx) {
      tx.executeSql("INSERT INTO tasks (id, project_name, name, time, start, running) VALUES (?, ?, ?, ?, ?, ?)", [id, project_name, name, 0, new Date(), false],
        function(tx, result) {
          taskInterface.index();
        },
        onError);
    });
  },
  
  update : function () {
    
  },
  reset : function (id) {
    db.transaction(function(tx) {
      tx.executeSql("UPDATE tasks SET time = ? WHERE id = ?", [0 , id], function (tx, results) {
        taskInterface.index();
      }, onError);
    });
  },
  remove : function (id) {
    db.transaction(function(tx) {
      tx.executeSql("DELETE FROM tasks WHERE id=?", [id],
        function(tx, result) {
          window.clearInterval(taskInterface.intervals[id]);
          taskInterface.index();
        },
        onError);
    });
  },
  
  removeall: function() {
    db.transaction(function(tx) {
      tx.executeSql("DELETE FROM tasks", [], function(tx, results) {

        for (iid in taskInterface.intervals) {
          window.clearInterval(taskInterface.intervals[iid]);
        }
            
        taskInterface.index();
      },onError);
    });
  }
  
  
}


/**
 * Time tracking user interface Javascript
 */
var taskInterface = {
  
  intervals: new Array,
  
  bind: function () {
    
    /* common elements
     ------------------------------------------------------------------------ */
    
    // cancel buttons click
    $(".cancel").live("click", function (e) {
      e.preventDefault();
      $("#" + $(this).attr("rel")).hide().hide().find("input:text").val("");
      $("#form-list").show();
    });

    /* create tesk
     ------------------------------------------------------------------------ */
    
    // create new task
    $(".create").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      $("#form-create").slideDown().find("input[name='task-project-name']").focus();
    });

    // create new task > confirm click
    $("#button-create").live("click", function ()
    {
      tasks.insert(taskInterface.nextID(), $("#form-create :input[name='task-project-name']").val(), $("#form-create :input[name='task-name']").val());
      $("#form-create").hide().find("input:text").val("");
    });
    
    // create new task > enter press
    $('#task-name').keydown(function(e) {
      if (e.keyCode == 13) {
        tasks.insert(taskInterface.nextID(), $("#form-create :input[name='task-project-name']").val(), $("#form-create :input[name='task-name']").val());
        $("#form-create").hide().find("input:text").val("");
      }
    });

    /* delete one task
     ------------------------------------------------------------------------ */
    
    // delete task
    $(".remove").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      $("#button-remove").attr("rel", $(this).attr("rel"));
      $("#remove-confirm").html("Are you sure? You want to <strong>delete " + $(this).attr("title") + "</strong>?");
      $("#form-remove").show();
    });

    // delete task > confirm deletion
    $("#button-remove").live("click", function () {
      $("#form-remove").hide();
      tasks.remove($(this).attr("rel"));
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
      tasks.removeall();
      localStorage.removeItem("lastid"); // remove last id from local storage
    });
    /* upload tasks to API
     ------------------------------------------------------------------------ */
    
    // upload all tasks
    $("#upload").live("click", function (e) {
        e.preventDefault();
        
        db.transaction(function(tx) {
            tx.executeSql("SELECT id, api_url, user_id FROM settings WHERE id = ? ", [1],
                function(tx, results) {
                    //taskInterface.index();
                    var len = results.rows.length;
                    
                    if (len > 0)
                    {
                        setting = results.rows.item(0);
                        //console.log(setting);
                        
                        
                        /*** Get tasks ***/
                        
                        db.transaction(function (tx) {
                          tx.executeSql('SELECT * FROM tasks', [], function (tx, results) {
                            if (results.rows.length > 0)
                            {
                                var items = [];
                                
                                for(i=0; i<results.rows.length; i++)
                                {
                                    var task = results.rows.item(i);
                                    var dt = new Date(task.start).toMysqlFormat();
                                    items[i] = {
                                        task_id: task.ID,
                                        project_name: task.project_name,
                                        task_name: task.name,
                                        time: task.time,
                                        start: dt,
                                        running: task.running,
                                        user_id: setting.user_id
                                    };
                                }
                                
                                /***
                                
                                var dataToPost = {
                                    items: [
                                        {
                                            task_id:"1",
                                            project_name:"Test Project",
                                            task_name:"task name",
                                            time: "2014-05-31 11:30:30",
                                            start: "2014-05-31 11:00:00",
                                            running: true,
                                            user_id: setting.user_id
                                        },
                                        {
                                            task_id:"2",
                                            project_name:"Test Project",
                                            task_name:"task name 2",
                                            time: "2014-05-31 10:30:30",
                                            start: "2014-05-31 10:00:00",
                                            running: false,
                                            user_id: setting.user_id
                                        }
                                    ]
                                };
                                
                                var dataToPost2 = {
                                    task_id:"1",
                                    project_name:"Test Project",
                                    task_name:"task name",
                                    time: "2014-05-31 11:30:30",
                                    start: "2014-05-31 11:00:00",
                                    running: true,
                                    user_id: setting.user_id
                                };
                                **/
                                
                                var dataToPost = {
                                    items:items
                                };
                                
                                $.ajax({
                                    type: "POST",
                                    url: setting.api_url + "upload.php?ac=multiple_upload",
                                    data: dataToPost,
                                    dataType: "json",
                                    success: function(result) {
                                        console.log(result);
                                        if(result.result == true){
                                            alert("Uploaded successfully");
                                            for(i=0; i<=result.success_entries.length; i++)
                                            {
                                                tasks.reset(result.success_entries[i]);
                                            }
                                        }
                                        else{
                                            alert("Upload FAILED!");
                                        }
                                    },
                                    error: function(result) {
                                        console.log(result);
                                        alert("Error uploading tasks to server.\n\n** Please review your settings.");
                                    }
                                });
                                
                                
                            }
                            else {
                                console.log("No tasks found for ajax");
                                alert("No tasks to upload");
                            }
                          }, null);
                        });
                        /*** Get tasks ***/
                        
                    }
                    else
                    {
                        alert("No settings found!");
                        console.log('No records fetched');
                    }
                }, null);
            },
        onError);
        
    });

    /* export all tasks
     ------------------------------------------------------------------------ */
    
    // export all tasks
    $(".export-all").live("click", function (e) {
        db.transaction(function (tx) {
          tx.executeSql('SELECT * FROM tasks ORDER BY id DESC', [], function (tx, results) {
            var out = '';
            var len = results.rows.length, i;
            
            if (len > 0)
            {
                for (i = 0; i < len; i++){
                    var task = results.rows.item(i);
                    if (task.running == true)
                    {
                        var start = new Date(task.start);
                        var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
                        out += task.ID + ',' + task.project_name + ',' + task.name + ',' + taskInterface.hms(dif);
                    } else {  
                        out += task.ID + ',' + task.project_name + ',' + task.name + ',' + taskInterface.hms(task.time);
                    }
                    var start = new Date(task.start);
                    out += ','+start.getFullYear()+'-'+(parseInt(start.getMonth())+1).toString()+'-'+start.getDate()+'\n';
                }
                /**
                 * @todo the file is now downloading as 'download' without the file extension
                 *       need to make it somehow download as 'simple_time_track.csv'. below code
                 *       supposed to work, but it is not working
                var link = document.createElement("a");
                link.setAttribute("download", "simple_time_track.csv");
                link.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURIComponent(out));
                link.click(); // This will download the data file named "my_data.csv"
                */
                window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(out));
            } 
            else 
            {
                out = "No tasks";
                alert("No tasks to export");
            }              
          }, null);
        });
    });

    /* update settings
     ------------------------------------------------------------------------ */

    // update settings
    
    $("#settings").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();
      
      // TODO load function
      db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM settings WHERE ID = ?', [1], function (tx, results) {

          if (results.rows.length > 0)
          {
            $("#form-settings :input[name='api_url']").val(results.rows.item(0).api_url);
            $("#form-settings :input[name='user_id']").val(results.rows.item(0).user_id);
            $("#form-settings :input[name='id']").val(1);
            $("#form-settings").slideDown();
            
          } else {
            alert("No settings found! Enter new");
            $("#form-settings :input[name='api_url']").val("");
            $("#form-settings :input[name='user_id']").val("");
            $("#form-settings :input[name='id']").val(0); // 0 means - create new
            $("#form-settings").slideDown();
          }
        }, null);
      });
    });

    // update settings > save
    $("#button-settings-update").live("click", function () {
      $("#form-settings").hide();
      
      var id = $("#form-settings :input[name='id']").val(); // get id
      var api_url = $("#form-settings :input[name='api_url']").val(); // get api url
      var user_id = $("#form-settings :input[name='user_id']").val(); // get user id
      
      db.transaction(function(tx) {
        if(id == 0){
          tx.executeSql("INSERT INTO settings (id, api_url, user_id) VALUES (?,?,?)", [1, api_url, user_id], function (tx, results) {
            taskInterface.index();
          }, onError);
          alert("New setting added");
        }
        else{
          tx.executeSql("UPDATE settings SET api_url = ?, user_id = ? WHERE id = ?", [api_url, user_id, 1], function (tx, results) {
            taskInterface.index();
          }, onError);
          alert("New setting updated");
        }
        
      });
    });

    /* update task name
     ------------------------------------------------------------------------ */

    // update task
    
    $(".update").live("click", function (e) {
      e.preventDefault();
      $(".form").hide();

      var id  = $(this).attr("rel");
      // TODO load function
      db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM tasks WHERE ID = ?', [id], function (tx, results) {

          if (results.rows.length > 0)
          {
            $("#form-update :input[name='task-id']").val(id);
            $("#form-update :input[name='task-project-name']").val(results.rows.item(0).project_name);
            $("#form-update :input[name='task-name']").val(results.rows.item(0).name);
            $("#form-update :input[name='task-time']").val(taskInterface.hms(results.rows.item(0).time));
            $("#form-update").slideDown();
          } else {
            alert("Task " + id + "not found!");
          }
        }, null);
      });
    });

    // update task > save
    $("#button-update").live("click", function () {
      $("#form-update").hide();
      
      var id = $("#form-update :input[name='task-id']").val(); // get id
      var project_name = $("#form-update :input[name='task-project-name']").val(); // get name
      var name = $("#form-update :input[name='task-name']").val(); // get name
      var time = $("#form-update :input[name='task-time']").val(); // get task time

      db.transaction(function(tx) {
        tx.executeSql("UPDATE tasks SET project_name = ?, name = ?, time = ? WHERE id = ?", [project_name, name, taskInterface.sec(time), id], function (tx, results) {
          taskInterface.index();
        }, onError);
      });
    });

    /* reset task
     ------------------------------------------------------------------------ */

    $(".reset").live("click", function (e) {
      e.preventDefault();
      if(confirm("Are you sure you want to reset this time?")){
          $(".form").hide();

          var id  = $(this).attr("rel");
          
          db.transaction(function(tx) {
            tx.executeSql("UPDATE tasks SET time = ? WHERE id = ?", [0 , id], function (tx, results) {
              taskInterface.index();
            }, onError);
          });
      }
    });
    
   
    $(".play").live("click", function (e) {
      e.preventDefault();
      taskInterface.toggleTimer($(this).attr("rel"));
    })

  },

  index: function () {
    var out = "";

    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM tasks ORDER BY id DESC', [], function (tx, results) {

        var len = results.rows.length, i;
        
        if (len > 0)
        {
          for (i = 0; i < len; i++){
            var task = results.rows.item(i);
            
            out += '<p class="item' + (task.running == true ? ' running' : '') + '" id="item' + task.ID + '" rel="' + task.ID +'">';
            out +='<label>' + task.name + ' <small class="badge">' + task.project_name + '</small></label>';
            out += '<span class="item-action-bar">';
            out += '<a href="#" class="update" rel="' + task.ID + '" title="Edit: ' + task.name + '">Edit</a> | ';
            out += '<a href="#" class="reset" rel="' + task.ID + '" title="Reset: ' + task.name + '">Reset</a> | ';
            out += '<a href="#" class="remove" rel="' + task.ID + '" title="Delete: ' + task.name + '">Delete</a>';
            
            if (task.running == true)
            {
              var start = new Date(task.start);
              var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
              out += '<span class="timer">' + taskInterface.hms(dif) + '</span>';
            } else {  
              out += '<span class="timer">' + taskInterface.hms(task.time) + '</span>';
            }
            
            out += '<a href="#" class="power play ' + (task.running == true ? 'running' : '') + '" title="Timer on/off" rel="' + task.ID + '"></a>';
            out += '</span>';
            out += '</p>';

            if (task.running == true) {
              taskInterface.startTask(task); // start task
            }
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
    this.toggleRunText();
  },
 

  toggleTimer: function (id) {
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM tasks WHERE ID = ?', [id], function (tx, results) {
        if (results.rows.length > 0)
        {
          var task = results.rows.item(0);
          $('#item' + id).toggleClass('running');
          $('#item' + id + ' .power').toggleClass('running');
          
          if (task.running == true)
          {
            taskInterface.stopTask(task);
          } else {
            taskInterface.startTask(task);
          }

          taskInterface.toggleRunText();
          
        } else {
          alert("Task " + id + " not found sorry!");
        }
      }, null);
    });   
  },

  //////////////////////////////////////////////////////////////////////////////
  // start task
  //////////////////////////////////////////////////////////////////////////////

  startTask:  function (task)
  {   
    window.clearInterval(taskInterface.intervals[task.ID]); // remove timer
    
    var start = new Date(); // set start to NOW
    
    if (task.running == true)
    {
      start = new Date(task.start);
    } else {
      db.transaction(function(tx) {
        tx.executeSql("UPDATE tasks SET running = ?, start = ? WHERE id = ?", [1, start, task.ID], null, onError);
      });
    }
    
    // setup interval for counter
    taskInterface.intervals[task.ID] = window.setInterval(function () {
      var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
      $('#item' + task.ID + ' .timer').text(taskInterface.hms(dif));
    }, 500);
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // stop task
  //////////////////////////////////////////////////////////////////////////////

  stopTask: function (task)
  {
    window.clearInterval(taskInterface.intervals[task.ID]); // remove timer
    
    var start, stop, dif = 0;

    db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM tasks WHERE id = ?', [task.ID], function (tx, results) {
        if (results.rows.length > 0)
        {
          start = new Date(results.rows.item(0).start); // read from DB
          stop = new Date(); // now
          dif = Number(results.rows.item(0).time) + Math.floor((stop.getTime() - start.getTime()) / 1000); // time diff in seconds

          $('#item' + task.ID + ' .timer').text(taskInterface.hms(dif));
          
        } else {
          alert('Task ' + task.ID + ' not found!');
        }
      }, null, onError);
    });

    // update record
    db.transaction(function(tx) {
      tx.executeSql("UPDATE tasks SET running = ?, time = ? WHERE id = ?", [0, Number(dif), task.ID], null, onError);
    });
    
  },
  

  //////////////////////////////////////////////////////////////////////////////
  // toggle RUN text on icon
  //////////////////////////////////////////////////////////////////////////////
  
  toggleRunText: function()
  {
    db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM tasks WHERE running = ?', [1], function (tx, results) {
        if (results.rows.length > 0)
        {
          chrome.browserAction.setBadgeText({
            text: 'RUN'
          });
        } else {
          chrome.browserAction.setBadgeText({
            text: ''
          });
        }
      }, null, onError);
    });
  },
  
  //////////////////////////////////////////////////////////////////////////////
  // convert sec to hms
  //////////////////////////////////////////////////////////////////////////////
  
  hms: function (secs) {
    //secs = secs % 86400; // fix 24:00:00 overlay
    var time = [0, 0, secs], i;
    for (i = 2; i > 0; i--) {
      time[i - 1] = Math.floor(time[i] / 60);
      time[i] = time[i] % 60;
      if (time[i] < 10) {
        time[i] = '0' + time[i];
      }
    }
    return time.join(':');
  },

  //////////////////////////////////////////////////////////////////////////////
  // convert h:m:s to sec
  //////////////////////////////////////////////////////////////////////////////
  
  sec: function (hms) {
    var t = String(hms).split(":");
    return Number(parseFloat(t[0] * 3600) + parseFloat(t[1]) * 60 + parseFloat(t[2]));
  },

  nextID: function ()
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

};

/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};
