/**
 * IMPERIAL MOTORS - comprar.js
 * =============================================================================
 * Versão: 14.0 (PATCH FINAL)
 * Autor: Imperial Dev Team
 * Descrição: Correção definitiva de referências de função Router.
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // [1] CONFIG
    const Config = {
        API: {
            BASE: 'http://localhost:3002/api/veiculos',
            SERVER_ROOT: 'http://localhost:3002',
            WHATSAPP: 'https://api.whatsapp.com/send?phone=5511999999999&text='
        },
        UI: {
            ITEMS_PER_PAGE: 9,
            PLACEHOLDER: 'https://placehold.co/600x400/222/FFF?text=Imperial+Motors',
            DEBOUNCE_MS: 300
        },
        STORAGE: {
            FAVORITES: 'IMPERIAL_FAVS_FINAL'
        },
        BACKUP_GALLERY: {
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
        }
    };

    // [2] ESTADO
    const Store = {
        rawData: [], processedData: [], favorites: new Set(),
        pagination: { currentIndex: 0, limit: Config.UI.ITEMS_PER_PAGE },
        filters: { search:'', brand:'todas', cat:'todas', price:Infinity, cond:'todas', sort:'relevancia' },
        system: { error: false }
    };

    // [3] DOM
    const DOM = {
        grid: document.getElementById('veiculos-grid'),
        counter: document.getElementById('resultados-contagem'),
        btnMore: document.getElementById('load-more-btn'),
        inputs: {
            brand: document.getElementById('filtro-marca'),
            cat: document.getElementById('filtro-categoria'),
            price: document.getElementById('filtro-preco'),
            lblPrice: document.getElementById('preco-valor'),
            radios: document.querySelectorAll('input[name="condicao"]'),
            sort: document.getElementById('ordenar-por'),
            clean: document.getElementById('limpar-filtros-btn'),
            search: document.getElementById('site-search')
        }
    };

    // [4] ENGINE
    const Engine = {
        start: async () => {
            console.log("🚀 Imperial V14 Started.");
            UI.injectCSS();
            Persistence.loadFavs();
            UI.skeleton();

            await Data.fetch();

            if (Store.rawData && Store.rawData.length > 0) {
                UI.populate();
                Router.loadFromURL();
                Engine.refresh(true);
                Events.bind();
            } else {
                DOM.grid.innerHTML = '<h3 style="text-align:center; padding:40px;">Erro: Banco vazio ou API offline.</h3>';
            }
        },

        refresh: (reset = false) => {
            if (reset) {
                Store.pagination.currentIndex = 0;
                DOM.grid.innerHTML = '';
            }
            Logic.filter();
            Logic.sort();
            UI.render();
            // Correção: Chamada certa
            Router.saveURL();
        }
    };

    // [5] DADOS
    const Data = {
        fetch: async () => {
            try {
                const r = await fetch(Config.API.BASE);
                const j = await r.json();
                if(!Array.isArray(j)) return;

                Store.rawData = j.map(v => {
                    const mod = (v.modelo||'Modelo').trim();
                    const br = (v.nome_marca||v.marca||'Genérica').trim();
                    const cat = (v.nome_categoria||v.categoria||'Geral').trim();
                    const ano = Number(v.ano)||2024;
                    const pr = Number(v.preco)||0;
                    
                    let img = Config.UI.PLACEHOLDER;
                    const db = v.imagem || v.imagem_url;
                    
                    if (db && db.startsWith('/uploads')) img = Config.API.SERVER_ROOT + db;
                    else if (db && db.startsWith('http')) img = db;
                    else {
                        const k = Object.keys(Config.BACKUP_GALLERY).find(key => mod.toUpperCase().includes(key));
                        if(k) img = Config.BACKUP_GALLERY[k];
                    }

                    return {
                        id: v.id_veiculo || Math.random(),
                        modelo: mod, marca: br, cat: cat, image: img,
                        ano: ano, km: Number(v.km)||0, price: pr,
                        isNew: ano >= new Date().getFullYear()
                    };
                });
            } catch (e) { console.error(e); Store.system.error = true; }
        }
    };

    // [6] LOGIC
    const Logic = {
        filter: () => {
            const f = Store.filters;
            const txt = Utils.slug(f.search);

            Store.processedData = Store.rawData.filter(c => {
                if(!c || !c.marca) return false;
                const meta = Utils.slug(`${c.modelo} ${c.marca} ${c.cat}`);
                
                if(txt && !meta.includes(txt)) return false;
                if(f.brand !== 'todas' && c.marca.toLowerCase() !== f.brand) return false;
                if(f.cat !== 'todas' && c.cat.toLowerCase() !== f.cat) return false;
                if(c.price > f.price) return false;
                if(f.cond === 'novo' && !c.isNew) return false;
                if(f.cond === 'usado' && c.isNew) return false;
                
                return true;
            });
        },
        sort: () => {
            const t = Store.filters.sort; const l = Store.processedData;
            if(t==='preco-menor') l.sort((a,b)=>a.price-b.price);
            else if(t==='preco-maior') l.sort((a,b)=>b.price-a.price);
            else if(t==='ano-novo') l.sort((a,b)=>b.ano-a.ano);
            else l.sort((a,b)=>b.id-a.id);
        }
    };

    // [7] UI
    const UI = {
        injectCSS: () => {
            const s = document.createElement('style');
            s.textContent = `
                .badge-new{position:absolute;top:10px;right:10px;background:#00c853;color:#fff;padding:4px;border-radius:4px;font-weight:bold;font-size:0.7em;z-index:2;}
                .fav{position:absolute;top:10px;left:10px;width:35px;height:35px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;color:white;cursor:pointer;z-index:2;display:flex;justify-content:center;align-items:center;}
                .fav.liked i{color:#ff4757;} 
                .action-row{display:flex;gap:10px;margin-top:auto;padding-top:15px;border-top:1px solid #eee;}
                .act-btn{flex:1;padding:10px;border-radius:5px;text-align:center;font-weight:bold;text-decoration:none;font-size:0.9em;display:flex;justify-content:center;align-items:center;gap:5px;}
                .btn-blk{background:#111;color:white;} .btn-wpp{background:#25d366;color:white;}
                .veiculo-card{display:flex;flex-direction:column;}
            `;
            document.head.appendChild(s);
        },

        skeleton: () => DOM.grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;"><h3>Carregando...</h3></div>',

        render: () => {
            const total = Store.processedData.length;
            DOM.counter.innerText = `${total} veículos`;

            if(total === 0) {
                DOM.grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#666;"><h3>Nenhum veículo</h3></div>';
                DOM.btnMore.style.display='none';
                return;
            }

            const { currentIndex, limit } = Store.pagination;
            const slice = Store.processedData.slice(currentIndex, currentIndex + limit);
            const frag = document.createDocumentFragment();

            slice.forEach(c => {
                const div = document.createElement('div');
                div.className = 'veiculo-card';
                
                const price = c.price.toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
                const badge = c.isNew ? `<span class="badge-new">NOVO ${c.ano}</span>` : '';
                const fav = Store.favorites.has(String(c.id)) ? 'liked' : '';
                const wpp = Config.API.WHATSAPP + encodeURIComponent(`Tenho interesse no ${c.modelo}`);

                div.innerHTML = `
                    <div class="card-imagem" style="position:relative;height:220px;">
                        ${badge}
                        <button class="fav ${fav}" onclick="window.Act.fav('${c.id}')">
                            <i class="${fav ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <img src="${c.image}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='${Config.UI.PLACEHOLDER}'">
                    </div>
                    <div class="card-conteudo" style="padding:15px;display:flex;flex-direction:column;flex:1;">
                        <small style="color:#888;font-weight:bold;text-transform:uppercase;">${c.marca} • ${c.cat}</small>
                        <h3 style="margin:5px 0 10px;font-size:1.2em;height:48px;overflow:hidden;">${c.modelo}</h3>
                        <div style="display:flex;justify-content:space-between;color:#666;font-size:0.9em;border-bottom:1px solid #eee;padding-bottom:10px;">
                            <span>${c.ano}</span><span>${c.km.toLocaleString()} km</span>
                        </div>
                        <div style="font-size:1.5em;font-weight:800;color:#111;margin-top:10px;">${price}</div>
                        <div class="action-row">
                            <a href="detalhes.html?id=${c.id}" class="act-btn btn-blk">Detalhes</a>
                            <a href="${wpp}" target="_blank" class="act-btn btn-wpp"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                        </div>
                    </div>
                `;
                frag.appendChild(div);
            });

            if (currentIndex === 0) DOM.grid.innerHTML = '';
            DOM.grid.appendChild(frag);
            
            Store.pagination.currentIndex += slice.length;
            
            if (Store.pagination.currentIndex >= total) {
                DOM.btnMore.style.display = 'none';
            } else {
                DOM.btnMore.style.display = 'block';
                DOM.btnMore.innerText = `Ver Mais (${total - Store.pagination.currentIndex})`;
            }
        },

        populate: () => {
            const raw = Store.rawData;
            const brands = [...new Set(raw.map(v => v.marca).filter(Boolean))].sort();
            const cats = [...new Set(raw.map(v => v.cat).filter(Boolean))].sort();

            const fill = (el, list) => {
                if(!el) return;
                const old = el.value;
                el.innerHTML = el.firstElementChild.outerHTML;
                list.forEach(v => { el.innerHTML += `<option value="${v.toLowerCase()}">${v}</option>`; });
                el.value = old;
            };
            
            fill(DOM.inputs.brand, brands);
            fill(DOM.inputs.cat, cats);
        }
    };

    // 8. STORAGE & ROUTER (Correção da v13.2)
    const Persistence = {
        saveFavs: () => localStorage.setItem(Config.STORAGE.FAVORITES, JSON.stringify([...Store.favorites])),
        loadFavs: () => {
            const s = localStorage.getItem(Config.STORAGE.FAVORITES);
            if(s) Store.favorites = new Set(JSON.parse(s));
        }
    };

    const Router = {
        // Função renomeada corretamente para saveURL e syncToURL apontar aqui
        saveURL: () => {
            const u = new URL(location); const f = Store.filters;
            const set = (k,v,d) => (v&&v!==d) ? u.searchParams.set(k,v) : u.searchParams.delete(k);
            set('m', f.brand, 'todas'); set('c', f.cat, 'todas'); set('s', f.sort, 'relevancia'); set('q', f.search, '');
            history.replaceState({},'',u);
        },
        syncToURL: () => Router.saveURL(), // Alias
        loadFromURL: () => {
            const p = new URLSearchParams(location.search);
            if(p.has('m') && DOM.inputs.brand) { Store.filters.brand=p.get('m'); DOM.inputs.brand.value=p.get('m'); }
            if(p.has('c') && DOM.inputs.cat) { Store.filters.cat=p.get('c'); DOM.inputs.cat.value=p.get('c'); }
            if(p.has('q') && DOM.inputs.search) { Store.filters.search=p.get('q'); DOM.inputs.search.value=p.get('q'); }
            
            Events.runUpdate(); // Garante atualização visual dos inputs
        },
        loadURL: () => Router.loadFromURL() // Alias para loadURL funcionar
    };

    // 9. EVENTS
    const Events = {
        runUpdate: () => {
            const i = DOM.inputs;
            if(i.brand) Store.filters.brand = i.brand.value;
            if(i.cat) Store.filters.cat = i.cat.value;
            if(i.sort) Store.filters.sort = i.sort.value;
            if(i.price) Store.filters.price = parseFloat(i.price.value);
            
            const rad = document.querySelector('input[name="condicao"]:checked');
            if(rad) Store.filters.cond = rad.value;
            
            Engine.refresh(true);
        },
        bind: () => {
            const ui = DOM.inputs;
            
            ui.brand.onchange = Events.runUpdate;
            ui.cat.onchange = Events.runUpdate;
            ui.sort.onchange = Events.runUpdate;
            ui.radios.forEach(r => r.onchange = Events.runUpdate);

            ui.price.oninput = Utils.debounce((e) => {
                ui.lblPrice.innerText = `Até ${Utils.money(parseFloat(e.target.value))}`;
                Events.runUpdate();
            }, 300);

            if(ui.search) ui.search.onkeyup = Utils.debounce((e) => {
                Store.filters.search = e.target.value;
                Events.runUpdate();
            }, 500);

            DOM.btnMore.onclick = () => Engine.refresh(false);
            ui.clean.onclick = () => location.reload();
        }
    };

    const Utils = {
        money: (v) => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'}),
        slug: t => t?t.toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase():'',
        debounce: (fn,d) => {let t; return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),d)}}
    };

    window.Act = {
        fav: (id) => {
            const sid = String(id);
            Store.favorites.has(sid) ? Store.favorites.delete(sid) : Store.favorites.add(sid);
            Persistence.saveFavs();
            document.querySelectorAll(`button[onclick*="'${id}'"]`).forEach(b=>{
                const h = Store.favorites.has(sid);
                b.className = `fav ${h?'liked':''}`;
                b.querySelector('i').className = h?'fas fa-heart':'far fa-heart';
            });
        }
    };

    Engine.start();
});