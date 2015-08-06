var current_clusterID = 0;
var current_corpusID = 0;
var current_groupID = 0;
var current_docID = 0;

var clusterNum = 13;
var corpusNum = 3;
var timeslotNum = 10;
var maxdocNum = 30;

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

        DisplayDocument();
        InitializeDocpickerStyle();
        InitializeTimeslotStyle();
        InitializeTopicVectorStyle();
    });

    $('.topic-link').click(function(){
        current_clusterID = parseInt($(this).attr('id').split('-')[1]);
        current_corpusID = 0;
        current_groupID = 0;
        current_docID = 0;

        DisplayDocument();
        DisplayTopicVector();
        InitializeElementStyle();
        LoadUserdata();
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
        var cluster = clusters[current_clusterID];
        var corpus = cluster[current_corpusID];
        var group = corpus[current_groupID];

        var id = parseInt($(this).attr('id').split('_')[1]);
        if (id + 1 > group.length)
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
        return clusters[current_clusterID][corpusID][groupID].length;
    }).css({
        //'background-color' : '#1f8dd6'
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

function DisplayDocument()
{
    $('.doc-picker').css({
        'border-bottom' : 'none'
    });

    var cluster = clusters[current_clusterID];
    var corpus = cluster[current_corpusID];
    var group = corpus[current_groupID];

    if (current_docID + 1 > group.length)
        return;

    var doc = group[current_docID];

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
        var cluster = clusters[current_clusterID];
        var corpus = cluster[current_corpusID];
        var group = corpus[current_groupID];
        $('.doc-picker').css({
            'background-color' : function(){
                var id = parseInt($(this).attr('id').split('_')[1]);
                if (id + 1 > group.length)
                    return (id % 2 == 0) ? '#1f8dd6' : '#129FEA';
                var doc = group[id];
                if (word in doc['wordvec']) {
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
    var timeslots = topics[current_clusterID];
    $('.single-topic-fea').html(function(){
        var id = parseInt($(this).attr('id').split('-')[1]);
        var wordvec = timeslots[id];
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
    setInterval(function(){
        SubmitUserdata();
    }, 1000);
}

function SetUnloadSubmitTrigger()
{
    window.onunload(function(){
        SubmitUserdata();
    });
}

function StartProcess()
{
    DisplayDocument();
    DisplayTopicVector();

    InitializeElementStyle();
    BindClickEvent();

    LoadUserdata();
    SetAutomaticSubmitTimer();
    SetUnloadSubmitTrigger();
}

StartProcess();
