export const stops=[0,93,186,276];
export function phase(day:number){ const i=day<93?0:day<186?1:day<276?2:3; const a=[0,93,186,276,365];return (i+(day-a[i])/(a[i+1]-a[i]))*Math.PI/2; }
export function solar(day:number,lat:number){const rad=Math.PI/180; const dec=23.5*Math.sin(phase(day));const altitude=90-Math.abs(lat-dec);const p=lat*rad,d=dec*rad;const a=Math.sin(p)*Math.sin(d),b=Math.cos(p)*Math.cos(d);const q=b<1e-10?(a>1e-10?-Infinity:a< -1e-10?Infinity:0):-a/b;const daylight=q<=-1?24:q>=1?0:24*Math.acos(q)/Math.PI;return {dec,altitude,daylight,night:24-daylight,intensity:Math.max(0,Math.sin(altitude*rad))*100,incidence:90-altitude};}
export function dateLabel(day:number){const d=new Date(Date.UTC(2025,2,20+Math.floor(day)));return `${d.getUTCMonth()+1}月 ${d.getUTCDate()} 日`;}
export function season(day:number,south:boolean){return ['春季','夏季','秋季','冬季'][(Math.floor(phase(day)/(Math.PI/2))+(south?2:0))%4];}
