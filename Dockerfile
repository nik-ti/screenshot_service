
FROM node:20-bookworm

# Install basic dependencies for Playwright
RUN npx playwright install-deps

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Install browsers
RUN npx playwright install chromium

EXPOSE 3001

CMD ["npm", "start"]
