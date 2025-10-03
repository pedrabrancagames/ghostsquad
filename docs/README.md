# Documentação do Projeto Ghost Squad

Bem-vindo à documentação completa do Ghost Squad! Esta pasta contém toda a documentação técnica e de usuário necessária para entender, desenvolver, implantar e utilizar o jogo.

## Estrutura da Documentação

### Para Desenvolvedores
- [`arquitetura.md`](arquitetura.md) - Documentação detalhada da arquitetura do sistema
- [`documentacao-tecnica.md`](documentacao-tecnica.md) - Documentação técnica completa do projeto

### Para Usuários
- [`guia-do-usuario.md`](guia-do-usuario.md) - Guia completo para jogadores

## Visão Geral

O Ghost Squad é um jogo de realidade aumentada baseado no universo dos Caça-Fantasmas, onde os jogadores caçam fantasmas em locais do mundo real usando seus dispositivos móveis. O jogo combina tecnologia WebAR com A-Frame, Firebase para autenticação e armazenamento de dados, e recursos de localização GPS.

## Tecnologias Principais

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework AR**: A-Frame 1.5.0
- **Bibliotecas**: Leaflet, html5-qrcode, Three.js
- **Backend**: Firebase (Auth, Realtime Database, Storage)
- **Testes**: Jest com jsdom

## Primeiros Passos

### Para Desenvolvedores
1. Consulte a [documentação técnica](documentacao-tecnica.md) para entender a estrutura do projeto
2. Revise a [arquitetura](arquitetura.md) para compreender como os componentes se relacionam
3. Verifique os arquivos de teste na pasta `tests/` para entender os padrões de teste

### Para Administradores
1. Acesse o painel administrativo em `/admin`
2. Consulte o guia de implantação em `admin/DEPLOYMENT_GUIDE.md`
3. Configure as regras de segurança conforme `admin/FIREBASE_SECURITY_RULES.md`

### Para Jogadores
1. Leia o [guia do usuário](guia-do-usuario.md) para aprender a jogar
2. Acesse o jogo através do navegador
3. Escolha seu método de autenticação preferido

## Suporte e Manutenção

Para suporte técnico, entre em contato com a equipe de desenvolvimento. Para problemas com o jogo, consulte a seção de solução de problemas no guia do usuário.

## Contribuição

Contribuições são bem-vindas! Por favor, siga o guia de contribuição (se disponível) e certifique-se de que todos os testes passem antes de enviar um pull request.

---

*Documentação atualizada em: 18 de setembro de 2025*