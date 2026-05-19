import { Card } from "../../components/Card";
import { ProgressBar } from "../../components/ProgressBar";
import { navigateTo } from "../../app/router";
import type { Goal } from "./goalTypes";

type GoalCardProps = {
  goal: Goal;
};

const eyebrowClass = "text-[0.78rem] font-extrabold tracking-normal text-[#a66235] uppercase";
const textLinkClass = "inline-flex w-fit border-0 bg-transparent p-0 font-extrabold text-[#b45e39]";

/** Dashboard 中的目标册摘要卡片，提供进度预览和详情入口。 */
export function GoalCard({ goal }: GoalCardProps) {
  return (
    <Card className={goal.status === "completed" ? "grid gap-3.5 bg-[#f2f4df] p-[18px]" : "grid gap-3.5 p-[18px]"}>
      <div>
        <p className={eyebrowClass}>{goal.status === "completed" ? "貼り終わり" : "続きを貼る"}</p>
        <h2 className="text-xl leading-[1.22] tracking-normal text-[#241e18]">{goal.title}</h2>
      </div>
      <ProgressBar value={goal.completedSteps} max={goal.totalSteps} />
      {goal.finalReward ? <p className="text-[#817365]">最後のごほうび：{goal.finalReward}</p> : null}
      <button className={textLinkClass} type="button" onClick={() => navigateTo(`/goals/${goal.id}`)}>
        アルバムを開く
      </button>
    </Card>
  );
}
