var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('graceful-fs');
var http = require('http');

var clusterNum = 13;
var corpusNum = 3;
var timeslotNum = 10;
var maxdocNum = 100;

var app = express();

var pubRoot={root: path.join(__dirname, 'public/html/')};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = http.createServer(app).listen(3000);

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

app.post('/getdoc', function(req,res){
  var clusterID = req.body['clusterID'];
  var corpusID = req.body['corpusID'];
  var timeslotID = req.body['timeslotID'];
  var docID = req.body['docID'];
  var doc = ReadSingleDoc(clusterID, corpusID, timeslotID, docID);
  res.send(doc);
});

app.post('/getgroupdoc', function(req,res){
  var clusterID = req.body['clusterID'];
  var corpusID = req.body['corpusID'];
  var timeslotID = req.body['timeslotID'];
  var docs = ReadGroupDocs(clusterID, corpusID, timeslotID);
  res.send(docs);
});

app.post('/gettopic', function(req,res){
  var clusterID = req.body['clusterID'];
  var topicvec = ReadTopicVecs(clusterID);
  res.send(topicvec);
});



function RenderMainPage(req, res, username)
{
  var data = {};
  data['username'] = username;
  data['userdata'] = ReadUserdata(username);
  data['datasetinfo'] = ReadDatasetInfo();
  data['clusterNum'] = clusterNum;
  data['corpusNum'] = corpusNum;
  data['timeslotNum'] = timeslotNum;
  data['maxdocNum'] = maxdocNum;
  res.render('index', data);
}

function ReadSingleDoc(clusterID, corpusID, timeslotID, docID)
{
  var doc = {};
  var dir = 'data/docdata/' + 'cluster_' + clusterID + '/corpus_' + corpusID + '/group_' + timeslotID;
  var vector_file = dir + '/doc_' + docID + '.txt';
  var content_file = dir + '/doc_' + docID + '_content.txt';
  var data;
  //console.log(vector_file);
  if (fs.existsSync(vector_file) == false) {
    doc['wordvec'] = '';
    doc['content'] = '';
    doc['docID'] = docID;
  } else {
    data = fs.readFileSync(vector_file, 'utf8');
    doc['wordvec'] = ParseWordVector(data);
    data = fs.readFileSync(content_file, 'utf8');
    doc['content'] = data;
    doc['docID'] = docID;
  }
  return doc;
}

function ReadGroupDocs(clusterID, corpusID, timeslotID)
{
  var docs = [];
  var dir = 'data/docdata/' + 'cluster_' + clusterID + '/corpus_' + corpusID + '/group_' + timeslotID;
  for (var t = 0; t < maxdocNum; t++)
  {
    var vector_file = dir + '/doc_' + t + '.txt';
    var content_file = dir + '/doc_' + t + '_content.txt';
    var data;
    var doc = {};
    if (fs.existsSync(vector_file) == false) {
      break;
    } else {
      data = fs.readFileSync(vector_file, 'utf8');
      doc['wordvec'] = ParseWordVector(data);
      data = fs.readFileSync(content_file, 'utf8');
      doc['content'] = data;
      doc['docID'] = t;
    }
    docs.push(doc);
  }
  return docs;
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

function ReadTopicVecs(clusterID)
{
  var topicvecs = [];
  for (var i = 0; i < timeslotNum; i++)
  {
    var path = 'data/docdata/cluster_' + clusterID + '/topics/topic' + i + '.txt';
    if (fs.existsSync(path) == false)
      continue;
    var data = fs.readFileSync(path, 'utf8');
    var wordvec = ParseWordVector(data);
    topicvecs.push(wordvec);
  }
  return topicvecs;
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
  if (fs.existsSync(path) == true) {
    data = fs.readFileSync(path, 'utf8');
  } else {
    data = '';
  }
  userdata = ParseUserdata(data);
  return userdata;
}

function ModifyUserdata(username, clusterID, data)
{
  var path = 'data/userdata/' + username + '.txt';
  var olddata;
  if (fs.existsSync(path) == true) {
    olddata = fs.readFileSync(path, 'utf8');
  } else {
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

function ReadDatasetInfo()
{
  var path = 'data/dataset_information.txt';
  var data = fs.readFileSync(path, 'utf8');
  var lines = data.split('\n');
  var datasetinfo = [];
  for (var i = 0; i < clusterNum; i++)
  {
    var clusterinfo = [];
    for (var j = 0; j < corpusNum; j++)
    {
      var corpusinfo = [];
      var linedata = lines[i * 6 + 1 + j].split(' ');
      //console.log(linedata);
      for (var k = 0; k < timeslotNum; k++)
      {
        var value = parseInt(linedata[3 + k]);
        corpusinfo.push(value);
      }
      clusterinfo.push(corpusinfo);
    }
    datasetinfo.push(clusterinfo);
  }
  return datasetinfo;
}

