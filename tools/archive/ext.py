import pymupdf,json
d=pymupdf.open('/home/user/tab/files/ebooks/great-house-farm-wiki-v0.1.0-archive.pdf')
json.dump({'toc':d.get_toc(),'pages':[p.get_text() for p in d]},open('pdf.json','w'))
