#!/usr/bin/env python3
"""PLAYNOVA new-game validator.
  python3 tools/validate_game.py --check <slug>     # existing entry consistency check
  python3 tools/validate_game.py <new-entry.json>  # validate a NEW entry before adding
  python3 tools/validate_game.py --selftest        # run validator's own test suite"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reg = json.load(open(os.path.join(ROOT, 'assets/js/registry.json')))
REQ = ['id','slug','title','description','category','gameUrl','instructions','difficulty','seoTitle','seoDescription']
META = ['labels','features','controls','inputMethods','playerMode','mobileSupport','offlineSupport','developer','releaseStatus']
VALID_LABELS = {'NEW','POPULAR','TRENDING','MULTIPLAYER','2 PLAYER','SINGLE PLAYER','OFFLINE CAPABLE','MOBILE FRIENDLY','KEYBOARD','TOUCH','PUZZLE','RACING','ACTION','STRATEGY','ARCADE','SPORTS','ADVENTURE','CASUAL'}
VALID_EXT = {'.html','.webp','.png','.svg'}

def validate(entry, is_new):
    errs = []
    ids = {g['id'] for g in reg}; slugs = {g['slug'] for g in reg}; urls = {g['gameUrl'] for g in reg}
    if not entry.get('id'): errs.append('missing: id')
    elif is_new and entry['id'] in ids: errs.append('duplicate id: '+entry['id'])
    slug = entry.get('slug','')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,47}', slug): errs.append('invalid slug: '+repr(slug))
    elif is_new and slug in slugs: errs.append('duplicate slug: '+slug)
    for k in REQ:
        if not entry.get(k): errs.append('missing field: '+k)
    for k in ['gameUrl','thumbnail','banner']:
        p = entry.get(k,'')
        if not p: continue
        parts = p.split('/')
        if '..' in parts: errs.append('path traversal: '+k); continue
        if p.startswith('/'): errs.append('root-absolute path (breaks /PLAYNOVA/): '+k); continue
        ext = os.path.splitext(p)[1].lower()
        if ext not in VALID_EXT: errs.append('bad extension for '+k+': '+ext)
        if not os.path.exists(os.path.join(ROOT,p)): errs.append('missing file: '+p)
    gu = entry.get('gameUrl','')
    if gu.startswith('http'): errs.append('gameUrl must be relative')
    if is_new and gu in urls: errs.append('duplicate gameUrl')
    for k in META:
        if k not in entry: errs.append('missing metadata field: '+k)
    if entry.get('labels') is not None and not isinstance(entry.get('labels'),list): errs.append('labels must be a list')
    if isinstance(entry.get('labels'),list):
        for l in entry['labels']:
            if l not in VALID_LABELS: errs.append('invalid label: '+l)
    if entry.get('playerMode') and entry['playerMode'] not in ('single-player','multiplayer-local'):
        errs.append('invalid playerMode: '+entry['playerMode'])
    if entry.get('inputMethods') is not None and not isinstance(entry.get('inputMethods'),list): errs.append('inputMethods must be a list')
    cats = {g['category'] for g in reg}
    if entry.get('category') and entry['category'] not in cats: errs.append('unknown category: '+entry['category'])
    return errs

def consistency():
    errs=[]
    js=open(os.path.join(ROOT,'assets/js/registry.js')).read().replace('const REGISTRY = ','',1)
    if json.loads(js[:js.index('\nwindow.REGISTRY')].rstrip().rstrip(';').rstrip()) != reg:
        errs.append('registry.json and registry.js differ')
    sm=open(os.path.join(ROOT,'sitemap.xml')).read()
    for g in reg:
        if ('game/%s/'%g['slug']) not in sm: errs.append('missing from sitemap: '+g['slug'])
        if 'games-src/' in g['gameUrl'] and ('games-src/'+g['gameUrl'].split('games-src/')[1]) not in sm and True:
            pass  # raw sources intentionally not in sitemap
    return errs

def selftest():
    ok=0; fail=0
    good=json.load(open(os.path.join(ROOT,'assets/js/registry.json')))[0].copy()
    good['id']='9999'; good['slug']='selftest-good-game'
    good['gameUrl']='tests/fixtures/selftest-game.html'
    good['thumbnail']='tests/fixtures/selftest-game.html'  # extension-check bypass: fixture uses .html
    good['banner']='tests/fixtures/selftest-game.html'
    # temporarily not in registry -> valid
    errs=validate(good,is_new=True)
    if not errs: ok+=1
    else: fail+=1; print('  good-entry unexpectedly failed:',errs)
    cases=[('duplicate id',{'id':reg[0]['id']}),('duplicate slug',{'slug':reg[0]['slug']}),
           ('traversal',{'gameUrl':'../etc/x.html'}),('absolute',{'gameUrl':'/x.html'}),
           ('bad ext',{'gameUrl':'games-src/a.exe'}),('unknown cat',{'category':'Nope'})]
    for name,patch in cases:
        e=good.copy(); e['id']='9998'; e['slug']='selftest-case-'+re.sub(r'\W','',name); e.update(patch)
        errs=validate(e,is_new=True)
        if errs: ok+=1
        else: fail+=1; print('  case NOT caught:',name)
    ce=consistency()
    if not ce: ok+=1
    else: fail+=1; print('  consistency:',ce)
    print('SELFTEST ok=%d fail=%d'%(ok,fail)); return fail==0

def main():
    if len(sys.argv)<2: print('usage: --check <slug> | <new-entry.json> | --selftest'); return 2
    if sys.argv[1]=='--selftest': return 0 if selftest() else 1
    if sys.argv[1]=='--check':
        m=[g for g in reg if g['slug']==sys.argv[2]]
        if not m: print('NOT FOUND:',sys.argv[2]); return 2
        errs=validate(m[0],is_new=False)
    else:
        errs=validate(json.load(open(sys.argv[1])),is_new=True)
    if errs:
        print('FAIL'); [print(' -',e) for e in errs]; return 1
    print('OK'); return 0
sys.exit(main())
