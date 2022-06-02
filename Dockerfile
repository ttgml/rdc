FROM python:3.9.13-slim-buster
ADD . /code
WORKDIR /code
EXPOSE 4000
RUN python -m pip install -r /code/requirements.txt -i https://pypi.doubanio.com/simple
CMD pwd && gunicorn -w 2 -b 0.0.0.0:4000 run:app