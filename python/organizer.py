#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZER.PY - File Organizer for Social Media Data Collector
# ═══════════════════════════════════════════════════════════════════════════════
#
# PURPOSE: Watch Downloads folder and automatically organize collected files
#   - Monitors: ~/Downloads/dataset_temp/
#   - Parses filenames to extract platform name
#   - Moves files to: D:/dataset/{platform}/images/ and /labels/
#
# FILENAME FORMAT:
#   {platform}_{timestamp}_{counter}.{extension}
#   Example: twitter_1730912345678_0347.jpg
#
# RUN: python organizer.py
#
# ═══════════════════════════════════════════════════════════════════════════════

import os
import shutil
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Source folder (where extension downloads files)
WATCH_FOLDER = os.path.expanduser("~/Downloads/dataset_temp")

# Destination base folder
# Change this to your preferred location
DEST_BASE = "C:/Users/offrk/Desktop/dataset"  # Windows - Desktop
# DEST_BASE = "D:/dataset"  # If you have D: drive
# DEST_BASE = os.path.expanduser("~/Desktop/dataset")  # Alternative

# Supported platforms
PLATFORMS = [
    'twitter', 'instagram', 'facebook', 'whatsapp',
    'linkedin', 'reddit', 'discord', 'threads', 
    'youtube', 'snapchat'
]

# File extensions
IMAGE_EXT = '.jpg'
LABEL_EXT = '.txt'


# ═══════════════════════════════════════════════════════════════════════════════
# FILE HANDLER CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class DatasetFileHandler(FileSystemEventHandler):
    """
    Handles file creation events in the watch folder
    """
    
    def on_created(self, event):
        """
        Called when a new file is created in watch folder
        """
        # Ignore directory creation
        if event.is_directory:
            return
        
        # Get filename
        filepath = event.src_path
        filename = os.path.basename(filepath)
        
        # Wait a bit to ensure file is fully written
        time.sleep(0.5)
        
        # Check if file still exists (might be temp file)
        if not os.path.exists(filepath):
            return
        
        # Process the file
        self.process_file(filepath, filename)
    
    
    def process_file(self, filepath, filename):
        """
        Parse filename and move to correct destination
        
        Filename format: {platform}_{timestamp}_{counter}.{ext}
        Example: twitter_1730912345678_0347.jpg
        """
        try:
            # Parse filename
            parts = filename.split('_')
            
            if len(parts) < 3:
                print(f"⚠️  Invalid filename format: {filename}")
                return
            
            # Extract platform name
            platform = parts[0].lower()
            
            # Validate platform
            if platform not in PLATFORMS:
                print(f"⚠️  Unknown platform: {platform}")
                return
            
            # Get file extension
            extension = os.path.splitext(filename)[1].lower()
            
            # Determine destination folder
            if extension == IMAGE_EXT:
                dest_folder = os.path.join(DEST_BASE, platform, 'images')
            elif extension == LABEL_EXT:
                dest_folder = os.path.join(DEST_BASE, platform, 'labels')
            else:
                print(f"⚠️  Unknown file extension: {extension}")
                return
            
            # Create destination folder if doesn't exist
            os.makedirs(dest_folder, exist_ok=True)
            
            # Build destination path
            dest_path = os.path.join(dest_folder, filename)
            
            # Check if file already exists
            if os.path.exists(dest_path):
                print(f"⚠️  File already exists: {dest_path}")
                # Add timestamp to make unique
                base, ext = os.path.splitext(filename)
                new_filename = f"{base}_dup_{int(time.time())}{ext}"
                dest_path = os.path.join(dest_folder, new_filename)
            
            # Move file
            shutil.move(filepath, dest_path)
            
            # Success message
            file_type = "Image" if extension == IMAGE_EXT else "Label"
            print(f"✅ {file_type} moved: {platform}/{filename}")
            
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# SETUP FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def setup_folders():
    """
    Create necessary folder structure if it doesn't exist
    """
    print("📁 Setting up folder structure...")
    
    # Create watch folder
    os.makedirs(WATCH_FOLDER, exist_ok=True)
    print(f"   ✅ Watch folder: {WATCH_FOLDER}")
    
    # Create destination folders for each platform
    for platform in PLATFORMS:
        images_folder = os.path.join(DEST_BASE, platform, 'images')
        labels_folder = os.path.join(DEST_BASE, platform, 'labels')
        
        os.makedirs(images_folder, exist_ok=True)
        os.makedirs(labels_folder, exist_ok=True)
        
        print(f"   ✅ {platform}: images/ and labels/")
    
    print("✅ Folder structure ready!\n")


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def print_statistics():
    """
    Print current dataset statistics
    """
    print("\n" + "="*60)
    print("📊 CURRENT DATASET STATISTICS")
    print("="*60)
    
    total_images = 0
    total_labels = 0
    
    for platform in PLATFORMS:
        images_folder = os.path.join(DEST_BASE, platform, 'images')
        labels_folder = os.path.join(DEST_BASE, platform, 'labels')
        
        # Count files
        image_count = 0
        label_count = 0
        
        if os.path.exists(images_folder):
            image_count = len([f for f in os.listdir(images_folder) if f.endswith(IMAGE_EXT)])
        
        if os.path.exists(labels_folder):
            label_count = len([f for f in os.listdir(labels_folder) if f.endswith(LABEL_EXT)])
        
        if image_count > 0 or label_count > 0:
            print(f"  {platform.upper():12} Images: {image_count:4}  Labels: {label_count:4}")
        
        total_images += image_count
        total_labels += label_count
    
    print("-"*60)
    print(f"  {'TOTAL':12} Images: {total_images:4}  Labels: {total_labels:4}")
    print("="*60 + "\n")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """
    Main function - starts the file watcher
    """
    print("\n" + "="*60)
    print("🎯 SOCIAL MEDIA DATA COLLECTOR - FILE ORGANIZER")
    print("="*60 + "\n")
    
    # Setup folders
    setup_folders()
    
    # Print current statistics
    print_statistics()
    
    # Create event handler and observer
    event_handler = DatasetFileHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_FOLDER, recursive=False)
    
    # Start watching
    observer.start()
    
    print("👀 Watching for new files...")
    print(f"📂 Monitoring: {WATCH_FOLDER}")
    print(f"📤 Organizing to: {DEST_BASE}/{{platform}}/{{images|labels}}/\n")
    print("Press Ctrl+C to stop\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping file organizer...")
        observer.stop()
    
    observer.join()
    
    # Print final statistics
    print_statistics()
    
    print("✅ File organizer stopped. Goodbye!\n")


# ═══════════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    main()


# ═══════════════════════════════════════════════════════════════════════════════
# END OF ORGANIZER.PY
# ═══════════════════════════════════════════════════════════════════════════════
#
# HOW TO USE:
#   1. Install dependencies: pip install watchdog
#   2. Run: python organizer.py
#   3. Leave it running in background
#   4. Start collecting data with extension
#   5. Files automatically organized!
#
# FOLDER STRUCTURE CREATED:
#   D:/dataset/
#   ├── twitter/
#   │   ├── images/
#   │   └── labels/
#   ├── instagram/
#   │   ├── images/
#   │   └── labels/
#   └── ... (all platforms)
#
# ═══════════════════════════════════════════════════════════════════════════════