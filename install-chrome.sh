#!/bin/bash

# Atualiza pacotes e instala dependências do Chrome
apt-get update
apt-get install -y wget gnupg2

# Adiciona chave do Google e repo do Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# Atualiza e instala o Google Chrome estável
apt-get update
apt-get install -y google-chrome-stable

# Verifica instalação
google-chrome --version
