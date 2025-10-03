// Script para adicionar administrador de teste
// Execute este script no console do Firebase ou como uma função cloud

// Substitua 'admin@test.com' e 'password123' pelos dados desejados
const adminEmail = 'admin@test.com';
const adminPassword = 'password123';

// Inicializar Firebase (se ainda não estiver inicializado)
// const firebase = require('firebase/app');
// require('firebase/auth');
// require('firebase/database');

// Criar usuário administrador
firebase.auth().createUserWithEmailAndPassword(adminEmail, adminPassword)
  .then((userCredential) => {
    // Adicionar usuário à lista de administradores
    const userId = userCredential.user.uid;
    const adminData = {
      email: adminEmail,
      name: 'Administrador de Teste',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      permissions: ['users.manage', 'stats.view', 'config.edit']
    };
    
    return firebase.database().ref('admins/' + userId).set(adminData);
  })
  .then(() => {
    console.log('Administrador de teste criado com sucesso!');
    console.log('Email:', adminEmail);
    console.log('Senha:', adminPassword);
  })
  .catch((error) => {
    console.error('Erro ao criar administrador:', error);
  });