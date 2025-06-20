// Main script for Oak booster reveal mini-site
const scene = document.getElementById("scene");
const dlg   = document.getElementById("dialogue");
const next  = document.getElementById("next");
const alarmImg = document.getElementById("alarm"); // NEW
const oakSprite = document.getElementById("oakSprite"); // NEW
const popup = document.getElementById("popup");     // NEW
const rareOverlay=document.getElementById("rareOverlay"); // NEW
// NEW — soundtrack elements
const introSound  = document.getElementById("introSound");
const rocketSound = document.getElementById("rocketSound");
const packSound   = document.getElementById("packSound");
const outroSound  = document.getElementById("outroSound"); // NEW

// Keep reference to whichever background track is currently playing (mp3s)
let currentTrack = null;

// track whether intro has already played to avoid restarting it
let introStarted = false;

// Ensure only one mp3 plays at a time
function playTrack(sound){
  // If the requested track is already the current playing one, leave it
  if(currentTrack === sound && !sound.paused){
    return;
  }
  // Stop previous track if any
  if(currentTrack){
    currentTrack.pause();
    currentTrack.currentTime = 0;
  }
  currentTrack = sound;
  sound.currentTime = 0;
  sound.play().catch(()=>{});
}

/* Sound helper (plays quietly if file missing) */
function playSound(src){
  const a = new Audio(src);
  a.play().catch(()=>{});
}

/* Dialogue & flow control */
const oakLines = [
  "Hello there! Welcome to the world of Pokémon!", // 0
  "My name is Oak…",                                // 1
  "Tonight I have something very special.",         // 2
  "Instead of a starter, pick this booster pack!",
  "Oh no! Team Rocket is here!",   // 3
];

const rocketLines = [ // NEW
  "Not this time Salim! We'll take that booster. Prepare for trouble!",
  "And make it double!",
  "To protect the world from devastation!",
  "To unite all peoples within our nation!",
  "To denounce the evils of truth and love!",
  "To extend our reach to the stars above!",
  "Daisy!",
  "Rawlii!",
  "Team Rocket blasts off at the speed of light!",
  "Surrender now, or prepare to fight!"
];

let lines = [...oakLines];
let idx   = 0;
let typing = false;
let state  = "dialogue";

function typeLine(str){
  typing = true;
  dlg.textContent = "";
  [...str].forEach((ch,i)=>setTimeout(()=>{
    dlg.textContent += ch;
    if(i===str.length-1) typing=false;
  },25*i));
}

// NEW: triple-blink alarm helper
function blinkAlarm(times = 3, cb){
  let count = 0;
  const overlay = alarmImg;
  overlay.style.display = "block";
  overlay.style.visibility = "visible";
  playTrack(rocketSound); // switch to rocket theme
  const id = setInterval(()=>{
    overlay.style.visibility =
      overlay.style.visibility === "hidden" ? "visible" : "hidden";
    if(++count === times * 2){
      clearInterval(id);
      overlay.style.display = "none";
      cb && cb();
    }
  },200);
}

function startRocket(){ // NEW
  scene.src = "assets/team_rocket_couple.png";
  oakSprite.style.display = "none"; // hide Oak
  lines = rocketLines;
  idx = 0;
  advance();
}

next.addEventListener("click",()=>{
  // Start intro theme on first user interaction (autoplay safeguard)
  if(!introStarted){
    playTrack(introSound);
    introStarted = true;
  }
  if(typing) return;
  if(state==="dialogue"){
    advance();
  }else if(state==="pack"){
    openPack();
  }
});

function advance(){
  if(idx >= lines.length){
    // finished current block
    if(scene.src.includes("team_rocket")){
      // After rocket lines, proceed to pack
      scene.src = "assets/booster_closed.png";
      state = "pack";
      dlg.textContent = "Click the pack to open!";
      next.style.display = "none";
      return;
    }
    // After Oak lines, blink alarm then trigger rocket entrance
    blinkAlarm(3, startRocket);
    return;
  }
  const current = lines[idx++];
  if(typeof current === "string"){
    typeLine(current);
  }
}

/* Pack opening */
function openPack(){
  if(state!=="pack") return; // NEW safeguard
  state = "opening";         // NEW
  // Cross-fade booster_closed → booster_open
  scene.style.transition = "opacity .4s";
  scene.style.opacity = 0;
  setTimeout(()=>{
    scene.src = "assets/booster_open.png";
    scene.style.opacity = 1;
    startPackSequence();
  },400);
  next.remove();
}

function startPackSequence(){
  // ③ cue pack soundtrack
  playTrack(packSound);
  const packRow = document.createElement("div");
  packRow.id = "pack";
  scene.after(packRow);

  const commons = ["card_common1.png","card_common2.png","card_common3.png","card_common4.png"].map(f=>`assets/${f}`);
  const rareThumb = "assets/rare_card.png";

  for(let i=0;i<5;i++){
    if(i<4){
      const img=document.createElement("img");
      img.className="card hoverable";
      img.src="assets/card_back.png";
      packRow.appendChild(img);

      img.addEventListener("click",()=>{
        if(img.dataset.flipped) return;
        img.dataset.flipped="1";
        img.classList.add("flip");
        setTimeout(()=>{img.src=commons[i];},200);
      });
    }else{
      // rare card wrapper immediately spinning
      const wrapper=document.createElement("div");
      wrapper.className="card card3d glow spin hoverable";

      const front=document.createElement("img");
      front.className="face front";
      front.src="assets/card_back.png";

      const back=document.createElement("img");
      back.className="face back";
      back.src="assets/card_back.png";

      wrapper.appendChild(front);
      wrapper.appendChild(back);
      packRow.appendChild(wrapper);

      popup.style.display="block";
      wrapper.addEventListener("click",()=>{
        if(!wrapper.dataset.revealed) revealRare(wrapper);
      });
      wrapper.addEventListener("dblclick",()=>{
        if(wrapper.dataset.revealed) showOverlay();
      });
    }
  }
}

function showOverlay(){
  rareOverlay.style.display='flex';
}

function revealRare(card){
  card.classList.remove("spin","glow");
  popup.style.display="none";
  card.dataset.revealed = "1";
  // ensure overlay can always be closed and reopened
  rareOverlay.onclick = ()=>{
    rareOverlay.style.display='none';
  };
  // Remove hover from other cards
  document.querySelectorAll('#pack .card').forEach(c=>{
    if(c!==card) c.classList.remove('hoverable');
  });
  // Replace faces with full-res image
  card.innerHTML="";
  const img=document.createElement("img");
  img.src="assets/rare_card_full.png";
  img.style.width="100%";
  img.style.height="100%";
  img.style.imageRendering="pixelated";
  card.appendChild(img);

  // Switch background music to outro, then play flip sfx
  playTrack(outroSound);
  playSound("assets/rare.wav");
}

// NEW: allow clicking the booster image itself
scene.addEventListener("click",()=>{
  if(state==="pack" && !typing){
    openPack();
  }
});

// Kick things off (dialogue only)
advance();

function playOnce(sound){
  sound.currentTime = 0;
  sound.play().catch(()=>{});
}

function stop(sound){
  sound.pause();
  sound.currentTime = 0;
} 