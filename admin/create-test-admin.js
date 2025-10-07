// Script para criar administrador de teste
// Execute este script no console do navegador

// Dados do administrador de teste
const adminEmail = 'admin@test.com';
const adminPassword = 'password123';

// Função para criar administrador
async function createTestAdmin() {
    try {
        // Criar usuário no Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(adminEmail, adminPassword);
        console.log('Usuário criado com sucesso:', userCredential.user.uid);
        
        // Dados do administrador
        const adminData = {
            email: adminEmail,
            name: 'Administrador de Teste',
            role: 'admin',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            permissions: ['users.manage', 'stats.view', 'config.edit']
        };
        
        // Adicionar à lista de administradores no Realtime Database
        await firebase.database().ref('admins/' + userCredential.user.uid).set(adminData);
        console.log('Administrador adicionado com sucesso!');
        
        // Fazer logout
        await firebase.auth().signOut();
        console.log('Setup concluído! Agora você pode fazer login com:');
        console.log('Email:', adminEmail);
        console.log('Senha:', adminPassword);
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('Administrador já existe. Tentando fazer login...');
            try {
                await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
                console.log('Login bem-sucedido!');
                await firebase.auth().signOut();
                console.log('Agora você pode fazer login no painel com:');
                console.log('Email:', adminEmail);
                console.log('Senha:', adminPassword);
            } catch (loginError) {
                console.error('Erro ao fazer login:', loginError);
            }
        } else {
            console.error('Erro ao criar administrador:', error);
        }
    }
}

// Executar a função
createTestAdmin();