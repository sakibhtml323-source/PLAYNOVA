# OFFLINE-TEST-REPORT — PLAYNOVA v3
Service worker `sw.js` (cache `playnova-v4`): app shell is pre-cached (home, offline page, core CSS/JS, profile page, capability file); every page and game file is cached on demand after it was opened once; the old `playnova-*` caches are deleted on activation; failed cache writes are ignored; an unvisited page shows `offline.html`; an update notice appears when a new worker takes control.
| Test | Result |
|---|---|
| 20 games (every 25th) opened online, then reopened offline: reach "ready" and start | 20/20 PASS |
| 5 unvisited games opened offline | 5/5 show the offline page (never another page) |
| Reconnect: unvisited game opens after going back online | PASS |
| Cache name / versioning | `playnova-v4`; bump the name in sw.js on every release |
| Quota errors | cache writes are wrapped in `.catch`; behaviour under a full quota is UNVERIFIED |
| All 500 games offline | **NOT CLAIMED**: only games opened before are available offline. Registry fields `offlineSupport: verified` come from an older release and are not used by the UI |
| Firefox / Safari service-worker behaviour | UNVERIFIED |
