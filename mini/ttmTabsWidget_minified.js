function ttmCreateGSTWidget(e,t,l){if(e.hasAttribute("ttmWidgetInit"))return;e.setAttribute("ttmWidgetInit","");let a=`${l}-${t}`;e.id=a;let r=e.getAttribute("data-ttmGSID");if(!r){c(e);return}let n=`https://docs.google.com/spreadsheets/d/e/${r}/pub?output=csv`;async function i(e){let t=await fetch(e);if(!t.ok)throw Error(`HTTP error! status: ${t.status}`);return await t.text()}function d(e,t,l,a){let r=e.querySelectorAll("ul li"),n=e.querySelector(".widget-container"),i=Object.keys(a),d=n.querySelector(`[data-tab-name="${i[l]}"]`),c=n.querySelectorAll(".table-content");if(c.forEach(e=>e.style.display="none"),r.forEach(e=>e.classList.remove("bg-blue-500")),r[l].classList.add("bg-blue-500"),d)d.style.display="block";else{let o=a[i[l]],p=function e(t,l,a){let r=s(a),n=document.createDocumentFragment(),i=document.createElement("div");i.style.display="block",i.classList.add("table-content"),i.dataset.tabName=t;let d=document.createElement("div");return d.className="relative overflow-x-auto shadow-sm",d.appendChild(r),i.appendChild(d),n.appendChild(i),n}(i[l],l,o);n.appendChild(p)}}function s(e){var t;let l=(t=e[0],Object.keys(t).map(e=>{let t="text-center",l=e,a="text-white",r="";l.includes("{C}")?(t="text-center",l=l.replace("{C}","")):l.includes("{L}")?(t="text-left",l=l.replace("{L}","")):l.includes("{R}")&&(t="text-right",l=l.replace("{R}","")),l.includes("{r}")?(a="text-red-500",l=l.replace("{r}","")):l.includes("{g}")?(a="text-green-500",l=l.replace("{g}","")):l.includes("{b}")&&(a="text-blue-500",l=l.replace("{b}",""));let n=l.match(/{f(\d+)}/);return n&&(r=n[1],l=l.replace(n[0],"")),l=l.split("_")[0],{header:l,alignment:t,originalHeader:e,textColor:a,fontSize:r}})),a=document.createElement("table");a.className="ttmTable-content w-full text-xs text-left text-gray-500 dark:text-gray-400";let r=l.every(({header:e})=>!e.trim());if(!r){let n=document.createElement("thead");n.className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400";let i=document.createElement("tr");l.forEach(({header:e,alignment:t,textColor:l,fontSize:a,columnWidth:r})=>{let n=document.createElement("th");n.scope="col",n.style.width=r,n.className=`px-5 py-5 border-b-2 border-gray-200 bg-blue-500 ${t} font-semibold ${l} uppercase align-middle`,n.innerHTML=a?`<span style="font-size:${a}px">${e}</span>`:e,i.appendChild(n)}),n.appendChild(i),a.appendChild(n)}let d=document.createElement("tbody");return e.forEach((e,t)=>{let a=function e(t,l,a,r){let n=document.createElement("tr");n.className=r%2==0?"":"bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600";let i=0;return l.forEach(({originalHeader:e,alignment:a,textColor:r,fontSize:d})=>{if(i>0){i--;return}let s=t[e],c=a,o="text-white"===r?"text-black":r,p=1,u=d?`font-size:${d}px`:"";if(s&&s.includes("{C}")?(c="text-center",s=s.replace("{C}","")):s&&s.includes("{L}")?(c="text-left",s=s.replace("{L}","")):s&&s.includes("{R}")&&(c="text-right",s=s.replace("{R}","")),s&&s.includes("{r}")?(o="text-red-500",s=s.replace("{r}","")):s&&s.includes("{g}")?(o="text-green-500",s=s.replace("{g}","")):s&&s.includes("{b}")&&(o="text-blue-500",s=s.replace("{b}","")),s&&s.includes("{W}")){s=s.replace("{W}","");let m=l.findIndex(({originalHeader:t})=>t===e)+1;for(;m<l.length&&(!t[l[m].originalHeader]||""===t[l[m].originalHeader]);)p++,i++,m++}let g=s.match(/{f(\d+)}/);g&&(u=`font-size:${g[1]}px`,s=s.replace(g[0],""));let f=function e(t,l,a,r,n,i){let d=document.createElement("td");if(d.style.width=t,d.colSpan=l,d.className=`px-3 py-5 border-b border-gray-200 bg-white ${r} ${n} align-middle`,i&&(d.style.cssText+=`; ${i}`),a.includes("{B}")){let[s,c]=a.replace("{B}","").split(">");c.startsWith("http://")||c.startsWith("https://")||(c=`https://${c}`);let o=document.createElement("button");o.className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",o.onclick=()=>window.open(c,"_blank"),o.innerHTML=s,d.appendChild(o)}else d.innerHTML=a;return d}("",p,s,o,c,u);n.appendChild(f)}),n}(e,l,"",t);d.appendChild(a)}),a.appendChild(d),a}function c(e){e.innerHTML='<div class="flex justify-center items-center h-full text-gray-500 text-lg">No data available</div>'}i(n).then(t=>{let r=function e(t){t=t.replace(/\r\n/g,"\n");let[l,...a]=t.split("\n"),r=l.split(","),n=r.map((e,t)=>`${e}_${t}`);return a.map(e=>{let t=e.split(",");return Object.fromEntries(n.map((e,l)=>[e,t[l]||""]))})}(t);"ttmTabsWidget"===l?function e(t,l,a){if(0===t.children.length){let r=document.createElement("div");r.className="flex justify-center",r.innerHTML='<div class="w-full"><div class="bg-transparent shadow-sm my-6"><ul class="flex justify-around"></ul><div class="w-full widget-container"></div></div></div>',t.appendChild(r)}let n=t.querySelector("ul"),i=Object.keys(a[0])[0],s={};a.forEach(e=>{let t=e[i];s[t]||(s[t]=[]);let{[i]:l,...a}=e;s[t].push(a)});let c=Object.keys(s),o=document.createDocumentFragment();c.forEach((e,a)=>{o.appendChild(function e(t,l,a,r){let n=document.createElement("li");return n.className="flex-auto ml-0 last:mr-0 text-center bg-gray-400 text-white rounded-t-xl ttmTab-element",n.innerHTML=`<div class="text-xs font-bold uppercase px-5 py-3 block leading-normal">${a}</div>`,n}(t,l,e,a))}),n.appendChild(o),n.addEventListener("click",e=>{let a=e.target,r=Array.from(n.children),i=a.closest(".ttmTab-element");if(i){let c=r.indexOf(i);d(t,l,c,s)}}),n.firstChild&&d(t,l,0,s)}(e,a,r):function e(t,l,a){if(0===t.children.length){let r=document.createElement("div");r.className="flex justify-center",r.innerHTML='<div class="w-full"><div class="bg-transparent shadow-sm rounded-sm my-6"><div class="w-full widget-container"></div></div></div>',t.appendChild(r)}let n=t.querySelector(".widget-container"),i=s(a),d=document.createElement("div");d.className="relative overflow-x-auto shadow-sm sm:rounded-lg",d.appendChild(i),n.appendChild(d),n.classList.add("table-content")}(e,a,r)}).catch(t=>{console.error("Error fetching Google Sheet data:",t),c(e)})}window.addEventListener("load",function(){Array.from(document.getElementsByClassName("ttmTabsWidget")).forEach((e,t)=>{ttmCreateGSTWidget(e,t,"ttmTabsWidget")}),Array.from(document.getElementsByClassName("ttmTableWidget")).forEach((e,t)=>{ttmCreateGSTWidget(e,t,"ttmTableWidget")})},!1);
