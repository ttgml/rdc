rdc
===

可以通过 Web 方式查看 docker 容器/服务的控制台实时输出。

Web 端通过 websocket 连接到服务器，然后服务端通过 docker sdk 从指定容器里面取日志输出，web 拿到日志后就直接打印日志。

### Usage

```
docker
# docker --rm -it -P -v /path/to/docker.sock:/run/docker.sock rdc:v1

or

command
# python run.py

=> 

Web Console
http://[ip]:4000
```
