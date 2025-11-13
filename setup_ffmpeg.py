#!/usr/bin/env python
"""
Helper script to set up FFmpeg path for the application
"""
import os
import sys
import shutil

def setup_ffmpeg():
    """Configure FFmpeg for the application"""
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        print(f"✓ Found imageio-ffmpeg at: {ffmpeg_path}")
        
        # Add to PATH
        ffmpeg_dir = os.path.dirname(ffmpeg_path)
        os.environ['PATH'] = ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')
        
        # Verify it works
        result = shutil.which('ffmpeg')
        if result:
            print(f"✓ FFmpeg is now available in PATH: {result}")
        else:
            print(f"⚠ FFmpeg still not in PATH, but imageio-ffmpeg is available at: {ffmpeg_path}")
            
        return True
    except Exception as e:
        print(f"✗ Error setting up FFmpeg: {e}")
        return False

if __name__ == "__main__":
    setup_ffmpeg()
