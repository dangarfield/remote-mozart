FROM node:10-alpine

COPY . /app
WORKDIR /app
RUN npm install && npm install -g pm2
CMD pm2-runtime pm2.json