# Configuração de Regras de Segurança do Firebase para Painel Administrativo

## Visão Geral

Para que o painel administrativo funcione corretamente, é necessário configurar as regras de segurança do Firebase Realtime Database para permitir que administradores autenticados acessem os dados necessários.

## Regras Necessárias

### 1. Estrutura do Banco de Dados

O painel administrativo precisa acessar as seguintes estruturas de dados:
- `/users` - Dados dos usuários do jogo
- `/gameConfig` - Configurações globais do jogo
- `/locations` - Localizações de caça
- `/admins` - Lista de administradores
- `/auditLogs` - Logs de auditoria
- `/systemLogs` - Logs do sistema
- `/ghosts` - Dados dos fantasmas
- `/events` - Dados dos eventos

### 2. Regras de Segurança Recomendadas

Adicione as seguintes regras ao seu Firebase Realtime Database:

```javascript
{
  "rules": {
    // Regras para usuários do jogo
    "users": {
      // Apenas administradores podem ler todos os usuários
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Apenas administradores podem escrever
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()",
      "$uid": {
        // Usuários autenticados podem ler seus próprios dados (para o jogo)
        ".read": "auth != null && auth.uid == $uid",
        // Usuários autenticados podem escrever seus próprios dados (para o jogo)
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    
    // Regras para configurações do jogo
    "gameConfig": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Apenas administradores podem escrever
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    
    // Regras para localizações
    "locations": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Apenas administradores podem escrever
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()",
      "$locationId": {
        // Qualquer um pode ler localizações individuais (para o jogo)
        ".read": true
      }
    },
    
    // Regras para administradores
    "admins": {
      // Apenas administradores podem ler a lista de administradores
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Ninguém pode escrever diretamente (deve ser feito pelo console do Firebase)
      ".write": false
    },
    
    // Regras para logs de auditoria
    "auditLogs": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Qualquer administrador autenticado pode escrever logs
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    
    // Regras para logs do sistema
    "systemLogs": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Qualquer administrador autenticado pode escrever logs
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    
    // Regras para fantasmas
    "ghosts": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Apenas administradores podem escrever
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()",
      "$ghostId": {
        // Apenas administradores podem ler fantasmas individuais
        ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
        // Apenas administradores podem escrever fantasmas individuais
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      }
    },
    
    // Regras para eventos
    "events": {
      // Apenas administradores podem ler
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      // Apenas administradores podem escrever
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()",
      "$eventId": {
        // Apenas administradores podem ler eventos individuais
        ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
        // Apenas administradores podem escrever eventos individuais
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

### 3. Configuração de Administradores

Para adicionar administradores, você precisa criar entradas no caminho `/admins` no Firebase Realtime Database:

```json
{
  "admins": {
    "USER_UID_AQUI": {
      "email": "admin@example.com",
      "name": "Nome do Administrador",
      "role": "admin",
      "permissions": ["users.manage", "stats.view", "config.edit"],
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
}
```

### 4. Solução para o Erro de adminId Indefinido

O erro `set failed: value argument contains undefined in property 'auditLogs.[...].adminId'` ocorre quando o `adminId` está indefinido. Para corrigir isso, vamos modificar o método `logAdminAction` no `admin-auth.js`:

```javascript
/**
 * Registra uma ação administrativa no log de auditoria
 * @param {string} adminId - ID do administrador
 * @param {string} action - Ação realizada
 * @param {Object} details - Detalhes da ação
 */
async logAdminAction(adminId, action, details = {}) {
    try {
        // Verificar se adminId está definido
        if (!adminId) {
            console.warn('adminId não definido, pulando registro de log');
            return;
        }
        
        const logEntry = {
            adminId: adminId,
            action: action,
            timestamp: new Date().toISOString(),
            details: details
        };
        
        // Adicionar informações adicionais se disponível
        if (this.currentAdmin) {
            logEntry.adminEmail = this.currentAdmin.email;
            logEntry.adminName = this.currentAdmin.name;
        }
        
        // Registrar IP do cliente se possível
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            logEntry.ipAddress = ipData.ip;
        } catch (error) {
            // Se não conseguir obter o IP, continuar sem ele
            console.warn('Não foi possível obter o endereço IP do cliente:', error);
        }
        
        // Salvar log no Firebase
        const logsRef = this.database.ref('auditLogs');
        const newLogRef = logsRef.push();
        await newLogRef.set(logEntry);
    } catch (error) {
        console.error('Erro ao registrar ação administrativa:', error);
    }
}
```

## Testando as Permissões

Após configurar as regras, você pode testar as permissões:

1. Acesse o painel administrativo
2. Faça login com credenciais de administrador
3. Verifique se consegue acessar todas as seções sem erros de permissão

## Solução de Problemas

Se ainda encontrar erros de permissão:

1. Verifique se o usuário está cadastrado corretamente em `/admins`
2. Confirme que as regras do Firebase foram aplicadas corretamente
3. Verifique se o usuário está autenticado corretamente
4. Tente acessar o console do Firebase e verificar manualmente as permissões

## Considerações de Segurança

- Nunca exponha regras de escrita para caminhos sensíveis publicamente
- Use sempre autenticação para operações de leitura/escrita
- Registre todas as ações administrativas para auditoria
- Mantenha os dados de administradores em um caminho separado e protegido