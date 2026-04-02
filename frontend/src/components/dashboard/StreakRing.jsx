export default function StreakRing({ currentDays, maxDays = 40 }) {
  const radius = 85;
  const strokeWidth = 8;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  const totalSegments = maxDays;
  const gapAngle = 2; // degrees gap between segments
  const segmentAngle = (360 - totalSegments * gapAngle) / totalSegments;

  // Color based on streak
  function getColor(days) {
    if (days >= 30) return { main: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' };
    if (days >= 20) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    if (days >= 10) return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
    if (days >= 5) return { main: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)' };
    return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' };
  }

  const color = getColor(currentDays);

  // Create segments as arcs
  function createSegment(index) {
    const startAngle = index * (segmentAngle + gapAngle) - 90;
    const endAngle = startAngle + segmentAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div className="streak-ring">
      <div className="streak-ring__svg-container">
        <svg
          viewBox="0 0 200 200"
          width="200"
          height="200"
          style={{ filter: currentDays > 0 ? `drop-shadow(${color.glow})` : 'none' }}
        >
          {/* Background segments */}
          {Array.from({ length: totalSegments }, (_, i) => (
            <path
              key={`bg-${i}`}
              d={createSegment(i)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          ))}

          {/* Active segments */}
          {Array.from({ length: Math.min(currentDays, totalSegments) }, (_, i) => (
            <path
              key={`active-${i}`}
              d={createSegment(i)}
              fill="none"
              stroke={color.main}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                opacity: 0.5 + (i / totalSegments) * 0.5,
                filter: i === currentDays - 1 ? `drop-shadow(0 0 6px ${color.glow})` : 'none',
              }}
            />
          ))}
        </svg>

        <div className="streak-ring__center">
          <div
            className={`streak-ring__number ${currentDays > 0 ? 'pulse' : ''}`}
            style={{ color: currentDays > 0 ? color.main : 'var(--text-muted)' }}
          >
            {currentDays}
          </div>
          <div className="streak-ring__label">
            {currentDays === 0 ? 'Sem Combo' : currentDays === 1 ? 'Dia' : 'Dias'}
          </div>
          {currentDays > 0 && (
            <div className="streak-ring__sublabel">
              🔥 COMBO ATIVO
            </div>
          )}
        </div>
      </div>

      {/* Combo multiplier badge */}
      {currentDays > 0 && (
        <div className={`combo-badge ${currentDays >= 40 ? 'combo-badge--max' : 'combo-badge--active'}`}>
          🔥 {currentDays >= 40 ? 'COMBO MÁXIMO' : `${currentDays}/${maxDays}`}
          {currentDays >= 5 && ` • x${getMultiplier(currentDays)}`}
        </div>
      )}
    </div>
  );
}

function getMultiplier(days) {
  if (days >= 40) return '3.0';
  if (days >= 30) return '2.5';
  if (days >= 20) return '2.0';
  if (days >= 10) return '1.5';
  if (days >= 5) return '1.2';
  return '1.0';
}
