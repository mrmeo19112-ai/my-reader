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

// --- 2. BIẾN QUẢN LÝ HỆ THỐNG ---
const synth = window.speechSynthesis;
let currentUtterance = null;
let currentStoryIndex = null; 
let lastCharIndex = 0; // Vị trí chữ cái đang đọc dở

// --- 3. HÀM HIỂN THỊ DANH SÁCH TRUYỆN ---
function renderList() {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; 

    stories.forEach((story, index) => {
        const li = document.createElement('li');
        // Tính toán phần trăm đã đọc (cho vui và chuyên nghiệp)
        const percent = story.scrollPos ? " (Đang đọc dở)" : "";
        
        li.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:5px">
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

    if (!title || !content) {
        alert("Nhập đủ tên và nội dung nhé!");
        return;
    }

    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ 
        title, 
        content, 
        scrollPos: 0, // Vị trí cuộn trang
        lastChar: 0   // Vị trí chữ cái đang đọc
    });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));

    inputTitle.value = '';
    inputContent.value = '';
    alert("Đã lưu vào kho!");
    renderList();
};

// --- 5. HÀM XÓA TRUYỆN ---
window.deleteStory = (index) => {
    if(confirm("Bạn có chắc muốn xóa truyện này không?")) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories.splice(index, 1);
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        renderList();
    }
}

// --- 6. HÀM MỞ TRUYỆN (CÓ NHỚ VỊ TRÍ) ---
window.openStory = (index) => {
    currentStoryIndex = index;
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];

    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;
    lastCharIndex = story.lastChar || 0; // Lấy vị trí chữ cũ

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');

    // Đợi giao diện render xong rồi cuộn xuống vị trí cũ
    setTimeout(() => {
        window.scrollTo({
            top: story.scrollPos || 0,
            behavior: 'smooth'
        });
    }, 100);
};

// --- 7. TÍNH NĂNG GHI NHỚ VỊ TRÍ KHI CUỘN ---
window.onscroll = () => {
    // Chỉ lưu khi đang ở màn hình đọc truyện
    if (!readerScreen.classList.contains('hidden') && currentStoryIndex !== null) {
        const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
        stories[currentStoryIndex].scrollPos = window.scrollY;
        localStorage.setItem('giahuy_stories', JSON.stringify(stories));
    }
};

// --- 8. ĐIỀU KHIỂN GIỌNG NÓI (TTS) ---
btnPlay.onclick = () => {
    if (synth.speaking) {
        synth.cancel(); // Nếu đang đọc thì bấm nút này sẽ Reset lại câu đang đọc
    }

    const fullText = displayContent.innerText;
    // Bắt đầu đọc từ vị trí chữ cái cuối cùng đã lưu
    const textToRead = fullText.substring(lastCharIndex);
    
    currentUtterance = new SpeechSynthesisUtterance(textToRead);
    currentUtterance.lang = 'vi-VN';
    currentUtterance.rate = 1.0;

    // SỰ KIỆN QUAN TRỌNG: Theo dõi Siri đang đọc đến đâu
    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
            // Cập nhật vị trí chữ cái mới = Vị trí cũ + Vị trí hiện tại của câu mới
            const globalCharIndex = lastCharIndex + event.charIndex;
            stories[currentStoryIndex].lastChar = globalCharIndex;
            localStorage.setItem('giahuy_stories', JSON.stringify(stories));
        }
    };

    // Khi đọc hết truyện
    currentUtterance.onend = () => {
        alert("Đã đọc xong chương này!");
        lastCharIndex = 0; // Reset về đầu
    };

    synth.speak(currentUtterance);
};

btnStop.onclick = () => {
    synth.cancel();
};

// --- 9. QUAY LẠI MÀN HÌNH CHÍNH ---
btnBack.onclick = () => {
    synth.cancel();
    currentStoryIndex = null;
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    renderList(); // Cập nhật lại danh sách (để hiện trạng thái "đang đọc dở")
};

// Chạy khởi tạo danh sách khi vừa mở App
renderList();