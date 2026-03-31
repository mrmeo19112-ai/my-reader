// --- 1. KHAI BÁO CÁC THÀNH PHẦN GIAO DIỆN ---
const homeScreen = document.getElementById('home-screen');
const readerScreen = document.getElementById('reader-screen');
const storyList = document.getElementById('story-list');

const inputTitle = document.getElementById('story-title');
const inputContent = document.getElementById('story-content');
const btnSave = document.getElementById('btn-save');

const displayTitle = document.getElementById('display-title');
const displayContent = document.getElementById('display-content');
const btnBack = document.getElementById('btn-back');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');

// Các thành phần mới cho cỡ chữ
const fontSlider = document.getElementById('font-slider');
const fontSizeVal = document.getElementById('font-size-val');

// --- 2. BIẾN QUẢN LÝ HỆ THỐNG ---
const synth = window.speechSynthesis;
let currentUtterance = null;
let currentStoryIndex = null; 
let lastCharIndex = 0; 

// --- 3. HÀM HIỂN THỊ DANH SÁCH TRUYỆN ---
function renderList() {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; 

    stories.forEach((story, index) => {
        const li = document.createElement('li');
        const percent = story.scrollPos > 100 ? " (Đang đọc dở)" : "";
        
        li.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:5px; flex:1">
                <span style="font-weight:bold">${story.title}</span>
                <small style="color:#8e8e93; font-size:11px">Đã lưu${percent}</small>
            </div>
            <div style="display:flex; gap:10px">
                <button onclick="openStory(${index})" style="width:auto; padding:8px 15px; background:#34c759">Đọc</button>
                <button onclick="deleteStory(${index})" style="width:auto; padding:8px 10px; background:#ff3b30">Xóa</button>
            </div>
        `;
        storyList.appendChild(li);
    });
}

// --- 4. HÀM LƯU TRUYỆN MỚI ---
btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();
    if (!title || !content) return alert("Nhập đủ tên và nội dung nhé!");

    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ title, content, scrollPos: 0, lastChar: 0 });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));

    inputTitle.value = ''; inputContent.value = '';
    alert("Đã lưu vào kho!");
    renderList();
};

// --- 5. HÀM XÓA TRUYỆN ---
window.deleteStory = (index) => {
    if(confirm("Xóa truyện này nhé?")) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories.splice(index, 1);
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        renderList();
    }
}

// --- 6. HÀM MỞ TRUYỆN & CÀI ĐẶT CỠ CHỮ ---
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];

    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0;

    // Tải cỡ chữ đã lưu từ máy
    const savedSize = localStorage.getItem('giahuy_fontsize') || 19;
    applyFontSize(savedSize);

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');

    setTimeout(() => {
        window.scrollTo({ top: story.scrollPos || 0, behavior: 'smooth' });
    }, 100);
};

// --- 7. LOGIC CHỈNH CỠ CHỮ ---
fontSlider.oninput = () => {
    applyFontSize(fontSlider.value);
};

function applyFontSize(size) {
    displayContent.style.fontSize = size + 'px';
    fontSizeVal.innerText = size;
    fontSlider.value = size;
    // Lưu lại sở thích vào máy để lần sau không phải chỉnh lại
    localStorage.setItem('giahuy_fontsize', size);
}

// --- 8. GHI NHỚ VỊ TRÍ CUỘN ---
window.onscroll = () => {
    if (!readerScreen.classList.contains('hidden') && currentStoryIndex !== null) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        if (stories[currentStoryIndex]) {
            stories[currentStoryIndex].scrollPos = window.scrollY;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    }
};

// --- 9. ĐIỀU KHIỂN GIỌNG NÓI (TTS) ---
btnPlay.onclick = () => {
    if (synth.speaking) synth.cancel();

    const textToRead = displayContent.innerText.substring(lastCharIndex);
    currentUtterance = new SpeechSynthesisUtterance(textToRead);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
            const globalCharIndex = lastCharIndex + event.charIndex;
            stories[currentStoryIndex].lastChar = globalCharIndex;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    };

    currentUtterance.onend = () => {
        alert("Xong chương rồi!");
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories[currentStoryIndex].lastChar = 0;
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        lastCharIndex = 0;
    };

    synth.speak(currentUtterance);
};

btnStop.onclick = () => synth.cancel();

// --- 10. QUAY LẠI ---
btnBack.onclick = () => {
    synth.cancel();
    currentStoryIndex = null;
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList();
};

renderList();