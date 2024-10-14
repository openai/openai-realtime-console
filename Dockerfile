FROM node:alpine
WORKDIR /app
COPY . /app
RUN npm i
ENTRYPOINT ["npm"]
EXPOSE 3000
CMD ["start"]
