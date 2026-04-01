const homeScreen = document.getElementById('home-screen');
const readerScreen = document.getElementById('reader-screen');
const storyList = document.getElementById('story-list');
const readerControls = document.getElementById('reader-controls');
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

// --- QUẢN LÝ DANH SÁCH ---
function renderList() {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; 
    stories.forEach((story, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="flex:1"><b>${story.title}</b></div>
            <div style="display:flex; gap:10px">
                <button onclick="openStory(${index})" style="width:auto; padding:10px 15px; background:#34c759">Đọc</button>
                <button onclick="deleteStory(${index})" style="width:auto; padding:10px 10px; background:#ff3b30">Xóa</button>
            </div>`;
        storyList.appendChild(li);
    });
}

// --- LƯU & XÓA ---
btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();
    if (!title || !content) return alert("Nhập đủ thông tin!");
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

// --- MỞ TRUYỆN ---
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];
    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0;

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');
    
    // Cập nhật thanh tiến độ ngay khi mở
    updateProgressBar(lastCharIndex, story.content.length);

    setTimeout(() => { window.scrollTo(0, story.scrollPos || 0); }, 100);
};

// --- HÀM CẬP NHẬT THANH TIẾN ĐỘ ---
function updateProgressBar(current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = percentage + "%";
}

// --- LOGIC ĐỌC TRUYỆN ---
btnPlay.onclick = () => {
    if (synth.speaking && !synth.paused) {
        synth.cancel();
        isPausedManual = true;
        btnPlay.innerText = "▶️";
        readerControls.style.opacity = "1";
        return;
    }

    isPausedManual = false;
    btnPlay.innerText = "⏸";
    readerControls.style.opacity = "0";

    const fullText = displayContent.innerText;
    const totalLength = fullText.length;
    const textChunk = fullText.substring(lastCharIndex, lastCharIndex + 2000);
    
    if (textChunk.length === 0) {
        btnPlay.innerText = "▶️";
        readerControls.style.opacity = "1";
        lastCharIndex = 0;
        updateProgressBar(0, totalLength);
        alert("Hết truyện!");
        return;
    }

    currentUtterance = new SpeechSynthesisUtterance(textChunk);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const globalIndex = lastCharIndex + event.charIndex;
            
            // Cập nhật thanh tiến độ theo chữ đang đọc
            updateProgressBar(globalIndex, totalLength);

            // Lưu vào máy
            const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
            stories[currentStoryIndex].lastChar = globalIndex;
            stories[currentStoryIndex].scrollPos = window.scrollY;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    };

    currentUtterance.onend = () => {
        if (!isPausedManual) {
            lastCharIndex += textChunk.length;
            btnPlay.click(); 
        }
    };

    synth.speak(currentUtterance);
};

// --- QUAY LẠI ---
btnBack.onclick = () => {
    synth.cancel();
    btnPlay.innerText = "▶️";
    readerControls.style.opacity = "1";
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList();
};

renderList();