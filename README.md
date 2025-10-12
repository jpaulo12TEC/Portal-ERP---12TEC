🏗️ INTRANET CORPORATIVA - ENGENHARIA INTEGRADA

Sistema interno desenvolvido em Node.js com TypeScript para centralizar e automatizar os processos da empresa de engenharia, integrando os setores Pessoal, Financeiro, SSMA (Segurança, Saúde e Meio Ambiente) e Qualidade (ISO 9001).

Foco principal: eficiência, rastreabilidade e padronização de processos conforme os requisitos da ISO 9001.

🚀 VISÃO GERAL

O projeto tem como objetivo fornecer uma plataforma única para a gestão de informações corporativas, otimizando rotinas internas, reduzindo retrabalho e promovendo o controle documental e a comunicação entre setores.

🧠 PRINCIPAIS FUNCIONALIDADES

Setor Pessoal

Cadastro e controle de colaboradores

Gestão de documentos e treinamentos obrigatórios

Alertas automáticos de vencimento (NRs, ASOs, certificados)

Setor Financeiro

Controle de despesas, receitas e fluxo de caixa

Emissão de relatórios e exportação em PDF

Dashboard com indicadores financeiros

Setor SSMA

Registro e acompanhamento de inspeções e auditorias

Controle de EPIs e relatórios de segurança

Indicadores de conformidade ambiental e de segurança

Setor da Qualidade (ISO 9001)

Controle de documentos, revisões e aprovações

Registro de não conformidades e ações corretivas

Indicadores de desempenho e conformidade com a norma

🛠️ TECNOLOGIAS UTILIZADAS

Node.js e TypeScript para o backend

Express.js para a criação de rotas e middlewares

Supabase (PostgreSQL) para banco de dados, autenticação e armazenamento

JWT e Bcrypt para autenticação segura

Axios, Helmet e CORS para segurança e comunicação com APIs

Docker e Azure Blob Storage para deploy e backups

Swagger (OpenAPI) para documentação da API

🗂️ ESTRUTURA DO PROJETO

O sistema é modularizado por setor:

pessoal → Gestão de colaboradores e documentos

financeiro → Controle financeiro e relatórios

ssma → Segurança, Saúde e Meio Ambiente

qualidade → Documentos, não conformidades e ações corretivas

Outras pastas de suporte:

config → Configurações do banco e autenticação

middlewares → Regras de segurança e validação

services → Lógica de negócios

utils → Funções auxiliares

🔐 AUTENTICAÇÃO E PERFIS DE USUÁRIO

O sistema utiliza autenticação baseada em JWT (JSON Web Token).
Perfis disponíveis:

Administrador: acesso total a todos os módulos

Gestor de Setor: acesso restrito ao seu respectivo módulo

Usuário: acesso apenas a informações pessoais e documentos próprios

📊 RELATÓRIOS E INTEGRAÇÕES

Exportação de dados para Excel e PDF

Dashboards por setor com indicadores de desempenho

API REST documentada via Swagger
