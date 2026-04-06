import { useEffect, useRef } from 'react';
import watervideo from '../../public/water-video.mp4';

function Hero() {
    const videoWrapperRef = useRef(null);
    const sectionRef = useRef(null);
    const placeholderRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        let orig = { left: 0, top: 0, width: 0, height: 0 };
        let target = { left: 0, top: 0, width: 0, height: 0 };

        const calcValues = () => {
            const placeholder = placeholderRef.current;
            const section = sectionRef.current;
            if (!placeholder || !section) return;

            const ph = placeholder.getBoundingClientRect();
            const sr = section.getBoundingClientRect();

            orig.left = ph.left - sr.left;
            orig.top = ph.top - sr.top;
            orig.width = ph.width;
            orig.height = ph.height;

            const padding = 60;
            target.left = padding;
            target.width = section.offsetWidth - padding * 2;
            target.height = window.innerHeight;
            target.top = orig.top; // expand hone ke baad yahan rahegi
        };

        const applyStyles = (left, top, width, height) => {
            const wrapper = videoWrapperRef.current;
            if (!wrapper) return;
            wrapper.style.left = left + 'px';
            wrapper.style.top = top + 'px';
            wrapper.style.width = width + 'px';
            wrapper.style.height = height + 'px';
        };

        const setInitial = () => {
            calcValues();
            applyStyles(orig.left, orig.top, orig.width, orig.height);
            const section = sectionRef.current;
            if (section) {
                const totalScroll = 700 + window.innerHeight;
                section.style.minHeight = totalScroll + 'px';
            }
        };

        const ease = (p) => p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        const lerp = (a, b, t) => a + (b - a) * t;

        const handleScroll = () => {
            const section = sectionRef.current;
            if (!section) return;

            const scrolled = -section.getBoundingClientRect().top; // total scroll in section

            const PHASE1_END = 700; // expansion distance
            const PHASE2_START = PHASE1_END;
            const PHASE2_END = PHASE2_START + target.height; // scroll upward distance

            if (scrolled <= 0) {
                applyStyles(orig.left, orig.top, orig.width, orig.height);
                return;
            }

            // Phase 1: expand down
            if (scrolled <= PHASE1_END) {
                const p = ease(scrolled / PHASE1_END);
                applyStyles(
                    lerp(orig.left, target.left, p),
                    lerp(orig.top, orig.top, p), // keep top same while expanding down
                    lerp(orig.width, target.width, p),
                    lerp(orig.height, target.height, p)
                );

                // Phase 2: move upward
            } else if (scrolled <= PHASE2_END) {
                const p = ease((scrolled - PHASE2_START) / (PHASE2_END - PHASE2_START));
                applyStyles(
                    target.left,
                    lerp(orig.top, orig.top - target.height, p), // move top up
                    target.width,
                    target.height
                );

            } else {
                // Max scroll
                applyStyles(target.left, orig.top - target.height, target.width, target.height);
            }

        };

        setInitial();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', setInitial);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', setInitial);
        };
    }, []);

    return (
        <section className="hero" ref={sectionRef}>
            <div className="hero-container">
                <h1 className="hero-title">
                    ART DIRECTION WATER BOTTLE <br />
                    <span>& VISUAL STRATEGY</span>
                </h1>
                <div className="hero-content">
                    <p className="hero-text">
                        We craft innovative visual solutions and strategic concepts for brands.
                        Combining creativity and precision, we bring products to life with style and impact.
                    </p>
                    <div className="hero-video-placeholder" ref={placeholderRef} />
                </div>
            </div>

            <div className="hero-video" ref={videoWrapperRef}>
                <video src={watervideo} autoPlay loop muted playsInline />
                <div className="play-btn">▶</div>
            </div>

            <div className="hero-bottom" ref={bottomRef}>
                <h2 className='hero-title'>Creative Direction & Branding</h2>

            </div>
        </section>
    );
}

export default Hero;