import { Card } from "../../components/Card";
import { formatDate } from "../../lib/dates";
import type { Goal } from "./goalTypes";

type CompletedGoalPanelProps = {
  goal: Goal;
};

const eyebrowClass = "text-[0.78rem] font-extrabold tracking-normal text-[#a66235] uppercase";

/** 目标贴满后的完成状态提示，展示完成数量、日期和最终奖励。 */
export function CompletedGoalPanel({ goal }: CompletedGoalPanelProps) {
  return (
    <Card className="mb-4 grid gap-2.5 bg-[#f4f6dc] p-[18px]">
      <p className={eyebrowClass}>貼り終わり</p>
      <h2 className="text-xl leading-[1.22] tracking-normal text-[#241e18]">このアルバムはすべて埋まりました</h2>
      <p>
        小さな進みを {goal.completedSteps} 個集めました
        {goal.completedAt ? `。完了日：${formatDate(goal.completedAt)}` : ""}。
      </p>
      {goal.finalReward ? <p className="font-bold text-[#6b5b48]">最後のごほうび：{goal.finalReward}</p> : null}
    </Card>
  );
}
