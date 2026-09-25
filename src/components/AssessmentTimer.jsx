import { useState, useEffect, useRef } from "react";

export default function AssessmentTimer({
  duration = 45,
  onTimeUp,
  questionKey,
  isPaused = false,
  onTogglePause,
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Reset timer whenever questionKey changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [questionKey, duration]);

  // Countdown timer loop
  useEffect(() => {
    if (isPaused) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          // Safely call onTimeUp outside the React render cycle
          setTimeout(() => {
            onTimeUpRef.current?.();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [questionKey, isPaused]);

  const percentage = Math.max(0, Math.min(100, (timeLeft / duration) * 100));

  // Determine urgency color
  const isUrgent = timeLeft <= 8;
  const isWarning = timeLeft <= 15 && !isUrgent;

  const colorClasses = isUrgent
    ? "text-rose-600 border-rose-300 bg-rose-50 animate-pulse"
    : isWarning
    ? "text-amber-600 border-amber-300 bg-amber-50"
    : "text-teal-700 border-teal-200 bg-teal-50";

  const barColor = isUrgent
    ? "bg-rose-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-teal-500";

  return (
    <div className="flex items-center gap-3">
      {/* Time Display Badge */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-colors ${colorClasses}`}
        title="Time remaining for this question"
      >
        <svg
          className={`w-3.5 h-3.5 ${isUrgent ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-20 md:w-28 bg-line/60 h-2 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Optional Pause / Resume Button */}
      {onTogglePause && (
        <button
          type="button"
          onClick={onTogglePause}
          className="text-ink-500 hover:text-ink-900 transition-colors p-1 rounded hover:bg-black/5"
          title={isPaused ? "Resume timer" : "Pause timer"}
          aria-label={isPaused ? "Resume timer" : "Pause timer"}
        >
          {isPaused ? (
            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
