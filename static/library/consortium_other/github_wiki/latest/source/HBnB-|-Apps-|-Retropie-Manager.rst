HBnB > Apps > Retropie-Manager
======================================================
# RetroPie-Manager

## Errors & Solution

The Makefile can bring up a myriad of issues, so go through it manually to fulfill it's requirements and deal with the issues 1 by 1 as they arrive. Here are some examples below: 

**Error:** bad magic number in 'application': b'\x03\xf3\r\n'
**Solution:** Remove `--no-site-packages` from manage.py

**Error:** bad magic number in 'project': b'\x03\xf3\r\n'
**Solution:** `find . -name \*.pyc -delete`
**Source:** https://github.com/Miserlou/Zappa/issues/854

**Error:** TypeError: expected str, bytes or os.PathLike object, not NoneType
**Solution:** apt-get -y update && apt-get install -y build-essential g++ gcc make git zip unzip libopenblas-dev cmake python3-dev python3-pip
**Source:** https://github.com/IBM/mimkl/issues/6 

