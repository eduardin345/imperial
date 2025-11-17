// auth_script.js
document.addEventListener('DOMContentLoaded', () => {
    const loginFormSection = document.getElementById('login-form-section');
    const registerFormSection = document.getElementById('register-form-section');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    const apiUrlBase = 'http://localhost:3001/api'; // VERIFIQUE SUA PORTA E URL DA API

    // --- LÓGICA PARA ALTERNAR ENTRE FORMULÁRIOS ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormSection.style.display = 'none';
            registerFormSection.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerFormSection.style.display = 'none';
            loginFormSection.style.display = 'block';
        });
    }

    // --- LÓGICA DE SUBMISSÃO DO FORMULÁRIO DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            console.log('Tentando login com:', { email, senha });

            try {
                const response = await fetch(`${apiUrlBase}/auth/login`, { // PRECISA CRIAR ESTE ENDPOINT NO SERVER.JS
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(`Login bem-sucedido! Bem-vindo, ${data.usuario?.nome_completo || 'Usuário'}!`); // API deve retornar dados do usuário, incluindo um token
                    // Armazenar token (ex: localStorage.setItem('authToken', data.token);)
                    // Redirecionar para a página principal ou painel do usuário
                    window.location.href = 'index.html'; // Ou para um painel
                } else {
                    throw new Error(data.error || 'Falha no login.');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert(`Erro no login: ${error.message}`);
            }
        });
    }

    // --- LÓGICA DE SUBMISSÃO DO FORMULÁRIO DE CADASTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nomeCompleto = document.getElementById('register-nome').value;
            const email = document.getElementById('register-email').value;
            const senha = document.getElementById('register-senha').value;
            const confirmaSenha = document.getElementById('register-confirma-senha').value;

            if (senha !== confirmaSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            console.log('Tentando registrar:', { nomeCompleto, email, senha });

            try {
                const response = await fetch(`${apiUrlBase}/auth/registrar`, { // PRECISA CRIAR ESTE ENDPOINT NO SERVER.JS
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_completo: nomeCompleto, email, senha }) // Alinhar nomes dos campos com o backend
                });

                const data = await response.json();

                if (response.status === 201) { // Status 201 Created
                    alert('Conta criada com sucesso! Você já pode fazer login.');
                    // Alternar para o formulário de login
                    registerFormSection.style.display = 'none';
                    loginFormSection.style.display = 'block';
                    loginForm.reset(); // Limpa campos do form de login se quiser
                } else {
                    throw new Error(data.error || 'Falha ao criar conta.');
                }
            } catch (error) {
                console.error('Erro no registro:', error);
                alert(`Erro ao criar conta: ${error.message}`);
            }
        });
    }
});