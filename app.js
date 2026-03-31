// 1. Khai báo các thành phần giao diện
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

// 2. Biến quản lý giọng nói
const synth = window.speechSynthesis;
let currentUtterance = null;

// 3. Hàm hiển thị danh sách truyện đã lưu
function renderList() {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    storyList.innerHTML = ''; // Xóa trắng danh sách cũ

    stories.forEach((story, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${story.title}</span>
            <button onclick="openStory(${index})" style="width:auto; padding:5px 10px; font-size:12px">Đọc</button>
        `;
        storyList.appendChild(li);
    });
}

// 4. Hàm lưu truyện
btnSave.onclick = () => {
    const title = inputTitle.value.trim();
    const content = inputContent.value.trim();

    if (!title || !content) {
        alert("Bạn ơi, nhập tên và nội dung truyện đã nhé!");
        return;
    }

    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    stories.push({ title, content });
    localStorage.setItem('giahuy_stories', JSON.stringify(stories));

    // Xóa trắng ô nhập sau khi lưu
    inputTitle.value = '';
    inputContent.value = '';
    
    alert("Đã lưu xong!");
    renderList();
};

// 5. Hàm mở truyện để đọc
window.openStory = (index) => {
    const stories = JSON.parse(localStorage.getItem('giahuy_stories') || '[]');
    const story = stories[index];

    displayTitle.innerText = story.title;
    displayContent.innerText = story.content;

    homeScreen.classList.add('hidden');
    readerScreen.classList.remove('hidden');
};

// 6. Quay lại màn hình chính
btnBack.onclick = () => {
    synth.cancel(); // Dừng đọc khi quay lại
    readerScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
};

// 7. CHỨC NĂNG ĐỌC TRUYỆN (Quan trọng nhất)
btnPlay.onclick = () => {
    if (synth.speaking) {
        alert("Đang đọc rồi mà!");
        return;
    }

    const text = displayContent.innerText;
    currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Cấu hình giọng đọc
    currentUtterance.lang = 'vi-VN'; // Tiếng Việt
    currentUtterance.rate = 1.0;     // Tốc độ (0.1 đến 2)
    currentUtterance.pitch = 1.0;    // Độ cao của giọng

    synth.speak(currentUtterance);
};

btnStop.onclick = () => {
    synth.cancel();
};

// Chạy lần đầu khi mở app
renderList();