export function dailySolar(hour:number,latitude:number){
 const h=((hour%24)+24)%24,rad=Math.PI/180;
 const cosine=Math.cos(latitude*rad)*Math.cos((h-12)*Math.PI/12);
 const altitude=Math.asin(Math.max(-1,Math.min(1,cosine)))/rad;
 const state=Math.abs(altitude)<.001?(h<12?'日出':'日落'):altitude>0?'白天':'黑夜';
 return {hour:h,altitude,cosine,state,intensity:Math.max(0,cosine)*100};
}
export function timeLabel(hour:number){
 const minutes=Math.round((((hour%24)+24)%24)*60)%1440;
 return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
