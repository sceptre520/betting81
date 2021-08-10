require("dotenv").config();
const express = require("express");
const app = express();
var path = require('path');
const cron = require('node-cron');

var View = require('./base');

const test1 = require('./TestQuery1');
const test2 = require('./TestQuery2');

var pipeline = [null, null, null]
var cron_cnt = 0
var start_time = getNow()


console.log('                                             ')
console.log('--------    started  scheduler    -----------')

// cron.schedule('0 */15 * * * *', function() {
//   console.log(' ---  running a task every 15 minutes --- ');
cron.schedule('*/5 * * * * *', function() {
  console.log(' ---  running a task every 5 seconds --- ');
  tmp = {}

  try {
    test1.getAllMatchesInDB().then((output) => {
      tmp.test1 = {run_time: getNow(), log:output}
    });  
  } catch (error) {
    tmp.test1 = {run_time: getNow(), log:output}
  }

  try {
    test2.getAllCategoriesInDB().then((output) => {
      tmp.test2 = {run_time: getNow(), log:output}
    });  
  } catch (error) {
    tmp.test2 = {run_time: getNow(), log:output}
  }

  for (i = 0; i < 2; i ++) {
    pipeline[i] = pipeline[i+1]
  }
  pipeline[2] = tmp

  cron_cnt ++
});


const port = process.env.PORT || 8100;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
  var v = new View(res, 'index');
  v.render({
    start_time  : start_time,
    cron_cnt    : cron_cnt,
    pipeline    : pipeline
  })
});

//Starting a server
app.listen(port, () => {
  console.log(`app is running at ${port}`);
});

function getNow() {
  var started_at = new Date();
  let date = ("0" + started_at.getDate()).slice(-2);
  let month = ("0" + (started_at.getMonth() + 1)).slice(-2);
  let year = started_at.getFullYear();
  let hours = ("0" + started_at.getHours()).slice(-2);
  let minutes = ("0" + started_at.getMinutes()).slice(-2);
  let seconds = ("0" + started_at.getSeconds()).slice(-2);
  return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
}