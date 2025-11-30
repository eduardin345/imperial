// js/detalhes.js

document.addEventListener('DOMContentLoaded', async () => {

    // Configurações (Mesma da página Comprar para consistência)
    const API_BASE = 'http://localhost:3002/api/veiculos';
    const SERVER_BASE = 'http://localhost:3002';
    const PLACEHOLDER = 'https://placehold.co/800x600/1b1b1b/FFF?text=Foto+Indispon%C3%ADvel';
    
    // Galeria de Backup (A mesma do comprar.js)
    const BACKUP_IMAGES = {
        'JETTA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/2022_Volkswagen_Jetta_GLI_2.0_s.jpg/800px-2022_Volkswagen_Jetta_GLI_2.0_s.jpg',
        'COROLLA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg/800px-2020_Toyota_Corolla_Altis_Hybrid_%28Philippines%29.jpg',
        'RAM': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg/800px-Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg',
        'TRX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg/800px-Ram_1500_TRX_%28restyling%29_%E2%80%93_Frontansicht%2C_10._April_2022%2C_D%C3%BCsseldorf.jpg',
        'RAPTOR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ford_F-150_Raptor_Gen3_img03.jpg/800px-Ford_F-150_Raptor_Gen3_img03.jpg',
        'F-150': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ford_F-150_Raptor_Gen3_img03.jpg/800px-Ford_F-150_Raptor_Gen3_img03.jpg',
        'CIVIC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/2017_Honda_Civic_Si_Coupe_%28FC3%29%2C_front_11.17.19.jpg/800px-2017_Honda_Civic_Si_Coupe_%28FC3%29%2C_front_11.17.19.jpg',
        'M4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BMW_G82_IAA_2021_1X7A0086.jpg/800px-BMW_G82_IAA_2021_1X7A0086.jpg',
        'X7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/2019_BMW_X7_xDrive40i_Front.jpg/800px-2019_BMW_X7_xDrive40i_Front.jpg',
        'GLE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg/800px-Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg',
        'MERCEDES': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg/800px-Mercedes-Benz_C_167_Mondial_de_l%E2%80%99Auto_2024_1X7A0766.jpg',
        'HAVAL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Haval_H6_S_PHEV_IAA_2021_1X7A0064.jpg/800px-Haval_H6_S_PHEV_IAA_2021_1X7A0064.jpg',
        'EVEREST': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/2022_Ford_Everest_Sport_V6_%28Thailand%29_front_view_01.jpg/800px-2022_Ford_Everest_Sport_V6_%28Thailand%29_front_view_01.jpg',
        'COOPER': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Mini_Cooper_S_%28F56%29_%E2%80%93_Frontansicht%2C_12._April_2014%2C_D%C3%BCsseldorf.jpg/800px-Mini_Cooper_S_%28F56%29_%E2%80%93_Frontansicht%2C_12._April_2014%2C_D%C3%BCsseldorf.jpg',
        'HURACAN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2014-03-04_Geneva_Motor_Show_1379.JPG/800px-2014-03-04_Geneva_Motor_Show_1379.JPG',
        'LAMBORGHINI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2014-03-04_Geneva_Motor_Show_1379.JPG/800px-2014-03-04_Geneva_Motor_Show_1379.JPG'
    };

    // Elementos do DOM
    const elements = {
        loader: document.getElementById('loading-screen'),
        content: document.getElementById('car-content'),
        img: document.getElementById('main-img'),
        badge: document.getElementById('detail-badge'),
        brand: document.getElementById('detail-brand'),
        model: document.getElementById('detail-model'),
        version: document.getElementById('detail-version'),
        year: document.getElementById('detail-year'),
        km: document.getElementById('detail-km'),
        motor: document.getElementById('detail-motor'),
        color: document.getElementById('detail-color'),
        price: document.getElementById('detail-price'),
        desc: document.getElementById('detail-desc'),
        whatsapp: document.getElementById('btn-whatsapp')
    };

    // 1. Pega o ID da URL (ex: detalhes.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        alert('Veículo não especificado.');
        window.location.href = 'comprar.html';
        return;
    }

    try {
        // 2. Busca os dados na API
        const response = await fetch(`${API_BASE}/${carId}`);
        
        if (!response.ok) throw new Error('Veículo não encontrado');
        
        const car = await response.json();
        
        // 3. Preenche a página
        renderCarDetails(car);

    } catch (error) {
        console.error(error);
        elements.loader.innerHTML = '<h3 style="color:red">Erro ao carregar o veículo. Tente novamente.</h3>';
    }

    function renderCarDetails(car) {
        // Normalização de dados (igual ao comprar.js)
        const mod = (car.modelo || 'Modelo').trim();
        const brand = (car.nome_marca || car.marca || 'Marca').trim();
        const cat = (car.nome_categoria || car.categoria || '').trim();
        const ano = Number(car.ano) || 2024;
        const km = Number(car.km) || 0;
        const preco = Number(car.preco) || 0;

        // === TRATAMENTO DE IMAGEM (Importante) ===
        let img = PLACEHOLDER;
        const dbImg = car.imagem || car.imagem_url;

        if (dbImg && dbImg.startsWith('/uploads')) img = SERVER_BASE + dbImg;
        else if (dbImg && dbImg.startsWith('http')) img = dbImg;
        else {
            // Fallback interno
            const key = Object.keys(BACKUP_IMAGES).find(k => mod.toUpperCase().includes(k));
            if(key) img = BACKUP_IMAGES[key];
        }
        
        // Preenche imagem
        elements.img.src = img;
        
        // Badge NOVO
        if (ano >= new Date().getFullYear()) {
            elements.badge.style.display = 'block';
            elements.badge.textContent = 'NOVO ' + ano;
        } else {
            elements.badge.style.display = 'none';
        }

        // Textos
        elements.brand.textContent = brand;
        elements.model.textContent = mod;
        elements.version.textContent = `${brand} • ${mod} • ${cat} Completo`; // Simulação de versão
        elements.year.textContent = ano;
        elements.km.textContent = km.toLocaleString() + ' km';
        elements.motor.textContent = car.motor || 'Não info.';
        elements.color.textContent = car.cor || 'Não info.';
        
        // Preço e Descrição
        elements.price.textContent = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        elements.desc.textContent = car.descricao || `Oportunidade única! ${mod} em estado de zero km. Veículo revisado, com garantia e procedência. Entre em contato agora mesmo.`;

        // WhatsApp Link
        const wppMsg = `Olá! Vi o anúncio do *${mod} (${ano})* por ${elements.price.textContent} no site da Imperial Motors e tenho interesse.`;
        elements.whatsapp.href = `https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(wppMsg)}`;

        // Mostra o conteúdo
        elements.loader.style.display = 'none';
        elements.content.style.display = 'grid'; // Respeita o CSS Grid
    }

});