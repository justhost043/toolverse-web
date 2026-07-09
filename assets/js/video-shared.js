
let ffmpeg=null,fetchFile=null;
async function getFFmpeg(onLog){
  if(ffmpeg)return ffmpeg;
  showStatus("Loading FFmpeg engine... (~30MB first load, cached after)");
  showProg(5);
  const ff=await import("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js");
  const ut=await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js");
  fetchFile=ut.fetchFile;
  const toBlobURL=ut.toBlobURL;
  ffmpeg=new ff.FFmpeg();
  if(onLog)ffmpeg.on("log",onLog);
  ffmpeg.on("progress",(p)=>showProg(Math.round(p.progress*90)+5));
  const base="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL:await toBlobURL(base+"/ffmpeg-core.js","text/javascript"),
    wasmURL:await toBlobURL(base+"/ffmpeg-core.wasm","application/wasm"),
  });
  showStatus("FFmpeg ready!");showProg(100);
  return ffmpeg;
}
function showStatus(msg){const b=document.getElementById("status-box");if(b){b.style.display="";b.textContent=msg;}}
function showProg(pct){const w=document.getElementById("prog-wrap"),b=document.getElementById("prog-bar");if(w&&b){w.style.display="";b.style.width=pct+"%";}}
function hideProgress(){const w=document.getElementById("prog-wrap"),b=document.getElementById("status-box");if(w)w.style.display="none";if(b)b.style.display="none";}
function dlFile(data,name,mime){const blob=new Blob([data.buffer||data],{type:mime});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();}
function initDZ(dzId,fiId,onFile){
  const dz=document.getElementById(dzId),fi=document.getElementById(fiId);
  if(!dz||!fi)return;
  dz.addEventListener("click",()=>fi.click());
  dz.addEventListener("dragover",e=>{e.preventDefault();dz.classList.add("drag")});
  dz.addEventListener("dragleave",()=>dz.classList.remove("drag"));
  dz.addEventListener("drop",e=>{e.preventDefault();dz.classList.remove("drag");if(e.dataTransfer.files[0])onFile(e.dataTransfer.files[0])});
  fi.addEventListener("change",()=>{if(fi.files[0])onFile(fi.files[0])});
}
function getExt(name){return name.substring(name.lastIndexOf("."));}
