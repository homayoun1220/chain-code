FROM node:16-alpine
WORKDIR /home
COPY . .
RUN npm install
EXPOSE 7052
CMD ["npm", "run", "start"]