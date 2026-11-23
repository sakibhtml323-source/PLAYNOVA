# LOADING & PAUSE TEST REPORT (বাংলা)
তারিখ: 2026-11-04

## Loading state machine (player.js v3)
| পরীক্ষা | ফলাফল |
|---|---|
| State machine state প্রকাশ (data-load-state) | ✅ 'ready' ধরা পড়েছে (0489) |
| Cooperative পোলিং — canvas আঁকা/splash/DOM | ✅ ready-তে রূপ নেয় |
| postMessage P5_READY — source===contentWindow যাচাই | ✅ শুণ্য-ভুল গ্রহণ |
| Infinite loading | ✅ অসম্ভব (১৫s timeout → Retry) |
| Already-loaded/cached iframe | ✅ প্রোব প্রথমেই ready |
| Retry — পুরনো listener/src পরিষ্কার | ✅ clean reload |
| ৮s-এ ভুয়া ready | ✅ বাদ — এখন শুধু আসল ready |

## Pause
| পরীক্ষা | ফলাফল |
|---|---|
| Cooperative pause hook না থাকলে বাটন disabled | ✅ সৎ আচরণ |
| পুরোনো মিথ্যা overlay-pause | ✅ সরানো |
| Overlay-এ সৎ ব্যাখ্যা | ✅ আছে |

## Restart
Score/timer/level/position reset — গেম-নিজস্ব start-ফাংশনে (gen/init) clean re-run; iframe src reset + state machine 'loading' → 'ready'।
