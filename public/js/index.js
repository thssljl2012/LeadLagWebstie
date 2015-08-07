var current_clusterID = 0;
var current_corpusID = 0;
var current_groupID = 0;
var current_docID = 0;
var current_docs = [];

var submit_timer;

function ChangeTimeslot()
{
    DisplayDocument();
    InitializeDocpickerStyle();
    InitializeTimeslotStyle();
    InitializeTopicVectorStyle();
}

function ChangeTopicCluster()
{
    DisplayDocument();
    DisplayTopicVector();
    InitializeElementStyle();
    LoadUserdata();
    SetAutomaticSubmitTimer();
}

function BindClickEvent()
{
    $('.doc-picker').click(function(){
        current_docID = parseInt($(this).attr('id').split('_')[1]);
        DisplayDocument();
    });

    $('.timeslot-box').click(function(){
        current_corpusID = parseInt($(this).attr('id').split('-')[2]);
        current_groupID = parseInt($(this).attr('id').split('-')[3]);
        current_docID = 0;

        GetCurrentDocGroup(ChangeTimeslot);
    });

    $('.topic-link').click(function(){
        clearInterval(submit_timer);
        SubmitUserdata();

        current_clusterID = parseInt($(this).attr('id').split('-')[1]);
        current_corpusID = 0;
        current_groupID = 0;
        current_docID = 0;

        GetCurrentDocGroup(ChangeTopicCluster);
    });
}

function InitializeClusterPickerStyle()
{
    $('.topic-link').css({
        'background-color' : 'transparent'
    });
    $('#topic-' + current_clusterID).css({
        'background-color'  : '#191818'
    });
}

function InitializeDocpickerStyle()
{
    $('.doc-picker').css({
        'background-color': function(){
            var id = parseInt($(this).attr('id').split('_')[1]);
            if (id % 2 == 0) {
                return '#1f8dd6';
            } else {
                return '#129FEA';
            }
        },
        'width': function(){
            return 1.0 / maxdocNum * 100.0 + '%';
        }
    }).html(function(){
        //var cluster = clusters[current_clusterID];
        //var corpus = cluster[current_corpusID];
        //var group = corpus[current_groupID];

        var id = parseInt($(this).attr('id').split('_')[1]);
        if (id + 1 > GetCurrentGroupSize())
            return '';
        else
            return id;
    });
}

function InitializeTimeslotStyle()
{
    $('.timeslot').css({
        'width' : function(){
            return 1.0 / timeslotNum * 100.0 + '%';
        }
    });

    $('.timeslot-box').html(function(){
        var corpusID = parseInt($(this).attr('id').split('-')[2]);
        var groupID = parseInt($(this).attr('id').split('-')[3]);
        return datasetinfo[current_clusterID][corpusID][groupID];
    }).css({
        'background-color' : function(){
            var groupID = parseInt($(this).attr('id').split('-')[3]);
            if (groupID % 2 == 0) {
                return '#1f8dd6';
            } else {
                return '#129FEA';
            }
        }
    });

    $('#timeslot-box-' + current_corpusID + '-' + current_groupID).css({
        'background-color': 'lightcoral'
    });

    $('.rank-tag').css({
        'background-color' : function(){
            var groupID = parseInt($(this).attr('id').split('-')[3]);
            if (groupID % 2 == 0) {
                return '#1f8dd6';
            } else {
                return '#129FEA';
            }
        }
    });
}

function InitializeTopicVectorStyle()
{
    $('.topic-vec').css({
        'width' : function(){
            return 1.0 / timeslotNum * 100.0 + '%';
        },
        'background-color' : function(){
            var index = $('.topic-vec').index($(this));
            if (index % 2 == 0) {
                return '#1f8dd6';
            } else {
                return '#129FEA';
            }
        }
    });

    $('.ts-fe-word').css({
        'background-color' : 'transparent'
    });
}

function InitializeElementStyle()
{
    InitializeClusterPickerStyle();
    InitializeDocpickerStyle();
    InitializeTimeslotStyle();
    InitializeTopicVectorStyle();
}


function SortWordVector(wordvec)
{
    var keySorted = Object.keys(wordvec).sort(function(a, b){
        return wordvec[b] - wordvec[a];
    });
    var sortedvec = {};
    for (var i = 0; i < keySorted.length; i++)
    {
        //sortedvec += keySorted[i] + '  ' + wordvec[keySorted[i]] + '\n';
        sortedvec[keySorted[i]] = wordvec[keySorted[i]];
    }
    return sortedvec;
}

function WordvecToString(wordvec)
{
    var str = '';
    var keys = Object.keys(wordvec);
    for (var i = 0; i < keys.length; i++)
    {
        str += keys[i] + '  ' + wordvec[keys[i]] + '\n';
    }
    return str;
}

function GetCurrentGroupSize()
{
    return datasetinfo[current_clusterID][current_corpusID][current_groupID];
}

function GetCurrentDocGroup(callback)
{
    $.post('/getgroupdoc', {
        'clusterID' : current_clusterID,
        'corpusID' : current_corpusID,
        'timeslotID' : current_groupID
    }, function(data){
        current_docs = data;
        // console.log(current_docs);
        callback();
    });
}

function DisplayDocument()
{
    $('.doc-picker').css({
        'border-bottom' : 'none'
    });

    //var request = {
    //    'clusterID' : current_clusterID,
    //    'corpusID' : current_corpusID,
    //    'timeslotID' : current_groupID,
    //    'docID' : current_docID
    //};

    if (current_docID + 1 > GetCurrentGroupSize())
        return;

    var doc = current_docs[current_docID];

    $('#doc-content-box').val(doc['content']);

    var wordvec = doc['wordvec'];
    var sortedvec = SortWordVector(wordvec);
    var vecstring = WordvecToString(sortedvec);

    $('#doc-feature-box').val(vecstring);

    $('#doc_' + current_docID).css({
        'border-bottom' : '8px solid lightcoral'
    });
}

function BindTopicVectorEvent()
{
    $('.ts-fe-word').click(function(e){
        var word = $(this).html();
        var groupsize = GetCurrentGroupSize();
        $('.doc-picker').css({
            'background-color' : function(){
                var id = parseInt($(this).attr('id').split('_')[1]);

                if (id + 1 > groupsize)
                    return (id % 2 == 0) ? '#1f8dd6' : '#129FEA';

                if (word in current_docs[id]['wordvec']) {
                    return 'lightcoral';
                } else {
                    return (id % 2 == 0) ? '#1f8dd6' : '#129FEA';
                }
            }
        });
        $('.ts-fe-word').css({
            'background-color' : 'transparent'
        });
        $(this).css({
            'background-color' : 'lightcoral'
        });
    });
}

function DisplayTopicVector()
{
    var request = {'clusterID' : current_clusterID};

    $.post('/gettopic', request, function(data){
        topicvecs = data;

        $('.single-topic-fea').html(function(){
            var id = parseInt($(this).attr('id').split('-')[1]);
            var wordvec = topicvecs[id];
            var sortedvec = SortWordVector(wordvec);
            var html = '';
            var keys = Object.keys(sortedvec);
            for (var i = 0; i < keys.length; i++)
            {
                html += '<div class="ts-fe-word">' + keys[i] + '</div>';
            }
            return html;
        });

        BindTopicVectorEvent();
    });
}

function LoadUserdata()
{
    $('.rank-tag-input').val('');
    var tagdata = userdata[current_clusterID];
    for (var i = 0; i < tagdata.length; i++)
    {
        for (var j = 0; j < tagdata[i].length; j++)
        {
            if (tagdata[i][j] != -1)
            {
                $('#rank-tag-' + i + '-' + j).val(tagdata[i][j]);
            }
        }
    }
}

function SubmitUserdata()
{
    var tagdata = [];
    var corpusNum = $('.corpus-row').size();
    var timeslotNum = $('.timeslot').size() / corpusNum;
    for (var i = 0; i < corpusNum; i++)
    {
        var timeslotdata = [];
        for (var j = 0; j < timeslotNum; j++)
        {
            var rank;
            var value = $('#rank-tag-' + i + '-' + j).val();
            if (value == '') {
                rank = -1;
            } else {
                rank = parseInt(value);
            }
            userdata[current_clusterID][i][j] = rank;
            timeslotdata.push(rank);
        }
        tagdata.push(timeslotdata);
    }

    var datatosubmit = {
        'data' : tagdata,
        'clusterID' : current_clusterID,
        'username' : username
    };

    $.post('/submitdata', datatosubmit, function(data){
        console.log(data);
    });
}

function SetAutomaticSubmitTimer()
{
    submit_timer = setInterval(function(){
        SubmitUserdata();
    }, 1000);
}

function Initialize()
{
    DisplayDocument();
    DisplayTopicVector();

    InitializeElementStyle();
    BindClickEvent();

    LoadUserdata();
    SetAutomaticSubmitTimer();
}

function StartProcess()
{
    GetCurrentDocGroup(Initialize);
}

StartProcess();
