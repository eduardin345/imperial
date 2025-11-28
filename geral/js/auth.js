// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES GERAIS ---
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // --- LÓGICA PARA ALTERNAR ENTRE FORMULÁRIOS ---
    function showLoginForm() {
        loginForm.classList.remove('hidden');
        cadastroForm.classList.add('hidden');
        authTitle.textContent = 'Acesso ao Painel';
        clearMessages();
    }

    function showRegisterForm() {
        loginForm.classList.add('hidden');
        cadastroForm.classList.remove('hidden');
        authTitle.textContent = 'Criar Nova Conta';
        clearMessages();
    }

    function clearMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // --- LÓGICA DO FORMULÁRIO DE LOGIN ---
    const loginEmailInput = document.getElementById('login-email');
    const loginSenhaInput = document.getElementById('login-senha');
    const loginSubmitButton = document.getElementById('login-submit-button');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessages();
        loginSubmitButton.disabled = true;
        loginSubmitButton.textContent = 'Entrando...';

        try {
            const response = await fetch('http://localhost:3002/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmailInput.value, senha: loginSenhaInput.value }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao fazer login.');

            localStorage.setItem('authToken', data.token);
            window.location.href = data.role === 'admin' ? 'crud_veiculos.html' : 'index.html';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loginSubmitButton.disabled = false;
            loginSubmitButton.textContent = 'Entrar';
        }
    });

    // --- LÓGICA DO FORMULÁRIO DE CADASTRO ---
    const cadastroNomeInput = document.getElementById('cadastro-nome');
    const cadastroEmailInput = document.getElementById('cadastro-email');
    const cadastroSenhaInput = document.getElementById('cadastro-senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const cadastroSubmitButton = document.getElementById('cadastro-submit-button');

    cadastroForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessages();

        if (cadastroSenhaInput.value !== confirmarSenhaInput.value) {
            errorMessage.textContent = 'As senhas não coincidem.';
            errorMessage.style.display = 'block';
            return;
        }
        
        cadastroSubmitButton.disabled = true;
        cadastroSubmitButton.textContent = 'Cadastrando...';

        try {
            const response = await fetch('http://localhost:3002/api/auth/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_completo: cadastroNomeInput.value,
                    email: cadastroEmailInput.value,
                    senha: cadastroSenhaInput.value,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao cadastrar.');

            successMessage.textContent = `${data.message} Você será redirecionado para o login.`;
            successMessage.style.display = 'block';
            setTimeout(() => showLoginForm(), 2500); // Mostra o form de login após o sucesso
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            cadastroSubmitButton.disabled = false;
            cadastroSubmitButton.textContent = 'Cadastrar';
        }
    });
});