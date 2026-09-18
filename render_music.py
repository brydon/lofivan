"""Render an original seamless 74 BPM instrumental loop for the room."""
from pathlib import Path
import wave
import numpy as np

RATE = 24000
BEAT = 60 / 74
LENGTH = BEAT * 64
rng = np.random.default_rng(7284)
mix = np.zeros((round(LENGTH * RATE), 2), dtype=np.float64)

def add(samples, start, pan=0):
    indices = (round(start * RATE) + np.arange(len(samples))) % len(mix)
    mix[indices, 0] += samples * np.sqrt((1 - pan) / 2)
    mix[indices, 1] += samples * np.sqrt((1 + pan) / 2)

def pitch(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def keys(midi, start, length, gain=.12, pan=0):
    t = np.arange(round(length * RATE)) / RATE
    f = pitch(midi)
    envelope = (1 - np.exp(-t * 100)) * np.exp(-t * 1.6) * np.minimum(1, (length-t) / .24)
    fm = .6 * np.sin(2*np.pi*f*2*t) * np.exp(-t*3)
    sound = (np.sin(2*np.pi*f*t + fm) + .17*np.sin(2*np.pi*f*2.002*t))
    sound *= envelope * gain * (.95 + .05*np.sin(2*np.pi*4.1*t))
    add(sound, start, pan)
    add(sound*.15, start+BEAT*.75, -pan)
    add(sound*.055, start+BEAT*1.5, pan)

chords = [[50,57,60,64,69], [43,55,59,64,69], [48,55,59,62,67], [41,53,57,60,64]]
for bar in range(16):
    start = bar * BEAT * 4
    chord = chords[(bar//2) % 4]
    for j, note in enumerate(chord):
        keys(note, start + j*.009, BEAT*3.5, .075 if j else .06, (j-2)*.19)
        if bar % 2:
            keys(note, start+BEAT*2.55+j*.008, BEAT*1.45, .038, (2-j)*.17)
    for beat in [0, 2.5]:
        t = np.arange(round(BEAT*1.35*RATE))/RATE
        env = (1-np.exp(-t*70))*np.exp(-t*3)*np.minimum(1,(t[-1]-t)/.12)
        add((np.sin(2*np.pi*pitch(chord[0]-12)*t)+.12*np.sin(4*np.pi*pitch(chord[0]-12)*t))*env*.22,start+beat*BEAT)
    for beat in [0, 1.75, 2.5]:
        t = np.arange(round(.26*RATE))/RATE
        phase = 2*np.pi*(46*t+39*.03*(1-np.exp(-t/.03)))
        add(np.sin(phase)*np.exp(-t*18)*.35,start+beat*BEAT)
    for beat in [1,3]:
        t = np.arange(round(.15*RATE))/RATE
        noise = rng.normal(0,.6,len(t))
        noise = np.convolve(noise,np.ones(6)/6,mode='same')
        snare = noise*np.exp(-t*32)*.18 + np.sin(2*np.pi*185*t)*np.exp(-t*48)*.055
        add(snare,start+beat*BEAT+.018,.12)
    for eighth in range(8):
        t = np.arange(round(.055*RATE))/RATE
        noise = rng.normal(0,.5,len(t)); noise = np.diff(noise, prepend=0)
        add(noise*np.exp(-t*80)*(.018 if eighth%2 else .025),start+eighth*.5*BEAT+(BEAT*.065 if eighth%2 else 0),-.2)
    if bar in [1,3,5,7,9,11,13,15]:
        for j,note in enumerate([chord[-1]+12,chord[-2]+12,chord[-1]+7]):
            keys(note,start+BEAT*(.5+j),BEAT*1.7,.025,.25)

# A very quiet warm floor and gentle saturation keep the loop soft.
noise = rng.normal(0, .0006, len(mix))
mix += noise[:,None]
mix = np.tanh(mix*1.25)
mix *= .72 / max(.72, np.max(np.abs(mix)))
path = Path(__file__).parent / 'dist/assets/afternoon-loop.wav'
with wave.open(str(path),'wb') as out:
    out.setnchannels(2); out.setsampwidth(2); out.setframerate(RATE)
    out.writeframes((mix*32767).astype('<i2').tobytes())
print(f'Rendered {LENGTH:.2f}s loop; peak={np.max(np.abs(mix)):.3f}; rms={np.sqrt(np.mean(mix**2)):.3f}')
