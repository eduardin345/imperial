// --- ATENÇÃO: CÓDIGO APENAS PARA DEMONSTRAÇÃO DE FRONT-END --- //
// Este script NÃO salva senhas de forma segura. Ele apenas simula
// o envio de dados para um "back-end" que você precisará construir.

document.addEventListener('DOMContentLoaded', () => {

    // Seleciona os containers e os links de alternância
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // Seleciona os formulários
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Evento para mostrar o formulário de CADASTRO
    showRegisterLink.addEventListener('click', (event) => {
        event.preventDefault(); // Impede que o link recarregue a página
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    // Evento para mostrar o formulário de LOGIN
    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault(); // Impede que o link recarregue a página
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Evento ao enviar o formulário de LOGIN
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        console.log('--- Tentativa de Login ---');
        console.log('Dados que seriam enviados ao servidor (back-end):');
        console.log({ email, password });

        alert('Login simulado! Verifique o console (F12) para ver os dados que seriam enviados.');
        // Aqui, no futuro, você faria uma chamada para o seu back-end (ex: fetch)
    });

    // Evento ao enviar o formulário de CADASTRO
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        console.log('--- Tentativa de Cadastro ---');
        console.log('Dados que seriam enviados ao servidor (back-end) para salvar:');
        console.log({ name, email, password });

        alert('Cadastro simulado! Verifique o console (F12) para ver os dados.');
        // Aqui, no futuro, você faria uma chamada para o seu back-end para criar um novo usuário
    });

});