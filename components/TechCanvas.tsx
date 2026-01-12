import React, { useRef, useEffect } from 'react';

// --- Geometric Math Utils ---
const ELLIPSE_CONSTANT = 0.552284749831;

class Vector2D {
    constructor(public x: number, public y: number) {}
}

class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    radius: number;
    opacity: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.width = 20 + Math.random() * 40;
        this.height = 10 + Math.random() * 20;
        this.radius = 4 + Math.random() * 4;
        this.opacity = 0.1 + Math.random() * 0.3;
    }

    update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const p = new Vector2D(this.x, this.y);
        const s = new Vector2D(this.width, this.height);
        
        ctx.beginPath();
        drawRoundedRect(ctx, p, s, this.radius);
        ctx.strokeStyle = `rgba(65, 105, 225, ${this.opacity})`;
        ctx.stroke();
        ctx.fillStyle = `rgba(65, 105, 225, ${this.opacity * 0.5})`;
        ctx.fill();
    }
}

/**
 * Custom rectangle function adapted for Canvas Path2D/ctx
 * Implements the Bezier logic provided by the user
 */
function drawRoundedRect(ctx: CanvasRenderingContext2D, p: Vector2D, s: Vector2D, r: number) {
    let left: number = p.x - s.x / 2;
    let right: number = p.x + s.x / 2;
    let top: number = p.y - s.y / 2;
    let bottom: number = p.y + s.y / 2;

    if (r <= 0) {
        ctx.rect(left, top, s.x, s.y);
    } else {
        let rounded: number = Math.min(s.x / 2, s.y / 2, r);
        let tangent: number = rounded * ELLIPSE_CONSTANT;

        // Top-right corner start
        ctx.moveTo(right, top + rounded);
        // Right side
        ctx.lineTo(right, bottom - rounded);
        // Bottom-right corner
        ctx.bezierCurveTo(right, bottom - rounded + tangent, right - rounded + tangent, bottom, right - rounded, bottom);
        // Bottom side
        ctx.lineTo(left + rounded, bottom);
        // Bottom-left corner
        ctx.bezierCurveTo(left + rounded - tangent, bottom, left, bottom - rounded + tangent, left, bottom - rounded);
        // Left side
        ctx.lineTo(left, top + rounded);
        // Top-left corner
        ctx.bezierCurveTo(left, top + rounded - tangent, left + rounded - tangent, top, left + rounded, top);
        // Top side
        ctx.lineTo(right - rounded, top);
        // Close with top-right corner
        ctx.bezierCurveTo(right - rounded + tangent, top, right, top + rounded - tangent, right, top + rounded);
    }
    ctx.closePath();
}

const TechCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.parentElement?.clientWidth || 800;
            canvas.height = canvas.parentElement?.clientHeight || 600;
            
            // Re-init particles on significant resize
            particles.current = Array.from({ length: 15 }).map(() => new Particle(canvas.width, canvas.height));
        };

        resize();
        window.addEventListener('resize', resize);

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.current.forEach(p => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-60"
        />
    );
};

export default TechCanvas;