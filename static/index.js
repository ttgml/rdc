var ws = null;
var connected = false;

var serverUrl = "ws://" + location.host + "/log";
console.log(serverUrl)

var connectionStatus = $('#connectionStatus');

var historyList;

var reloadButton = $('#reloadButton');
var stopButton = $('#stopButton');
var clearMessage = $('#clearMessage');

var service_list = new Array();
var container_list = new Array();
var serviceList = $('#ss')
var containerList = $('#cc')

var info;
var msg;

var needscroll = true;

var open = function() {
    console.log("open click")
    ws = new WebSocket(serverUrl);
    ws.onopen = onOpen;
    ws.onclose = onClose;
    ws.onmessage = onMessage;
    ws.onerror = onError;
    connectionStatus.text('OPENING ...');
};

var reset = function() {
    connected = false;
    connectionStatus.text('STOPED');
};

var clearLog = function() {
    $('#messages').html('');
};

var onOpen = function() {
    console.log('OPENED: ' + serverUrl);
    connected = true;
    connectionStatus.text('OPENED');
};

var onClose = function() {
    if (ws){
        ws.close()
    }
    ws = null;
    reset();
};

var onMessage = function(event) {
    var data = event.data;
    addMessage(data);
};

var onError = function(event) {
    alert(event.type);
};

var addMessage = function(data) {
    var msg = $('<pre>').text(data);
    var messages = $('#messages');
    messages.append(msg);
    var msgBox = messages.get(0);
    if (document.getElementById("needScroll").checked){

        msgBox.scrollTop = msgBox.scrollHeight;
    }else{
        msgBox.scrollTop = msgBox.scrollTop;
    }
};

var guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

WebSocketClient = {
    init: function() {
        connectionStatus = $('#connectionStatus');

        stopButton.click(function(e) {
            close();
        });
        reloadButton.click(function (){
            close();
            open();
        })


    }
};
$('#clearMessage').click(function(e) {
    clearLog();
});
$('#stopButton').click(function (){
    stop_log();
})
$('#reloadButton').click(function (){
    reload_log();
})

function get_docker_info(){
    $.get("/info", function (data, status){
        console.log(data);
        info = data
        for (var s in data["services"]){
            s_name = data["services"][s]["Spec"]["Name"]
            service_list.push(s_name)
        }
        for (var c in data["containers"]){
            c_name = data["containers"][c]["Name"]
            container_list.push(c_name)
        }
    })
}

function load_sc(){
    for (i in service_list) {
        var ss_list = $('<li>').attr('id', guid()).append(
            $('<a>').attr('title', service_list[i])
                .attr('class', 'historyUrl')
                .attr('href', '#')
                .attr('onclick',"ss_load_it('"+ i +"')")
                .append(service_list[i])
        )
        ss_list.prependTo(serviceList)
    }
    for (i in container_list) {
        var cc_list = $('<li>').attr('id', guid()).append(
            $('<a>').attr('title', container_list[i])
                .attr('class', 'historyUrl')
                .attr('href', '#')
                .attr('onclick',"cc_load_it('"+ i +"')")
                .append(container_list[i])
        )
        cc_list.prependTo(containerList)
    }
}

function ss_load_it(index){
    openit(index,"ss")
}

function cc_load_it(index){
    openit(index,"cc")
}

function openit(index,type){

    if (type == "ss"){
        msg = {
            "type":2,
            "t":"ss",
            "id": info['services'][index]['ID'],
        }
    }
    if (type == "cc"){
        msg = {
            "type":2,
            "t":"cc",
            "id": info['containers'][index]['Id']
        }
    }
    console.log(msg)
    clearLog()
    open()
    setTimeout(function (){
        start_log()
    },100)
}

function start_log(){
    if (ws){
        ws.send(JSON.stringify(msg))
    } else {
        console.log(ws)
    }

}
function stop_log(){
    onClose()
}
function reload_log(){
    onClose()
    open()
    setTimeout(function (){
        start_log()
    },100)
}

var WebSocketClient;

$(function() {
    //WebSocketClient.init();
    get_docker_info();
    setTimeout(function (){
        load_sc()
    }, 200)
    // load_sc();
})
