var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('graceful-fs');
var http = require('http');

var app = express();

var pubRoot={root: path.join(__dirname, 'public/html/')};

var server = http.createServer(app).listen(3000);



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.get('/', function (req, res) {
  res.sendFile('login.html', pubRoot);
});

app.post('/index', function(req, res) {
  var username = req.body['username'];
  var datasetID = 0;
  if (username) {
    RenderMainPage(req, res, username, datasetID);
  } else {
    res.redirect('/');
  }
});

app.get('/index', function(req, res) {
  var username = req.query['username'];
  var datasetID = req.query['dataset'];
  if (username) {
    RenderMainPage(req, res, username, datasetID);
  } else {
    res.redirect('/');
  }
});


app.post('/submitdata', function(req, res){
  var data = req.body['data'];
  var datasetID = req.body['datasetID'];
  var metadata = GetDatasetMetadata(datasetID);
  var clusterID = req.body['clusterID'];
  var username = req.body['username'];
  ModifyUserdata(username, clusterID, data, metadata);
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
  var datasetID = req.body['datasetID'];
  var metadata = GetDatasetMetadata(datasetID);
  var clusterID = req.body['clusterID'];
  var corpusID = req.body['corpusID'];
  var timeslotID = req.body['timeslotID'];
  var docs = ReadGroupDocs(clusterID, corpusID, timeslotID, metadata);
  res.send(docs);
});

app.post('/gettopic', function(req,res){
  var datasetID = req.body['datasetID'];
  var metadata = GetDatasetMetadata(datasetID);
  var clusterID = req.body['clusterID'];
  var topicvec = ReadTopicVecs(clusterID, metadata);
  res.send(topicvec);
});



function RenderMainPage(req, res, username, datasetID)
{
  var data = {};
  data['username'] = username;
  data['catalog'] = ReadDatasetCatalog();

  var metadata = GetDatasetMetadata(datasetID);

  data['userdata'] = ReadUserdata(username, metadata);
  data['datasetinfo'] = ReadDatasetInfo(metadata);

  data['clusterNum'] = metadata['clusterNum'];
  data['corpusNum'] = metadata['corpusNum'];
  data['timeslotNum'] = metadata['timeslotNum'];
  data['maxdocNum'] = metadata['maxdocNum'];
  data['datasetID'] = datasetID;

  res.render('index', data);
}

function GetDatasetMetadata(datasetID)
{
  var Catalog = ReadDatasetCatalog();

  return {
    'dataroot' : 'data/' + Catalog[datasetID]['name'] + '/',
    'clusterNum' : Catalog[datasetID]['clusterNum'],
    'corpusNum' : Catalog[datasetID]['corpusNum'],
    'timeslotNum' : Catalog[datasetID]['timeslotNum'],
    'maxdocNum' : Catalog[datasetID]['maxdocNum']
  };
}



function ReadDatasetCatalog()
{
  var data = fs.readFileSync('data/dataset_catalog.txt', 'utf8');
  var lines = data.split('\n');
  var catalog = [];
  for (var i = 0; i < lines.length; i++)
  {
    var paras = lines[i].split(' ');
    var dataset = {
      'name' : paras[0],
      'clusterNum' : parseInt(paras[1]),
      'corpusNum' : parseInt(paras[2]),
      'timeslotNum' : parseInt(paras[3]),
      'maxdocNum' : parseInt(paras[4])
    };
    catalog.push(dataset);
  }
  return catalog;
}

function ReadSingleDoc(clusterID, corpusID, timeslotID, docID)
{
  var doc = {};
  var dir = dataroot + 'docdata/' + 'cluster_' + clusterID + '/corpus_' + corpusID + '/group_' + timeslotID;
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

function ReadGroupDocs(clusterID, corpusID, timeslotID, metadata)
{
  var docs = [];
  var dir = metadata['dataroot'] + 'docdata/' + 'cluster_' + clusterID + '/corpus_' + corpusID + '/group_' + timeslotID;
  for (var t = 0; t < metadata['maxdocNum']; t++)
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
  var root = dataroot + 'docdata/';
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

function ReadTopicVecs(clusterID, metadata)
{
  var topicvecs = [];
  for (var i = 0; i < metadata['timeslotNum']; i++)
  {
    var path = metadata['dataroot'] + 'docdata/cluster_' + clusterID + '/topics/topic' + i + '.txt';
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
  var root = dataroot + 'docdata/';
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

function ReadUserdata(username, metadata)
{
  var userdata;
  var data;

  var path = metadata['dataroot'] + 'userdata/' + username + '.txt';
  if (fs.existsSync(path) == true) {
    data = fs.readFileSync(path, 'utf8');
  } else {
    data = '';
  }
  userdata = ParseUserdata(data, metadata);
  return userdata;
}

function ModifyUserdata(username, clusterID, data, metadata)
{
  var path = metadata['dataroot'] + 'userdata/' + username + '.txt';
  var olddata;
  if (fs.existsSync(path) == true) {
    olddata = fs.readFileSync(path, 'utf8');
  } else {
    olddata = '';
  }

  var userdata = ParseUserdata(olddata, metadata);

  clusterID = parseInt(clusterID);

  var i, j, k;

  for (i = 0; i < metadata['corpusNum']; i++)
  {
    for (j = 0; j < metadata['timeslotNum']; j++)
    {
      userdata[clusterID][i][j] = parseInt(data[i][j]);
    }
  }

  var datastr = '';
  for (i = 0; i < metadata['clusterNum']; i++)
  {
    for (j = 0; j < metadata['corpusNum']; j++)
    {
      for (k = 0; k < metadata['timeslotNum']; k++)
      {
        datastr = datastr + userdata[i][j][k].toString() + ((k == metadata['timeslotNum'] - 1) ? '\n' : ' ');
      }
    }
    if (i != metadata['clusterNum'] - 1)
      datastr += '\n';
  }

  fs.writeFileSync(path, datastr);
}

function ParseUserdata(data, metadata)
{
  // console.log('data to be parsed:' + data + '\n');
  var userdata = [];
  for (var i = 0; i < metadata['clusterNum']; i++)
  {
    var corpora = [];
    for (var j = 0; j < metadata['corpusNum']; j++)
    {
      var timeslots = [];
      for (var k = 0; k < metadata['timeslotNum']; k++)
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
  for (i = 0; i < metadata['clusterNum']; i++)
  {
    for (j = 0; j < metadata['corpusNum']; j++)
    {
      var dataline = datalines[i * metadata['corpusNum'] + j];
      var tags = dataline.split(' ');
      for (k = 0; k < metadata['timeslotNum']; k++)
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

function ReadDatasetInfo(metadata)
{
  var path = metadata['dataroot'] + 'dataset_information.txt';
  var data = fs.readFileSync(path, 'utf8');
  var lines = data.split('\n');
  var datasetinfo = [];
  for (var i = 0; i < metadata['clusterNum']; i++)
  {
    var clusterinfo = [];
    for (var j = 0; j < metadata['corpusNum']; j++)
    {
      var corpusinfo = [];
      var linedata = lines[i * 6 + 1 + j].split(' ');
      for (var k = 0; k < metadata['timeslotNum']; k++)
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

