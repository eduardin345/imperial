// venda-carro.js - VERSÃO FINAL, LIMPA E CORRETA

document.addEventListener('DOMContentLoaded', async () => {

    // --- Seleção dos Elementos do HTML ---
    const form = document.getElementById('form-venda-carro');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-bar .step');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    const marcaSelect = document.getElementById('marca');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('fotos');
    const previewsContainer = document.getElementById('previews');
    const faqItems = document.querySelectorAll('.faq-item');
    
    let currentStep = 1;
    let uploadedFiles = [];

    // --- 1. FUNÇÃO DE VALIDAÇÃO ---
    function validateCurrentStep() {
        const currentFormStep = form.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = currentFormStep.querySelectorAll('input[required], select[required]');
        let allValid = true;

        inputs.forEach(input => {
            input.classList.remove('input-error');
            if (!input.value.trim()) {
                allValid = false;
                input.classList.add('input-error');
            }
        });

        currentFormStep.querySelectorAll('.input-error').forEach(input => {
            input.addEventListener('input', () => {
                if(input.value.trim()){
                    input.classList.remove('input-error');
                }
            }, { once: true });
        });
        
        return allValid;
    }

    // --- 2. FUNÇÃO DE ATUALIZAÇÃO DA INTERFACE (NAVEGAÇÃO) ---
    const updateForm = () => {
        formSteps.forEach(s => s.classList.remove('active'));
        formSteps[currentStep - 1].classList.add('active');
        progressSteps.forEach((s, i) => s.classList.toggle('active', i < currentStep));
        
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextBtn.textContent = currentStep === formSteps.length ? 'Confirmar e Enviar' : 'Próximo';

        if (currentStep === 4) { // Etapa de Revisão
            populateReviewSummary();
        }
    };

    // --- 3. EVENTOS DOS BOTÕES DE NAVEGAÇÃO ---
    nextBtn.addEventListener('click', () => {
        if (currentStep < formSteps.length) {
            if (validateCurrentStep()) {
                currentStep++;
                updateForm();
            } else {
                alert('Por favor, preencha todos os campos obrigatórios para continuar.');
            }
        } else {
             if(validateCurrentStep()){
                document.getElementById('form-venda-carro').style.display = 'none';
                document.querySelector('.progress-bar').style.display = 'none';
                document.getElementById('sucesso-mensagem').classList.remove('hidden');
             }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateForm();
        }
    });

    // --- 4. FUNÇÃO PARA BUSCAR MARCAS NA API ---
    async function populateMarcas() {
        try {
            const response = await fetch('http://localhost:3001/api/marcas');
            if (!response.ok) throw new Error('Falha ao buscar marcas.');
            const marcas = await response.json();
            
            marcas.forEach(marca => {
                const option = new Option(marca.nome_marca, marca.nome_marca);
                marcaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Falha ao carregar marcas da API:', error);
            marcaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    // --- 5. FUNÇÕES DE UPLOAD DE IMAGEM ---
    const handleFiles = (files) => {
        const newFiles = [...files].filter(file => file.type.startsWith('image/'));
        newFiles.slice(0, 5 - uploadedFiles.length).forEach(file => {
            uploadedFiles.push(file);
            const reader = new FileReader();
            reader.onload = () => createPreview(reader.result, file);
            reader.readAsDataURL(file);
        });
    };
    
    const createPreview = (src, file) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `<img src="${src}" alt="${file.name}"><button class="remove-btn">&times;</button>`;
        previewsContainer.appendChild(previewItem);
        previewItem.querySelector('.remove-btn').addEventListener('click', () => {
            uploadedFiles = uploadedFiles.filter(f => f !== file);
            previewItem.remove();
        });
    };
    
    // --- 6. EVENTOS DE UPLOAD DE IMAGEM ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }));
    ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover')));
    ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover')));
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', e => handleFiles(e.target.files));

    // --- 7. FUNÇÃO DA ETAPA DE REVISÃO ---
    const populateReviewSummary = () => {
        const summaryContainer = document.getElementById('review-summary');
        const createItem = (label, value) => `
            <div class="summary-item">
                <span>${label}</span>
                <strong>${value || 'Não informado'}</strong>
            </div>`;

        summaryContainer.innerHTML =
            createItem('Marca', document.getElementById('marca').value) +
            createItem('Modelo', document.getElementById('modelo').value) +
            createItem('Ano/Modelo', document.getElementById('ano').value) +
            createItem('Quilometragem', document.getElementById('km').value + ' km') +
            createItem('Cor', document.getElementById('cor').value) +
            createItem('Seu Nome', document.getElementById('nome').value) +
            createItem('Seu Telefone', document.getElementById('telefone').value) +
            createItem('Fotos Enviadas', `${uploadedFiles.length} foto(s)`);
    };

    // --- 8. LÓGICA DO FAQ (ACORDEÃO) ---
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = 0;
            });
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    await populateMarcas();
    updateForm();
});