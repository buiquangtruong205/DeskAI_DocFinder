"""
Migration script to update from deprecated google.generativeai to google.genai
"""

import subprocess
import sys
import os

def install_new_package():
    """Install the new google.genai package"""
    print("Installing new google.genai package...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai"])
        print("✅ Successfully installed google-genai")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install google-genai: {e}")
        return False

def uninstall_old_package():
    """Uninstall the deprecated google.generativeai package"""
    print("Uninstalling deprecated google.generativeai package...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "google-generativeai", "-y"])
        print("✅ Successfully uninstalled google.generativeai")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to uninstall google.generativeai: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Migrating from google.generativeai to google.genai...")
    
    # Install new package first
    if install_new_package():
        # Only uninstall old package if new one installed successfully
        uninstall_old_package()
        print("\n✅ Migration completed!")
        print("📝 Note: You'll need to update your code to use the new API.")
        print("📖 See: https://github.com/google-gemini/generative-ai-python")
    else:
        print("\n❌ Migration failed!")