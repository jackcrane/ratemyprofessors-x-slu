import rmp from './rmp.js';

const fetchApi = fetch;

export default {
	async fetch(request, env) {
		// Helper function to create responses with consistent CORS headers
		function createResponse(body, status = 200, contentType = 'application/json') {
			return new Response(typeof body === 'string' ? body : JSON.stringify(body, null, 2), {
				status,
				headers: {
					'Content-Type': contentType,
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		try {
			if (request.method === 'OPTIONS') {
				return createResponse(null, 204); // Respond to OPTIONS requests
			}

			// Get professor name from request query
			const url = new URL(request.url);

			if (url.pathname === '/i') {
				const response =
					'(()=>{if(!window.location.href.includes("https://courses.slu.edu"))alert("This bookmarklet only works on courses.slu.edu");else{alert("Courses@SLU x RMP Bookmarklet loaded");let x=[],i={};setInterval(()=>{document.querySelectorAll(".result__link--viewing").forEach(e=>e.style.pointerEvents="initial")},100);let b=async e=>{if(e==="TBA"||e==="Staff"||e==="Instructor TBA"||e==="Team")return[!1];if(i[e])return console.log("Using cache"),i[e][0]===!1?[!1,i[e][1]]:[!0,i[e][1]];console.log("Not using cache",e,i);try{let r=await fetch(`https://rmp-conn.jackcrane.workers.dev/api?name=${e}`);if(!r.ok){let u=await r.text();return i[e]=[!1,u],[!1,await r.text()]}let t=await r.json();return i[e]=[!0,t],[!0,t]}catch(r){return[!1,r]}},y=null,d=async()=>{if(y&&Date.now()-y<100){console.log("Skipping processing professors");return}y=Date.now(),document.querySelectorAll(".__rmp-rating").forEach(t=>{t.remove()}),console.log("Processing professors");let e=document.querySelectorAll(".sr-only");if(e.length>150){console.log("Too many sr-only elements, skipping processing",e.length);return}document.querySelectorAll(".sr-only, .header-text").forEach(t=>{if(t.textContent.trim()==="Instructor:"){let u=t?.nextSibling?.textContent?.trim();if(u){let v=b(u).then(([w,n])=>{if(w){let l=n?.avgRating,C=t.parentElement.getAttribute("role")==="gridcell",g=document.createElement("a");g.href=n.link,g.textContent="RMP",g.target="_blank",g.addEventListener("click",s=>{s.stopPropagation()});let a=document.createElement("div");a.style.display="flex",a.style.gap="1px",a.style.flexDirection="column",a.classList.add("__rmp-rating-graphs");let p=document.createElement("div");p.style.display="flex",p.style.gap="1px",p.classList.add("__rmp-rating-boxes");for(let s=1;s<=5;s++){let c=document.createElement("div");c.style.width="10px",c.style.height="5px",c.style.border="0.5px solid black";let k=l>3?"#2fb344":l>2?"#f7b731":"#eb3b5a";s<=Math.floor(l)?c.style.backgroundColor=k:s===Math.ceil(l)&&l%1!==0?c.style.background=`linear-gradient(to right, ${k} ${Math.round(l%1*100)}%, #e6e6e6 ${Math.round(l%1*100)}%)`:c.style.backgroundColor="#e6e6e6",p.appendChild(c)}let h=document.createElement("div");h.style.width="54px",h.style.height="5px",h.style.border="0.5px solid black";let E=n.wouldTakeAgainPercent>90?"#2fb344":n.wouldTakeAgainPercent>70?"#B4B637":n.wouldTakeAgainPercent>40?"#f7b731":"#eb3b5a",f=document.createElement("div");f.style.width=`${n.wouldTakeAgainPercent}%`,f.style.height="5px",f.style.backgroundColor=E,h.appendChild(f),a.appendChild(h),a.appendChild(p);let m=document.createElement("a");m.href="#",m.addEventListener("click",s=>{s.stopPropagation(),confirm(`Professor ${n.firstName} ${n.lastName} has the following ratings:\n\n                    Average Rating: ${n.avgRating.toFixed(1)} /5\n                    Would Take Again: ${n.wouldTakeAgainPercent.toFixed(0)}%\n                    Average Difficulty: ${n.avgDifficulty.toFixed(1)} /5\n                    Number of Ratings: ${n.numRatings}\n\n                    Click OK to open the Rate My Professors page for ${u} in a new tab. Click Cancel to close this dialog.`.replace(/[ ]{2,}/g," ").trim())&&g.click()}),m.textContent="?";let o=document.createElement("div");o.style.display="flex",o.style.justifyContent=C?"left":"flex-end",o.style.gap="5px",o.style.alignItems="center",o.appendChild(g),o.appendChild(a),o.appendChild(m),o.classList.add("__rmp-rating"),t.parentElement.prepend(o)}});x.push({parent:t.parentElement,profName:u,ratingPromise:v})}}})};d(),document.querySelector("#search-button").addEventListener("click",()=>{d()}),document.querySelector("#search-form").addEventListener("submit",()=>{setTimeout(()=>{d()},500)}),document.addEventListener("input",e=>{setTimeout(()=>{d()},500)}),document.addEventListener("change",e=>{setTimeout(()=>{d()},500)}),new PerformanceObserver(e=>{e.getEntriesByType("resource").forEach(t=>{(t.initiatorType==="fetch"||t.initiatorType==="xmlhttprequest")&&(t.name.includes("jackcrane.workers.dev")||setTimeout(()=>{d()},500))})}).observe({entryTypes:["resource"]})}})();';
				return createResponse(response);
			}

			if (url.pathname === '/api') {
				const name = url.searchParams.get('name');
				if (!name) {
					return createResponse('Missing professor name', 404, 'text/plain');
				}

				const firstInitial = name[0];
				const lastName = name.split(' ')[1];
				console.log({ firstInitial, lastName });
				if (!firstInitial || !lastName) {
					return createResponse('Invalid professor name', 404, 'text/plain');
				}

				const school = await rmp.searchSchool('Saint Louis University');
				if (!school) {
					return createResponse('Invalid school', 404, 'text/plain');
				}
				const schoolId = school[0].node.id;

				const results = await rmp.searchProfessorsAtSchoolId(lastName, schoolId);
				if (!results) {
					return createResponse('Invalid professor', 404, 'text/plain');
				}

				const matchingProfessors = results.filter((prof) => {
					return prof.node.firstName[0] === firstInitial && prof.node.wouldTakeAgainPercent !== -1;
				});
				if (matchingProfessors.length === 0) {
					return createResponse('No matching professors', 404, 'text/plain');
				}

				return createResponse(matchingProfessors[0]?.node);
			}

			const html = `
          <html>
          <body>
          <a href="javascript:fetch('https://rmp-conn.jackcrane.workers.dev/i').then(e => e.text()).then(e => eval(e))">Run RMP</a>
          <p>Drag-and-drop the above link to your bookmarks bar to create a bookmarklet. Then, on courses.slu, just click the bookmarklet</p>
          </body>
          </html>`;
			return createResponse(html, 200, 'text/html');
		} catch (err) {
			return createResponse(`Error: ${err.message}`, 500, 'text/plain');
		}
	},
};
