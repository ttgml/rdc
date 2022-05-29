import json
from flask import Flask, jsonify, render_template
from flask_sock import Sock
import docker

client = docker.from_env()

app = Flask(__name__)
sock = Sock(app)

app.config['SOCK_SERVER_OPTIONS'] = {'ping_interval': 25}

@app.route("/")
def hello_world():
    return render_template("print_log.html")

@app.route("/info")
def echo_info():
    msg = {}
    services = []
    containers = []
    for srv in client.services.list():
        services.append(srv.attrs)
    for pod in client.containers.list():
        containers.append(pod.attrs)
    msg["services"] = services
    msg["containers"] = containers
    msg["type"] = 1
    return jsonify(msg)

@sock.route("/log")
def echo(ws):
    while True:
        data = ws.receive()
        msg = {}
        try:
            data_json = json.loads(data);
        except:
            print("readerror")
            msg["msg"] = "read data error , need json"
            ws.send(msg)
            ws.close()
        try:
            if data_json['type'] == 1:
                msg["type"] = 1
                ws.send(msg)
            elif data_json['type'] == 2:
                if data_json['t'] == "ss":
                    for line in client.services.get(data_json['id']).logs(follow=True,stderr=True,tail=20):
                        ws.send(line.decode())

                if data_json['t'] == "cc":
                    for line in client.containers.get(data_json['id']).logs(follow=True, tail=20, stream=True):
                        ws.send(line.decode())
                ws.send("ok")
            else:
                msg["type"] = 0
                msg["msg"] = "emmm..."
                ws.send(msg)
        except Exception as e:
            print(e)
            msg["msg"] = "bad parm"
            ws.send(msg)

