FROM python:3.9.13-slim-buster
ADD . /code
WORKDIR /code
EXPOSE 4000
RUN python -m pip install -r /code/requirements.txt
CMD python run.py