type ProgressBarProps = {
  value: number;
  max: number;
};

/** 展示目标册已贴数量和总槽位数的进度条。 */
export function ProgressBar({ value, max }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5" aria-label={`進捗 ${value} / ${max}`}>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#eadfcd]">
        <span className="block h-full rounded-[inherit] bg-[#86a96a]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-sm font-extrabold text-[#6f604d]">
        {value} / {max}
      </span>
    </div>
  );
}
