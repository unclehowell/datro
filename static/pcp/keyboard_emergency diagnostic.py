#!/usr/bin/env python3
"""
Keyboard Issue Diagnoser
Determines if keyboard issues are hardware or software related
"""

import subprocess
import platform
import time
import sys

def check_stuck_keys():
    """Check for stuck modifier keys"""
    print("=== CHECKING FOR STUCK KEYS ===")
    print("1. Press ALL modifier keys (Ctrl, Shift, Alt, Fn) repeatedly")
    print("2. Try each key individually several times")
    print("3. Check if any key feels "stuck down" or different")
    
    # Create a file with stuck key info
    with open("stuck_keys_fix.txt", "w") as f:
        f.write("""STUCK KEYS SOLUTIONS:

1. REPEATEDLY TAP all modifier keys (Ctrl, Shift, Alt, Fn)
2. Slightly press each key multiple times
3. Try pressing multiple modifier keys simultaneously
4. Clean under the keys with compressed air
5. For laptops: press keyboard firmly but gently overall

Common stuck key symptoms:
- Keys feel different when pressed
- Multiple keys not working
- One modifier key affects other keys
- Keyboard "forgetting" settings
""")

def test_terminal_interrupt():
    """Test Ctrl+C in a safe way"""
    print("\n=== TESTING TERMINAL INTERRUPT ===")
    print("This simulates Ctrl+C (but won't actually stop anything)")
    
    print("Try pressing Ctrl+C right now...")
    print("If nothing happens, the Ctrl key combo is not working")
    
    # Create a safe test environment
    try:
        # This will run for 2 seconds and finish
        time.sleep(1)
        print("Test completed - Ctrl+C interrupt test")
    except KeyboardInterrupt:
        print("SUCCESS: Ctrl+C works!")
        return True
    except Exception as e:
        print(f"Other interrupt: {e}")
        return False
    
    print("Did Ctrl+C work? If timeout (nothing happened) = broken Ctrl key")
    return False

def check_os_keyboard_settings():
    """Check OS-level keyboard settings"""
    system = platform.system()
    print(f"\n=== CHECKING {system.upper()} KEYBOARD SETTINGS ===")
    
    if system:
        print(f"System: {system}")
        
    if system == "Windows":
        print("Windows keyboard diagnostics:")
        print("1. Control Panel → Ease of Access → Keyboard")
        print("2. Check Filter Keys, Sticky Keys, Toggle Keys")
        print("3. Run: control keyboard")
    elif system == "Darwin":  # macOS
        print("macOS keyboard diagnostics:")
        print("1. System Preferences → Keyboard")
        print("2. Check Modifier Keys remapping")
        print("3. Try: defaults read com.apple.keyboard")
    elif system == "Linux":
        print("Linux keyboard diagnostics:")
        print("1. Check: xinput list")
        print("2. Try: setxkbmap -query")
        print("3. Check: dmesg | grep -i keyb")

def create_on_screen_access():
    """Create instructions for on-screen keyboards"""
    print("\n=== ON-SCREEN KEYBOARD ACCESS ===")
    
    system = platform.system()
    
    instructions = {
        "Windows": """
Windows On-Screen Keyboard:
1. Win+R, type 'osk' press Enter
2. Start Menu → Windows Ease of Access → On-Screen Keyboard  
3. Right-click taskbar → Show Touch Keyboard button
4. Win+Ctrl+O (Windows 10/11)
        """,
        
        "Darwin": """
macOS On-Screen Keyboard:
1. System Preferences → Keyboard → Show keyboard menu in menu bar
2. Apple menu → System Preferences → Accessibility → Switch Control → Panel
3. Command+Option+Command+K (Karabiner if installed)
        """,
        
        "Linux": """
Linux On-Screen Keyboard:
1. 'onboard' command (Gnome Desktop)
2. 'florence' (alternative on-screen keyboard)
3. Ubuntu: Settings → Universal Access → Typing assistance
4. Try: onscreen_keyboard
        """
    }
    
    system = platform.system()
    if system in instructions:
        print(instructions[system])

def test_with_external_keyboard():
    """Instructions for testing with external keyboard"""
    print("\n=== HARDWARE VS SOFTWARE TEST ===")
    print("EXTERNAL KEYBOARD TEST (Most Important):")
    print("1. Find ANY USB keyboard (or PS/2)")
    print("2. Connect to computer without rebooting")
    print("3. Try all the broken keys on EXTERNAL keyboard")
    print("4. If external works = HARDWARE issue (your keyboard broken)")
    print("5. If external ALSO fails = SOFTWARE issue")
    print("")
    print("Result interpretation:")
    print("- External works: Buy new keyboard (laptop keyboard broken)")
    print("- External also fails: System issue, continue diagnostics")

def emergency_character_substitutions():
    """Provide emergency text with common characters"""
    print("\n=== EMERGENCY CHARACTER SUBSTITUTIONS ===")
    print("Copy/paste these characters if you need them:")
    
    chars = {
        "dash": "-",
        "underscore": "_", 
        "pipe": "|",
        "backslash": "\\",
        "forward_slash": "/"
    }
    
    with open("emergency_chars.txt", "w") as f:
        f.write("EMERGENCY CHARACTERS TO COPY:\n\n")
        for name, char in chars.items():
            f.write(f"{name}: {char}\n")
        f.write("\nCopy these characters and paste where needed!\n")
    
    for name, char in chars.items():
        print(f"{name}: {char}")
    
    print("Saved to emergency_chars.txt to copy easily")

def main():
    print("🚨 KEYBOARD EMERGENCY DIAGNOSIS 🚨") 
    print("=" * 50)
    print("Testing what's broken and providing immediate fixes")
    print("")
    
    # 1. Check stuck keys (most common hardware issue)
    check_stuck_keys()
    
    # 2. Test terminal functionality
    test_terminal_interrupt()
    
    # 3. Check OS settings that could cause issues
    check_os_keyboard_settings()
    
    # 4. On-screen keyboard access
    create_on_screen_access()
    
    # 5. Hardware vs software test (most important)
    test_with_external_keyboard()
    
    # 6. Emergency character access
    emergency_character_substitutions()
    
    print("\n" + "="*50)
    print("SUMMARY - IMMEDIATE ACTION REQUIRED:")
    print("1. Use external USB keyboard test to determine hardware vs software")
    print("2. If external works: Replace/buy new keyboard (hardware issue)")
    print("3. If external also fails: Use on-screen keyboard while fixing software")
    print("4. Check files created: typing_chars.txt, emergency_chars.txt")
    print("5. Try system restart - fixes many driver issues")
    print("\nKeep this script running for reference! 👆")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Script error: {e}")
        print("This script created files you can use:")
        print("- typing_chars.txt: Common replacement characters")
        print("- emergency_chars.txt: Basic keyboard characters") 
        print("- stuck_keys_fix.txt: Solutions for stuck keys")