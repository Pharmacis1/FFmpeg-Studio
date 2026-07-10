document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем active со всех
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Добавляем active на текущий
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

async function browseInput(inputId, type) {
    const res = await fetch(`/api/browse_input?type=${type}`);
    const data = await res.json();
    if (data.path) {
        document.getElementById(inputId).value = data.path;
        
        // Показываем превью
        document.getElementById('preview-container').style.display = 'block';
        if (type === 'video') {
            document.getElementById('video-preview').style.display = 'inline-block';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('video-preview').src = `/media?path=${encodeURIComponent(data.path)}`;
        } else if (type === 'image') {
            document.getElementById('image-preview').style.display = 'inline-block';
            document.getElementById('video-preview').style.display = 'none';
            document.getElementById('image-preview').src = `/media?path=${encodeURIComponent(data.path)}`;
        }
    }
}

async function browseOutput(inputId, ext = '.mp4') {
    const res = await fetch(`/api/browse_output?ext=${ext}`);
    const data = await res.json();
    if (data.path) {
        document.getElementById(inputId).value = data.path;
    }
}

async function browseOutputDir(inputId) {
    const res = await fetch(`/api/browse_output_dir`);
    const data = await res.json();
    if (data.path) {
        document.getElementById(inputId).value = data.path;
    }
}

async function browseMultipleInputs() {
    const res = await fetch(`/api/browse_multiple_inputs?type=video`);
    const data = await res.json();
    if (data.paths && data.paths.length > 0) {
        document.getElementById('multi-preview-input').value = `Выбрано файлов: ${data.paths.length}`;
        
        const container = document.getElementById('multi-video-container');
        container.innerHTML = ''; // Очистка предыдущих
        
        data.paths.forEach(path => {
            const video = document.createElement('video');
            video.src = `/media?path=${encodeURIComponent(path)}`;
            video.controls = false; // Убираем контролы для синхронного управления
            video.style.width = data.paths.length > 1 ? `calc(${100 / Math.ceil(Math.sqrt(data.paths.length))}% - 10px)` : '100%';
            video.style.minWidth = '200px';
            video.style.maxWidth = '100%';
            video.style.backgroundColor = '#000';
            video.className = 'synced-video';
            container.appendChild(video);
        });
    }
}

function playAllVideos() {
    document.querySelectorAll('.synced-video').forEach(vid => vid.play());
}

function pauseAllVideos() {
    document.querySelectorAll('.synced-video').forEach(vid => vid.pause());
}

function stopAllVideos() {
    document.querySelectorAll('.synced-video').forEach(vid => {
        vid.pause();
        vid.currentTime = 0;
    });
}

function showMessage(text, isError = false) {
    const msgEl = document.getElementById('result-message');
    msgEl.innerText = text;
    msgEl.className = 'message ' + (isError ? 'error' : 'success');
    msgEl.style.display = 'block';
    setTimeout(() => {
        msgEl.style.display = 'none';
    }, 5000);
}

async function startProcess(type) {
    const loader = document.getElementById('loader');
    loader.style.display = 'flex';
    document.getElementById('result-message').style.display = 'none';
    
    let url = '';
    let payload = {};

    if (type === 'convert') {
        url = '/api/convert';
        payload = {
            input: document.getElementById('conv-input').value,
            output: document.getElementById('conv-output').value,
            quality: document.getElementById('conv-quality').value
        };
    } else if (type === 'audio') {
        url = '/api/extract_audio';
        payload = {
            input: document.getElementById('audio-input').value,
            output: document.getElementById('audio-output').value
        };
    } else if (type === 'split') {
        url = '/api/split_video';
        payload = {
            input: document.getElementById('split-input').value,
            output_dir: document.getElementById('split-output').value,
            parts: document.getElementById('split-parts').value
        };
    } else if (type === 'compose') {
        url = '/api/compose';
        payload = {
            video: document.getElementById('comp-video').value,
            image: document.getElementById('comp-image').value,
            orientation: document.getElementById('comp-orientation').value,
            output: document.getElementById('comp-output').value
        };
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        loader.style.display = 'none';
        showMessage(data.message || (data.success ? 'Готово!' : 'Ошибка'), !data.success);
    } catch (err) {
        loader.style.display = 'none';
        showMessage('Произошла ошибка при отправке запроса', true);
    }
}

async function shutdownApp() {
    if (confirm('Вы уверены, что хотите закрыть программу?')) {
        try {
            await fetch('/api/shutdown', { method: 'POST' });
        } catch (e) {} // Ошибка может возникнуть, если сервер отключился до ответа
        
        document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;"><h2 style="color: white;">Программа успешно закрыта</h2><p style="color: #94a3b8;">Вы можете закрыть эту вкладку.</p></div>';
        
        // Пытаемся закрыть вкладку
        setTimeout(() => {
            window.close();
        }, 500);
    }
}
