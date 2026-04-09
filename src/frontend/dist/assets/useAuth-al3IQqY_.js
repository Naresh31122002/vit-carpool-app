import{r as s}from"./router-_3jHSKuE.js";import{u as h}from"./index-Cwi5fxhF.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),m=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,r,o)=>o?o.toUpperCase():r.toLowerCase()),l=e=>{const t=m(e);return t.charAt(0).toUpperCase()+t.slice(1)},u=(...e)=>e.filter((t,r,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===r).join(" ").trim(),C=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var w={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=s.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:i="",children:n,iconNode:c,...a},d)=>s.createElement("svg",{ref:d,...w,width:t,height:t,stroke:e,strokeWidth:o?Number(r)*24/Number(t):r,className:u("lucide",i),...!n&&!C(a)&&{"aria-hidden":"true"},...a},[...c.map(([g,p])=>s.createElement(g,p)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=(e,t)=>{const r=s.forwardRef(({className:o,...i},n)=>s.createElement(y,{ref:n,iconNode:t,className:u(`lucide-${f(l(e))}`,`lucide-${e}`,o),...i}));return r.displayName=l(e),r};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",key:"5owen"}],["circle",{cx:"7",cy:"17",r:"2",key:"u2ysq9"}],["path",{d:"M9 17h6",key:"r8uit2"}],["circle",{cx:"17",cy:"17",r:"2",key:"axvx0g"}]],I=x("car",A);function b(){const{identity:e,login:t,clear:r,loginStatus:o,isInitializing:i}=h(),n=!!e,c=e?e.getPrincipal().toText():null;let a="unauthenticated";return i?a="initializing":o==="logging-in"?a="logging-in":o==="loginError"?a="error":n&&(a="authenticated"),{status:a,isAuthenticated:n,isInitializing:i,userId:c,login:t,logout:r}}export{I as C,x as c,b as u};
