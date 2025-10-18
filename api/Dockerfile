# Base image
FROM node:22-alpine

# Crea la directory dell'applicazione
WORKDIR /usr/src/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Compila l'applicazione
RUN npm run build

# Esponi la porta 3000
EXPOSE 3000

# Comando per avviare l'applicazione
CMD ["npm", "run", "start:debug"]