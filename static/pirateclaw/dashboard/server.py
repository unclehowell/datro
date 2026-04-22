#!/usr/bin/env python3
"""PirateClaw Dashboard - Simple HTTP Server"""
import os
import http.server
import socketserver
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DASH_PORT = int(os.getenv("DASH_PORT", "8080"))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    
    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(("", DASH_PORT), Handler) as httpd:
    print(f'PirateClaw Dashboard on :{DASH_PORT}')
    httpd.serve_forever()