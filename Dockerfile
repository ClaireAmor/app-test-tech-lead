FROM node:alpine
COPY . /app
WORKDIR /app
RUN npm install
COPY . .
EXPOSE 8080
CMD npm run start