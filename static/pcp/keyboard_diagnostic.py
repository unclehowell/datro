#!/usr/bin/env python3
"""
Keyboard Diagnostic Tool
Tests for Ctrl key functionality and other problematic keys
"""

import threading
import time
import sys
import os

def test_ctrl_c():
    """Test Ctrl+C functionality"""
    print("=== Testing Ctrl+C (Interrupt) ===")
    print("Press Ctrl+C within 5 seconds to test...")
    
    try:
        time.sleep(5)
        print("RESULT: Ctrl+C did not work (timeout) - This may indicate:")
        print("  1. Ctrl key not working")
        print("  2. C key not working") 
        print("  3. Terminal not accepting Ctrl+C")
        return False
    except KeyboardInterrupt:
        print("RESULT: Ctrl+C is working!")
        return True

def test_console_input():
    """Test basic keyboard input including dash/underscore"""
    print("\n=== Testing Specific Keys ===")
    print("Testing basic input - please type when prompted")
    
    # Test dash
    print("Please press the DASH key (-): ", end="", flush=True)
    dash_input = input()
    if dash_input == '-':
        print("RESULT: Dash key (-) is working")
    else:
        print(f"RESULT: Dash key (-) NOT working. Got: {repr(dash_input)}")
    
    # Test underscore (shift+dash)
    print("Please press SHIFT+DASH for underscore (_): ", end="", flush=True)
    underscore_input = input()
    if underscore_input == '_':
        print("RESULT: Underscore key (SHIFT+DASH) is working")
    else:
        print(f"RESULT: Underscore key NOT working. Got: {repr(underscore_input)}")
    
    # Test delete key (this is tricky in terminal)
    print("RESULT: Delete key testing - see manual test below")

def test_manual_keys():
    """Manual tests for keys hard to test programmatically"""
    print("\n=== MANUAL TESTS ===")
    print("Please manually test these in a text editor:")
    print("1. Ctrl+A (Select All) - Try in Notepad/TextEdit")
    print("2. Ctrl+V (Paste) - Copy some text first, then try pasting") 
    print("3. DELETE key - Try deleting characters")
    print("4. BACKSPACE key - Alternative to delete")
    print("5. Try typing numbers 0-9")
    print("6. Try typing special characters: !@#$%^&*()")

def test_evasive_measures():
    """Test possible software workarounds"""
    print("\n=== SUGGESTED IMMEDIATE WORKAROUNDS ===")
    
    if os.name == 'posix':
        print("Linux/macOS solutions:")
        print("1. Use Ctrl+Insert for paste instead of Ctrl+V")
        print("2. Use Ctrl+Z for suspend instead of Ctrl+C")
        print("3. Use on-screen keyboard: 'onboard' (Linux) or 'OnScreenKeyboard' (macOS)")
    else:
        print("Windows solutions:")
        print("1. Use Shift+Insert for paste instead of Ctrl+V")  
        print("2. Use Win+R 'osk' for on-screen keyboard")
        print("3. Try Right-click → Paste instead of Ctrl+V")
    
    print("4. Try external USB keyboard if available")
    print("5. Use mobile device or virtual keyboard app")

def main():
    print("KEYBOARD DIAGNOSTIC TOOL")
    print("=" * 50)
    print("This will help identify what's not working")
    print("")
    
    # Test Ctrl+C
    ctrl_working = test_ctrl_c()
    
    # Test console input
    test_console_input()
    
    # Manual tests
    test_manual_keys()
    
    # Workarounds
    test_evasive_measures()
    
    print("\n=== DIAGNOSIS FLOW ===")
    print("Next steps to determine hardware vs software:")
    print("1. Try USB external keyboard (if hardware issue, external should work)")
    print("2. Boot from USB/live CD and test (if works, software issue)")
    print("3. Safe mode test (if works, software/driver issue)")
    print("4. Check keyboard settings in OS preferences")
    print("5. Look for keyboard remapping software")

if __name__ == "__main__":
    main()