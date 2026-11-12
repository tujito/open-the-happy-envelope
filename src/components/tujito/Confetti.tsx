const COLORS = ["bg-primary", "bg-accent", "bg-blush", "bg-peach"];

// Fixed positions so server and browser render the same thing.
const PIECES = Array.from({ length: 28 }).map((_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 140 + ((i * 37) % 120);
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist * 0.8 + 120),
    rot: ((i * 97) % 540) - 270,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
    delay: (i % 7) * 0.04,
  };
});

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 z-10 size-0">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`absolute block animate-confetti ${p.color} ${p.round ? "size-3 rounded-full" : "h-4 w-2 rounded-sm"}`}
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
