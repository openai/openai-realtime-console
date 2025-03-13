# Nutze ein offizielles Node.js-Image (z. B. Node 18 auf Alpine-Basis)
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden) in das Arbeitsverzeichnis
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Installiere die Abhängigkeiten
RUN npm install twilio

# Kopiere den Rest der Anwendung in das Arbeitsverzeichnis
COPY . .

# Exponiere den Port, auf dem die App läuft (standardmäßig 3000)
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]