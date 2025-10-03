# GEMINI.md

## Visão Geral do Projeto

Este projeto é um jogo de realidade aumentada (AR) para a web chamado "Ghost Squad". Os jogadores usam seus dispositivos móveis para encontrar e capturar fantasmas no mundo real. O jogo usa A-Frame para a experiência de AR, Leaflet para o mapa e Firebase para autenticação, banco de dados e armazenamento.

O jogo tem duas partes principais:

*   **O Cliente do Jogo:** A interface principal do jogo, onde os jogadores encontram e capturam fantasmas.
*   **O Painel de Administração:** Uma interface web para os administradores gerenciarem o jogo, incluindo usuários, fantasmas, eventos e configurações do jogo.

### Tecnologias Utilizadas

*   **Frontend:** HTML, CSS, JavaScript
*   **AR:** A-Frame
*   **Mapa:** Leaflet
*   **Backend:** Firebase (Autenticação, Realtime Database, Storage)
*   **Testes:** Jest

## Compilando e Executando

### Executando o Jogo

1.  Sirva os arquivos do projeto usando um servidor web local.
2.  Abra o arquivo `index.html` em um navegador web em um dispositivo móvel que suporte AR.

### Executando o Painel de Administração

1.  Sirva os arquivos do projeto usando um servidor web local.
2.  Abra o arquivo `admin/index.html` em um navegador web.
 
### Executando os Testes
 
Para executar os testes, use o seguinte comando:

```bash
npm test
```

Para executar os testes em modo de observação, use o seguinte comando:

```bash
npm run test:watch
```

## Convenções de Desenvolvimento

*   O projeto usa módulos JavaScript para organizar o código.
*   O código é organizado em gerenciadores, componentes e módulos.
*   O estado do jogo é gerenciado pela classe `GameStateManager`.
*   A experiência de AR é gerenciada pela classe `ARManager`.
*   O mapa é gerenciado pela classe `MapManager`.
*   A interface do usuário é gerenciada pela classe `UIManager`.
*   A autenticação do usuário é gerenciada pela classe `AuthManager`.
*   O painel de administração é organizado em componentes e módulos para gerenciar diferentes aspectos do jogo.
*   O projeto usa Jest para testes. Os arquivos de teste estão localizados no diretório `tests`.