FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ghostscript \
    libreoffice \
    qpdf \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir pdf2docx pypdf cryptography pdfplumber pandas openpyxl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# In production, you might compile TS to JS, but for now we run via tsx
CMD ["npm", "start"]
