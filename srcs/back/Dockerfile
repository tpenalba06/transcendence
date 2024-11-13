FROM python:3.11.4-alpine

WORKDIR /usr/src/app
COPY ./requirements.txt /usr/src/app/requirements.txt
COPY ./script.sh /usr/src/app/script.sh
RUN apk --update add postgresql-client
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m pip uninstall channels
RUN python -m pip install -Iv channels==3.0.5
COPY . .

ENTRYPOINT ["./script.sh"]