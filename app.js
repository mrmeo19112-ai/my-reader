const homeScreen = document.getElementById('home-screen');
const readerScreen = document.getElementById('reader-screen');
const storyList = document.getElementById('story-list');
const readerControls = document.getElementById('reader-controls');
const searchBox = document.getElementById('search-box');
const progressBar = document.getElementById('progress-bar');

const inputTitle = document.getElementById('story-title');
const inputContent = document.getElementById('story-content');
const btnSave = document.getElementById('btn-save');

const displayTitle = document.getElementById('display-title');
const displayContent = document.getElementById('display-content');
const btnBack = document.getElementById('btn-back');
const btnPlay = document.getElementById('btn-play');

const synth = window.speechSynthesis;
let currentUtterance = null;
let currentStoryIndex = null; 
let lastCharIndex = 0; 
let isPausedManual = false;

// ==========================================
// 1. TÌM KIẾM & HIỂN THỊ DANH SÁCH
// ==========================================
searchBox.oninput = (e) => {
    renderList(e.target.value.toLowerCase().trim());
};

function renderList(searchQuery = '') {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; 
    
    // Duyệt mảng gốc để giữ đúng index khi mở/xóa truyện
    stories.forEach((story, originalIndex) => {
        if (story.title.toLowerCase().includes(searchQuery)) {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="flex:1; padding-right:10px;"><b>${story.title}</b></div>
                <div style="display:flex; gap:8px;">
                    <button onclick="openStory(${originalIndex})" style="width:auto; padding:8px 12px; background:#34c759">Đọc</button>
                    <button onclick="deleteStory(${originalIndex})" style="width:auto; padding:8px 10px; background:#ff3b30">Xóa</button>
                </div>`;
            storyList.appendChild(li);
        }
    });
}

btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();
    if (!title || !content) return alert("Nhập đủ tên và nội dung nhé!");
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ title, content, scrollPos: 0, lastChar: 0 });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));
    inputTitle.value = ''; inputContent.value = '';
    searchBox.value = ''; // Xóa ô tìm kiếm khi lưu mới
    renderList();
};

window.deleteStory = (index) => {
    if(confirm("Xóa truyện này nhé?")) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories.splice(index, 1);
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        renderList(searchBox.value.toLowerCase().trim());
    }
}

// ==========================================
// 2. MỞ TRUYỆN & LƯU TRẠNG THÁI
// ==========================================
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];
    
    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0;

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');
    
    updateProgressBar(lastCharIndex, story.content.length);

    setTimeout(() => { window.scrollTo(0, story.scrollPos || 0); }, 100);
};

function saveCurrentProgress() {
    if (currentStoryIndex !== null) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        if (stories[currentStoryIndex]) {
            stories[currentStoryIndex].lastChar = lastCharIndex;
            stories[currentStoryIndex].scrollPos = window.scrollY;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        synth.cancel(); saveCurrentProgress();
    }
});

window.onscroll = () => {
    if (!readerScreen.classList.contains('hidden')) saveCurrentProgress();
};

// ==========================================
// 3. TUA TRUYỆN BẰNG THANH TRƯỢT (SEEKBAR)
// ==========================================
function updateProgressBar(current, total) {
    if (total === 0) return;
    const percentage = (current / total) * 100;
    progressBar.value = percentage;
}

// Khi người dùng đang kéo thanh trượt
progressBar.oninput = (e) => {
    const percentage = parseFloat(e.target.value);
    const fullText = displayContent.innerText;
    
    // Tính toán lại vị trí chữ
    lastCharIndex = Math.floor((percentage / 100) * fullText.length);
    
    // Cuộn màn hình tương đối theo phần trăm truyện
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (percentage / 100) * maxScroll, behavior: 'instant' });
};

// Khi người dùng thả tay ra khỏi thanh trượt
progressBar.onchange = (e) => {
    saveCurrentProgress();
    // Nếu trước đó đang bật Play, thả tay ra sẽ tự động đọc tiếp đoạn mới
    if (!isPausedManual && btnPlay.innerText === "⏸") {
        synth.cancel();
        setTimeout(() => { startReading(); }, 100);
    }
};

// ==========================================
// 4. LOGIC ĐỌC TRUYỆN
// ==========================================
function startReading() {
    isPausedManual = false;
    btnPlay.innerText = "⏸";
    btnPlay.style.opacity = "0.3";
    readerControls.style.opacity = "0"; // Ẩn thanh công cụ khi đọc
    readerControls.style.pointerEvents = "none";

    const fullText = displayContent.innerText;
    const totalLength = fullText.length;
    const textChunk = fullText.substring(lastCharIndex, lastCharIndex + 2000);
    
    if (textChunk.length === 0) {
        btnPlay.innerText = "▶️";
        btnPlay.style.opacity = "1";
        readerControls.style.opacity = "1";
        readerControls.style.pointerEvents = "auto";
        lastCharIndex = 0;
        updateProgressBar(0, totalLength);
        alert("Đã đọc hết truyện!");
        return;
    }

    currentUtterance = new SpeechSynthesisUtterance(textChunk);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const globalIndex = lastCharIndex + event.charIndex;
            updateProgressBar(globalIndex, totalLength); // Thanh tua chạy theo giọng đọc

            if (event.charIndex % 5 === 0) {
                const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
                stories[currentStoryIndex].lastChar = globalIndex;
                stories[currentStoryIndex].scrollPos = window.scrollY;
                localStorage.setItem('giahuy_stories', JSON.stringify(stories));
            }
        }
    };

    currentUtterance.onend = () => {
        if (!isPausedManual) {
            lastCharIndex += textChunk.length;
            saveCurrentProgress();
            startReading(); // Tự động đọc khúc 2000 chữ tiếp theo
        }
    };

    synth.speak(currentUtterance);
}

btnPlay.onclick = () => {
    // Nếu đang đọc -> Bấm để TẠM DỪNG
    if (synth.speaking && !synth.paused) {
        synth.cancel();
        isPausedManual = true;
        btnPlay.innerText = "▶️";
        btnPlay.style.opacity = "1";
        readerControls.style.opacity = "1"; // Hiện lại thanh tua truyện để người dùng có thể tua
        readerControls.style.pointerEvents = "auto";
        saveCurrentProgress();
        return;
    }
    // Bắt đầu đọc
    startReading();
};

// ==========================================
// 5. QUAY LẠI
// ==========================================
btnBack.onclick = () => {
    synth.cancel();
    isPausedManual = true;
    saveCurrentProgress();
    
    btnPlay.innerText = "▶️";
    btnPlay.style.opacity = "1";
    readerControls.style.opacity = "1";
    readerControls.style.pointerEvents = "auto";
    
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList(searchBox.value.toLowerCase().trim());
};

renderList();