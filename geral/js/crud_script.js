// crud_script.js
document.addEventListener('DOMContentLoaded', () => {
    const apiUrlBase = 'http://localhost:3002/api';

    // Seletores do Formulário
    const formVeiculo = document.getElementById('form-veiculo');
    const formTitle = document.getElementById('form-title');
    const veiculoIdInput = document.getElementById('veiculo-id');
    const modeloInput = document.getElementById('modelo');
    const marcaSelect = document.getElementById('marca');
    const categoriaSelect = document.getElementById('categoria');
    const anoInput = document.getElementById('ano');
    const corInput = document.getElementById('cor');
    const precoInput = document.getElementById('preco');
    const kmInput = document.querySelector('#km'); // Adicionado
    const motorInput = document.querySelector('#motor'); // Adicionado
    const descricaoTextarea = document.getElementById('descricao');
    const disponivelCheckbox = document.getElementById('disponivel');
    const submitButton = document.getElementById('submit-button');
    const clearButton = document.getElementById('clear-button');

    // Seletores da Tabela
    const corpoTabelaVeiculos = document.getElementById('corpo-tabela-veiculos');
    const searchVeiculoInput = document.getElementById('search-veiculo-input');
    
    let allVeiculos = []; // Cache para a busca
    let editando = false;

    // --- FUNÇÕES DE CARREGAMENTO INICIAL ---

    async function carregarMarcas() {
        try {
            const response = await fetch(`${apiUrlBase}/marcas`);
            if (!response.ok) throw new Error('Erro ao buscar marcas.');
            const marcas = await response.json();
            marcaSelect.innerHTML = '<option value="">Selecione uma marca...</option>';
            marcas.forEach(marca => {
                const option = new Option(marca.nome_marca, marca.id_marca);
                marcaSelect.add(option);
            });
        } catch (error) {
            console.error('Falha ao carregar marcas:', error);
            marcaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    async function carregarCategorias() {
        try {
            const response = await fetch(`${apiUrlBase}/categorias`);
            if (!response.ok) throw new Error('Erro ao buscar categorias.');
            const categorias = await response.json();
            categoriaSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach(cat => {
                const option = new Option(cat.nome_categoria, cat.id_categoria);
                categoriaSelect.add(option);
            });
        } catch (error) {
            console.error('Falha ao carregar categorias:', error);
            categoriaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    async function carregarVeiculos() {
         try {
            const response = await fetch(`${apiUrlBase}/veiculos`);
            if (!response.ok) throw new Error('Erro ao buscar veículos.');
            allVeiculos = await response.json();
            renderizarTabela(allVeiculos);
         } catch(error) {
             console.error('Falha ao carregar veículos:', error);
             corpoTabelaVeiculos.innerHTML = `<tr><td colspan="8" class="error">Erro ao carregar veículos.</td></tr>`;
         }
    }

    function renderizarTabela(veiculos) {
        corpoTabelaVeiculos.innerHTML = '';
        if (veiculos.length === 0) {
            corpoTabelaVeiculos.innerHTML = '<tr><td colspan="8">Nenhum veículo encontrado.</td></tr>';
            return;
        }
        veiculos.forEach(veiculo => {
            const tr = corpoTabelaVeiculos.insertRow();
            tr.innerHTML = `
                <td>${veiculo.id_veiculo}</td>
                <td>${veiculo.modelo}</td>
                <td>${veiculo.nome_marca || 'N/A'}</td>
                <td>${veiculo.nome_categoria || 'N/A'}</td>
                <td>${veiculo.ano || 'N/A'}</td>
                <td>${(veiculo.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${veiculo.disponivel ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="edit-btn" data-id="${veiculo.id_veiculo}">✏️ Editar</button>
                    <button class="delete-btn" data-id="${veiculo.id_veiculo}" data-modelo="${veiculo.modelo}">🗑️ Deletar</button>
                </td>
            `;
        });
    }


    // --- LÓGICA DO FORMULÁRIO (CRIAR/ATUALIZAR) ---
    formVeiculo.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dadosVeiculo = {
            modelo: modeloInput.value,
            id_marca_fk: parseInt(marcaSelect.value),
            id_categoria_fk: parseInt(categoriaSelect.value),
            ano: anoInput.value ? parseInt(anoInput.value) : null,
            cor: corInput.value,
            preco: precoInput.value ? parseFloat(precoInput.value) : null,
            km: kmInput.value ? parseInt(kmInput.value) : 0,
            motor: motorInput.value,
            descricao: descricaoTextarea.value,
            disponivel: disponivelCheckbox.checked
        };

        const id = veiculoIdInput.value;
        const url = editando ? `${apiUrlBase}/veiculos/${id}` : `${apiUrlBase}/veiculos`;
        const method = editando ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosVeiculo)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro na operação`);
            }
            alert(`Veículo ${editando ? 'atualizado' : 'criado'} com sucesso!`);
            resetarFormulario();
            await carregarVeiculos();
        } catch (error) {
            console.error(`Erro ao ${editando ? 'atualizar' : 'salvar'} veículo:`, error);
            alert(`Falha: ${error.message}`);
        }
    });

    function resetarFormulario() {
        formVeiculo.reset();
        veiculoIdInput.value = '';
        formTitle.textContent = 'Adicionar Novo Veículo';
        submitButton.textContent = 'Salvar Veículo';
        editando = false;
        disponivelCheckbox.checked = true;
        modeloInput.focus();
    }

    clearButton.addEventListener('click', resetarFormulario);
    
    // --- LÓGICA DE EDIÇÃO E DELEÇÃO NA TABELA (Event Delegation) ---
    corpoTabelaVeiculos.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn') && id) {
            try {
                const response = await fetch(`${apiUrlBase}/veiculos/${id}`);
                if(!response.ok) throw new Error('Não foi possível carregar os dados do veículo para edição.');
                const veiculo = await response.json();
                popularFormularioParaEdicao(veiculo);
            } catch (error) {
                alert(error.message);
            }
        }
        
        if (target.classList.contains('delete-btn') && id) {
            const modelo = target.dataset.modelo;
            if (confirm(`Tem certeza que deseja deletar o veículo "${modelo}" (ID: ${id})?`)) {
                await deletarVeiculo(id, modelo);
            }
        }
    });
    
    function popularFormularioParaEdicao(veiculo) {
        formTitle.textContent = `Editando Veículo: ${veiculo.modelo}`;
        submitButton.textContent = 'Atualizar Veículo';
        editando = true;

        veiculoIdInput.value = veiculo.id_veiculo;
        modeloInput.value = veiculo.modelo;
        marcaSelect.value = veiculo.id_marca_fk;
        categoriaSelect.value = veiculo.id_categoria_fk;
        anoInput.value = veiculo.ano;
        corInput.value = veiculo.cor;
        precoInput.value = veiculo.preco;
        kmInput.value = veiculo.km;
        motorInput.value = veiculo.motor;
        descricaoTextarea.value = veiculo.descricao;
        disponivelCheckbox.checked = veiculo.disponivel;

        window.scrollTo({ top: formVeiculo.offsetTop - 20, behavior: 'smooth' });
        modeloInput.focus();
    }

    async function deletarVeiculo(id, modelo) {
        try {
            const response = await fetch(`${apiUrlBase}/veiculos/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao deletar');
            }
            alert(`Veículo "${modelo}" deletado com sucesso!`);
            await carregarVeiculos();
        } catch (error) {
            console.error('Erro ao deletar veículo:', error);
            alert(`Falha ao deletar: ${error.message}`);
        }
    }

    // --- BUSCA NA TABELA (Filtro Frontend) ---
    searchVeiculoInput.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const veiculosFiltrados = allVeiculos.filter(v => 
            v.modelo.toLowerCase().includes(termo) ||
            v.nome_marca.toLowerCase().includes(termo)
        );
        renderizarTabela(veiculosFiltrados);
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function initCrudPage() {
        await Promise.all([
            carregarMarcas(),
            carregarCategorias(),
            carregarVeiculos()
        ]);
        resetarFormulario();
    }

    initCrudPage();
});






javascript
// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DO MENU HAMBÚRGUER (MOBILE) ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const mainMenu = document.getElementById('main-menu');
    const menuCloseButton = mainMenu ? mainMenu.querySelector('.menu-close') : null;
    const overlay = document.querySelector('.overlay'); // Pega o primeiro overlay
    const body = document.body;

    if (menuToggleButton && mainMenu) {
        menuToggleButton.addEventListener('click', () => {
            body.classList.toggle('menu-is-open');
            const isMenuOpen = body.classList.contains('menu-is-open');
            menuToggleButton.setAttribute('aria-expanded', String(isMenuOpen));
            mainMenu.setAttribute('aria-hidden', String(!isMenuOpen));
        });
    }

    if (menuCloseButton) {
        menuCloseButton.addEventListener('click', () => {
            body.classList.remove('menu-is-open');
            menuToggleButton.setAttribute('aria-expanded', 'false');
            mainMenu.setAttribute('aria-hidden', 'true');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            if (body.classList.contains('menu-is-open')) {
                body.classList.remove('menu-is-open');
                menuToggleButton.setAttribute('aria-expanded', 'false');
                mainMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // --- LÓGICA DA BARRA DE BUSCA ANIMADA ---
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('site-search');
    const searchButton = document.querySelector('.search-container .search-button');

    if (searchContainer && searchInput && searchButton) {
        searchButton.addEventListener('click', (event) => {
            if (!searchContainer.classList.contains('search-active')) {
                event.preventDefault();
                searchContainer.classList.add('search-active');
                setTimeout(() => searchInput.focus(), 300);
            }
        });

        searchInput.addEventListener('blur', () => {
            if (searchInput.value.trim() === '') {
                searchContainer.classList.remove('search-active');
            }
        });

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    alert(`Buscando por: ${query}`);
                    // Ação de busca aqui. Ex: window.location.href = `/comprar?q=${query}`;
                }
            }
        });
    }
    
    // --- LÓGICA DO CARROSSEL DE MODELOS (AUTOPLAY) ---
    const carouselContainer = document.querySelector('#modelos .modelos-multi-carousel-container');
    const carouselTrack = document.querySelector('#modelos .modelos-multi-carousel-track');
    const originalItems = Array.from(document.querySelectorAll('#modelos .modelo-item-original'));
    
    if (carouselTrack && originalItems.length > 0) {
        const itemsVisible = 3;
        const itemWidth = 220; // Largura do item + gap
        let currentIndex = itemsVisible;
        let autoPlayInterval;

        const cloneItems = () => {
            for (let i = 0; i < itemsVisible; i++) {
                const cloneFirst = originalItems[i % originalItems.length].cloneNode(true);
                cloneFirst.classList.replace('modelo-item-original', 'modelo-item-display');
                carouselTrack.appendChild(cloneFirst);

                const cloneLast = originalItems[originalItems.length - 1 - (i % originalItems.length)].cloneNode(true);
                cloneLast.classList.replace('modelo-item-original', 'modelo-item-display');
                carouselTrack.prepend(cloneLast);
            }
            originalItems.forEach(item => {
                const newItem = item.cloneNode(true);
                newItem.classList.replace('modelo-item-original', 'modelo-item-display');
                carouselTrack.insertBefore(newItem, carouselTrack.children[carouselTrack.children.length - itemsVisible]);
            });
            carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
        };

        const moveToNext = () => {
            currentIndex++;
            carouselTrack.style.transition = 'transform 0.5s ease-in-out';
            carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

            carouselTrack.addEventListener('transitionend', () => {
                if (currentIndex >= originalItems.length + itemsVisible) {
                    carouselTrack.style.transition = 'none';
                    currentIndex = itemsVisible;
                    carouselTrack.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
                }
            }, { once: true });
        };
        
        cloneItems();
        autoPlayInterval = setInterval(moveToNext, 3000);
        
        carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselContainer.addEventListener('mouseleave', () => autoPlayInterval = setInterval(moveToNext, 3000));
    }


    // --- LÓGICA DA NAVEGAÇÃO COM DESTAQUE (SUA VIAGEM COMEÇA AQUI) ---
    const subNavContainer = document.querySelector('#sua-viagem .sub-navigation');
    if (subNavContainer) {
        const subNavItems = subNavContainer.querySelectorAll('li');
        const highlighter = subNavContainer.querySelector('.underline-highlighter');
        const allGridItems = document.querySelectorAll('#sua-viagem .viagem-grid .item-content');

        const updateHighlighter = (activeItem) => {
            highlighter.style.width = `${activeItem.offsetWidth}px`;
            highlighter.style.transform = `translateX(${activeItem.offsetLeft}px)`;
            subNavItems.forEach(item => item.classList.remove('active'));
            activeItem.classList.add('active');
        };

        const filterContent = (category) => {
            allGridItems.forEach(item => {
                item.style.display = item.dataset.category === category ? 'block' : 'none';
            });
        };
        
        // Inicialização
        const initialActiveItem = subNavContainer.querySelector('li.active');
        if (initialActiveItem) {
            updateHighlighter(initialActiveItem);
            filterContent(initialActiveItem.dataset.category);
        }

        subNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                updateHighlighter(item);
                filterContent(item.dataset.category);
            });
        });
    }

});