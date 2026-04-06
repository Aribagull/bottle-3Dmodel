import { useEffect, useRef } from 'react';

const IMAGES = [
  { src: 'https://cdn.dribbble.com/userupload/4533078/file/original-0e70b28c450c4a16e10958c7f84829ab.png?resize=1024x768&vertical=center', alt: 'Mountain' },
  { src: 'https://www.milton.in/cdn/shop/files/1_c73d4f61-b43d-47ca-a34f-86b75b79c62d.png?v=1744978040', alt: 'Forest' },
  { src: 'https://www.milton.in/cdn/shop/files/Batman1024x1024_1.png?v=1740553622', alt: 'Ocean' },
  { src: 'https://i.ebayimg.com/images/g/Z5YAAeSwNDVoqoZv/s-l400.jpg', alt: 'Valley' },
  { src: 'https://t4.ftcdn.net/jpg/09/47/49/97/360_F_947499717_9lckJhcymNhGe9Bh76cXrlcBwBy7G8BB.jpg', alt: 'Aerial' },
];


const PATHS = [
  { sx: -120, sy: -55,  ax: -52, ay: -38 },
  { sx: 15,   sy: -125, ax: 8,   ay: -56 },
  { sx: 125,  sy: -45,  ax: 54,  ay: -28 }, 
  { sx: 115,  sy: 85,   ax: 52,  ay: 44  }, 
  { sx: -25,  sy: 125,  ax: -12, ay: 56  }, 
];

const FINAL_ROT     = [-4, 2, -2, 3, -1];
const SCROLL_PER_IMG = 600; 
const LOCK_SCROLL    = 250; 
const TOTAL_SCROLL   = IMAGES.length * SCROLL_PER_IMG + LOCK_SCROLL;


function eio(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
function lerp(a, b, t) { return a + (b-a)*t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export default function ImageStack() {
  const outerRef = useRef(null);
  const imgRefs  = useRef([]);
  const labelRef = useRef(null);
  const hintRef  = useRef(null);

  useEffect(() => {
   
    const outer = outerRef.current;
    if (outer) outer.style.height = `calc(100vh + ${TOTAL_SCROLL}px)`;

    const onScroll = () => {
      if (!outer) return;
      const rect    = outer.getBoundingClientRect();
      // Kitna scroll hua outer div ke top se
      const scrolled = clamp(-rect.top, 0, TOTAL_SCROLL);

      imgRefs.current.forEach((el, i) => {
        if (!el) return;
        const p  = PATHS[i];
        const fr = FINAL_ROT[i];
        const imgStart = i * SCROLL_PER_IMG;
        const imgEnd   = imgStart + SCROLL_PER_IMG;

        let tx, ty, rot, op, sc;

        if (scrolled <= imgStart) {
         
          tx = p.sx; ty = p.sy; rot = fr*3; op = 0; sc = 0.8;

        } else {
          const raw = clamp((scrolled - imgStart) / (imgEnd - imgStart), 0, 1);

          if (raw < 0.35) {
            
            const t = eio(raw / 0.35);
            tx = lerp(p.sx, p.ax, t); ty = lerp(p.sy, p.ay, t);
            rot = lerp(fr*3, fr*1.5, t); op = lerp(0, 0.65, t); sc = lerp(0.8, 0.93, t);

          } else if (raw < 0.78) {
            // Stage 2: arc → center
            const t = eio((raw - 0.35) / 0.43);
            tx = lerp(p.ax, 0, t); ty = lerp(p.ay, 0, t);
            rot = lerp(fr*1.5, fr, t); op = lerp(0.65, 1, t); sc = lerp(0.93, 1.03, t);

          } else {

            const t  = eio((raw - 0.78) / 0.22);
            const os = Math.sin(t * Math.PI) * 2.5;
            tx  = -(os * (p.ax > 0 ? 0.25 : -0.25));
            ty  = -(os * (p.ay > 0 ? 0.25 : -0.25));
            rot = fr; op = 1; sc = lerp(1.03, 1, t);
          }
        }

        el.style.transform = `translate(${tx}vw, ${ty}vh) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity   = String(op);
      });

   
      if (labelRef.current) {
        const done = scrolled >= IMAGES.length * SCROLL_PER_IMG;
        labelRef.current.style.opacity   = done ? '1' : '0';
        labelRef.current.style.transform = `translateX(-50%) translateY(${done ? 0 : 14}px)`;
      }


      if (hintRef.current) {
        hintRef.current.style.opacity = scrolled > 40 ? '0' : '1';
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (outer) outer.style.height = `calc(100vh + ${TOTAL_SCROLL}px)`;
      onScroll();
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=Syne:wght@400;700&display=swap');

        .is-outer {
          width: 100%;
          /* height JS set karega */
        }

        .is-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          background: #0c0b09;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .is-bg-word {
          position: absolute;
          font-family: 'Syne', sans-serif;
          font-size: clamp(88px, 15vw, 196px);
          font-weight: 700;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,0.15);
          letter-spacing: -0.03em;
          user-select: none;
          pointer-events: none;
        }

        .is-frame {
          position: relative;
          width: clamp(260px, 26vw, 390px);
          height: clamp(340px, 34vw, 510px);
          z-index: 2;
        }

        .is-card {
          position: absolute;
          inset: 0;
          border-radius: 3px;
          overflow: hidden;
          will-change: transform, opacity;
          box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 32px 80px rgba(0,0,0,0.38);
        }

        .is-card:nth-child(1){z-index:1}
        .is-card:nth-child(2){z-index:2}
        .is-card:nth-child(3){z-index:3}
        .is-card:nth-child(4){z-index:4}
        .is-card:nth-child(5){z-index:5}

        .is-card img {
          width:100%; height:100%;
          object-fit:cover; display:block;
          pointer-events:none;
        }

        .is-vignette {
          position:absolute; inset:0;
          background: linear-gradient(160deg, transparent 45%, rgba(0,0,0,0.28) 100%);
        }

        .is-label {
          position: absolute;
          bottom: 13%;
          left: 50%;
          transform: translateX(-50%) translateY(14px);
          opacity: 0;
          transition: opacity 0.65s ease, transform 0.65s ease;
          z-index: 10;
          pointer-events: none;
          white-space: nowrap;
          text-align: center;
        }
        .is-label::before {
          content:'';
          display:block;
          width:1px; height:34px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.22));
          margin: 0 auto 13px;
        }
        .is-label span {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 15px;
          color: rgba(255,255,255,0.42);
          letter-spacing: 0.16em;
        }

        .is-hint {
          position: absolute;
          bottom: 34px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          z-index: 10; pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .is-hint-txt {
          font-family: 'Syne', sans-serif;
          font-size: 9px; letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
        }
        .is-hint-bar {
          width:1px; height:42px;
          background: rgba(255,255,255,0.12);
          position:relative; overflow:hidden;
        }
        .is-hint-bar::after {
          content:'';
          position:absolute; top:-100%; left:0;
          width:100%; height:100%;
          background: rgba(255,255,255,0.48);
          animation: barDrop 1.9s ease infinite;
        }
        @keyframes barDrop {
          0%   { top:-100% }
          100% { top:200%  }
        }
      `}</style>

   
      <div className="is-outer" ref={outerRef}>

       
        <div className="is-sticky">

          <div className="is-bg-word">LAYERS</div>

          <div className="is-frame">
            {IMAGES.map((img, i) => (
              <div
                key={i}
                className="is-card"
                ref={el => imgRefs.current[i] = el}
                style={{
                  transform: `translate(${PATHS[i].sx}vw, ${PATHS[i].sy}vh) rotate(${FINAL_ROT[i]*3}deg) scale(0.8)`,
                  opacity: 0,
                }}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
                <div className="is-vignette" />
              </div>
            ))}
          </div>

          <div className="is-label" ref={labelRef}>
            <span>the full collection</span>
          </div>

          <div className="is-hint" ref={hintRef}>
            <span className="is-hint-txt">scroll</span>
            <div className="is-hint-bar" />
          </div>

        </div>
      </div>
    </>
  );
}