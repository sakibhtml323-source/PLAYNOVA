"""PLAYNOVA automated regression suite. Usage: python3 tests/run_all.py  (from the site root; needs playwright+chromium)
Starts its own local web server, runs catalogue, isolation, platform-logic, bridge-security, responsive and one real-input gameplay check,
and writes TEST_EVIDENCE/clean_extract_run.json. Exit code 1 if any check fails."""
import json,os,re,sys,subprocess,time,glob,collections,random
from playwright.sync_api import sync_playwright
ROOT=os.getcwd();PORT=8190
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(2)
U=f'http://localhost:{PORT}';T=[]
def chk(group,name,ok,detail=''):T.append({'group':group,'test':name,'result':'PASS' if ok else 'FAIL','detail':str(detail)[:200]})
try:
    R=json.load(open('assets/js/registry.json'))
    # catalogue
    ids=collections.Counter(g['id'] for g in R);sl=collections.Counter(g['slug'] for g in R)
    chk('catalogue','500 games in registry',len(R)==500,len(R))
    chk('catalogue','no duplicate ids/slugs',max(ids.values())==1 and max(sl.values())==1)
    miss=[(g['id'],k) for g in R for k in('gameUrl','thumbnail','banner') if not os.path.isfile(g[k])]+[(g['id'],'page') for g in R if not os.path.isfile(f"game/{g['slug']}/index.html")]
    chk('catalogue','every game file, page, thumbnail and banner exists',not miss,miss[:3])
    # isolation (static)
    pages=glob.glob('game/*/index.html');same=[p for p in pages if 'allow-same-origin' in open(p,encoding='utf8').read()]
    chk('security','no game page uses allow-same-origin',len(pages)==500 and not same,f'{len(pages)} pages, {len(same)} with allow-same-origin')
    modal=set(json.load(open('assets/js/modal-games.json')))
    nosb=[p for p in pages if not (('sandbox="allow-scripts allow-modals"' in open(p,encoding='utf8').read()) if p.split('/')[1] in modal else ('sandbox="allow-scripts"' in open(p,encoding='utf8').read()))]
    chk('security','every game iframe has sandbox="allow-scripts"',not nosb,nosb[:2])
    nocsp=[p for p in glob.glob('**/index.html',recursive=True) if 'games-src' not in p and 'Content-Security-Policy' not in open(p,encoding='utf8').read()]
    chk('security','every site page has a CSP meta tag',not nocsp,nocsp[:3])
    caps=json.load(open('assets/js/game-capabilities.json'))['games']
    chk('integration','capability registry statuses valid',all(v['status'] in('FULLY_INTEGRATED','PARTIALLY_INTEGRATED','NOT_INTEGRATED','MANUAL_VERIFICATION_REQUIRED') for v in caps.values()))
    chk('integration','no game marked FULLY_INTEGRATED without evidence',not any(v['status']=='FULLY_INTEGRATED' for v in caps.values()))
    # ---- extra static checks (SEO, HTML validity, bridge order, ads default, service worker)
    from html.parser import HTMLParser
    BASE='https://sakibhtml323-source.github.io/PLAYNOVA/'
    seo={'canonical':[],'og':[],'ld':[],'title':collections.Counter(),'desc':collections.Counter()}
    for g in R:
        h=open('game/%s/index.html'%g['slug'],encoding='utf8').read()
        if ('<link rel="canonical" href="%sgame/%s/">'%(BASE,g['slug'])) not in h:seo['canonical'].append(g['slug'])
        if 'property="og:title"' not in h or 'property="og:image"' not in h or 'name="twitter:card"' not in h:seo['og'].append(g['slug'])
        m=re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,re.S)
        try:
            ok=bool(m) and all(json.loads(x) for x in m)
        except Exception:ok=False
        if not ok:seo['ld'].append(g['slug'])
        seo['title'][re.search(r'<title>(.*?)</title>',h,re.S).group(1)]+=1;d=re.findall(r'<meta name="description" content="([^"]*)"',h);seo['desc'][d[0] if d else '']+=1
    chk('seo','all 500 game pages have the correct canonical URL',not seo['canonical'],seo['canonical'][:2])
    chk('seo','all 500 game pages have Open Graph + Twitter tags',not seo['og'],seo['og'][:2])
    chk('seo','all 500 game pages have valid JSON-LD',not seo['ld'],seo['ld'][:2])
    chk('seo','500 unique titles and 500 unique non-empty descriptions',max(seo['title'].values())==1 and max(seo['desc'].values())==1 and '' not in seo['desc'])
    sm=open('sitemap.xml').read();urls=re.findall(r'<loc>([^<]+)</loc>',sm);miss=[u for u in urls if not os.path.exists((u.replace(BASE,'') or '')+('index.html' if u.endswith('/') or u==BASE else ''))]
    chk('seo','every sitemap URL exists on disk',not miss and len(urls)>=500,f'{len(urls)} urls, missing {miss[:2]}')
    chk('seo','robots.txt allows crawling and points to the sitemap','Sitemap: '+BASE+'sitemap.xml' in open('robots.txt').read())
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
    class PP(HTMLParser):
        def __init__(s):super().__init__();s.st=[];s.err=0
        def handle_starttag(s,t,a):
            if t not in VOID:s.st.append(t)
        def handle_endtag(s,t):
            if t in VOID:return
            if not s.st or s.st[-1]!=t:
                s.err+=1
                if t in s.st:
                    while s.st and s.st.pop()!=t:pass
            else:s.st.pop()
    badh=[]
    for f in [x for x in glob.glob('**/index.html',recursive=True) if not x.startswith(('games-src','TEST_EVIDENCE','tests','previous_release_reports'))]+['404.html','offline.html']:
        pp=PP();pp.feed(open(f,encoding='utf8').read())
        if pp.err or [t for t in pp.st if t not in('html','body','head')]:badh.append(f)
    chk('html','no tag-nesting errors on any site page (incl. cookies, privacy, terms)',not badh,badh[:3])
    # ---- duplicate IDs in static markup of every HTML file shipped for production (site pages, game pages and game files)
    dupfiles={}
    for f in [x for x in glob.glob('**/*.html',recursive=True) if not x.startswith(('TEST_EVIDENCE','tests','previous_release_reports'))]:
        t=open(f,encoding='utf8').read();t=re.sub(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->','',t,flags=re.S)
        c=collections.Counter(re.findall(r'\sid="([^"]+)"',t));d=[k for k,v in c.items() if v>1]
        if d:dupfiles[f]=d
    chk('html','no duplicate static HTML ids in any production HTML file (incl. the 500 game files)',not dupfiles,dict(list(dupfiles.items())[:2]))
    chk('html','legal pages use readable colours (dark theme overrides present)','.legal{color:#ecebff' in open('assets/css/playnova-ui.css').read().replace(' ',''))
    first_bad=[g['slug'] for g in R if not re.search(r'<script\b[^>]*>',open(g['gameUrl'],encoding='utf8').read()).group(0).endswith('pn-bridge.js">') ]
    chk('storage','bridge is the first script of all 500 games (initialised before game scripts)',not first_bad,first_bad[:3])
    nohyd=[g['slug'] for g in R if 'pn-frame.js' not in open('game/%s/index.html'%g['slug'],encoding='utf8').read() or 'data-pn-src' not in open('game/%s/index.html'%g['slug'],encoding='utf8').read()]
    chk('storage','all 500 game pages hydrate saved data via pn-frame.js before the game loads',not nohyd,nohyd[:3])
    ac=open('assets/js/ads-config.js',encoding='utf8').read()
    chk('ads','ads disabled by default with no publisher id or fake credentials','enabled: false' in ac and 'ca-pub-' not in ac.replace("'ca-pub-...'",'').replace('ca-pub-XXXXXXXXXXXXXXXX','') and 'client: null' in ac)
    sw=open('sw.js').read();chk('offline','service worker has versioned cache cleanup and own-page cache keys',"k.startsWith('playnova-') && k !== VERSION" in sw and "caches.match('offline.html')" in sw)
    with sync_playwright() as p:
        b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:80]));E=pg.evaluate
        pg.goto(U+'/profile/');pg.wait_for_timeout(700);E('PLAYNOVA.reset()')
        E('PLAYNOVA.sessionVerified("g1","s1")');E('PLAYNOVA.sessionVerified("g1","s1")')
        chk('wallet','duplicate session reward blocked',E('PLAYNOVA.data.xp')==10)
        chk('wallet','insufficient balance purchase blocked',E('PLAYNOVA.buy("fr_gold")')=='INSUFFICIENT')
        for i in range(40):E(f'PLAYNOVA.sessionVerified("g{i+10}","s")')
        b0=E('PLAYNOVA.bal()');ok=E('PLAYNOVA.buy("av_rocket")')=='OK';b1=E('PLAYNOVA.bal()')
        chk('wallet','purchase deducts exact price once',ok and b0-b1==50)
        chk('wallet','duplicate purchase blocked',E('PLAYNOVA.buy("av_rocket")')!='OK' and E('PLAYNOVA.bal()')==b1)
        chk('wallet','ledger sum never negative',E('PLAYNOVA.data.ledger.reduce((a,t)=>a+t.amt,0)')>=0)
        pg.wait_for_timeout(900);E('localStorage.clear()');pg.reload();pg.wait_for_timeout(1300)
        chk('storage','IndexedDB restores progress after localStorage cleared',E('PLAYNOVA.bal()')==b1,E('PLAYNOVA.bal()'))
        E('PLAYNOVA.reset()');pg.evaluate('localStorage.setItem("pn_data","{broken")');pg.reload();pg.wait_for_timeout(700)
        chk('storage','corrupt data recovers to fresh profile with backup',E('PLAYNOVA.bal()')==0 and E('!!localStorage.getItem("pn_data_corrupt_backup")'))
        chk('storage','import rejects invalid data',E('PLAYNOVA.importData("{bad")')==False and E('PLAYNOVA.importData(\'{"v":1}\')')==False)
        E('PLAYNOVA.reset()');chk('daily','login claim once only',E('PLAYNOVA.claim("login")')==True and E('PLAYNOVA.claim("login")')==False)
        chk('daily','play challenge locked before a session',E('PLAYNOVA.claim("play1")')==False)
        chk('daily','reset day is UTC',E('PLAYNOVA.today()')==E('new Date().toISOString().slice(0,10)'))
        E('PLAYNOVA.sessionVerified("a","1")');chk('achievements','First Game unlocks, 10 Games does not',E('"first_game" in PLAYNOVA.data.ach')and E('!("g10" in PLAYNOVA.data.ach)'))
        m=lambda o,t,g='jungle-farm-puzzle',extra='':E('PLAYNOVA.handleMessage({source:window,origin:%s,data:{ns:"PLAYNOVA",v:1,type:"%s",sessionId:"s"%s}},"%s",window)'%(o,t,extra,g))
        E('PLAYNOVA.reset()')
        chk('adapter','wrong origin rejected',m('"https://evil.example"','GAME_WON')=='REJECT_SENDER')
        chk('adapter','malformed message rejected',E('PLAYNOVA.handleMessage({source:window,origin:location.origin,data:"x"},"jungle-farm-puzzle",window)')=='REJECT_SCHEMA')
        chk('adapter','unsupported game rejected',m('location.origin','GAME_WON','nope')=='REJECT_UNSUPPORTED')
        # bridge security with a real sandboxed game
        pg.goto(U+'/game/jungle-farm-puzzle/');pg.wait_for_timeout(3000);E('PLAYNOVA.reset()')
        fr=[f for f in pg.frames if 'games-src' in f.url][0]
        fr.evaluate("parent.postMessage({ns:'PLAYNOVA',v:1,type:'GAME_LEVEL_COMPLETED',nonce:'wrong',sessionId:'x',level:1},'*')");pg.wait_for_timeout(300)
        chk('bridge','wrong nonce rejected',E('PLAYNOVA.data.xp')==0)
        fr.evaluate("pnEmit('GAME_LEVEL_COMPLETED',{level:1,xp:99999,coins:99999})");pg.wait_for_timeout(300)
        chk('bridge','valid level event rewards platform amount only (20 XP)',E('PLAYNOVA.data.xp')==20,E('PLAYNOVA.data.xp'))
        fr.evaluate("pnEmit('GAME_LEVEL_COMPLETED',{level:1})");pg.wait_for_timeout(300)
        chk('bridge','replayed level gives no extra reward',E('PLAYNOVA.data.xp')==20)
        r=fr.evaluate("(()=>{try{return String(localStorage.getItem('pn_data'))}catch(e){return 'ERR'}})()")
        chk('bridge','game cannot read platform data',r=='null',r)
        # shim persistence
        pg.goto(U+'/game/haunted-organ-444/');pg.wait_for_timeout(3000)
        fr=[f for f in pg.frames if 'games-src' in f.url][0];fr.evaluate('localStorage.setItem("pn_t","42")');pg.wait_for_timeout(700)
        pg.reload();pg.wait_for_timeout(3000);fr=[f for f in pg.frames if 'games-src' in f.url][0]
        chk('shim','game storage persists across reload via platform store',fr.evaluate('localStorage.getItem("pn_t")')=='42')
        chk('platform','no JS page errors in logic tests',not errs,errs[:2])
        # real-input gameplay (spot the difference)
        s='desert-reflection-232';pg.goto(U+f'/game/{s}/');pg.wait_for_timeout(2200);E('PLAYNOVA.reset()')
        fr=[f for f in pg.frames if 'games-src' in f.url][0];fr.click('#btn');fr.wait_for_timeout(500)
        o=E('(()=>{const r=document.querySelector("iframe").getBoundingClientRect();return [r.left,r.top]})()')
        for i in range(fr.evaluate('spots.length')):
            pos=fr.evaluate('''()=>{const s=spots.find(x=>!found.includes(x.id));if(!s)return null;const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return [r.left+(s.x+s.w/2)*r.width/c.width,r.top+(s.y+s.h/2)*r.height/c.height]}''')
            if not pos:break
            pg.mouse.click(o[0]+pos[0],o[1]+pos[1]);pg.wait_for_timeout(250)
        pg.wait_for_timeout(500)
        chk('gameplay','real clicks complete level 1 of desert-reflection-232 and reward 20 XP once',E('PLAYNOVA.data.xp')==20 and E('(PLAYNOVA.data.stats.byGame["%s"]||{}).done'%s)==[1],E('PLAYNOVA.data.xp'))
        # player controls: restart keeps working, Back button not broken, consent bar does not cover controls
        q=b.new_page(viewport={'width':412,'height':915});q.goto(U+'/games/');q.wait_for_timeout(900);q.goto(U+'/game/ninja-fog-walk-441/');q.wait_for_timeout(3000);h0=q.evaluate('history.length');st=[]
        for i in range(2):
            q.click('#btnRestart',timeout=6000);q.wait_for_timeout(4500);st.append(q.evaluate('document.body.dataset.loadState'))
        chk('player','restart twice returns to ready',st==['ready','ready'],st)
        chk('player','restart does not add browser-history entries',q.evaluate('history.length')==h0)
        chk('player','fullscreen button is clickable (consent bar not covering it)',(q.click('#btnFs',timeout=5000) or True))
        q.evaluate('document.fullscreenElement&&document.exitFullscreen()');q.close()
        # a11y/structure on key pages
        for pn,u in {'home':'/','games':'/games/','profile':'/profile/','404':'/404.html','game':'/game/ninja-fog-walk-441/'}.items():
            q=b.new_page();q.goto(U+u);q.wait_for_timeout(900);chk('a11y',f'{pn}: exactly one h1',q.evaluate('document.querySelectorAll("h1").length')==1);q.close()
        # offline fallback: unvisited page must show the offline page, never another page
        ctx=b.new_context();q=ctx.new_page();q.goto(U+'/');q.wait_for_timeout(2500);q.goto(U+'/game/ninja-fog-walk-441/');q.wait_for_timeout(2500);q.goto(U+'/profile/');q.wait_for_timeout(1500)
        ctx.set_offline(True)
        try:q.goto(U+'/game/royal-card-castle-387/',timeout=8000);q.wait_for_timeout(1500);t1=q.evaluate('document.title')
        except Exception as e:t1='ERR '+str(e)[:40]
        try:q.goto(U+'/game/ninja-fog-walk-441/',timeout=8000);q.wait_for_timeout(3500);t2=q.evaluate('document.body.dataset.loadState')
        except Exception as e:t2='ERR '+str(e)[:40]
        chk('offline','unvisited page shows offline page',t1.startswith('Offline'),t1);chk('offline','previously visited game works offline',t2=='ready',t2);ctx.close()
        # storage API round-trip on a sample of 30 games (full 500-game run: TEST_EVIDENCE/storage_all_500.json)
        okst=[]
        for g in R[::17][:30]:
            q=b.new_page();q.goto(U+'/game/%s/'%g['slug']);q.wait_for_timeout(1400);fr=[x for x in q.frames if 'games-src' in x.url][0];val=json.dumps({'r':random.random(),'pad':'x'*2500})
            a=fr.evaluate('(v=>{localStorage.setItem("__pn_test__",v);let qx=false;try{localStorage.setItem("__h","z".repeat(300000))}catch(e){qx=e.name==="QuotaExceededError"}return [localStorage.getItem("__pn_test__")===v,qx]})('+json.dumps(val)+')')
            q.wait_for_timeout(600);q.reload();q.wait_for_timeout(1500);fr=[x for x in q.frames if 'games-src' in x.url][0]
            r=fr.evaluate('localStorage.getItem("__pn_test__")')==val;fr.evaluate('localStorage.removeItem("__pn_test__")');okst.append(all(a) and r);q.close()
        chk('storage',f'save, reload, restore and quota error work on a 30-game sample',all(okst),sum(okst))
        # per-game drawer
        q=b.new_page(viewport={'width':360,'height':740});q.goto(U+'/game/mystic-physics-sandbox/');q.wait_for_timeout(3000)
        chk('game-panel','progress drawer closed by default and opens with related games',q.evaluate('document.getElementById("pnDrawer").hidden')==True and (q.click('#btnProg') or True) and q.evaluate('document.querySelectorAll("#related .card").length')==12 and q.evaluate('document.getElementById("pnGamePanel").offsetHeight>50'));q.close()
        # responsive
        pages={'home':'/','games':'/games/','profile':'/profile/','game':'/game/ninja-fog-walk-441/'}
        for vn,(w,h) in {'360':(360,640),'412':(412,915),'768':(768,1024),'1366':(1366,768)}.items():
            for pn,u in pages.items():
                q=b.new_page(viewport={'width':w,'height':h});q.goto(U+u);q.wait_for_timeout(900)
                chk('responsive',f'{pn} @{vn}px no horizontal overflow',q.evaluate('document.documentElement.scrollWidth-innerWidth')<=0);q.close()
        b.close()
finally:
    srv.terminate()
f=[t for t in T if t['result']!='PASS']
json.dump({'run_from':ROOT,'total':len(T),'passed':len(T)-len(f),'failed':len(f),'tests':T},open('TEST_EVIDENCE/clean_extract_run.json','w'),indent=1)
print(len(T),'checks,',len(f),'failed');[print('FAIL',x) for x in f]
sys.exit(1 if f else 0)
