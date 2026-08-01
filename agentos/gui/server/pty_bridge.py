#!/usr/bin/env python3
"""
PTY bridge: creates a real pseudo-terminal with bash,
communicates with Node.js via stdin/stdout JSON lines.

Protocol (stdin JSON lines):
  {"type":"input","data":"..."}
  {"type":"resize","cols":80,"rows":24}

Protocol (stdout JSON lines):
  {"type":"output","data":"..."}
  {"type":"exit","code":N}
"""

import json
import os
import pty
import select
import sys
import termios
import struct
import fcntl
import atexit

SHELL = os.environ.get("SHELL", "/bin/bash")


def set_pty_size(fd, rows, cols):
    winsize = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)


def setup_terminal(master_fd):
    """Configure terminal to standard xterm-like settings."""
    try:
        attrs = termios.tcgetattr(master_fd)
        iflag, oflag, cflag, lflag, ispeed, ospeed, cc = attrs

        ICRNL = 0x0004
        iflag |= ICRNL

        attrs = [iflag, oflag, cflag, lflag, ispeed, ospeed, list(cc)]
        termios.tcsetattr(master_fd, termios.TCSANOW, attrs)
    except Exception:
        pass


def main():
    pid, master_fd = pty.fork()
    if pid == 0:
        os.environ["TERM"] = "xterm-256color"
        os.execve(SHELL, [SHELL, "--login"], os.environ)
        sys.exit(1)

    atexit.register(lambda: os.close(master_fd))
    setup_terminal(master_fd)

    buf = ""
    running = True

    while running:
        rlist, _, _ = select.select([sys.stdin, master_fd], [], [], 0.2)

        if master_fd in rlist:
            try:
                data = os.read(master_fd, 65536)
                if data:
                    out = {"type": "output", "data": data.decode("utf-8", errors="replace")}
                    sys.stdout.write(json.dumps(out) + "\n")
                    sys.stdout.flush()
                else:
                    running = False
                    break
            except OSError:
                running = False
                break

        if sys.stdin in rlist:
            try:
                chunk = os.read(sys.stdin.fileno(), 65536)
                if chunk:
                    buf += chunk.decode("utf-8")
                else:
                    running = False
                    break
            except OSError:
                running = False
                break

        while "\n" in buf:
            line, buf = buf.split("\n", 1)
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")
            if msg_type == "input":
                data = msg.get("data", "")
                if isinstance(data, str):
                    os.write(master_fd, data.encode("utf-8"))
            elif msg_type == "resize":
                cols = msg.get("cols", 80)
                rows = msg.get("rows", 24)
                set_pty_size(master_fd, rows, cols)

    _, status = os.waitpid(pid, 0)
    code = os.WEXITSTATUS(status) if os.WIFEXITED(status) else -1
    out = {"type": "exit", "code": code}
    try:
        sys.stdout.write(json.dumps(out) + "\n")
        sys.stdout.flush()
    except Exception:
        pass


if __name__ == "__main__":
    main()
