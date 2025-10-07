# Documentação Técnica - Ghost Squad

## Visão Geral

O Ghost Squad é um jogo de realidade aumentada (AR) baseado no universo dos Caça-Fantasmas, onde os jogadores caçam fantasmas em locais do mundo real usando seus dispositivos móveis. O jogo utiliza tecnologia WebAR com A-Frame, Firebase para autenticação e armazenamento de dados, e recursos de localização GPS para criar uma experiência imersiva.

## Arquitetura do Sistema

### Tecnologias Principais

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework AR**: A-Frame 1.5.0
- **Bibliotecas**:
  - Leaflet para mapas interativos
  - html5-qrcode para leitura de QR Codes
  - Three.js para modelos 3D
- **Backend**: Firebase (Authentication, Realtime Database, Storage)
- **Testes**: Jest com jsdom

### Estrutura de Diretórios

```
ghostbusters---mais-fantasmas/
├── admin/                 # Painel administrativo
├── assets/                # Recursos visuais e de áudio
│   ├── audio/             # Efeitos sonoros
│   ├── images/            # Imagens da interface
│   └── models/            # Modelos 3D de fantasmas
├── docs/                  # Documentação do projeto
├── tests/                 # Arquivos de teste
├── *.js                   # Módulos principais do jogo
├── index.html             # Ponto de entrada da aplicação
├── style.css              # Estilos principais
└── package.json           # Dependências e scripts
```

## Componentes Principais

### 1. Gerenciador de Autenticação (auth-manager.js)

Responsável por gerenciar a autenticação de usuários usando Firebase Authentication:

- Login com Google
- Login como visitante (anônimo)
- Login com email e senha
- Registro de novos usuários
- Sincronização com o banco de dados

### 2. Gerenciador de Estado do Jogo (game-state.js)

Controla o estado do jogo, incluindo:

- Estatísticas do usuário (pontos, capturas, nível)
- Inventário de fantasmas capturados
- Configurações do jogo (raio de captura, limite de inventário)
- Localizações disponíveis para caça
- Conteúdo ativo (fantasmas e eventos)

### 3. Gerenciador de Realidade Aumentada (ar-manager.js)

Gerencia elementos de realidade aumentada:

- Posicionamento de objetos no ambiente AR
- Hit testing para interação com superfícies
- Renderização de modelos 3D de fantasmas
- Animações e comportamentos dos fantasmas

### 4. Gerenciador de Interface do Usuário (ui-manager.js)

Controla toda a interface do usuário:

- Telas de login e seleção de localização
- Interface do jogo (inventário, mapa, indicadores)
- Scanner de QR Code para depósito de fantasmas
- Notificações e mensagens

### 5. Gerenciador de Mapas (map-manager.js)

Integra com Leaflet para:

- Exibição do mapa com localização do jogador
- Marcação de pontos de interesse (fantasmas, ECTO-1)
- Cálculo de proximidade com objetos
- Atualização em tempo real da posição

### 6. Gerenciador de QR Codes (qr-manager.js)

Utiliza html5-qrcode para:

- Leitura de QR Codes para depósito de fantasmas
- Validação da unidade de contenção oficial

### 7. Gerenciador de Rankings (rankings.js)

Mostra o ranking dos jogadores:

- Listagem dos melhores caçadores
- Pontuação e número de capturas
- Destaque do jogador atual

### 8. Gerenciador de Dados do Firebase (firebase-data-manager.js)

Busca e filtra dados do jogo:

- Carregamento de fantasmas ativos
- Gerenciamento de eventos especiais
- Filtragem de conteúdo baseado em eventos ativos

## Funcionalidades Principais

### 1. Autenticação de Usuários

O jogo oferece três formas de autenticação:

1. **Login com Google**: Autenticação social rápida e segura
2. **Login com Email/Senha**: Sistema tradicional de cadastro
3. **Visitante**: Acesso sem necessidade de registro

### 2. Seleção de Localização

Os jogadores podem escolher entre várias áreas de caça pré-configuradas, onde os fantasmas estarão disponíveis para captura.

### 3. Caça aos Fantasmas

A experiência principal do jogo:

- Uso de GPS para localizar fantasmas próximos
- Visualização em AR dos modelos 3D dos fantasmas
- Interação através do Proton Pack (pressionar e segurar)
- Barra de progresso durante a captura

### 4. Inventário e Depósito

- Limite de 5 fantasmas no inventário
- Depósito na unidade de contenção através de QR Code
- Ganho de pontos após o depósito

### 5. Desbloqueio do ECTO-1

Após capturar 5 fantasmas, os jogadores desbloqueiam o ECTO-1, que aparece como um ponto no mapa para ser encontrado.

### 6. Sistema de Rankings

Mostra os melhores caçadores com base em pontos acumulados.

## Sistema Visual e de Efeitos

### 1. Sistema de Efeitos Visuais (visual-effects.js)

Implementa partículas e animações especiais:

- Efeitos de celebração ao capturar fantasmas
- Feixe de prótons durante a captura
- Efeitos de sucção do fantasma para o inventário
- Efeitos de falha na captura

### 2. Sistema de Animações (animations.js)

Gerencia animações CSS e JavaScript:

- Animações de pulso e brilho
- Efeitos de captura e sucção
- Animações da Proton Pack
- Efeitos de UI

### 3. Sistema de Notificações (notifications.js)

Sistema avançado de notificações toast:

- Notificações de sucesso, erro e aviso
- Notificações específicas do jogo (fantasma capturado, ECTO-1 desbloqueado)
- Animações e estilos personalizados

### 4. Efeito de Fundo (login-background.js)

Partículas de ectoplasma na tela de login para criar uma atmosfera imersiva.

## Painel Administrativo

### Estrutura

O painel administrativo permite gerenciar todos os aspectos do jogo:

- Dashboard com métricas em tempo real
- Gerenciamento de usuários
- Cadastro e configuração de fantasmas
- Criação de eventos especiais
- Relatórios e estatísticas
- Configurações globais do jogo
- Gerenciamento de localizações
- Logs de auditoria e sistema

### Segurança

- Autenticação específica para administradores
- Verificação de privilégios
- Logs de todas as ações administrativas
- Regras de segurança do Firebase

## Banco de Dados (Firebase Realtime Database)

### Estrutura Principal

```json
{
  "users": {
    "USER_ID": {
      "displayName": "Nome do Usuário",
      "email": "email@exemplo.com",
      "points": 150,
      "captures": 15,
      "level": 3,
      "inventory": [...],
      "ecto1Unlocked": true
    }
  },
  "gameConfig": {
    "inventoryLimit": 5,
    "captureRadius": 15,
    "ecto1UnlockCount": 5,
    "captureDuration": {
      "common": 5000,
      "strong": 8000
    }
  },
  "locations": {
    "LOCAL_ID": {
      "name": "Praça Central",
      "lat": -27.630913,
      "lon": -48.679793,
      "active": true
    }
  },
  "ghosts": {
    "GHOST_ID": {
      "name": "Fantasma Comum",
      "type": "fraco",
      "points": 10,
      "modelUrl": "assets/models/ghost.glb",
      "behavior": "orbit",
      "scale": 1.0
    }
  },
  "events": {
    "EVENT_ID": {
      "name": "Halloween Especial",
      "startDate": "2025-10-31",
      "endDate": "2025-11-02",
      "logoUrl": "url_da_logo"
    }
  },
  "admins": {
    "ADMIN_ID": {
      "email": "admin@exemplo.com",
      "name": "Administrador",
      "role": "admin",
      "permissions": ["users.manage", "stats.view"]
    }
  },
  "auditLogs": {
    "LOG_ID": {
      "adminId": "ADMIN_ID",
      "action": "login",
      "timestamp": "2025-01-15T10:00:00Z",
      "details": {...}
    }
  }
}
```

## Testes

O projeto utiliza Jest para testes automatizados:

- Testes unitários dos gerenciadores principais
- Mocks para dependências externas (Firebase, Leaflet, etc.)
- Testes de componentes específicos

## Deploy e Configuração

### Requisitos

1. Conta no Firebase com projeto configurado
2. Firebase Realtime Database criado
3. Regras de segurança configuradas corretamente
4. Usuários administradores cadastrados

### Passos para Deploy

1. Criar projeto no Firebase
2. Configurar Realtime Database
3. Aplicar regras de segurança
4. Cadastrar administradores no banco de dados
5. Configurar `firebase-config.js` com as credenciais
6. Fazer deploy dos arquivos estáticos

## Considerações Técnicas

### Performance

- Otimização de modelos 3D para dispositivos móveis
- Limitação do número de partículas nos efeitos visuais
- Cache de recursos para melhor experiência
- Lazy loading de assets

### Compatibilidade

- Navegadores com suporte a WebAR (Chrome, Safari, Firefox)
- Dispositivos móveis com GPS e câmera
- Conexão com internet para autenticação e dados

### Segurança

- Autenticação obrigatória para funcionalidades do jogo
- Regras de segurança no Firebase Database
- Validação de dados no cliente e servidor
- Proteção contra acesso não autorizado ao painel admin

## Manutenção

### Atualizações de Conteúdo

- Adição de novos fantasmas através do painel admin
- Criação de eventos especiais sazonais
- Atualização de localizações de caça
- Modificação de configurações do jogo

### Monitoramento

- Logs de auditoria de ações administrativas
- Monitoramento de erros em produção
- Análise de métricas de uso
- Verificação de performance do sistema