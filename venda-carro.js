// venda-carro.js - UPGRADED VERSION
document.addEventListener('DOMContentLoaded', () => {
    // --- MOCK DATA ---
    const veiculosDB = {
        "Volkswagen": ["Jetta", "Polo", "Nivus", "T-Cross", "Taos"],
        "Toyota": ["Corolla", "Hilux", "RAV4", "Yaris"],
        "Ford": ["Everest", "F-150", "Mustang", "Bronco"],
        "BMW": ["M4", "X7", "320i", "X1"],
        "MINI": ["Cooper S", "Countryman"],
        // Add other brands and models here
    };

    // --- DOM ELEMENTS ---
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-bar .step');
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    const marcaSelect = document.getElementById('marca');
    const modeloSelect = document.getElementById('modelo');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('fotos');
    const previewsContainer = document.getElementById('previews');
    const faqItems = document.querySelectorAll('.faq-item');
    
    let currentStep = 1;
    let uploadedFiles = [];

    // --- FORM NAVIGATION ---
    const updateForm = () => {
        formSteps.forEach(s => s.classList.remove('active'));
        formSteps[currentStep - 1].classList.add('active');

        progressSteps.forEach((s, i) => s.classList.toggle('active', i < currentStep));
        
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextBtn.textContent = currentStep === formSteps.length ? 'Confirmar e Enviar' : 'Próximo';

        if (currentStep === formSteps.length) { // If it's the review step
            populateReviewSummary();
        }
    };

    nextBtn.addEventListener('click', () => {
        if (currentStep < formSteps.length) {
            currentStep++; updateForm();
        } else {
             // Logic to show success message
             document.getElementById('form-venda-carro').style.display = 'none';
             document.querySelector('.progress-bar').style.display = 'none';
             document.getElementById('sucesso-mensagem').classList.remove('hidden');
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--; updateForm();
        }
    });

    // --- DYNAMIC DROPDOWNS ---
    const populateMarcas = () => {
        Object.keys(veiculosDB).sort().forEach(marca => {
            const option = document.createElement('option');
            option.value = marca;
            option.textContent = marca;
            marcaSelect.appendChild(option);
        });
    };
    
    marcaSelect.addEventListener('change', () => {
        modeloSelect.innerHTML = '<option value="">-- Selecione o Modelo --</option>';
        const selectedMarca = marcaSelect.value;
        if (selectedMarca && veiculosDB[selectedMarca]) {
            modeloSelect.disabled = false;
            veiculosDB[selectedMarca].forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo; option.textContent = modelo;
                modeloSelect.appendChild(option);
            });
        } else {
            modeloSelect.disabled = true;
        }
    });

    // --- IMAGE UPLOADER ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, e => {
        e.preventDefault(); e.stopPropagation();
    }));
    ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover')));
    ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover')));
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', e => handleFiles(e.target.files));

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
    
    // --- REVIEW SUMMARY ---
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

    // --- FAQ ACCORDION ---
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

    // --- INITIALIZATION ---
    populateMarcas();
    updateForm();
});
