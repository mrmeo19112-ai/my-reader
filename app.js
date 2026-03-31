// ==========================================
// 1. KẾT NỐI VỚI GIAO DIỆN HTML
// ==========================================
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

// ==========================================
// 2. BIẾN HỆ THỐNG & TRẠNG THÁI
// ==========================================
const synth = window.speechSynthesis;
let currentUtterance = null;
let currentStoryIndex = null; 
let lastCharIndex = 0; 
let isPausedManual = false;

// ==========================================
// 3. QUẢN LÝ DANH SÁCH & LƯU TRỮ
// ==========================================
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

btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();
    if (!title || !content) return alert("Vui lòng nhập đủ tên và nội dung truyện!");
    
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ title, content, scrollPos: 0, lastChar: 0 });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));
    
    inputTitle.value = ''; inputContent.value = '';
    renderList();
};

window.deleteStory = (index) => {
    if(confirm("Bạn có chắc chắn muốn xóa truyện này?")) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories.splice(index, 1);
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        renderList();
    }
}

// ==========================================
// 4. MỞ TRUYỆN & CÀI ĐẶT CỠ CHỮ
// ==========================================
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];
    
    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0;

    // Load cỡ chữ đã lưu
    applyFontSize(localStorage.getItem('giahuy_fontsize') || 19);
    
    // Đảm bảo thanh điều khiển hiện rõ khi mới vào
    readerControls.style.opacity = "1";
    readerControls.style.pointerEvents = "auto";
    btnPlay.innerText = "▶️";
    btnPlay.style.opacity = "1";

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');

    // Tự động cuộn đến chỗ đọc dở
    setTimeout(() => { 
        window.scrollTo(0, story.scrollPos || 0); 
    }, 100);
};

fontSlider.oninput = () => applyFontSize(fontSlider.value);

function applyFontSize(size) {
    displayContent.style.fontSize = size + 'px';
    fontSizeVal.innerText = size + 'px';
    fontSlider.value = size;
    localStorage.setItem('giahuy_fontsize', size);
}

// ==========================================
// 5. TRÍ NHỚ & LƯU TRẠNG THÁI LIÊN TỤC
// ==========================================
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

// Bắt sự kiện thoát App ra màn hình chính (Lưu ngay lập tức)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        synth.cancel(); 
        saveCurrentProgress();
    }
});

// Lưu vị trí khi bạn tự dùng tay vuốt màn hình
window.onscroll = () => {
    if (!readerScreen.classList.contains('hidden')) {
        saveCurrentProgress();
    }
};

// ==========================================
// 6. LOGIC ĐỌC TRUYỆN (XỬ LÝ TRUYỆN DÀI)
// ==========================================
btnPlay.onclick = () => {
    // NẾU ĐANG ĐỌC -> BẤM VÀO ĐỂ TẠM DỪNG
    if (synth.speaking && !synth.paused) {
        synth.cancel();
        isPausedManual = true;
        
        btnPlay.innerText = "▶️";
        btnPlay.style.opacity = "1"; // Sáng nút lên
        
        // Hiện lại thanh công cụ trên cùng
        readerControls.style.opacity = "1"; 
        readerControls.style.pointerEvents = "auto"; 
        
        saveCurrentProgress();
        return;
    }

    // NẾU ĐANG DỪNG -> BẤM VÀO ĐỂ ĐỌC TIẾP
    isPausedManual = false;
    btnPlay.innerText = "⏸";
    btnPlay.style.opacity = "0.3"; // Làm mờ nút Pause để không rối mắt
    
    // Ẩn thanh công cụ trên cùng (Chế độ tập trung)
    readerControls.style.opacity = "0"; 
    readerControls.style.pointerEvents = "none";

    const fullText = displayContent.innerText;
    // Cắt khúc 2000 chữ để trình duyệt không bị treo
    const textChunk = fullText.substring(lastCharIndex, lastCharIndex + 2000);
    
    if (textChunk.length === 0) {
        btnPlay.innerText = "▶️";
        btnPlay.style.opacity = "1";
        readerControls.style.opacity = "1";
        lastCharIndex = 0; 
        saveCurrentProgress();
        alert("Đã đọc hết truyện!");
        return;
    }

    currentUtterance = new SpeechSynthesisUtterance(textChunk);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    // Ghi nhớ từng chữ cái khi Siri đọc
    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const tempIndex = lastCharIndex + event.charIndex;
            
            // Cứ 5 từ thì lưu vào bộ nhớ 1 lần cho an toàn tuyệt đối
            if (event.charIndex % 5 === 0) {
                const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
                stories[currentStoryIndex].lastChar = tempIndex;
                stories[currentStoryIndex].scrollPos = window.scrollY;
                localStorage.setItem('giahuy_stories', JSON.stringify(stories));
            }
        }
    };

    // Khi đọc hết khúc 2000 chữ -> Tự động gọi đọc khúc tiếp theo
    currentUtterance.onend = () => {
        if (!isPausedManual) {
            lastCharIndex += textChunk.length;
            saveCurrentProgress();
            btnPlay.click(); 
        }
    };

    synth.speak(currentUtterance);
};

// ==========================================
// 7. QUAY LẠI MÀN HÌNH CHÍNH
// ==========================================
btnBack.onclick = () => {
    synth.cancel();
    saveCurrentProgress();
    
    // Khôi phục lại giao diện ban đầu
    btnPlay.innerText = "▶️";
    btnPlay.style.opacity = "1";
    readerControls.style.opacity = "1";
    readerControls.style.pointerEvents = "auto";
    
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList();
};

// Khởi chạy App
renderList();