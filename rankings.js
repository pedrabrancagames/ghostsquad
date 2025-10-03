/**
 * Rankings Manager - Ghost Squad
 * Gerencia o sistema de rankings dos jogadores
 */

import { ref, get, query, orderByChild, limitToFirst } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export class RankingsManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.rankingsModal = null;
        this.rankingsList = null;
        this.closeRankingsButton = null;
    }

    // Obtém o nome do usuário com base no perfil ou dados de autenticação
    async getUserName(userId, currentDisplayName = null) {
        try {
            // Se já temos um displayName do ranking e não é o valor padrão, usar ele
            if (currentDisplayName && currentDisplayName.trim() !== '' && currentDisplayName !== 'Caça-Fantasma') {
                return currentDisplayName;
            }
            
            // Buscar os dados do usuário no banco de dados
            const userRef = ref(this.gameManager.database, 'users/' + userId);
            const userSnapshot = await get(userRef);
            
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                
                // Se o usuário tem um displayName cadastrado no perfil, usar ele
                if (userData.displayName && userData.displayName.trim() !== '') {
                    return userData.displayName;
                }
                
                // Se não tem displayName no perfil, verificar os dados de autenticação
                if (userData.email && userData.email.includes('@')) {
                    // Se for um usuário com email/senha, usar o nome antes do @
                    return userData.email.split('@')[0];
                }
            }
            
            // Se não encontrou nenhum nome, usar um padrão
            return 'Caça-Fantasma';
        } catch (error) {
            console.warn("Erro ao obter nome do usuário:", error);
            // Em caso de erro, retornar um nome padrão
            return 'Caça-Fantasma';
        }
    }

    // Inicializa elementos da interface de rankings
    initializeRankingsElements() {
        // Criar modal de rankings
        const rankingsModal = document.createElement('div');
        rankingsModal.id = 'rankings-modal';
        rankingsModal.className = 'ui-screen ui-element hidden';
        rankingsModal.innerHTML = `
            <div id="rankings-content">
                <div id="rankings-header">
                    <h2>Ranking de Caçadores</h2>
                    <button id="close-rankings-button" class="ui-element">&times;</button>
                </div>
                <ul id="rankings-list"></ul>
            </div>
        `;
        
        // Adicionar ao container da UI
        document.getElementById('ui-container').appendChild(rankingsModal);
        
        // Referenciar elementos
        this.rankingsModal = document.getElementById('rankings-modal');
        this.rankingsList = document.getElementById('rankings-list');
        this.closeRankingsButton = document.getElementById('close-rankings-button');
        
        // Adicionar event listeners
        this.closeRankingsButton.addEventListener('click', () => this.hideRankings());
    }

    // Mostra o modal de rankings
    showRankings() {
        // Verificar se o usuário está logado
        if (!this.gameManager.currentUser) {
            this.rankingsList.innerHTML = '<li>Você precisa estar logado para ver os rankings.</li>';
            this.rankingsModal.classList.remove('hidden');
            return;
        }
        
        this.rankingsModal.classList.remove('hidden');
        this.loadRankings();
    }

    // Esconde o modal de rankings
    hideRankings() {
        this.rankingsModal.classList.add('hidden');
    }

    // Carrega e exibe os rankings
    async loadRankings() {
        try {
            // Mostrar loading
            this.rankingsList.innerHTML = '<li>Carregando rankings...</li>';
            
            // Verificar se o database está disponível
            if (!this.gameManager.database) {
                console.error("Database não está disponível");
                this.rankingsList.innerHTML = '<li>Erro: Database não disponível.</li>';
                return;
            }
            
            // Verificar se o usuário está logado
            if (!this.gameManager.currentUser) {
                console.error("Usuário não está logado");
                this.rankingsList.innerHTML = '<li>Você precisa estar logado para ver os rankings.</li>';
                return;
            }
            
            console.log("Tentando carregar rankings para usuário:", this.gameManager.currentUser);
            
            // Primeiro, tentar carregar do caminho 'rankings' (estrutura recomendada)
            try {
                const rankingsRef = ref(this.gameManager.database, 'rankings');
                const rankingsQuery = query(rankingsRef, orderByChild('points'), limitToFirst(10));
                const snapshot = await get(rankingsQuery);
                
                if (snapshot.exists()) {
                    // Converter os dados para um array
                    const users = [];
                    const userPromises = [];
                    
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        const userId = childSnapshot.key;
                        
                        // Criar uma promessa para buscar o nome do perfil do usuário
                        const userPromise = this.getUserName(userId, userData.displayName || null)
                            .then(displayName => {
                                users.push({
                                    key: userId,
                                    displayName: displayName,
                                    points: userData.points || 0,
                                    captures: userData.captures || 0
                                });
                            });
                        
                        userPromises.push(userPromise);
                    });
                    
                    // Esperar todas as promessas serem resolvidas
                    await Promise.all(userPromises);
                    
                    // Ordenar por pontos em ordem decrescente
                    users.sort((a, b) => b.points - a.points);
                    
                    // Exibir os rankings
                    this.displayRankings(users);
                    return;
                }
            } catch (error) {
                // Se falhar ao ler de 'rankings', registrar o erro e continuar
                console.warn("Não foi possível ler rankings do caminho 'rankings':", error);
            }
            
            // Se não houver dados em 'rankings', tentar ler diretamente de 'users'
            // Isso só funcionará se as regras do Firebase permitirem
            try {
                const usersRef = ref(this.gameManager.database, 'users');
                const usersQuery = query(usersRef, orderByChild('points'), limitToFirst(10));
                const snapshot = await get(usersQuery);
                
                if (snapshot.exists()) {
                    // Converter os dados para um array
                    const users = [];
                    const userPromises = [];
                    
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        const userId = childSnapshot.key;
                        
                        // Apenas incluir usuários com pontos > 0 para evitar mostrar usuários que nunca jogaram
                        if (userData.points > 0) {
                            // Criar uma promessa para buscar o nome do perfil do usuário
                            const userPromise = this.getUserName(userId, userData.displayName || null)
                                .then(displayName => {
                                    users.push({
                                        key: userId,
                                        displayName: displayName,
                                        points: userData.points || 0,
                                        captures: userData.captures || 0
                                    });
                                });
                            
                            userPromises.push(userPromise);
                        }
                    });
                    
                    // Esperar todas as promessas serem resolvidas
                    await Promise.all(userPromises);
                    
                    // Ordenar por pontos em ordem decrescente
                    users.sort((a, b) => b.points - a.points);
                    
                    // Exibir os rankings
                    this.displayRankings(users);
                    return;
                }
            } catch (error) {
                // Se falhar ao ler de 'users', registrar o erro
                console.warn("Não foi possível ler rankings do caminho 'users':", error);
                if (error.message && error.message.includes("Permission denied")) {
                    this.rankingsList.innerHTML = `
                        <li>Erro de permissão ao acessar rankings.</li>
                        <li>Para resolver este problema, um administrador precisa:</li>
                        <li>1. Atualizar as regras do Firebase para permitir leitura de rankings</li>
                        <li>2. Ou criar um caminho 'rankings' com dados agregados</li>
                    `;
                    return;
                }
            }
            
            // Se nenhum dos caminhos funcionar
            this.rankingsList.innerHTML = '<li>Nenhum jogador encontrado.</li>';
        } catch (error) {
            console.error("Erro ao carregar rankings:", error);
            if (error.message && error.message.includes("Permission denied")) {
                this.rankingsList.innerHTML = `
                    <li>Erro: Permissão negada. Não foi possível acessar os rankings.</li>
                    <li>Para resolver este problema, um administrador precisa atualizar as regras do Firebase.</li>
                `;
            } else if (error.message && error.message.includes("Index not defined")) {
                this.rankingsList.innerHTML = `
                    <li>Erro: Índice não definido. O sistema de rankings precisa de configurações adicionais.</li>
                    <li>Um administrador precisa adicionar ".indexOn": "points" às regras do Firebase.</li>
                `;
            } else {
                this.rankingsList.innerHTML = '<li>Erro ao carregar rankings.</li>';
            }
        }
    }

    // Exibe os rankings na interface
    displayRankings(users) {
        this.rankingsList.innerHTML = '';
        
        if (users.length === 0) {
            this.rankingsList.innerHTML = '<li>Nenhum jogador encontrado.</li>';
            return;
        }
        
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'ranking-item';
            
            // Destacar o usuário atual
            const isCurrentUser = this.gameManager.currentUser && user.key === this.gameManager.currentUser.uid;
            if (isCurrentUser) {
                li.classList.add('current-user');
            }
            
            li.innerHTML = `
                <span class="ranking-position">${index + 1}.</span>
                <span class="ranking-name">${user.displayName}</span>
                <span class="ranking-points">${user.points} pts</span>
                <span class="ranking-captures">(${user.captures} capturas)</span>
            `;
            
            this.rankingsList.appendChild(li);
        });
    }
}