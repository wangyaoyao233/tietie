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
      <p className={eyebrowClass}>已贴满</p>
      <h2 className="text-xl leading-[1.22] tracking-normal text-[#241e18]">这本收集册已经贴满了</h2>
      <p>
        一共收起了 {goal.completedSteps} 个小进度
        {goal.completedAt ? `，完成于 ${formatDate(goal.completedAt)}` : ""}。
      </p>
      {goal.finalReward ? <p className="font-bold text-[#6b5b48]">最终奖励：{goal.finalReward}</p> : null}
    </Card>
  );
}
