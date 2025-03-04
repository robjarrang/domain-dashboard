(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{8921:function(e,t,s){Promise.resolve().then(s.bind(s,6120))},6120:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return E}});var a=s(3827),r=s(4090),i=s(1310),l=s(2529),n=s(8745),o=s(7960),d=s(3835),c=s(4773),m=s(7474),h=s(3753),u=s(4894),x=s(4424),p=s(8005),f=s(5548),y=s(558);let j=(e,t,s)=>{if(t)return(0,a.jsx)(l.Z,{className:"w-5 h-5 text-primary animate-spin"});if(s)return(0,a.jsx)(d.Z,{className:"w-5 h-5 text-green-500"});switch(e){case"success":return(0,a.jsx)(d.Z,{className:"w-5 h-5 text-green-500"});case"error":return(0,a.jsx)(c.Z,{className:"w-5 h-5 text-yellow-500"});case"advisory":return(0,a.jsx)(m.Z,{className:"w-5 h-5 text-primary"});default:return(0,a.jsx)(h.Z,{className:"w-5 h-5 text-red-500"})}},b=(e,t)=>{if(t)return"text-green-700 bg-green-50 ring-1 ring-green-600/10";switch(e){case"success":return"text-green-700 bg-green-50 ring-1 ring-green-600/10";case"error":return"text-yellow-700 bg-yellow-50 ring-1 ring-yellow-600/10";case"advisory":return"text-deep-teal bg-ice-white ring-1 ring-deep-teal/10";default:return"text-red-700 bg-red-50 ring-1 ring-red-600/10"}};function g(e){let{domain:t,onRefresh:s,onDelete:i,onEdit:d}=e,[c,m]=(0,r.useState)(!1),[h,g]=(0,r.useState)(!1),[N,v]=(0,r.useState)(null),[w,S]=(0,r.useState)(!1);(0,r.useEffect)(()=>{S(!0)},[]);let k=async()=>{g(!0);try{await s(t.id)}finally{g(!1)}},C=()=>{confirm("Are you sure you want to delete this domain?")&&i(t.id)},E=async e=>{try{v(null);let a=[...t.dismissedAdvisories||[]];a.includes(e)||a.push(e);let r=await fetch("/api/domains/".concat(t.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({dismissedAdvisories:a})}),i=await r.json();if(!r.ok)throw Error(i.error||"Failed to dismiss advisory");await s(t.id)}catch(e){console.error("Failed to dismiss advisory:",e),v(e instanceof Error?e.message:"Failed to dismiss advisory")}},P=async e=>{try{v(null);let a=(Array.isArray(t.dismissedAdvisories)?t.dismissedAdvisories:"string"==typeof t.dismissedAdvisories?t.dismissedAdvisories.split(",").filter(Boolean):[]).filter(t=>t!==e),r=await fetch("/api/domains/".concat(t.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({dismissedAdvisories:a})}),i=await r.json();if(!r.ok)throw Error(i.error||"Failed to undo advisory dismissal");await s(t.id)}catch(e){console.error("Failed to undo advisory dismissal:",e),v(e instanceof Error?e.message:"Failed to undo advisory dismissal")}},F=e=>!!t.dismissedAdvisories&&(Array.isArray(t.dismissedAdvisories)?t.dismissedAdvisories:"string"==typeof t.dismissedAdvisories?t.dismissedAdvisories.split(",").filter(Boolean):[]).includes(e),A=(e,t,s)=>{if(!e)return(0,a.jsx)("span",{className:"text-gray-500",children:"Not configured"});let[r,i]=e.split(" (");return(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("span",{className:"font-mono block",children:r}),i&&(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("span",{className:"text-sm px-2 py-0.5 rounded-full ".concat(b(t,F(s||""))),children:i.replace(")","")}),"advisory"===t&&(0,a.jsx)(a.Fragment,{children:F(s||"")?(0,a.jsx)("button",{onClick:()=>s&&P(s),className:"text-sm text-blue-600 hover:text-blue-800",children:"Undo"}):(0,a.jsx)("button",{onClick:()=>s&&E(s),className:"text-sm text-blue-600 hover:text-blue-800",children:"Dismiss"})})]}),N&&(0,a.jsx)("div",{className:"text-sm text-red-600 mt-1",children:N})]})},D=()=>(0,a.jsxs)("div",{className:"flex items-center gap-1",children:[j(t.dkimStatus,h,F("dkim")),j(t.spfStatus,h,F("spf")),j(t.dmarcStatus,h,F("dmarc"))]});return w?(0,a.jsxs)("div",{className:"card overflow-hidden mb-4",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between p-6 cursor-pointer",onClick:()=>m(!c),children:[(0,a.jsxs)("div",{className:"flex-1",children:[(0,a.jsxs)("div",{className:"flex items-center gap-4",children:[(0,a.jsx)("h3",{className:"font-semibold text-lg text-midnight-navy",children:t.name}),t.esp&&(0,a.jsx)("span",{className:"px-2 py-0.5 rounded-full text-sm bg-ice-white text-deep-teal",children:t.esp.name}),(0,a.jsx)(D,{}),N&&(0,a.jsx)(u.Z,{className:"w-5 h-5 text-red-500",title:N})]}),(0,a.jsxs)("p",{className:"mt-2 text-sm text-deep-teal",children:["Last checked: ",new Date(t.lastChecked).toLocaleString()]})]}),(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsx)("button",{type:"button",onClick:e=>{e.stopPropagation(),d(t.id)},className:"p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200",title:"Edit domain",children:(0,a.jsx)(f.Z,{className:"w-5 h-5"})}),(0,a.jsx)("button",{type:"button",onClick:e=>{e.stopPropagation(),C()},className:"p-2.5 rounded-full text-deep-teal hover:text-red-600 hover:bg-red-50 transition-all duration-200",title:"Delete domain",children:(0,a.jsx)(x.Z,{className:"w-5 h-5"})}),(0,a.jsx)("button",{type:"button",onClick:e=>{e.stopPropagation(),k()},disabled:h,className:"p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",title:"Refresh DNS records",children:(0,a.jsx)(l.Z,{className:"w-5 h-5 ".concat(h?"animate-spin":"")})}),(0,a.jsx)("div",{className:"p-2.5 rounded-full text-deep-teal",children:c?(0,a.jsx)(y.Z,{className:"w-5 h-5"}):(0,a.jsx)(p.Z,{className:"w-5 h-5"})})]})]}),(0,a.jsx)(n.M,{children:c&&(0,a.jsx)(o.E.div,{initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.2},className:"overflow-hidden",children:(0,a.jsxs)("div",{className:"p-6 bg-ice-white space-y-6 border-t border-soft-grey",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("h4",{className:"font-semibold text-midnight-navy mb-3",children:["DKIM Record (",t.dkimSelector,"._domainkey)"]}),A(t.dkim,t.dkimStatus,"dkim")]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("h4",{className:"font-semibold text-midnight-navy mb-3",children:"SPF Record"}),A(t.spf,t.spfStatus,"spf")]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("h4",{className:"font-semibold text-midnight-navy mb-3",children:"DMARC Record"}),A(t.dmarc,t.dmarcStatus,"dmarc")]})]})})})]}):(0,a.jsx)("div",{className:"bg-white divide-y divide-gray-200",children:(0,a.jsx)("div",{className:"group",children:(0,a.jsxs)("div",{className:"flex items-center justify-between p-4",children:[(0,a.jsxs)("div",{className:"flex-1",children:[(0,a.jsxs)("div",{className:"flex items-center gap-4",children:[(0,a.jsx)("h3",{className:"font-medium text-gray-900",children:t.name}),(0,a.jsx)(D,{}),N&&(0,a.jsx)(u.Z,{className:"w-5 h-5 text-red-500",title:N})]}),(0,a.jsxs)("p",{className:"mt-1 text-sm text-gray-500",children:["Last checked: ",new Date(t.lastChecked).toLocaleString()]})]}),(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsx)("button",{type:"button",onClick:C,className:"p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200",title:"Delete domain",children:(0,a.jsx)(x.Z,{className:"w-5 h-5"})}),(0,a.jsx)("button",{type:"button",onClick:k,disabled:h,className:"p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-blue-50 transition-colors duration-200",title:"Refresh DNS records",children:(0,a.jsx)(l.Z,{className:"w-5 h-5 ".concat(h?"animate-spin":"")})}),(0,a.jsx)(p.Z,{className:"w-5 h-5 text-gray-400"})]})]})})})}var N=s(8621);function v(e){let{onAdd:t,onClose:s}=e,[l,n]=(0,r.useState)(""),[o,d]=(0,r.useState)("default"),[c,m]=(0,r.useState)(""),[h,u]=(0,r.useState)([]),[x,p]=(0,r.useState)(""),[f,y]=(0,r.useState)(!1),[j,b]=(0,r.useState)(!1),[g,v]=(0,r.useState)(null);(0,r.useEffect)(()=>{w()},[]);let w=async()=>{try{let e=await fetch("/api/esps");if(!e.ok)throw Error("Failed to fetch ESPs");let t=await e.json();u(t)}catch(e){console.error("Error fetching ESPs:",e),v("Failed to load ESP list")}},S=async()=>{if(!x.trim()){v("ESP name is required");return}try{let e=await fetch("/api/esps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:x.trim()})});if(!e.ok)throw Error("Failed to create ESP");let t=await e.json();u([...h,t]),m(t.id),p(""),y(!1),v(null)}catch(e){console.error("Error creating ESP:",e),v("Failed to create new ESP")}},k=e=>/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(e),C=e=>/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(e),E=async e=>{if(e.preventDefault(),b(!0),v(null),!k(l)){v("Please enter a valid domain name"),b(!1);return}if(!C(o)){v("DKIM selector must contain only letters, numbers, and hyphens"),b(!1);return}try{await t({name:l,dkimSelector:o,dkim:null,spf:null,dmarc:null,dismissedAdvisories:null,espId:c||null}),s()}catch(e){console.error("Failed to add domain:",e),v(e instanceof Error?e.message:"Failed to add domain")}finally{b(!1)}};return(0,a.jsx)("div",{className:"fixed inset-0 bg-midnight-navy/30 backdrop-blur-sm z-50",children:(0,a.jsx)("div",{className:"flex min-h-full items-center justify-center p-4",children:(0,a.jsxs)("div",{className:"card w-full max-w-md",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between p-6 border-b border-soft-grey",children:[(0,a.jsx)("h2",{className:"text-xl font-semibold text-midnight-navy",children:"Add Domain"}),(0,a.jsx)("button",{onClick:s,className:"p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200",children:(0,a.jsx)(N.Z,{className:"w-5 h-5"})})]}),(0,a.jsxs)("form",{onSubmit:E,className:"p-6 space-y-6",children:[g&&(0,a.jsx)("div",{className:"p-4 rounded-xl bg-red-50 border border-red-200 text-red-600",children:(0,a.jsx)("p",{className:"text-sm",children:g})}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"domain",className:"block text-sm font-medium text-deep-teal",children:"Domain Name"}),(0,a.jsx)("input",{type:"text",id:"domain",value:l,onChange:e=>n(e.target.value.toLowerCase()),placeholder:"example.com",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50",required:!0}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"Enter the domain name without protocols or paths"})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"selector",className:"block text-sm font-medium text-deep-teal",children:"DKIM Selector"}),(0,a.jsx)("input",{type:"text",id:"selector",value:o,onChange:e=>d(e.target.value.toLowerCase()),placeholder:"default",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50",required:!0}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"The selector used in your DKIM record (e.g., default, google, etc.)"})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"esp",className:"block text-sm font-medium text-deep-teal",children:"Email Service Provider (ESP)"}),f?(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)("input",{type:"text",value:x,onChange:e=>p(e.target.value),placeholder:"Enter ESP name",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"}),(0,a.jsx)("button",{type:"button",onClick:S,className:"mt-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors duration-200",children:"Add"}),(0,a.jsx)("button",{type:"button",onClick:()=>{y(!1),p("")},className:"mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200",children:(0,a.jsx)(N.Z,{className:"w-5 h-5"})})]}):(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsxs)("select",{id:"esp",value:c,onChange:e=>m(e.target.value),className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200",children:[(0,a.jsx)("option",{value:"",children:"Select ESP"}),h.map(e=>(0,a.jsx)("option",{value:e.id,children:e.name},e.id))]}),(0,a.jsx)("button",{type:"button",onClick:()=>y(!0),className:"mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200",title:"Add new ESP",children:(0,a.jsx)(i.Z,{className:"w-5 h-5"})})]}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"Select or add the ESP associated with this domain"})]}),(0,a.jsxs)("div",{className:"flex justify-end gap-3 pt-2",children:[(0,a.jsx)("button",{type:"button",onClick:s,className:"btn-secondary",children:"Cancel"}),(0,a.jsx)("button",{type:"submit",disabled:j,className:"btn-primary",children:j?"Adding...":"Add Domain"})]})]})]})})})}function w(e){let{domain:t,onEdit:s,onClose:l}=e,[n,o]=(0,r.useState)(t.name),[d,c]=(0,r.useState)(t.dkimSelector),[m,h]=(0,r.useState)(t.espId||""),[u,x]=(0,r.useState)([]),[p,f]=(0,r.useState)(""),[y,j]=(0,r.useState)(!1),[b,g]=(0,r.useState)(!1),[v,w]=(0,r.useState)(null);(0,r.useEffect)(()=>{S()},[]);let S=async()=>{try{let e=await fetch("/api/esps");if(!e.ok)throw Error("Failed to fetch ESPs");let t=await e.json();x(t)}catch(e){console.error("Error fetching ESPs:",e),w("Failed to load ESP list")}},k=async()=>{if(!p.trim()){w("ESP name is required");return}try{let e=await fetch("/api/esps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:p.trim()})});if(!e.ok)throw Error("Failed to create ESP");let t=await e.json();x([...u,t]),h(t.id),f(""),j(!1),w(null)}catch(e){console.error("Error creating ESP:",e),w("Failed to create new ESP")}},C=e=>/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(e),E=e=>/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(e),P=async e=>{if(e.preventDefault(),g(!0),w(null),!C(n)){w("Please enter a valid domain name"),g(!1);return}if(!E(d)){w("DKIM selector must contain only letters, numbers, and hyphens"),g(!1);return}try{await s(t.id,{name:n,dkimSelector:d,espId:m||null}),l()}catch(e){console.error("Failed to edit domain:",e),w(e instanceof Error?e.message:"Failed to edit domain")}finally{g(!1)}};return(0,a.jsx)("div",{className:"fixed inset-0 bg-midnight-navy/30 backdrop-blur-sm z-50",children:(0,a.jsx)("div",{className:"flex min-h-full items-center justify-center p-4",children:(0,a.jsxs)("div",{className:"card w-full max-w-md",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between p-6 border-b border-soft-grey",children:[(0,a.jsx)("h2",{className:"text-xl font-semibold text-midnight-navy",children:"Edit Domain"}),(0,a.jsx)("button",{onClick:l,className:"p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200",children:(0,a.jsx)(N.Z,{className:"w-5 h-5"})})]}),(0,a.jsxs)("form",{onSubmit:P,className:"p-6 space-y-6",children:[v&&(0,a.jsx)("div",{className:"p-4 rounded-xl bg-red-50 border border-red-200 text-red-600",children:(0,a.jsx)("p",{className:"text-sm",children:v})}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"domain",className:"block text-sm font-medium text-deep-teal",children:"Domain Name"}),(0,a.jsx)("input",{type:"text",id:"domain",value:n,onChange:e=>o(e.target.value.toLowerCase()),placeholder:"example.com",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50",required:!0}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"Enter the domain name without protocols or paths"})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"selector",className:"block text-sm font-medium text-deep-teal",children:"DKIM Selector"}),(0,a.jsx)("input",{type:"text",id:"selector",value:d,onChange:e=>c(e.target.value.toLowerCase()),placeholder:"default",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50",required:!0}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"The selector used in your DKIM record (e.g., default, google, etc.)"})]}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("label",{htmlFor:"esp",className:"block text-sm font-medium text-deep-teal",children:"Email Service Provider (ESP)"}),y?(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)("input",{type:"text",value:p,onChange:e=>f(e.target.value),placeholder:"Enter ESP name",className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"}),(0,a.jsx)("button",{type:"button",onClick:k,className:"mt-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors duration-200",children:"Add"}),(0,a.jsx)("button",{type:"button",onClick:()=>{j(!1),f("")},className:"mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200",children:(0,a.jsx)(N.Z,{className:"w-5 h-5"})})]}):(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsxs)("select",{id:"esp",value:m,onChange:e=>h(e.target.value),className:"mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200",children:[(0,a.jsx)("option",{value:"",children:"Select ESP"}),u.map(e=>(0,a.jsx)("option",{value:e.id,children:e.name},e.id))]}),(0,a.jsx)("button",{type:"button",onClick:()=>j(!0),className:"mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200",title:"Add new ESP",children:(0,a.jsx)(i.Z,{className:"w-5 h-5"})})]}),(0,a.jsx)("p",{className:"text-sm text-deep-teal",children:"Select or add the ESP associated with this domain"})]}),(0,a.jsxs)("div",{className:"flex justify-end gap-3 pt-2",children:[(0,a.jsx)("button",{type:"button",onClick:l,className:"btn-secondary",children:"Cancel"}),(0,a.jsx)("button",{type:"submit",disabled:b,className:"btn-primary",children:b?"Saving...":"Save Changes"})]})]})]})})})}var S=s(2685),k=s(5681);function C(e){let{searchQuery:t,onSearchChange:s,sortOption:r,onSortChange:i}=e;return(0,a.jsxs)("div",{className:"flex flex-col md:flex-row gap-4 mb-6",children:[(0,a.jsxs)("div",{className:"relative flex-grow",children:[(0,a.jsx)("div",{className:"pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",children:(0,a.jsx)(S.Z,{className:"h-5 w-5 text-deep-teal","aria-hidden":"true"})}),(0,a.jsx)("input",{type:"text",name:"search",id:"search",value:t,onChange:e=>s(e.target.value),className:"block w-full rounded-xl border-soft-grey pl-10 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50",placeholder:"Search domains..."})]}),(0,a.jsxs)("div",{className:"relative min-w-[200px]",children:[(0,a.jsx)("div",{className:"pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",children:(0,a.jsx)(k.Z,{className:"h-5 w-5 text-deep-teal","aria-hidden":"true"})}),(0,a.jsxs)("select",{value:r,onChange:e=>i(e.target.value),className:"block w-full rounded-xl border-soft-grey pl-10 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 appearance-none bg-white pr-8 text-deep-teal",children:[(0,a.jsx)("option",{value:"name-asc",children:"Name (A-Z)"}),(0,a.jsx)("option",{value:"name-desc",children:"Name (Z-A)"}),(0,a.jsx)("option",{value:"date-asc",children:"Last Checked (Oldest)"}),(0,a.jsx)("option",{value:"date-desc",children:"Last Checked (Newest)"})]}),(0,a.jsx)("div",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3",children:(0,a.jsx)("svg",{className:"h-5 w-5 text-deep-teal",viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":"true",children:(0,a.jsx)("path",{fillRule:"evenodd",d:"M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z",clipRule:"evenodd"})})})]})]})}function E(){let[e,t]=(0,r.useState)([]),[s,n]=(0,r.useState)(!0),[o,d]=(0,r.useState)(null),[c,m]=(0,r.useState)(!1),[h,u]=(0,r.useState)(null),[x,p]=(0,r.useState)(""),[f,y]=(0,r.useState)("name-asc"),j=async()=>{try{let e=await fetch("/api/domains"),s=await e.json();if(!e.ok)throw Error(s.error||"Failed to fetch domains");t(s)}catch(e){console.error("Failed to fetch domains:",e),d(e instanceof Error?e.message:"Failed to fetch domains")}finally{n(!1)}};(0,r.useEffect)(()=>{j()},[]);let b=async e=>{let t=await fetch("/api/domains",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),s=await t.json();if(!t.ok)throw Error(s.error||"Failed to add domain");await j()},N=async(e,t)=>{let s=await fetch("/api/domains/".concat(e),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),a=await s.json();if(!s.ok)throw Error(a.error||"Failed to update domain");await j()},S=async e=>{try{let t=await fetch("/api/domains/".concat(e),{method:"DELETE"}),s=await t.json();if(!t.ok)throw Error(s.error||"Failed to delete domain");await j()}catch(e){console.error("Failed to delete domain:",e),d(e instanceof Error?e.message:"Failed to delete domain")}},k=async e=>{try{let t=await fetch("/api/domains/".concat(e),{method:"PUT"}),s=await t.json();if(!t.ok)throw Error(s.error||"Failed to refresh domain");await j()}catch(e){throw console.error("Failed to refresh domain:",e),e}},E=[...e.filter(e=>e.name.toLowerCase().includes(x.toLowerCase()))].sort((e,t)=>{switch(f){case"name-asc":return e.name.localeCompare(t.name);case"name-desc":return t.name.localeCompare(e.name);case"date-asc":return new Date(e.lastChecked).getTime()-new Date(t.lastChecked).getTime();case"date-desc":return new Date(t.lastChecked).getTime()-new Date(e.lastChecked).getTime();default:return 0}});return(0,a.jsxs)("div",{className:"space-y-6",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between gap-4",children:[(0,a.jsxs)("button",{type:"button",onClick:()=>m(!0),className:"btn-primary inline-flex items-center gap-2",children:[(0,a.jsx)(i.Z,{className:"w-5 h-5"}),"Add Domain"]}),(0,a.jsxs)("button",{type:"button",onClick:()=>j(),disabled:s,className:"btn-secondary inline-flex items-center gap-2",title:"Refresh all domains",children:[(0,a.jsx)(l.Z,{className:"w-5 h-5 ".concat(s?"animate-spin":"")}),"Refresh All"]})]}),(0,a.jsx)(C,{searchQuery:x,onSearchChange:p,sortOption:f,onSortChange:y}),(0,a.jsxs)("div",{children:[o&&(0,a.jsx)("div",{className:"p-4 rounded-xl bg-red-50 border border-red-200 mb-4",children:(0,a.jsx)("p",{className:"text-sm text-red-600",children:o})}),s?(0,a.jsxs)("div",{className:"text-center py-12",children:[(0,a.jsx)(l.Z,{className:"w-8 h-8 animate-spin mx-auto text-primary"}),(0,a.jsx)("p",{className:"mt-2 text-deep-teal",children:"Loading domains..."})]}):0===E.length?(0,a.jsxs)("div",{className:"section-highlight text-center p-12",children:[(0,a.jsx)("h2",{className:"text-xl font-medium text-white mb-2",children:"No domains found"}),(0,a.jsx)("p",{className:"text-ice-white/80",children:x?"Try adjusting your search query":"Add your first domain to get started"})]}):(0,a.jsx)("div",{className:"space-y-4",children:E.map(t=>(0,a.jsx)(g,{domain:t,onRefresh:k,onDelete:S,onEdit:t=>u(e.find(e=>e.id===t)||null)},t.id))})]}),c&&(0,a.jsx)(v,{onAdd:b,onClose:()=>m(!1)}),h&&(0,a.jsx)(w,{domain:h,onEdit:N,onClose:()=>u(null)})]})}}},function(e){e.O(0,[599,971,69,744],function(){return e(e.s=8921)}),_N_E=e.O()}]);