#!/usr/bin/env python3
"""Commit the clearance source/data to unclehowell/datro branch fcg (fetch head, add tree on top, move ref without force). — Sion's Tab agent"""
import sys, os, json
sys.path.insert(0,'/home/user/tab/work/site-flywheels/tools'); from gh import gh
H='/home/user/tab/work/fcg'; R='unclehowell/datro'; BR='fcg'
files={'fcg/src/index.js':H+'/worker/index.js','fcg/src/clearance.js':H+'/worker/clearance.js'}
for f in ['STANDARD.md','events.json','scores.json','rescore.py','resolve_links.py','build_site.py','deploy.py','commit_repo.py']:
    files['fcg/clearance/'+f]=H+'/'+f
msg=sys.argv[1] if len(sys.argv)>1 else 'fcg clearance update'
for attempt in range(3):
    st,ref=gh('GET',f'/repos/{R}/git/ref/heads/{BR}'); head=ref['object']['sha']
    st,c=gh('GET',f'/repos/{R}/git/commits/{head}'); base=c['tree']['sha']
    tree=[]
    for path,local in files.items():
        for k in range(4):
            st,b=gh('POST',f'/repos/{R}/git/blobs',{'content':open(local,encoding='utf-8').read(),'encoding':'utf-8'})
            if isinstance(b,dict) and b.get('sha'): break
            import time; time.sleep(30)
        if not (isinstance(b,dict) and b.get('sha')): sys.exit('blob failed %s %s %s'%(path,st,str(b)[:200]))
        tree.append({'path':path,'mode':'100644','type':'blob','sha':b['sha']})
    st,t=gh('POST',f'/repos/{R}/git/trees',{'base_tree':base,'tree':tree})
    st,nc=gh('POST',f'/repos/{R}/git/commits',{'message':msg+'\n\n— Sion\'s Tab agent','tree':t['sha'],'parents':[head],'author':{'name':"Sion's Tab agent",'email':'tymawr.giftshop@mail.tab.bot'}})
    st,u=gh('PATCH',f'/repos/{R}/git/refs/heads/{BR}',{'sha':nc['sha'],'force':False})
    if st==200: print(json.dumps({'commit':nc['sha'],'parent':head})); break
    print('ref move failed',st,str(u)[:200],'— retrying from new head')
