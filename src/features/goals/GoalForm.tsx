import { useState } from "react";
import { Button } from "../../components/Button";
import { createGoalAlbum } from "./goalApi";
import { navigateTo } from "../../app/router";

type GoalFormProps = {
  userId: string;
};

const themes = [
  { value: "study", label: "学習", marker: "文" },
  { value: "fitness", label: "運動", marker: "体" },
  { value: "reading", label: "読書", marker: "本" },
  { value: "money", label: "貯金", marker: "円" },
  { value: "daily", label: "日常", marker: "日" },
  { value: "cute", label: "かわいい", marker: "花" },
];

const stepOptions = [
  { value: 7, label: "7枚", hint: "小さく始める" },
  { value: 14, label: "14枚", hint: "続けやすい" },
  { value: 30, label: "30枚", hint: "じっくり続ける" },
];

type StepChoice = "preset" | "custom";

const fieldClass = "grid gap-2 font-extrabold text-[#5a4d3e]";
const inputClass =
  "w-full rounded-[14px] border border-[#d8c8ae] bg-[#fffdf8] px-3.5 py-[13px] text-[#302a24] outline-none focus:border-[#df6d43] focus:shadow-[0_0_0_3px_rgb(223_109_67_/_14%)]";
const formErrorClass = "rounded-[14px] bg-[#ffe8df] px-3.5 py-3 text-[#8f2d20]";

/** 创建目标册表单，只收集 MVP 需要的标题、步数、奖励和主题。 */
export function GoalForm({ userId }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [stepChoice, setStepChoice] = useState<StepChoice>("preset");
  const [selectedPresetSteps, setSelectedPresetSteps] = useState(14);
  const [customStepsInput, setCustomStepsInput] = useState("21");
  const [finalReward, setFinalReward] = useState("");
  const [theme, setTheme] = useState("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const totalStepsInput = stepChoice === "custom" ? customStepsInput : String(selectedPresetSteps);

  return (
    <form
      className="grid gap-4 rounded-[18px] border border-[#eadfcd] bg-[#fffaf1] p-[18px] shadow-[0_14px_30px_rgb(83_61_36_/_9%)]"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");

        if (!title.trim()) {
          setError("タイトルを入力してください");
          return;
        }
        const totalSteps = /^\d+$/.test(totalStepsInput) ? Number(totalStepsInput) : Number.NaN;
        if (!Number.isInteger(totalSteps) || totalSteps < 1 || totalSteps > 100) {
          setError("ステッカーの枚数は1から100の間で入力してください");
          return;
        }

        setSubmitting(true);
        try {
          // 创建成功后直接进入新目标册，让用户立刻看到等待贴纸的空槽。
          const goal = await createGoalAlbum({
            userId,
            title,
            totalSteps,
            finalReward,
            theme,
          });
          navigateTo(`/goals/${goal.id}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "目標アルバムを作成できませんでした");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label className={fieldClass}>
        <span>目標タイトル</span>
        <input
          className={inputClass}
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="日本語の勉強"
        />
      </label>
      <fieldset className={fieldClass}>
        <legend>何枚貼ったら完成にしますか？</legend>
        <p className="text-[0.82rem] font-bold leading-relaxed text-[#756758]">
          一歩進むたびに、ステッカーを1枚貼ります。
        </p>
        <div className="grid grid-cols-3 gap-2" aria-label="完成までに貼るステッカー枚数">
          {stepOptions.map((option) => {
            const selected = stepChoice === "preset" && selectedPresetSteps === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className={[
                  "grid min-h-[72px] content-center gap-1 rounded-[14px] border px-2 py-2 text-center transition",
                  selected
                    ? "border-[#df6d43] bg-[#fff1e8] text-[#8d3f26] shadow-[0_0_0_3px_rgb(223_109_67_/_12%)]"
                    : "border-[#d8c8ae] bg-[#fffdf8] text-[#5a4d3e]",
                ].join(" ")}
                aria-pressed={selected}
                onClick={() => {
                  setStepChoice("preset");
                  setSelectedPresetSteps(option.value);
                }}
              >
                <span className="text-[1.15rem] leading-tight">{option.label}</span>
                <span className="text-[0.72rem] font-bold leading-tight text-[#8d7a65]">{option.hint}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded-[14px] border border-[#d8c8ae] bg-[#fffdf8] p-2.5">
          <button
            type="button"
            className={[
              "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[11px] px-3 text-left text-[0.9rem] font-extrabold transition",
              stepChoice === "custom" ? "bg-[#fff1e8] text-[#8d3f26]" : "bg-transparent text-[#5a4d3e]",
            ].join(" ")}
            aria-expanded={stepChoice === "custom"}
            onClick={() => setStepChoice("custom")}
          >
            <span>自分で枚数を決める</span>
            <span className="shrink-0 text-[0.82rem] text-[#8d7a65]">{customStepsInput || "--"}枚</span>
          </button>
          {stepChoice === "custom" ? (
            <label className="mt-2 grid gap-1.5 px-1 pb-1 text-[0.82rem] font-bold text-[#756758]">
              <span>完成までに貼る枚数</span>
              <input
                className={inputClass}
                inputMode="numeric"
                pattern="[0-9]*"
                value={customStepsInput}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setCustomStepsInput(digitsOnly.replace(/^0+(?=\d)/, ""));
                }}
              />
            </label>
          ) : null}
        </div>
      </fieldset>
      <label className={fieldClass}>
        <span>最後のごほうび</span>
        <input
          className={inputClass}
          value={finalReward}
          maxLength={120}
          onChange={(event) => setFinalReward(event.target.value)}
          placeholder="原書のマンガを1冊買う"
        />
      </label>
      <fieldset className={fieldClass}>
        <legend>テーマ</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {themes.map((item) => {
            const selected = theme === item.value;
            return (
              <button
                type="button"
                key={item.value}
                className={[
                  "flex min-h-[58px] items-center gap-2 rounded-[14px] border px-3 py-2 text-left transition",
                  selected
                    ? "border-[#df6d43] bg-[#fff1e8] text-[#8d3f26] shadow-[0_0_0_3px_rgb(223_109_67_/_12%)]"
                    : "border-[#d8c8ae] bg-[#fffdf8] text-[#5a4d3e]",
                ].join(" ")}
                aria-pressed={selected}
                onClick={() => setTheme(item.value)}
              >
                <span
                  className={[
                    "grid size-8 shrink-0 place-items-center rounded-full text-[0.8rem] font-extrabold",
                    selected ? "bg-[#df6d43] text-white" : "bg-[#f3eadb] text-[#8d7a65]",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {item.marker}
                </span>
                <span className="min-w-0 text-[0.92rem] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {error ? <p className={formErrorClass}>{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "作成中" : "目標アルバムを作る"}
      </Button>
    </form>
  );
}
