var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('graceful-fs');

var clusterNum = 13;
var corpusNum = 3;
var timeslotNum = 10;
var maxdocNum = 30;

var app = express();

var pubRoot={root: path.join(__dirname, 'public/html/')};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var server = app.listen(3000, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});


app.get('/', function (req, res) {
  res.sendFile('login.html', pubRoot);
});

app.post('/index', function(req, res) {
  var username = req.body['username'];
  if (username) {
    RenderMainPage(req, res, username);
  } else {
    res.redirect('/');
  }
});

app.post('/submitdata', function(req, res){
  var data = req.body['data'];
  var clusterID = req.body['clusterID'];
  var username = req.body['username'];
  ModifyUserdata(username, clusterID, data);
  res.send('Data saved!');
});



function RenderMainPage(req, res, username)
{
  var data = {};
  data['username'] = username;
  data['clusters'] = ReadDocs();
  data['topics'] = ReadTopics();
  data['userdata'] = ReadUserdata(username);
  res.render('index', data);
}

function ReadDocs()
{
  var root = 'data/docdata/';
  var clusters = [];
  for (var i = 0; i < clusterNum; i++)
  {
    var corpora = [];
    for (var j = 0; j < corpusNum; j++)
    {
      var docgroups = [];
      for (var k = 0; k < timeslotNum; k++)
      {
        var docs = [];
        var path = root + 'cluster_' + i + '/' + 'corpus_' + j + '/' + 'group_' + k + '/';
        if (fs.existsSync(path) == false)
        {
          docgroups.push(docs);
          continue;
        }
        for (var t = 0; t < maxdocNum; t++)
        {
          var file = path + 'doc_' + t + '.txt';
          if (fs.existsSync(file) == false)
            break;
          var vector_data = fs.readFileSync(file, 'utf8');
          var word_vec = ParseWordVector(vector_data);
          var content_data = fs.readFileSync(path + 'doc_' + t + '_content.txt', 'utf8');
          var doc = {'wordvec': word_vec, 'content':content_data};
          docs.push(doc);
        }
        docgroups.push(docs);
      }
      corpora.push(docgroups);
    }
    clusters.push(corpora);
  }
  return clusters;
}

function ReadTopics()
{
  var root = 'data/docdata/';
  var topics = [];
  for (var i = 0; i < clusterNum; i++)
  {
    var timeslots = [];
    for (var j = 0; j < timeslotNum; j++)
    {
      var path = root + 'cluster_' + i + '/topics/topic' + j + '.txt';
      if (fs.existsSync(path) == false)
        continue;
      var data = fs.readFileSync(path, 'utf8');
      var word_vec = ParseWordVector(data);
      timeslots.push(word_vec);
    }
    topics.push(timeslots);
  }
  return topics;
}

function ReadUserdata(username)
{
  var userdata;
  var data;

  var path = 'data/userdata/' + username + '.txt';
  if (fs.existsSync(path) == true)
  {
    data = fs.readFileSync(path, 'utf8');
  }
  else
  {
    data = '';
  }
  userdata = ParseUserdata(data);
  return userdata;
}

function ModifyUserdata(username, clusterID, data)
{
  var path = 'data/userdata/' + username + '.txt';
  var olddata;
  if (fs.existsSync(path) == true)
  {
    olddata = fs.readFileSync(path, 'utf8');
  }
  else
  {
    olddata = '';
  }

  var userdata = ParseUserdata(olddata);

  clusterID = parseInt(clusterID);

  for (var i = 0; i < corpusNum; i++)
  {
    for (var j = 0; j < timeslotNum; j++)
    {
      userdata[clusterID][i][j] = parseInt(data[i][j]);
    }
  }

  var datastr = '';
  for (var i = 0; i < clusterNum; i++)
  {
    for (var j = 0; j < corpusNum; j++)
    {
      for (var k = 0; k < timeslotNum; k++)
      {
        datastr = datastr + userdata[i][j][k].toString() + ((k == timeslotNum - 1) ? '\n' : ' ');
      }
    }
    if (i != clusterNum - 1)
      datastr += '\n';
  }

  fs.writeFileSync(path, datastr);
}

function ParseUserdata(data)
{
  // console.log('data to be parsed:' + data + '\n');
  var userdata = [];
  for (var i = 0; i < clusterNum; i++)
  {
    var corpora = [];
    for (var j = 0; j < corpusNum; j++)
    {
      var timeslots = [];
      for (var k = 0; k < timeslotNum; k++)
      {
        timeslots.push(-1);
      }
      corpora.push(timeslots);
    }
    userdata.push(corpora);
  }

  if (data == '')
  {
    return userdata;
  }

  var lines = data.split('\n');
  var datalines = [];
  for (i = 0; i < lines.length; i++)
  {
    if (lines[i] != '')
      datalines.push(lines[i]);
  }
  for (i = 0; i < clusterNum; i++)
  {
    for (j = 0; j < corpusNum; j++)
    {
      var dataline = datalines[i * corpusNum + j];
      var tags = dataline.split(' ');
      for (k = 0; k < timeslotNum; k++)
      {
        userdata[i][j][k] = parseInt(tags[k]);
      }
    }
  }

  return userdata;
}

function ParseWordVector(data)
{
  var wordvec = {};
  var words = data.split('\n');
  for (var u = 0; u < words.length; u++)
  {
    if (words[u] == '')
      continue;
    var pairs = words[u].split(' ');
    var word = pairs[0];
    wordvec[word] = parseFloat(pairs[1]);
  }
  return wordvec;
}

