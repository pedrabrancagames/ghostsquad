# Arquitetura do Sistema - Ghost Squad

## Visão Geral da Arquitetura

O Ghost Squad é uma aplicação web progressiva (PWA) que combina tecnologias web modernas com realidade aumentada para criar uma experiência de jogo imersiva. A arquitetura é baseada em componentes modulares que se comunicam através de uma estrutura bem definida.

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cliente Web (Navegador)                      │
├─────────────────────────────────────────────────────────────────┤
│  Interface do Usuário (UI)                                      │
│  • Telas e componentes visuais                                  │
│  • Animações e efeitos visuais                                  │
│  • Sistema de notificações                                      │
├─────────────────────────────────────────────────────────────────┤
│  Lógica do Jogo                                                 │
│  • Gerenciador de Estado do Jogo                                │
│  • Gerenciador de Autenticação                                 │
│  • Gerenciador de Realidade Aumentada                          │
│  • Gerenciador de Mapas                                        │
│  • Gerenciador de QR Codes                                     │
│  • Gerenciador de Rankings                                     │
├─────────────────────────────────────────────────────────────────┤
│  Integrações Externas                                           │
│  • Firebase (Auth, Database, Storage)                          │
│  • A-Frame (Realidade Aumentada)                               │
│  • Leaflet (Mapas)                                             │
│  • html5-qrcode (Scanner QR)                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Servidor (Firebase)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Autenticação de Usuários                                     │
│  • Armazenamento de Dados em Tempo Real                         │
│  • Hospedagem de Arquivos (Modelos 3D, Imagens, Áudio)          │
│  • Regras de Segurança                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Painel Administrativo                         │
├─────────────────────────────────────────────────────────────────┤
│  • Gerenciamento de Usuários                                    │
│  • Configuração do Jogo                                         │
│  • Cadastro de Fantasmas e Eventos                              │
│  • Relatórios e Estatísticas                                    │
│  • Logs de Auditoria                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Gerenciador Principal (game-manager.js)

O componente central que coordena todos os outros componentes:

**Responsabilidades**:
- Inicialização da aplicação
- Coordenação entre módulos
- Gerenciamento do ciclo de vida do jogo
- Processamento de eventos principais

**Dependências**:
- AuthManager
- GameStateManager
- ARManager
- UIManager
- MapManager
- QRManager
- RankingsManager
- FirebaseDataManager

### 2. Gerenciador de Autenticação (auth-manager.js)

**Funções**:
- Gerenciamento de autenticação Firebase
- Login com Google, email/senha e anônimo
- Sincronização com banco de dados
- Gerenciamento de estado de autenticação

**Integrações**:
- Firebase Authentication
- Firebase Realtime Database

### 3. Gerenciador de Estado do Jogo (game-state.js)

**Responsabilidades**:
- Gerenciamento de estatísticas do usuário
- Controle do inventário
- Configurações do jogo
- Gerenciamento de localizações
- Carregamento de conteúdo ativo

**Armazenamento**:
- Dados em memória durante a sessão
- Persistência no Firebase Database

### 4. Gerenciador de Realidade Aumentada (ar-manager.js)

**Funções**:
- Configuração do ambiente AR com A-Frame
- Posicionamento de objetos 3D
- Hit testing para interação
- Animações e comportamentos de modelos

**Tecnologias**:
- A-Frame WebXR
- Three.js para renderização 3D

### 5. Gerenciador de Interface do Usuário (ui-manager.js)

**Responsabilidades**:
- Renderização de telas e componentes
- Gerenciamento de eventos de interface
- Atualização de elementos visuais
- Sistema de notificações

**Componentes**:
- Telas de autenticação
- Seleção de localização
- Interface do jogo principal
- Modal de inventário
- Scanner de QR Code

### 6. Gerenciador de Mapas (map-manager.js)

**Funções**:
- Integração com Leaflet
- Exibição de mapa interativo
- Posicionamento de marcadores
- Cálculo de proximidade

**Recursos**:
- Mapas OpenStreetMap
- Localização GPS em tempo real
- Marcadores personalizados

### 7. Gerenciador de QR Codes (qr-manager.js)

**Responsabilidades**:
- Leitura de QR Codes
- Validação de unidade de contenção
- Integração com html5-qrcode

### 8. Gerenciador de Rankings (rankings.js)

**Funções**:
- Carregamento de rankings
- Exibição de posições
- Destaque do jogador atual

### 9. Gerenciador de Dados do Firebase (firebase-data-manager.js)

**Responsabilidades**:
- Carregamento de conteúdo dinâmico
- Filtragem baseada em eventos ativos
- Sincronização com o estado do jogo

## Sistemas de Suporte

### 1. Sistema de Efeitos Visuais (visual-effects.js)

**Características**:
- Partículas em canvas 2D
- Efeitos de captura e sucção
- Animações de celebração
- Efeitos do Proton Pack

**Performance**:
- Limitação de partículas para dispositivos móveis
- Limpeza automática de elementos antigos
- Otimização para contexto AR

### 2. Sistema de Animações (animations.js)

**Recursos**:
- Animações CSS pré-definidas
- Sistema de sequências
- Animações específicas do jogo
- Helpers para animações personalizadas

### 3. Sistema de Notificações (notifications.js)

**Tipos**:
- Toast notifications
- Notificações de sucesso/erro
- Notificações específicas do jogo
- Sistema de progresso

### 4. Efeito de Fundo (login-background.js)

**Funções**:
- Partículas de ectoplasma na tela de login
- Efeito visual imersivo
- Animação em canvas 2D

## Fluxo de Dados

### 1. Inicialização da Aplicação
```
index.html → main.js → game-manager.init()
                    ↓
            Carregamento de módulos
                    ↓
         Inicialização de componentes
                    ↓
               Tela de login
```

### 2. Autenticação do Usuário
```
UI Event → AuthManager.signIn()
          ↓
   Firebase Authentication
          ↓
   onAuthStateChanged listener
          ↓
   Carregamento de dados do usuário
          ↓
   Atualização da interface
```

### 3. Início do Jogo
```
Seleção de localização → GameStateManager.setSelectedLocation()
                      ↓
              Carregamento de conteúdo
                      ↓
               Início do modo AR
                      ↓
                Interface do jogo
```

### 4. Caça aos Fantasmas
```
GPS Update → MapManager.updatePlayerPosition()
          ↓
   MapManager.checkProximity()
          ↓
   Atualização de indicadores
          ↓
   Posicionamento de fantasma AR
          ↓
   Interação via Proton Pack
          ↓
   Captura e atualização de estado
```

### 5. Depósito de Fantasmas
```
UI Event → QRManager.startQrScanner()
        ↓
     Leitura de QR Code
        ↓
   Validação da unidade
        ↓
    GameStateManager.clearInventory()
        ↓
   Atualização de pontos
        ↓
       Geração de novo fantasma
```

## Banco de Dados

### Estrutura do Firebase Realtime Database

#### Coleção de Usuários (`users`)
```
{
  "USER_ID": {
    "displayName": string,
    "email": string,
    "points": number,
    "captures": number,
    "level": number,
    "inventory": array,
    "ecto1Unlocked": boolean,
    "lastActive": timestamp
  }
}
```

#### Configurações do Jogo (`gameConfig`)
```
{
  "inventoryLimit": number,
  "captureRadius": number,
  "ecto1UnlockCount": number,
  "captureDuration": {
    "common": number,
    "strong": number
  }
}
```

#### Localizações (`locations`)
```
{
  "LOCATION_ID": {
    "name": string,
    "lat": number,
    "lon": number,
    "active": boolean
  }
}
```

#### Fantasmas (`ghosts`)
```
{
  "GHOST_ID": {
    "name": string,
    "type": "fraco"|"medio"|"forte",
    "points": number,
    "modelUrl": string,
    "behavior": "orbit"|"stationary",
    "scale": number,
    "eventId": string (opcional)
  }
}
```

#### Eventos (`events`)
```
{
  "EVENT_ID": {
    "name": string,
    "startDate": date,
    "endDate": date,
    "startTime": time,
    "endTime": time,
    "logoUrl": string,
    "id": string
  }
}
```

#### Administradores (`admins`)
```
{
  "ADMIN_ID": {
    "email": string,
    "name": string,
    "role": "admin"|"superadmin",
    "permissions": array,
    "createdAt": timestamp,
    "lastLogin": timestamp
  }
}
```

#### Logs de Auditoria (`auditLogs`)
```
{
  "LOG_ID": {
    "adminId": string,
    "action": string,
    "timestamp": timestamp,
    "details": object,
    "adminEmail": string,
    "adminName": string,
    "ipAddress": string
  }
}
```

## Segurança

### Autenticação
- Firebase Authentication para gerenciamento seguro
- Verificação de privilégios para administradores
- Proteção contra acesso não autorizado

### Autorização
- Regras de segurança do Firebase Database
- Validação de permissões por componente
- Logs de todas as ações administrativas

### Proteção de Dados
- Criptografia em trânsito (HTTPS)
- Validação de dados no cliente e servidor
- Proteção contra ataques comuns (XSS, CSRF)

## Performance

### Otimizações
- Lazy loading de recursos
- Cache de assets estáticos
- Limitação de partículas e efeitos visuais
- Otimização de modelos 3D para mobile

### Monitoramento
- Logs de erro em produção
- Monitoramento de performance
- Análise de uso e métricas

## Escalabilidade

### Horizontal
- Firebase escala automaticamente
- CDN para assets estáticos
- Arquitetura stateless

### Vertical
- Configuração de limites de dados
- Otimização de consultas
- Indexação adequada

## Manutenção e Deploy

### Estratégia de Deploy
- Deploy contínuo via GitHub Pages ou similar
- Versionamento semântico
- Rollback em caso de problemas

### Monitoramento
- Firebase Performance Monitoring
- Relatórios de erro do navegador
- Logs de auditoria

### Atualizações
- Atualização de conteúdo via Firebase
- Deploy de código através de CI/CD
- Testes automatizados antes de releases