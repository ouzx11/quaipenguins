const resim = document.getElementById('tiklamaResim');
const puanElement = document.getElementById('puan');
const marketAcBtn = document.getElementById('marketAc');
const marketKapatBtn = document.getElementById('marketKapat');
const marketModal = document.getElementById('marketModal');
const satinAlButonlari = document.querySelectorAll('.satin-al');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

let puan = 0;
let guclendiriciler = {
    ciftTiklama: false,
    altinTiklama: false,
    otoTiklayici: false,
    superTiklama: false,
    hizliOtoTiklayici: false,
    megaSans: false,
    kritikVurus: false,
    ultraOtoTiklayici: false
};

let satilanlar = {
    karakterler: {
        aktif: 'default',
        sahipOlunanlar: ['default']
    },
    arkaPlanlar: {
        aktif: 'default',
        sahipOlunanlar: ['default']
    }
};

let intervals = []; // Interval ID'lerini sakla

// Güç artırıcıları için yeni değişkenler ekle
let aktifGucArtirici = null;
let gucArtiriciTimeout = null;

const gucArtiricilar = [
    { id: 'x2', text: '2x Power', duration: 10000, color: '#e74c3c' },
    { id: 'x3', text: '3x Power', duration: 5000, color: '#9b59b6' },
    { id: 'instant', text: '+100 Quai', duration: 0, color: '#f1c40f' },
    { id: 'lucky', text: 'Lucky Time', duration: 8000, color: '#2ecc71' },
    { id: 'bomb', text: 'BOMB!', duration: 0, color: '#000000' }
];

// Karakter yeteneklerini güncelle
const karakterYetenekleri = {
    ice: {
        name: "Frozen Time",
        description: "Power-ups never disappear",
        effect: function() {
            // Pasif yetenek - güç artırıcılar hiç kaybolmaz
        }
    },
    habibi: {
        name: "Desert Storm",
        description: "All earnings are permanently doubled",
        effect: function() {
            // Pasif yetenek - sürekli 2x kazanç
        }
    },
    angel: {
        name: "Divine Protection",
        description: "Immune to bombs and gains 500 Quai when collecting them",
        effect: function() {
            // Pasif yetenek - bomba koruması
        },
        bombProtection: true
    }
};

function puanAnimasyonuOlustur(x, y, miktar, extraClass = '') {
    const animasyon = document.createElement('div');
    animasyon.className = 'puan-animasyon';
    
    // Ekstra sınıf varsa ekle
    if (extraClass) {
        animasyon.classList.add(extraClass);
    } else {
        animasyon.style.color = '#27ae60'; // Varsayılan yeşil renk
    }
    
    animasyon.textContent = `+${miktar}`;
    
    // Pozisyonu ayarla
    const container = resim.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    animasyon.style.left = `${x - containerRect.left}px`;
    animasyon.style.top = `${y - containerRect.top}px`;
    
    container.appendChild(animasyon);
    
    animasyon.addEventListener('animationend', () => {
        animasyon.remove();
    });
}

function puanArtir(miktar, event = null) {
    let kazanilanPuan = miktar;
    
    // Habibi karakteri seçiliyse sürekli 2x kazanç
    if (satilanlar.karakterler.aktif === 'habibi') {
        kazanilanPuan *= 2;
    }
    
    // Diğer çarpanları uygula
    kazanilanPuan *= puanCarpani;
    
    // Güçlendiricileri uygula
    if (guclendiriciler.ciftTiklama) {
        kazanilanPuan *= 2;
    }
    
    if (guclendiriciler.superTiklama) {
        kazanilanPuan *= 3;
    }
    
    let extraClass = '';
    
    if (guclendiriciler.altinTiklama && Math.random() < 0.2) {
        kazanilanPuan = 5;
        extraClass = 'altin-tiklama';
    }
    
    if (guclendiriciler.megaSans && Math.random() < 0.1) {
        kazanilanPuan = 10;
        extraClass = 'mega-sans';
    }
    
    if (guclendiriciler.kritikVurus && Math.random() < 0.05) {
        kazanilanPuan = 20;
        extraClass = 'kritik-vurus';
    }
    
    // Şans modu aktifse ekstra şans
    if (sansModuAktif && Math.random() < 0.5) {
        kazanilanPuan *= 2;
    }
    
    puan += kazanilanPuan;
    puanElement.textContent = puan;
    
    // Animasyon için konum hesapla
    let x, y;
    if (event) {
        x = event.clientX;
        y = event.clientY;
    } else {
        const rect = resim.getBoundingClientRect();
        x = rect.left + Math.random() * rect.width;
        y = rect.top + Math.random() * rect.height;
    }
    
    puanAnimasyonuOlustur(x, y, kazanilanPuan, extraClass);
    butonlariGuncelle();
}

function marketAc() {
    marketModal.style.display = 'block';
    butonlariGuncelle();
    tabDegistir('guclendiriciler');
}

function marketKapat() {
    marketModal.style.display = 'none';
}

function butonlariGuncelle() {
    satinAlButonlari.forEach(buton => {
        const fiyat = parseInt(buton.dataset.fiyat);
        const item = buton.dataset.item;
        const type = buton.dataset.type;

        if (type === 'karakter') {
            if (satilanlar.karakterler.sahipOlunanlar.includes(item)) {
                buton.textContent = satilanlar.karakterler.aktif === item ? 'Using' : 'Use';
                buton.disabled = satilanlar.karakterler.aktif === item;
            } else {
                buton.disabled = puan < fiyat;
            }
        } else if (type === 'arkaPlan') {
            if (satilanlar.arkaPlanlar.sahipOlunanlar.includes(item)) {
                buton.textContent = satilanlar.arkaPlanlar.aktif === item ? 'Using' : 'Use';
                buton.disabled = satilanlar.arkaPlanlar.aktif === item;
            } else {
                buton.disabled = puan < fiyat;
            }
        } else {
            if (guclendiriciler[item]) {
                buton.disabled = true;
                buton.textContent = 'Purchased';
            } else {
                buton.disabled = puan < fiyat;
            }
        }
    });
}

function tabDegistir(tabId) {
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(tabId);
    
    if (selectedButton && selectedContent) {
        selectedButton.classList.add('active');
        selectedContent.classList.add('active');
    }
}

// HTML'de karakter açıklamalarını güncelle
function updateKarakterAciklamalari() {
    const karakterItems = document.querySelectorAll('#karakterler .market-item');
    karakterItems.forEach(item => {
        const karakterAdi = item.querySelector('h3').textContent.toLowerCase();
        if (karakterYetenekleri[karakterAdi]) {
            const yetenek = karakterYetenekleri[karakterAdi];
            const aciklama = document.createElement('p');
            aciklama.className = 'yetenek-aciklama';
            aciklama.innerHTML = `<strong>${yetenek.name}:</strong> ${yetenek.description}`;
            
            // Varolan açıklamayı güncelle veya yenisini ekle
            const mevcutAciklama = item.querySelector('.yetenek-aciklama');
            if (mevcutAciklama) {
                mevcutAciklama.replaceWith(aciklama);
            } else {
                item.insertBefore(aciklama, item.querySelector('p'));
            }
        }
    });
}

// Karakter değiştirme fonksiyonunu güncelle
function gorunumDegistir(type, item) {
    if (type === 'karakter') {
        const karakterYolu = item === 'default' ? 'resim.png' : `${item}.png`;
        resim.src = `images/${karakterYolu}`;
        satilanlar.karakterler.aktif = item;
        
        // Aktif karakterin yeteneğini kaydet
        aktifKarakterYetenek = karakterYetenekleri[item] ? karakterYetenekleri[item].effect : null;
    } else if (type === 'arkaPlan') {
        const arkaplanYolu = item === 'default' ? 'none' : `url('images/bg-${item}.png')`;
        const cerceve = document.querySelector('.oyun-cerceve');
        cerceve.style.setProperty('--bg-image', arkaplanYolu);
        document.body.style.backgroundImage = 'none';
        satilanlar.arkaPlanlar.aktif = item;
    } else {
        guclendiriciler[item] = true;
        if (item === 'otoTiklayici') {
            intervals.push(setInterval(() => puanArtir(1), 3000));
        }
        if (item === 'hizliOtoTiklayici') {
            setInterval(() => puanArtir(1), 1000);
        }
        if (item === 'ultraOtoTiklayici') {
            setInterval(() => puanArtir(2), 2000);
        }
    }
}

function satinAl(item, fiyat, type, buton) {
    if (!item || fiyat < 0 || !type) return; // Geçersiz parametreleri kontrol et
    
    if (puan >= fiyat) {
        puan -= fiyat;
        puanElement.textContent = puan;

        if (type === 'karakter') {
            if (!satilanlar.karakterler.sahipOlunanlar.includes(item)) {
                satilanlar.karakterler.sahipOlunanlar.push(item);
            }
            gorunumDegistir('karakter', item);
        } else if (type === 'arkaPlan') {
            if (!satilanlar.arkaPlanlar.sahipOlunanlar.includes(item)) {
                satilanlar.arkaPlanlar.sahipOlunanlar.push(item);
            }
            gorunumDegistir('arkaPlan', item);
        } else {
            guclendiriciler[item] = true;
            if (item === 'otoTiklayici') {
                setInterval(() => puanArtir(1), 3000);
            }
            if (item === 'hizliOtoTiklayici') {
                setInterval(() => puanArtir(1), 1000);
            }
            if (item === 'ultraOtoTiklayici') {
                setInterval(() => puanArtir(2), 2000);
            }
        }
        
        butonlariGuncelle();
    }
}

// Event Listeners
resim.addEventListener('click', (e) => {
    puanArtir(1, e);
    
    // Aktif karakterin yeteneğini kullan
    if (aktifKarakterYetenek) {
        aktifKarakterYetenek();
    }
});

marketAcBtn.addEventListener('click', marketAc);
marketKapatBtn.addEventListener('click', marketKapat);

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabDegistir(button.dataset.tab);
    });
});

satinAlButonlari.forEach(buton => {
    buton.addEventListener('click', () => {
        const item = buton.dataset.item;
        const fiyat = parseInt(buton.dataset.fiyat);
        const type = buton.dataset.type || 'powerup';
        satinAl(item, fiyat, type, buton);
    });
});

window.addEventListener('click', (e) => {
    if (e.target === marketModal && marketModal.style.display === 'block') {
        marketKapat();
    }
});

// Oyun resetlendiğinde veya gerektiğinde:
function temizle() {
    intervals.forEach(clearInterval);
    intervals = [];
}

// Güç artırıcı oluşturma fonksiyonunu güncelle
function gucArtiriciOlustur() {
    if (aktifGucArtirici) return;

    const gucArtirici = document.createElement('div');
    const randomGuc = gucArtiricilar[Math.floor(Math.random() * gucArtiricilar.length)];
    
    gucArtirici.className = 'guc-artirici';
    gucArtirici.textContent = randomGuc.text;
    gucArtirici.style.backgroundColor = randomGuc.color;
    
    // Oyun çerçevesi içinde rastgele konum
    const cerceve = document.querySelector('.oyun-cerceve');
    const rect = cerceve.getBoundingClientRect();
    
    const width = 100;
    const height = 50;
    const x = Math.random() * (rect.width - width);
    const y = Math.random() * (rect.height - height);
    
    gucArtirici.style.position = 'absolute';
    gucArtirici.style.left = `${x}px`;
    gucArtirici.style.top = `${y}px`;
    
    gucArtirici.addEventListener('click', () => gucArtiriciKullan(randomGuc));
    cerceve.appendChild(gucArtirici);
    
    aktifGucArtirici = gucArtirici;
    
    // Ice karakteri seçiliyse güç artırıcı hiç kaybolmaz
    if (satilanlar.karakterler.aktif !== 'ice') {
        gucArtiriciTimeout = setTimeout(() => {
            if (aktifGucArtirici === gucArtirici) {
                gucArtirici.remove();
                aktifGucArtirici = null;
            }
        }, 5000);
    }
}

// Güç artırıcı kullanma fonksiyonu
function gucArtiriciKullan(guc) {
    if (!aktifGucArtirici) return;
    
    aktifGucArtirici.remove();
    aktifGucArtirici = null;
    
    switch(guc.id) {
        case 'bomb':
            // Angel karakteri için özel kontrol
            if (satilanlar.karakterler.aktif === 'angel') {
                // Bomba yerine bonus puan
                puan += 500;
                puanElement.textContent = puan;
                
                // Koruma efekti göster
                const efekt = document.createElement('div');
                efekt.className = 'karakter-efekt angel-effect';
                efekt.textContent = 'Divine Shield! +500 Quai';
                document.body.appendChild(efekt);
                
                setTimeout(() => efekt.remove(), 1000);
            } else {
                oyunBitti();
            }
            break;
        case 'x2':
            puanCarpani = 2;
            setTimeout(() => puanCarpani = 1, guc.duration);
            break;
        case 'x3':
            puanCarpani = 3;
            setTimeout(() => puanCarpani = 1, guc.duration);
            break;
        case 'instant':
            puan += 100;
            puanElement.textContent = puan;
            break;
        case 'lucky':
            sansModuAktif = true;
            setTimeout(() => sansModuAktif = false, guc.duration);
            break;
    }
    
    // Efekt göster
    const efekt = document.createElement('div');
    efekt.className = 'guc-efekt';
    efekt.textContent = guc.text;
    efekt.style.color = guc.color;
    document.body.appendChild(efekt);
    
    setTimeout(() => efekt.remove(), 1000);
}

// Güç artırıcıları daha sık oluştur
function gucArtiricilarBaslat() {
    setInterval(() => {
        if (Math.random() < 0.5) { // %50 şans
            gucArtiriciOlustur();
        }
    }, 5000); // Her 5 saniyede bir kontrol et
}

// Yeni değişkenler
let puanCarpani = 1;
let sansModuAktif = false;

// Başlangıç modalı için değişkenler
const startModal = document.getElementById('startModal');
const startButton = document.getElementById('startGame');

// Oyun başlamadan önce güç artırıcıları başlatma
window.onload = () => {
    // Oyun başlamadan önce tıklamaları devre dışı bırak
    resim.style.pointerEvents = 'none';
    marketAcBtn.disabled = true;
    
    // Karakter açıklamalarını güncelle
    updateKarakterAciklamalari();
    
    // Start butonuna tıklandığında
    startButton.addEventListener('click', () => {
        resim.style.pointerEvents = 'auto';
        marketAcBtn.disabled = false;
        startModal.style.display = 'none';
        gucArtiricilarBaslat();
    });
};

// Oyun sonu fonksiyonu
function oyunBitti() {
    const oyunCerceve = document.querySelector('.oyun-cerceve');
    
    // Patlama efekti
    const patlama = document.createElement('div');
    patlama.className = 'patlama-efekt';
    oyunCerceve.appendChild(patlama);
    
    // Game Over yazısı
    const gameOver = document.createElement('div');
    gameOver.className = 'game-over';
    gameOver.innerHTML = `
        <h1>Game Over!</h1>
        <p>Final Score: ${puan}</p>
        <button onclick="location.reload()">Play Again</button>
    `;
    oyunCerceve.appendChild(gameOver);
    
    // Tüm interval'ları temizle
    temizle();
    
    // Tıklamaları devre dışı bırak
    resim.style.pointerEvents = 'none';
    marketAcBtn.disabled = true;
} 