'use strict';
const $ = (id) => document.getElementById(id);
const computer = $('computer');
const world = $('world');
const radio = $('radio');
const commandHistory = [];
let historyIndex = 0;

function placeRoom() {
  const width = innerWidth, height = innerHeight;
  let scale = Math.max(width / 1672, height / 941);
  let x = (width - 1672 * scale) / 2;
  let y = (height - 941 * scale) / 2;
  if (width < 700) x = Math.min(0, Math.max(width - 1672 * scale, width * .48 - 510 * scale));
  world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
}
function openComputer() {
  $('command').focus({preventScroll:true});
  scrollTerminal();
  startComputerAudio();
}
function closeComputer() { $('command').blur(); }
computer.addEventListener('click', event => {
  if (!window.getSelection()?.toString()) { $('command').focus({preventScroll:true}); startComputerAudio(); }
});
document.addEventListener('pointerdown', event => {
  if (!computer.contains(event.target)) closeComputer();
});
computer.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeComputer(); }
});
addEventListener('resize', placeRoom);
placeRoom();

function updateRadioState() {
  document.body.classList.toggle('music-playing', !radio.paused && !radio.error);
}

function startRadio() {
  if (!radio.paused) return;
  const play = radio.play();
  if (play) play.catch(updateRadioState);
}
radio.volume = .55;
radio.addEventListener('playing', updateRadioState);
radio.addEventListener('pause', updateRadioState);
radio.addEventListener('error', updateRadioState);
// Try on arrival, then retry inside a real gesture when autoplay is blocked.
for (const event of ['pointerdown', 'click', 'keydown']) document.addEventListener(event, startRadio, { capture: true, passive: true });
startRadio();

let fxContext, humGain, keyBuffer;
function startComputerAudio() {
  try {
    if (!fxContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      fxContext = new AudioContextClass();
      humGain = fxContext.createGain();
      humGain.gain.value = .0025;
      humGain.connect(fxContext.destination);
      for (const frequency of [60,120]) {
        const hum = fxContext.createOscillator();
        hum.type = 'sine'; hum.frequency.value = frequency;
        hum.connect(humGain); hum.start();
      }
      keyBuffer = fxContext.createBuffer(1, Math.floor(fxContext.sampleRate*.045), fxContext.sampleRate);
      const data = keyBuffer.getChannelData(0);
      for(let i=0;i<data.length;i++) {
        const t=i/fxContext.sampleRate;
        data[i]=(Math.random()*2-1)*Math.exp(-t*105)*.7 + Math.sin(2*Math.PI*175*t)*Math.exp(-t*150)*.3;
      }
    }
    if (fxContext.state === 'suspended') void fxContext.resume().catch(()=>{});
    humGain.gain.setTargetAtTime(computer.contains(document.activeElement) ? .005 : .0025, fxContext.currentTime, .3);
  } catch { /* Browsers without Web Audio retain the terminal. */ }
}
function typeSound() {
  startComputerAudio();
  if (fxContext?.state !== 'running' || !keyBuffer) return;
  const click = fxContext.createBufferSource(), gain = fxContext.createGain();
  click.buffer = keyBuffer; click.playbackRate.value = .85 + Math.random()*.3;
  gain.gain.value = .045;
  click.connect(gain); gain.connect(fxContext.destination); click.start();
  click.onended=()=>{click.disconnect();gain.disconnect();};
}
for (const event of ['pointerdown','keydown']) document.addEventListener(event,startComputerAudio,{capture:true,passive:true});
computer.addEventListener('keydown',event=>{
  if(!event.metaKey && !event.ctrlKey && !event.altKey && ['Enter','Tab'].includes(event.key)) typeSound();
});
computer.addEventListener('click',event=>{const button=event.target.closest('button');if(button)typeSound();});
$('command').addEventListener('input',typeSound);
computer.addEventListener('focusin',startComputerAudio);
computer.addEventListener('focusout',startComputerAudio);
startComputerAudio();

function printTerminal(text, echo = false) {
  const line = document.createElement('p'); line.textContent = text;
  if (echo) line.className = 'echo';
  $('terminal-output').append(line);
  while ($('terminal-output').childElementCount > 120) $('terminal-output').firstElementChild.remove();
  scrollTerminal();
}
function scrollTerminal() { const panel = $('terminal-app'); panel.scrollTop = panel.scrollHeight; }
function cowsay(message) {
  const text = (message || 'moo.').replace(/\s+/g,' ').trim();
  const wrapWidth=Math.max(12,Math.min(28,Math.floor((($('terminal-app').clientWidth || 222)-20)/7.2)-4));
  const lines=[];
  let line='';
  for (const word of text.split(' ')) {
    if(line && line.length+word.length+1>wrapWidth){lines.push(line);line='';}
    let rest=word;
    while(rest.length>wrapWidth){if(line){lines.push(line);line='';}lines.push(rest.slice(0,wrapWidth));rest=rest.slice(wrapWidth);}
    line+=(line?' ':'')+rest;
  }
  if(line)lines.push(line);
  if(!lines.length)lines.push('moo.');
  const width=Math.max(...lines.map(s=>s.length));
  const bubble=lines.map((s,i)=>{
    const left=lines.length===1?'<':i===0?'/':i===lines.length-1?'\\':'|';
    const right=lines.length===1?'>':i===0?'\\':i===lines.length-1?'/':'|';
    return `${left} ${s.padEnd(width)} ${right}`;
  });
  const cow = String.raw`        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||`;
  return [' '+ '_'.repeat(width+2),...bubble,' '+ '-'.repeat(width+2),cow].join('\n');
}

const USERNAME = '1vnzh';
const HOME_DIRECTORY = `/home/${USERNAME}`;
let workingDirectory = HOME_DIRECTORY;
let historyDraft = '';
const sessionStarted = Date.now();
const directories = new Set(['/', '/home', HOME_DIRECTORY]);
const files = new Map([
  [`${HOME_DIRECTORY}/readme.txt`, 'lofivan\n1vnzh\n\nTry help, north, north2, or cowsay hello.'],
  [`${HOME_DIRECTORY}/music.txt`, 'lofivan — an original 74 BPM instrumental loop.\nWarm keys, soft drums, a quiet CRT hum.\n\nMusic starts automatically. You can mute this browser tab.'],
]);
const commandNames = ['help','ls','pwd','cd','cat','echo','whoami','hostname','uname','date','uptime','history','clear','cowsay','north','north2','about','exit'];
function promptText() {
  const path = workingDirectory === HOME_DIRECTORY ? '~' : workingDirectory;
  return `${USERNAME}@lofivan:${path} $`;
}
function updatePrompt() { $('terminal-prompt').textContent = promptText(); }
function resolvePath(path = '~') {
  const expanded = path === '~' ? HOME_DIRECTORY : path.startsWith('~/') ? HOME_DIRECTORY + path.slice(1) : path;
  const parts = (expanded.startsWith('/') ? expanded : workingDirectory + '/' + expanded).split('/');
  const resolved = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  return '/' + resolved.join('/');
}
function splitCommand(raw) {
  const tokens = [];
  let token = '', quote = null, escaped = false, started = false;
  for (const ch of raw) {
    if (escaped) { token += ch; escaped = false; started = true; continue; }
    if (ch === '\\' && quote !== "'") { escaped = true; started = true; continue; }
    if (quote) { if (ch === quote) quote = null; else token += ch; started = true; continue; }
    if (ch === '"' || ch === "'") { quote = ch; started = true; continue; }
    if (/\s/.test(ch)) { if (started) { tokens.push(token); token = ''; started = false; } }
    else { token += ch; started = true; }
  }
  if (quote) throw new Error('Unclosed quote.');
  if (escaped) token += '\\';
  if (started) tokens.push(token);
  return tokens;
}
function runCommand(raw) {
  if (typeof raw !== 'string' || raw.length > 500) throw new Error('Enter a command of up to 500 characters.');
  if (!raw.trim()) return { output: '' };
  printTerminal(`${promptText()} ${raw}`, true);
  commandHistory.push(raw);
  if (commandHistory.length > 200) commandHistory.shift();
  historyIndex = commandHistory.length;
  historyDraft = '';
  let tokens;
  try { tokens = splitCommand(raw); }
  catch (error) { printTerminal(error.message); return { error: error.message }; }
  const [name, ...args] = tokens;
  let output = '';
  switch (name.toLowerCase()) {
    case 'help':
      output = commandNames.join('  ');
      break;
    case 'north': output = 'strong and free'; break;
    case 'north2': output = 'coming soon'; break;
    case 'cowsay': output = cowsay(args.join(' ')); break;
    case 'whoami': output = USERNAME; break;
    case 'hostname': output = 'lofivan'; break;
    case 'uname': output = 'lofivan'; break;
    case 'pwd': output = workingDirectory; break;
    case 'echo': output = args.map(s => s.replace(/\$(USER|HOME|PWD)\b/g, (_,key) => ({USER:USERNAME,HOME:HOME_DIRECTORY,PWD:workingDirectory})[key])).join(' '); break;
    case 'date': output = new Date().toLocaleString([], {dateStyle:'full',timeStyle:'short'}); break;
    case 'uptime': {
      const seconds = Math.floor((Date.now()-sessionStarted)/1000);
      output = `up ${Math.floor(seconds/60)}m ${seconds%60}s`; break;
    }
    case 'ls': {
      const paths = args.filter(arg => !['-a','-l','-la','-al'].includes(arg));
      const unsupported = args.find(arg => arg.startsWith('-') && !['-a','-l','-la','-al'].includes(arg));
      if (unsupported) { output = `ls: unsupported option: ${unsupported}`; break; }
      if (paths.length > 1) { output = 'usage: ls [path]'; break; }
      const path = resolvePath(paths[0] || '.');
      if (files.has(path)) { output = path.split('/').pop(); break; }
      if (!directories.has(path)) { output = `ls: ${paths[0]}: No such directory`; break; }
      const prefix = path === '/' ? '/' : path + '/';
      const children = [...directories,...files.keys()].filter(p => p.startsWith(prefix) && p !== path && !p.slice(prefix.length).includes('/'));
      const names = children.map(p => p.slice(prefix.length)+(directories.has(p)?'/':''));
      if (args.some(a=>['-a','-la','-al'].includes(a))) names.unshift('./','../');
      output = names.sort().join(args.some(a=>['-l','-la','-al'].includes(a))?'\n':'  '); break;
    }
    case 'cd': {
      if (args.length > 1) { output = 'usage: cd [path]'; break; }
      const path = resolvePath(args[0] || '~');
      if (!directories.has(path)) output = `cd: ${args[0]}: ${files.has(path)?'Not a directory':'No such directory'}`;
      else { workingDirectory = path; updatePrompt(); }
      break;
    }
    case 'cat':
      output = args.length ? args.map(path => {const resolved=resolvePath(path);return files.get(resolved) ?? `cat: ${path}: ${directories.has(resolved)?'Is a directory':'No such file'}`;}).join('\n\n') : 'usage: cat <file>';
      break;
    case 'history': output = commandHistory.map((line,index)=>`${String(index+1).padStart(3)}  ${line}`).join('\n'); break;
    // Deliberately omitted from help and tab completion.
    case 'sudo': output = 'permission denied.\ntry asking nicely.'; break;
    case 'coffee':
      output = String.raw`   ( (  )
    ) )(
  .------.
  |      |]
  \______/

HTTP 418. wrong appliance.`;
      break;
    case 'sl':
      output = String.raw`      ~ ~ ~
    __|_|___
   |  []   |__
   |_______|__|
    O-O-O  O-O

you missed the ls train.`;
      break;
    case 'fortune': {
      const fortunes = [
        'Your code will work.\nYou will not know why.',
        'There is no cloud.\nJust a very small Spark.',
        'A watched build\nnever compiles.',
        'The bug was a feature.\nThe feature was a typo.',
        'Touch grass.\nPermission denied.'
      ];
      output = fortunes[Math.floor(Math.random() * fortunes.length)];
      break;
    }
    case 'xyzzy': output = 'Nothing happens.\nThe plants look impressed.'; break;
    case 'about': window.open('https://twitter.com/1vnzh','_blank','noopener,noreferrer'); break;
    case 'clear': $('terminal-output').replaceChildren(); break;
    case 'exit': closeComputer(); break;
    default: output = `${name}: command not found\nType help for commands.`;
  }
  if (output) printTerminal(output);
  return { output, directory: workingDirectory };
}
updatePrompt();
$('terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const raw = $('command').value;
  $('command').value = '';
  runCommand(raw);
});
$('command').addEventListener('keydown', event => {
  if (event.key === 'Tab' && !event.shiftKey && !/\s/.test($('command').value) && $('command').value) {
    const matches = commandNames.filter(command=>command.startsWith($('command').value.toLowerCase()));
    if (matches.length) {
      event.preventDefault();
      if (matches.length === 1) $('command').value = matches[0]+' ';
      else printTerminal(matches.join('  '));
    }
    return;
  }
  if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); $('terminal-output').replaceChildren(); return; }
  if (event.ctrlKey && event.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
    event.preventDefault(); printTerminal(`${promptText()} ${$('command').value}^C`,true); $('command').value=''; historyIndex=commandHistory.length; return;
  }
  if (!['ArrowUp','ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  if (historyIndex===commandHistory.length) historyDraft=$('command').value;
  historyIndex=Math.max(0,Math.min(commandHistory.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
  $('command').value=historyIndex===commandHistory.length?historyDraft:commandHistory[historyIndex];
});

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name:'run_terminal_command',title:'Run terminal command',
      description:'Focus the lofivan terminal and run a supported command such as help, ls, cowsay, north, or north2. Updates the visible terminal history. The about command opens https://twitter.com/1vnzh in a new tab.',
      inputSchema:{type:'object',properties:{command:{type:'string',minLength:1,maxLength:500}},required:['command'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:true},
      execute(input){
        if(!input || typeof input.command!=='string' || !input.command.trim() || input.command.length>500) throw new Error('Enter a command of 1–500 characters.');
        openComputer();return runCommand(input.command);
      }
    },{signal:lifecycle.signal})).catch(()=>{});
  } catch {}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

if (matchMedia('(pointer: fine)').matches) requestAnimationFrame(openComputer);
