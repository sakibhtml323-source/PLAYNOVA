
import asyncio, json, time, os, subprocess, socket
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
# test-provider: নির্দোষ local-only JS
open(os.path.join(HERE,'test-provider.js'),'w').write('/* PLAYNOVA test-only ad stub: no network, no ads */ window.__P5_TEST_AD__=true;')
# ফ্রি পোর্টে নিজস্ব সার্ভার
s=socket.socket(); s.bind(('127.0.0.1',0)); PORT=s.getsockname()[1]; s.close()
srv=subprocess.Popen(['python3','-m','http.server',str(PORT),'--directory',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1.2)
B='http://127.0.0.1:%d'%PORT
res={}
def lock(provider):
    cfg={"enabled":True,"provider":provider,provider:{"key":"TEST-ONLY","scriptTag":{"src":B+"/tests/test-provider.js","attrs":{}}},"placements":{"homeAfterHero":True,"listingBetween":True,"gamePage":True,"footer":True}}
    return "Object.defineProperty(window,'ADS_CONFIG',{configurable:true,get:function(){return %s;},set:function(){}});"%json.dumps(cfg)
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        ctx=await b.new_context(); await ctx.add_init_script(lock('adsterra'))
        pg=await ctx.new_page(); loaded=[]; errs=[]
        pg.on('request',lambda r: loaded.append(1) if 'test-provider.js' in r.url else None)
        pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
        async def setc(c):
            if c is None: await pg.evaluate("localStorage.removeItem('p5_consent')")
            else: await pg.evaluate("localStorage.setItem('p5_consent',%s)"%json.dumps(json.dumps(c)))
        async def rc():
            loaded.clear(); await pg.reload(); await pg.wait_for_timeout(600); return len(loaded)
        await pg.goto(B+'/',timeout=12000)
        await setc({'v':'accepted','t':time.time()*1000}); res['accepted_exactly_one']=((await rc())==1)
        res['repeat_no_duplicate']=((await rc())==1)
        await setc({'v':'declined','t':time.time()*1000}); res['declined_zero']=((await rc())==0)
        await setc(None); res['no_consent_absent_key']=((await rc())==0)
        await setc({'v':'accepted','t':time.time()*1000-400*86400000}); res['expired_zero']=((await rc())==0)
        await setc({'v':'garbage!!','t':time.time()*1000}); res['invalid_zero']=((await rc())==0)
        res['no_uncaught_errors']=(len(errs)==0)
        await ctx.close()
        ctx2=await b.new_context(); errs2=[]; loaded2=[]
        await ctx2.add_init_script(lock('unknownnet'))
        p2=await ctx2.new_page()
        p2.on('request',lambda r: loaded2.append(1) if 'test-provider.js' in r.url else None)
        p2.on('pageerror',lambda e:errs2.append(str(e)[:120]))
        await p2.goto(B+'/',timeout=12000)
        await p2.evaluate("localStorage.setItem('p5_consent',%s)"%json.dumps(json.dumps({'v':'accepted','t':time.time()*1000})))
        await p2.reload(); await p2.wait_for_timeout(600)
        res['unknown_provider_zero_inject']=(len(loaded2)==0)
        res['unknown_provider_no_uncaught']=(len(errs2)==0)
        ctx3=await b.new_context(); loaded3=[]
        await ctx3.add_init_script(lock('adsterra').replace('TEST-ONLY',''))
        p3=await ctx3.new_page()
        p3.on('request',lambda r: loaded3.append(1) if 'test-provider.js' in r.url else None)
        await p3.goto(B+'/',timeout=12000)
        await p3.evaluate("localStorage.setItem('p5_consent',%s)"%json.dumps(json.dumps({'v':'accepted','t':time.time()*1000})))
        await p3.reload(); await p3.wait_for_timeout(600)
        res['missing_credentials_zero']=(len(loaded3)==0)
        await b.close()
    srv.terminate()
    report={'test':'ads-consent-gate','server':'self-started python http.server on ephemeral port','provider':'TEST-ONLY local tests/test-provider.js via adsterra adapter; no real ad network','cases':res,'all_pass':all(res.values()),'date':time.strftime('%Y-%m-%d %H:%M')}
    open(os.path.join(HERE,'ads_consent_results.json'),'w').write(json.dumps(report,indent=1))
    human='ADS CONSENT TEST EVIDENCE — '+report['date']+'\nserver: '+report['server']+'\nprovider: '+report['provider']+'\n\n'
    for k,v in res.items(): human+='  %-30s %s\n'%(k,'PASS' if v else 'FAIL')
    open(os.path.join(HERE,'ADS_TEST_EVIDENCE.txt'),'w').write(human)
    print('ADS10', json.dumps(res), 'ALL:', all(res.values()), flush=True)
asyncio.run(main())
