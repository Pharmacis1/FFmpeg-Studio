import os
import sys
import subprocess
import threading
import webbrowser
from flask import Flask, render_template, request, jsonify, send_file
import tkinter as tk
from tkinter import filedialog

# PyInstaller compatibility for static and template folders
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    FFMPEG_EXE = os.path.join(sys._MEIPASS, 'ffmpeg.exe')
else:
    template_folder = 'templates'
    static_folder = 'static'
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

app = Flask(__name__, static_folder=static_folder, template_folder=template_folder)

def open_file_dialog(title, filetypes):
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.askopenfilename(title=title, filetypes=filetypes)
    root.destroy()
    return file_path

def open_file_dialog_multiple(title, filetypes):
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_paths = filedialog.askopenfilenames(title=title, filetypes=filetypes)
    root.destroy()
    return list(file_paths)

def open_save_dialog(title, defaultextension, filetypes):
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    file_path = filedialog.asksaveasfilename(title=title, defaultextension=defaultextension, filetypes=filetypes)
    root.destroy()
    return file_path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/browse_input', methods=['GET'])
def browse_input():
    filter_type = request.args.get('type', 'video')
    if filter_type == 'video':
        filetypes = [("Video files", "*.mp4 *.avi *.mkv *.mov *.wmv")]
    elif filter_type == 'image':
        filetypes = [("Image files", "*.jpg *.jpeg *.png")]
    else:
        filetypes = [("All files", "*.*")]
        
    path = open_file_dialog("Выберите исходный файл", filetypes)
    return jsonify({"path": path})

@app.route('/api/browse_multiple_inputs', methods=['GET'])
def browse_multiple_inputs():
    filter_type = request.args.get('type', 'video')
    if filter_type == 'video':
        filetypes = [("Video files", "*.mp4 *.avi *.mkv *.mov *.wmv")]
    elif filter_type == 'image':
        filetypes = [("Image files", "*.jpg *.jpeg *.png")]
    else:
        filetypes = [("All files", "*.*")]
        
    paths = open_file_dialog_multiple("Выберите исходные файлы", filetypes)
    return jsonify({"paths": paths})

@app.route('/api/browse_output', methods=['GET'])
def browse_output():
    ext = request.args.get('ext', '.mp4')
    path = open_save_dialog("Выберите куда сохранить", ext, [(f"{ext} files", f"*{ext}")])
    return jsonify({"path": path})

@app.route('/api/browse_output_dir', methods=['GET'])
def browse_output_dir():
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    path = filedialog.askdirectory(title="Выберите папку для сохранения")
    root.destroy()
    return jsonify({"path": path})

@app.route('/media')
def serve_media():
    path = request.args.get('path')
    if not path or not os.path.exists(path):
        return "Not found", 404
    return send_file(path)

def run_ffmpeg(cmd):
    try:
        creationflags = 0x08000000 if os.name == 'nt' else 0
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=creationflags)
        _, stderr = process.communicate()
        if process.returncode != 0:
            return False, stderr.decode('utf-8', errors='ignore')
        return True, "Успешно!"
    except Exception as e:
        return False, str(e)

@app.route('/api/convert', methods=['POST'])
def convert():
    data = request.json
    inputs = data.get('inputs', [])
    output_dir = data.get('output_dir')
    quality = data.get('quality', '23')
    remove_audio = data.get('remove_audio', False)
    fps = data.get('fps', '')
    
    if not inputs or not output_dir:
        return jsonify({"success": False, "message": "Выберите файлы и папку для сохранения"})
        
    errors = []
    
    for input_file in inputs:
        base_name = os.path.basename(input_file)
        name, _ = os.path.splitext(base_name)
        out_name = f"{name}_conv.mp4"
        output_file = os.path.join(output_dir, out_name)
        
        cmd = [FFMPEG_EXE, '-y', '-i', input_file, '-vcodec', 'libx264', '-crf', str(quality)]
        if remove_audio:
            cmd.append('-an')
        if fps:
            cmd.extend(['-r', str(fps)])
        cmd.append(output_file)
        
        success, msg = run_ffmpeg(cmd)
        if not success:
            errors.append(f"Ошибка при обработке {base_name}: {msg}")
            
    if errors:
        return jsonify({"success": False, "message": "\n".join(errors)})
    
    return jsonify({"success": True, "message": "Все файлы успешно сконвертированы!"})

@app.route('/api/split_video', methods=['POST'])
def split_video():
    data = request.json
    tasks = data.get('tasks', [])
    output_dir = data.get('output_dir')
    parts = int(data.get('parts', 4))
    
    if not tasks or not output_dir:
        return jsonify({"success": False, "message": "Выберите файлы и папку"})
        
    errors = []
    
    for task in tasks:
        input_file = task.get('input')
        custom_names = task.get('custom_names', [])
        
        if not input_file:
            continue
            
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        
        filter_complex = ""
        maps = []
        output_files = []
        
        for i in range(parts):
            filter_complex += f"[0:v]crop=iw/{parts}:ih:(iw/{parts})*{i}:0[v{i}];"
            maps.extend(['-map', f'[v{i}]'])
            
            if custom_names and i < len(custom_names) and custom_names[i]:
                part_name = custom_names[i]
            else:
                part_name = f"{base_name}_part{i+1}"
                
            if not part_name.endswith('.mp4'):
                part_name += '.mp4'
                
            output_files.append(os.path.join(output_dir, part_name))
            
        cmd = [FFMPEG_EXE, '-y', '-i', input_file, '-filter_complex', filter_complex[:-1]]
        
        for i in range(parts):
            cmd.extend(['-map', f'[v{i}]', '-vcodec', 'libx264', '-crf', '23', '-an', '-r', '30', output_files[i]])
            
        success, msg = run_ffmpeg(cmd)
        if not success:
            errors.append(f"Ошибка при нарезке {base_name}: {msg}")
            
    if errors:
        return jsonify({"success": False, "message": "\n".join(errors)})
        
    return jsonify({"success": True, "message": "Все файлы успешно разрезаны!"})

@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return jsonify({"success": True, "message": "Выключение сервера..."})

def start_browser():
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    threading.Timer(1.25, start_browser).start()
    app.run(port=5000)
