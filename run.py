import json
import os.path

from flask import Flask, jsonify, render_template
from flask_sock import Sock
import docker

try:
    if os.path.exists("/.dockerenv"):
        client = docker.DockerClient(base_url='unix:///run/docker.sock')
    else:
        client = docker.from_env()
except Exception as e:
    print(e)
    print("Docker environment not found")
    print("Run again after install Docker")
    print("------------------------------")
    print("docker --rm -it -P -v /path/to/docker.sock:/run/docker.sock <image>")
    print("------------------------------")
    exit(1)

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
    try:
        for srv in client.services.list():
            services.append(srv.attrs)
    except Exception as e:
        pass
    try:
        for pod in client.containers.list():
            containers.append(pod.attrs)
    except Exception as e:
        msg["msg"] = str(e)
        return jsonify(msg), 500
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
            msg["msg"] = "read data error"
            ws.send(msg)
            ws.close()
        try:
            if data_json['type'] == 1:
                msg["type"] = 1
                ws.send(msg)
            elif data_json['type'] == 2:
                line = ""
                if data_json['t'] == "ss":
                    for i in client.services.get(data_json['id']).logs(follow=True,stderr=True,tail=20):
                        if i != b'\n':
                            line = line + i.decode()
                        else:
                            ws.send(line)
                            line = ""
                if data_json['t'] == "cc":
                    cr = client.containers.get(data_json['id'])
                    # for line in cr.logs(follow=True, stderr=True, tail=20, stream=True):
                    #     ws.send(line.decode())
                    for i in cr.logs(follow=True, stderr=True, tail=20, stream=True):
                        if i != b'\n':
                            line = line + i.decode()
                        else:
                            ws.send(line)
                            line = ""
                ws.send("done.")
            else:
                msg["type"] = 0
                msg["msg"] = "emmm..."
                ws.send(msg)
        except Exception as e:
            print(e)
            msg["msg"] = str(e)
            ws.send(msg)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)