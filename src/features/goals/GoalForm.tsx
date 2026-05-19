import { useState } from "react";
import { Button } from "../../components/Button";
import { createGoalAlbum } from "./goalApi";
import { navigateTo } from "../../app/router";

type GoalFormProps = {
  userId: string;
};

const themes = [
  { value: "study", label: "学習" },
  { value: "fitness", label: "運動" },
  { value: "reading", label: "読書" },
  { value: "money", label: "貯金" },
  { value: "daily", label: "日常" },
  { value: "cute", label: "かわいい" },
];

const fieldClass = "grid gap-2 font-extrabold text-[#5a4d3e]";
const inputClass =
  "w-full rounded-[14px] border border-[#d8c8ae] bg-[#fffdf8] px-3.5 py-[13px] text-[#302a24] outline-none focus:border-[#df6d43] focus:shadow-[0_0_0_3px_rgb(223_109_67_/_14%)]";
const formErrorClass = "rounded-[14px] bg-[#ffe8df] px-3.5 py-3 text-[#8f2d20]";

/** 创建目标册表单，只收集 MVP 需要的标题、步数、奖励和主题。 */
export function GoalForm({ userId }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [totalSteps, setTotalSteps] = useState(10);
  const [finalReward, setFinalReward] = useState("");
  const [theme, setTheme] = useState("daily");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        if (!Number.isInteger(totalSteps) || totalSteps < 1 || totalSteps > 100) {
          setError("ステップ数は1から100の間で入力してください");
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
      <label className={fieldClass}>
        <span>ステップ数</span>
        <input
          className={inputClass}
          type="number"
          min={1}
          max={100}
          value={totalSteps}
          onChange={(event) => setTotalSteps(Number(event.target.value))}
        />
      </label>
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
      <label className={fieldClass}>
        <span>テーマ</span>
        <select className={inputClass} value={theme} onChange={(event) => setTheme(event.target.value)}>
          {themes.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className={formErrorClass}>{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "作成中" : "目標アルバムを作る"}
      </Button>
    </form>
  );
}
