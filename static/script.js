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

async function browseInput(inputId, type, isSplit = false) {
    const res = await fetch(`/api/browse_input?type=${type}`);
    const data = await res.json();
    if (data.path) {
        document.getElementById(inputId).value = data.path;
        
        if (isSplit) {
            generateSplitPreview();
        } else {
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
}

function generateSplitPreview() {
    const inputPath = document.getElementById('split-input').value;
    const partsCount = parseInt(document.getElementById('split-parts').value);
    const container = document.getElementById('split-video-container');
    const section = document.getElementById('split-preview-section');
    
    if (!inputPath || isNaN(partsCount) || partsCount < 2) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    container.innerHTML = ''; // Очистка
    
    const flexBasis = `calc(${100 / partsCount}% - 10px)`;
    
    for (let i = 0; i < partsCount; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'split-part-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = flexBasis;
        wrapper.style.minWidth = '50px';
        wrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        wrapper.style.padding = '5px';
        wrapper.style.borderRadius = '8px';
        wrapper.style.boxSizing = 'border-box';
        
        const videoClipWrapper = document.createElement('div');
        videoClipWrapper.style.position = 'relative';
        videoClipWrapper.style.width = '100%';
        videoClipWrapper.style.overflow = 'hidden';
        videoClipWrapper.style.backgroundColor = '#000';
        videoClipWrapper.style.borderRadius = '4px';
        videoClipWrapper.style.aspectRatio = '16/9';
        
        const video = document.createElement('video');
        video.src = `/media?path=${encodeURIComponent(inputPath)}`;
        video.controls = false;
        video.className = 'split-preview-video';
        
        // CSS Crop Trick
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = `-${i * 100}%`;
        video.style.width = `${partsCount * 100}%`;
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        videoClipWrapper.appendChild(video);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'split-part-name';
        input.value = `part${i+1}`;
        input.style.marginTop = '8px';
        input.style.width = '100%';
        input.style.textAlign = 'center';
        input.style.fontSize = '12px';
        
        wrapper.appendChild(videoClipWrapper);
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }
}

function playSplitVideos() {
    document.querySelectorAll('.split-preview-video').forEach(vid => vid.play());
}

function pauseSplitVideos() {
    document.querySelectorAll('.split-preview-video').forEach(vid => vid.pause());
}

function stopSplitVideos() {
    document.querySelectorAll('.split-preview-video').forEach(vid => {
        vid.pause();
        vid.currentTime = 0;
    });
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
        
        data.paths.forEach((path, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.draggable = true;
            wrapper.dataset.index = index;
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            wrapper.style.padding = '10px';
            wrapper.style.borderRadius = '8px';
            wrapper.style.cursor = 'grab';
            wrapper.style.boxSizing = 'border-box';
            
            wrapper.addEventListener('dragstart', handleDragStart);
            wrapper.addEventListener('dragover', handleDragOver);
            wrapper.addEventListener('drop', handleDrop);
            wrapper.addEventListener('dragenter', handleDragEnter);
            wrapper.addEventListener('dragleave', handleDragLeave);
            wrapper.addEventListener('dragend', handleDragEnd);

            const video = document.createElement('video');
            video.src = `/media?path=${encodeURIComponent(path)}`;
            video.controls = false;
            video.style.width = '100%';
            video.style.backgroundColor = '#000';
            video.style.borderRadius = '4px';
            video.className = 'synced-video';
            
            const title = document.createElement('span');
            title.innerText = path.split('\\').pop().split('/').pop();
            title.style.marginTop = '8px';
            title.style.fontSize = '12px';
            title.style.color = '#cbd5e1';
            title.style.wordBreak = 'break-all';
            title.style.textAlign = 'center';

            wrapper.appendChild(video);
            wrapper.appendChild(title);
            container.appendChild(wrapper);
        });
        updateMultiLayout();
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
        const nameInputs = document.querySelectorAll('.split-part-name');
        const customNames = Array.from(nameInputs).map(inp => inp.value.trim());
        
        payload = {
            input: document.getElementById('split-input').value,
            output_dir: document.getElementById('split-output').value,
            parts: document.getElementById('split-parts').value,
            custom_names: customNames
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

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    // Firefox требует, чтобы что-то было установлено
    e.dataTransfer.setData('text/plain', this.dataset.index);
    setTimeout(() => this.style.opacity = '0.4', 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    this.style.border = '2px dashed #f87171';
}

function handleDragLeave(e) {
    this.style.border = 'none';
}

function handleDrop(e) {
    e.stopPropagation();
    this.style.border = 'none';
    if (draggedItem !== this) {
        const container = document.getElementById('multi-video-container');
        const allItems = [...container.querySelectorAll('.video-wrapper')];
        const draggedIndex = allItems.indexOf(draggedItem);
        const targetIndex = allItems.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedItem, this);
        }
    }
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    document.querySelectorAll('.video-wrapper').forEach(item => {
        item.style.border = 'none';
    });
}

function updateMultiLayout() {
    const layout = document.getElementById('multi-layout') ? document.getElementById('multi-layout').value : 'row';
    const container = document.getElementById('multi-video-container');
    if (!container) return;
    
    const wrappers = container.querySelectorAll('.video-wrapper');
    
    if (layout === 'row') {
        container.style.flexWrap = 'nowrap';
        container.style.overflowX = 'hidden';
        container.style.justifyContent = 'center';
        const count = wrappers.length;
        const flexBasis = count > 1 ? `calc(${100 / count}% - 10px)` : '100%';
        wrappers.forEach(w => {
            w.style.width = flexBasis;
            w.style.minWidth = '50px';
            w.style.flexShrink = '1';
        });
    } else {
        container.style.flexWrap = 'wrap';
        container.style.overflowX = 'visible';
        container.style.justifyContent = 'center';
        
        const count = wrappers.length;
        const flexBasis = count > 1 ? `calc(${100 / Math.ceil(Math.sqrt(count))}% - 20px)` : '100%';
        
        wrappers.forEach(w => {
            w.style.width = flexBasis;
            w.style.minWidth = '200px';
            w.style.flexShrink = '1';
        });
    }
}
