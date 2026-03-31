const homeScreen = document.getElementById('home-screen');
const readerScreen = document.getElementById('reader-screen');
const storyList = document.getElementById('story-list');
const readerControls = document.getElementById('reader-controls');

const inputTitle = document.getElementById('story-title');
const inputContent = document.getElementById('story-content');
const btnSave = document.getElementById('btn-save');

const displayTitle = document.getElementById('display-title');
const displayContent = document.getElementById('display-content');
const btnBack = document.getElementById('btn-back');
const btnPlay = document.getElementById('btn-play');

const fontSlider = document.getElementById('font-slider');
const fontSizeVal = document.getElementById('font-size-val');

const synth = window.speechSynthesis;
let currentUtterance = null;
let currentStoryIndex = null; 
let lastCharIndex = 0; 
let isPausedManual = false;

// --- HÀM HIỂN THỊ DANH SÁCH ---
function renderList() {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; 
    stories.forEach((story, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="flex:1"><b>${story.title}</b></div>
            <div style="display:flex; gap:5px">
                <button onclick="openStory(${index})" style="width:auto; padding:8px 12px; background:#34c759">Đọc</button>
                <button onclick="deleteStory(${index})" style="width:auto; padding:8px 10px; background:#ff3b30">Xóa</button>
            </div>`;
        storyList.appendChild(li);
    });
}

// --- LƯU & XÓA ---
btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();
    if (!title || !content) return alert("Nhập đủ đã nhé!");
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ title, content, scrollPos: 0, lastChar: 0 });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));
    inputTitle.value = ''; inputContent.value = '';
    renderList();
};

window.deleteStory = (index) => {
    if(confirm("Xóa nhé?")) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories.splice(index, 1);
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        renderList();
    }
}

// --- MỞ TRUYỆN & CỠ CHỮ ---
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];
    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0;

    applyFontSize(localStorage.getItem('giahuy_fontsize') || 19);
    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');
    setTimeout(() => { window.scrollTo(0, story.scrollPos || 0); }, 100);
};

fontSlider.oninput = () => applyFontSize(fontSlider.value);
function applyFontSize(size) {
    displayContent.style.fontSize = size + 'px';
    fontSizeVal.innerText = size + 'px';
    fontSlider.value = size;
    localStorage.setItem('giahuy_fontsize', size);
}

// --- LOGIC ĐỌC TRUYỆN DÀI (FIX LỖI 3K CHỮ) ---
btnPlay.onclick = () => {
    if (synth.speaking && !synth.paused) {
        // Đang đọc thì TẠM DỪNG
        synth.cancel();
        isPausedManual = true;
        btnPlay.innerText = "▶️";
        readerControls.style.opacity = "1"; // Hiện lại nút chỉnh
        return;
    }

    isPausedManual = false;
    btnPlay.innerText = "⏸";
    readerControls.style.opacity = "0"; // ẨN NÚT KHI ĐỌC

    const fullText = displayContent.innerText;
    // Chia nhỏ truyện thành các đoạn 2000 chữ để tránh lỗi trình duyệt dừng đột ngột
    const textChunk = fullText.substring(lastCharIndex, lastCharIndex + 2000);
    
    if (textChunk.length === 0) {
        btnPlay.innerText = "▶️";
        readerControls.style.opacity = "1";
        alert("Hết truyện rồi!");
        return;
    }

    currentUtterance = new SpeechSynthesisUtterance(textChunk);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
            stories[currentStoryIndex].lastChar = lastCharIndex + event.charIndex;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    };

    currentUtterance.onend = () => {
        if (!isPausedManual) {
            lastCharIndex += textChunk.length; // Chuyển sang đoạn 2000 chữ tiếp theo
            btnPlay.click(); // Tự động kích hoạt đọc đoạn kế tiếp
        }
    };

    synth.speak(currentUtterance);
};

// --- QUAY LẠI ---
btnBack.onclick = () => {
    synth.cancel();
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    if(stories[currentStoryIndex]) {
        stories[currentStoryIndex].scrollPos = window.scrollY;
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
    }
    btnPlay.innerText = "▶️";
    readerControls.style.opacity = "1";
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList();
};

renderList();