FROM node:alpine

RUN mkdir /app
WORKDIR /app/
ADD ./ /app/
EXPOSE 8080

RUN npm install