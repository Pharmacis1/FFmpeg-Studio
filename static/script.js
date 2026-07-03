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
