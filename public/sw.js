if(!self.define){let e,a={};const i=(i,s)=>(i=new URL(i+".js",s).href,a[i]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=a,document.head.appendChild(e)}else e=i,importScripts(i),a()})).then((()=>{let e=a[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(s,n)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(a[o])return;let r={};const c=e=>i(e,o),d={module:{uri:o},exports:r,require:c};a[o]=Promise.all(s.map((e=>d[e]||c(e)))).then((e=>(n(...e),r)))}}define(["./workbox-7c2a5a06"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"b81a21c6037e97b94a9bb194ef1d0cff"},{url:"/_next/static/EGC19nMZhWsRfxuRP3sU0/_buildManifest.js",revision:"66a650a40453999ca40002ee32e3481e"},{url:"/_next/static/EGC19nMZhWsRfxuRP3sU0/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/340-f6a14361c8f06667.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/596-2904cfab98d84ff7.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/641-2c65d9ea3333dad4.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/@auth/default-79067328d3820c54.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/@auth/signin/page-00cf5601d20e7ed8.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/@auth/signup/page-3da7753cee95a273.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/default-938d96d28d55ab6e.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/goodbye/page-9af54f43aa8a99c8.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/layout-e4b789ef1d62b26c.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/page-1138448767008e62.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/student/page-c00710f5629dd313.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/app/teacher/page-e55aae22a7a0ad1f.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/fd9d1056-7d396398206e3437.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/framework-8883d1e9be70c3da.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/main-770d4298e73519f6.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/main-app-3936258a733eaba5.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/pages/_app-52924524f99094ab.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/pages/_error-c92d5c4bb2b49926.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js",revision:"79330112775102f91e1010318bae2bd3"},{url:"/_next/static/chunks/webpack-d380b070101fb66c.js",revision:"EGC19nMZhWsRfxuRP3sU0"},{url:"/_next/static/css/15fea545642695e4.css",revision:"15fea545642695e4"},{url:"/_next/static/css/51e9759e63223697.css",revision:"51e9759e63223697"},{url:"/_next/static/css/76b988ba33116b18.css",revision:"76b988ba33116b18"},{url:"/_next/static/css/ef46db3751d8e999.css",revision:"ef46db3751d8e999"},{url:"/_next/static/media/148a0c17ddd47a84-s.woff2",revision:"ab0e64b5b1c942e14f7945bd882a78f7"},{url:"/_next/static/media/4c891b6278df6a9f-s.p.woff2",revision:"821760a0c24e57d2e3009725217bae08"},{url:"/_next/static/media/4f2295d3ac547cd7-s.woff2",revision:"5ea50cb55cec41e3e7bc76c0c1d12119"},{url:"/_next/static/media/693b45ebc16300fb-s.woff2",revision:"d1f414d6a1e76e2261e30962dc1fcb47"},{url:"/_next/static/media/87e4b229c0ad654c-s.p.woff2",revision:"238e5cdfe5684c705f48ee428077ca82"},{url:"/_next/static/media/a05472d8df32fdcc-s.p.woff2",revision:"6b6cc9f2207564e0feae69b7821c2de0"},{url:"/_next/static/media/a2bc2c1e55dc2f9e-s.woff2",revision:"a7158d6d12cc8a01ff7348b1b6bdef9d"},{url:"/_next/static/media/bb0e05018d4f5d4c-s.woff2",revision:"1229056319d9e371b0142a0f260eb352"},{url:"/_next/static/media/ef77d928a903c281-s.woff2",revision:"88ee14de143d66d23bfe5f4e08e0836d"},{url:"/_next/static/media/logo.1f0ce395.png",revision:"5a1cd85c29b1ffaaffa4f4d0a85965ae"},{url:"/android/android-launchericon-144-144.png",revision:"1200379fa217a08a91b949500b73f974"},{url:"/android/android-launchericon-192-192.png",revision:"bca83914be474bd6d4bfc0b3be94f5f9"},{url:"/android/android-launchericon-48-48.png",revision:"a0918466063578c9477a814c0385ffa3"},{url:"/android/android-launchericon-512-512.png",revision:"6ee06ef5d4698fab82111df500ee50fd"},{url:"/android/android-launchericon-72-72.png",revision:"78a097d287d7615172afee79c0e06c78"},{url:"/android/android-launchericon-96-96.png",revision:"5ce07c675f2b596e23c34c5d89dcd408"},{url:"/favicon-16x16.png",revision:"cb83853df1316baee6477797851433b4"},{url:"/favicon-32x32.png",revision:"3add875505ba18af51d298db6af3f00c"},{url:"/images/logo.png",revision:"5a1cd85c29b1ffaaffa4f4d0a85965ae"},{url:"/ios/100.png",revision:"1b850a42029895d9680a50340c172d84"},{url:"/ios/1024.png",revision:"ad24f352e8583be8aa9383081df201d1"},{url:"/ios/114.png",revision:"79c8adf6fc0c8b7fd0c25ac734387818"},{url:"/ios/120.png",revision:"8d18b213fd01b2b7e037a5577672780a"},{url:"/ios/128.png",revision:"fa9fc60d5f094f20a5fc9d290a8fde1d"},{url:"/ios/144.png",revision:"1200379fa217a08a91b949500b73f974"},{url:"/ios/152.png",revision:"7b7ae832b9a5e092343082eb9985ae99"},{url:"/ios/16.png",revision:"a61d8169250beba8fe0f337ccf294ed0"},{url:"/ios/167.png",revision:"bf75a40e9501acf5660026df3338d34e"},{url:"/ios/180.png",revision:"90d5c5b96010495de4ae790de6f71cca"},{url:"/ios/192.png",revision:"bca83914be474bd6d4bfc0b3be94f5f9"},{url:"/ios/20.png",revision:"cdf7c83dfcfc5d740dec9c3051ec1820"},{url:"/ios/256.png",revision:"e0450a2589679b3dad07a4c5bb4e9d8b"},{url:"/ios/29.png",revision:"72c8c9dbba80c21af96fe36d5e414a15"},{url:"/ios/32.png",revision:"eef9195eee9d96594a7619fa64e264fc"},{url:"/ios/40.png",revision:"fba210fb5359b801e655064c189e7016"},{url:"/ios/50.png",revision:"0202cc4b30c4d616ab5a9e4a868b781e"},{url:"/ios/512.png",revision:"6ee06ef5d4698fab82111df500ee50fd"},{url:"/ios/57.png",revision:"6d4a0a82ba6ac1c364d19cb299b3c379"},{url:"/ios/58.png",revision:"11682a0e27d82990fbb6d63c1f467ca7"},{url:"/ios/60.png",revision:"f104c83b31ef1f83e7e572a249e987fb"},{url:"/ios/64.png",revision:"3116dc3c1f27a119474eb769335ceae2"},{url:"/ios/72.png",revision:"78a097d287d7615172afee79c0e06c78"},{url:"/ios/76.png",revision:"cfed8938fa306dde7beebcda3d39aa09"},{url:"/ios/80.png",revision:"efc47a934748d69a8e1840966892623b"},{url:"/ios/87.png",revision:"2fb927eb0bcd2bbd35441da488df3304"},{url:"/manifest.json",revision:"8748b4f0116b7b8f4708b2368fd5f908"},{url:"/maskable_icon.png",revision:"bb37e6a33fb64187051e04d34b2701ea"},{url:"/windows11/LargeTile.scale-100.png",revision:"e6dfb8e23054ae6c9945cc6244d5c355"},{url:"/windows11/LargeTile.scale-125.png",revision:"d4d390de3f418f31d157c8cd8eb12dff"},{url:"/windows11/LargeTile.scale-150.png",revision:"aafb394f84a75f6b7cbfa2a509f5996a"},{url:"/windows11/LargeTile.scale-200.png",revision:"95fa51b311c47ebfe2aef53693c2c8f7"},{url:"/windows11/LargeTile.scale-400.png",revision:"f31e09d75a16c8e104b9ec0cd3cda15c"},{url:"/windows11/SmallTile.scale-100.png",revision:"2422fb1ef3c824ce231642a9f69a4c72"},{url:"/windows11/SmallTile.scale-125.png",revision:"fa69179375a90e3f0e8e2afc7cf12e88"},{url:"/windows11/SmallTile.scale-150.png",revision:"ead1a067b9d1c62ad29a8d70abc0933e"},{url:"/windows11/SmallTile.scale-200.png",revision:"15345071653aae4f6d1df84a6b2a3513"},{url:"/windows11/SmallTile.scale-400.png",revision:"f9e6f7cf7ae3ef5d18299b976f2e242a"},{url:"/windows11/SplashScreen.scale-100.png",revision:"09a5f9f6efa7f881998c20b7b76e6d49"},{url:"/windows11/SplashScreen.scale-125.png",revision:"611c407656342e658d2dad0094164768"},{url:"/windows11/SplashScreen.scale-150.png",revision:"728fc46fb7182fd126b2afca747b64cc"},{url:"/windows11/SplashScreen.scale-200.png",revision:"ec8d365aa63e06b8333e459eaeb39c52"},{url:"/windows11/SplashScreen.scale-400.png",revision:"a8cfaff830117fd5bdea2664d8d5a185"},{url:"/windows11/Square150x150Logo.scale-100.png",revision:"52589fc1bdbfc56f68ae3247dd0a5249"},{url:"/windows11/Square150x150Logo.scale-125.png",revision:"fc154b730a5e3994b6eba06ee2fe7daf"},{url:"/windows11/Square150x150Logo.scale-150.png",revision:"51f2826a1bda6e19a5f564209662296c"},{url:"/windows11/Square150x150Logo.scale-200.png",revision:"0288619d059389f8cd812fdf284266e5"},{url:"/windows11/Square150x150Logo.scale-400.png",revision:"3e6af48dad6424e9effabdeea4dcb053"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-16.png",revision:"a61d8169250beba8fe0f337ccf294ed0"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-20.png",revision:"cdf7c83dfcfc5d740dec9c3051ec1820"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-24.png",revision:"bd052e84f2768cf7cd1ac53fefe92e0e"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-256.png",revision:"e0450a2589679b3dad07a4c5bb4e9d8b"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-30.png",revision:"1ae7bec31013c768ef55f75b8e18c713"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-32.png",revision:"eef9195eee9d96594a7619fa64e264fc"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-36.png",revision:"8fa7161959d2bc8ab4ce84cce69733e0"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-40.png",revision:"fba210fb5359b801e655064c189e7016"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-44.png",revision:"61522530bf2be0d08999a6d35ea9c009"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-48.png",revision:"a0918466063578c9477a814c0385ffa3"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-60.png",revision:"f104c83b31ef1f83e7e572a249e987fb"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-64.png",revision:"3116dc3c1f27a119474eb769335ceae2"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-72.png",revision:"78a097d287d7615172afee79c0e06c78"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-80.png",revision:"efc47a934748d69a8e1840966892623b"},{url:"/windows11/Square44x44Logo.altform-lightunplated_targetsize-96.png",revision:"5ce07c675f2b596e23c34c5d89dcd408"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-16.png",revision:"a61d8169250beba8fe0f337ccf294ed0"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-20.png",revision:"cdf7c83dfcfc5d740dec9c3051ec1820"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-24.png",revision:"bd052e84f2768cf7cd1ac53fefe92e0e"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-256.png",revision:"e0450a2589679b3dad07a4c5bb4e9d8b"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-30.png",revision:"1ae7bec31013c768ef55f75b8e18c713"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-32.png",revision:"eef9195eee9d96594a7619fa64e264fc"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-36.png",revision:"8fa7161959d2bc8ab4ce84cce69733e0"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-40.png",revision:"fba210fb5359b801e655064c189e7016"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-44.png",revision:"61522530bf2be0d08999a6d35ea9c009"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-48.png",revision:"a0918466063578c9477a814c0385ffa3"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-60.png",revision:"f104c83b31ef1f83e7e572a249e987fb"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-64.png",revision:"3116dc3c1f27a119474eb769335ceae2"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-72.png",revision:"78a097d287d7615172afee79c0e06c78"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-80.png",revision:"efc47a934748d69a8e1840966892623b"},{url:"/windows11/Square44x44Logo.altform-unplated_targetsize-96.png",revision:"5ce07c675f2b596e23c34c5d89dcd408"},{url:"/windows11/Square44x44Logo.scale-100.png",revision:"61522530bf2be0d08999a6d35ea9c009"},{url:"/windows11/Square44x44Logo.scale-125.png",revision:"1ee3f7f114819d28144ba97bd8cfde10"},{url:"/windows11/Square44x44Logo.scale-150.png",revision:"3ad684adca9203ac6b8b6c60f8afd311"},{url:"/windows11/Square44x44Logo.scale-200.png",revision:"e2cb2c64c15ecd416fe9238ffd858113"},{url:"/windows11/Square44x44Logo.scale-400.png",revision:"cbe7babc4170f440044261e209959c56"},{url:"/windows11/Square44x44Logo.targetsize-16.png",revision:"a61d8169250beba8fe0f337ccf294ed0"},{url:"/windows11/Square44x44Logo.targetsize-20.png",revision:"cdf7c83dfcfc5d740dec9c3051ec1820"},{url:"/windows11/Square44x44Logo.targetsize-24.png",revision:"bd052e84f2768cf7cd1ac53fefe92e0e"},{url:"/windows11/Square44x44Logo.targetsize-256.png",revision:"e0450a2589679b3dad07a4c5bb4e9d8b"},{url:"/windows11/Square44x44Logo.targetsize-30.png",revision:"1ae7bec31013c768ef55f75b8e18c713"},{url:"/windows11/Square44x44Logo.targetsize-32.png",revision:"eef9195eee9d96594a7619fa64e264fc"},{url:"/windows11/Square44x44Logo.targetsize-36.png",revision:"8fa7161959d2bc8ab4ce84cce69733e0"},{url:"/windows11/Square44x44Logo.targetsize-40.png",revision:"fba210fb5359b801e655064c189e7016"},{url:"/windows11/Square44x44Logo.targetsize-44.png",revision:"61522530bf2be0d08999a6d35ea9c009"},{url:"/windows11/Square44x44Logo.targetsize-48.png",revision:"a0918466063578c9477a814c0385ffa3"},{url:"/windows11/Square44x44Logo.targetsize-60.png",revision:"f104c83b31ef1f83e7e572a249e987fb"},{url:"/windows11/Square44x44Logo.targetsize-64.png",revision:"3116dc3c1f27a119474eb769335ceae2"},{url:"/windows11/Square44x44Logo.targetsize-72.png",revision:"78a097d287d7615172afee79c0e06c78"},{url:"/windows11/Square44x44Logo.targetsize-80.png",revision:"efc47a934748d69a8e1840966892623b"},{url:"/windows11/Square44x44Logo.targetsize-96.png",revision:"5ce07c675f2b596e23c34c5d89dcd408"},{url:"/windows11/StoreLogo.scale-100.png",revision:"5bcc4b75c5c2db24c4c8d9840f6ba86c"},{url:"/windows11/StoreLogo.scale-125.png",revision:"c7ec8fc71b1355999dd04f6e657d93fa"},{url:"/windows11/StoreLogo.scale-150.png",revision:"ad8ff9ab8f91f24a2d4da6231edd22e6"},{url:"/windows11/StoreLogo.scale-200.png",revision:"e8f0742101e47a40e27abcec93514d21"},{url:"/windows11/StoreLogo.scale-400.png",revision:"d3d2e2e6b983a9ec170f61aa0a66013d"},{url:"/windows11/Wide310x150Logo.scale-100.png",revision:"29f3a90458f1652e91586ff7a9f1b959"},{url:"/windows11/Wide310x150Logo.scale-125.png",revision:"90332d08d6e2dc52a4752b2321dbf7b0"},{url:"/windows11/Wide310x150Logo.scale-150.png",revision:"2af4dec8b0dc2d8285617f4dd578d5f6"},{url:"/windows11/Wide310x150Logo.scale-200.png",revision:"09a5f9f6efa7f881998c20b7b76e6d49"},{url:"/windows11/Wide310x150Logo.scale-400.png",revision:"ec8d365aa63e06b8333e459eaeb39c52"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:a,event:i,state:s})=>a&&"opaqueredirect"===a.type?new Response(a.body,{status:200,statusText:"OK",headers:a.headers}):a}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const a=e.pathname;return!a.startsWith("/api/auth/")&&!!a.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));