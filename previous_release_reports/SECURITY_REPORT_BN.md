
## Sandbox ঝুঁকি-বিশ্লেষণ (সৎ সীমাবদ্ধতা)
- `sandbox="allow-scripts allow-same-origin"` **সম্পূর্ণ নিরাপদ নয়** — HTML স্পেসিফিকেশন অনুযায়ী এই কম্বিনেশনে sandboxed iframe প্রায় unsandboxed-এর সমতুল্য (iframe নিজের sandbox অ্যাট্রিবিউট মুছে ফেলতে পারে)।
- **কেন রাখা হয়েছে:** ৫০০টি ফ্রোজেন গেম localStorage-এ high-score সেভ করে — allow-same-origin ছাড়া সব গেমের স্কোর-সিস্টেম ভেঙে যেত (মাস্টার-নিয়মে গেম অপরিবর্তনীয়)।
- **মিতিগেশন:** (১) allow-top-navigation নেই — গেম পোর্টালকে রিডাইরেক্ট করতে পারে না; (২) postMessage-এ source===contentWindow যাচাই; (৩) referrerpolicy=no-referrer; (৪) CSP frame-src 'self'; (৫) সব গেম same-origin — third-party কন্টেন্ট নেই।
- **আদর্শ ভবিষ্যৎ সমাধান:** গেমগুলো postMessage-ভিত্তিক storage-bridge-এ মাইগ্রেট (বড় কাজ — রোডম্যাপে রাখুন)।
