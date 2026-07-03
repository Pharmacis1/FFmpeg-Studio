import os
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
print(f"Found ffmpeg at: {ffmpeg_exe}")

# Windows PyInstaller command
cmd = [
    'pyinstaller',
    '--name=FFmpegStudio',
    '--onefile',
    '--windowed',  # Hides the console window
    f'--add-data=templates;templates',
    f'--add-data=static;static',
    f'--add-data={ffmpeg_exe};.',  # Put ffmpeg.exe in the root of the bundle
    'app.py'
]

print("Running PyInstaller...")
subprocess.run(cmd, check=True)
print("Build complete! Check the 'dist' folder.")
