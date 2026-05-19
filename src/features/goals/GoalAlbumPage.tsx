import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { ProgressBar } from "../../components/ProgressBar";
import { navigateTo } from "../../app/router";
import { fetchStickers } from "../stickers/stickerApi";
import type { Sticker } from "../stickers/stickerTypes";
import { completeGoalStep, fetchGoal } from "./goalApi";
import { CompletedGoalPanel } from "./CompletedGoalPanel";
import { CompleteStepModal } from "./CompleteStepModal";
import { CompletionDetailModal } from "./CompletionDetailModal";
import { GoalAlbumGrid } from "./GoalAlbumGrid";
import type { Goal, GoalSlot } from "./goalTypes";

type GoalAlbumPageProps = {
  goalId: string;
  userId: string;
};

const pageClass = "mx-auto min-h-[100svh] w-[min(100%,720px)] px-[18px] pt-[22px] pb-[54px] min-[700px]:pt-9";
const eyebrowClass = "text-[0.78rem] font-extrabold tracking-normal text-[#a66235] uppercase";
const h1Class = "text-[2.35rem] leading-[1.06] tracking-normal text-[#241e18]";
const textLinkClass = "inline-flex w-fit border-0 bg-transparent p-0 font-extrabold text-[#b45e39]";

/** 目标册详情页，承载贴纸册网格、完成一步流程和记录查看。 */
export function GoalAlbumPage({ goalId, userId }: GoalAlbumPageProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inspectedSlot, setInspectedSlot] = useState<GoalSlot | null>(null);
  const [recentlyFilledSlotId, setRecentlyFilledSlotId] = useState<string | null>(null);
  const slots = goal?.slots ?? [];

  useEffect(() => {
    let active = true;
    // 详情页一次加载目标状态和贴纸库，确保完成 modal 打开时不用再等待贴纸。
    Promise.all([fetchGoal(goalId, userId), fetchStickers()])
      .then(([loadedGoal, loadedStickers]) => {
        if (active) {
          setGoal(loadedGoal);
          setStickers(loadedStickers);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "目標アルバムを読み込めませんでした");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [goalId, userId]);

  const handleComplete = async (input: { stickerId: string; note: string }) => {
    setCompleteError("");
    if (!input.stickerId) {
      setCompleteError("ステッカーを1枚選んでください");
      return;
    }

    const nextSlot = slots.find((slot) => slot.status === "empty");
    setSubmitting(true);
    try {
      // 服务端决定真正填入哪个空槽；本地 nextSlot 只用于命中新贴纸动画。
      const result = await completeGoalStep(goalId, { userId, stickerId: input.stickerId, note: input.note });
      setGoal(result.goal);
      setRecentlyFilledSlotId(nextSlot?.id ?? null);
      setCompleteOpen(false);
      window.setTimeout(() => setRecentlyFilledSlotId(null), 900);
    } catch (caught) {
      setCompleteError(caught instanceof Error ? caught.message : "この一歩を保存できませんでした");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-[#756758]">目標アルバムを開いています...</p>;
  }

  if (error || !goal) {
    return (
      <EmptyState
        title="目標アルバムを開けませんでした"
        body={error || "目標が見つかりません"}
        action={
          <Button type="button" onClick={() => navigateTo("/dashboard")}>
            マイアルバムへ戻る
          </Button>
        }
      />
    );
  }

  return (
    <main className={pageClass}>
      <button className={`${textLinkClass} mb-4`} type="button" onClick={() => navigateTo("/dashboard")}>
        マイアルバムへ戻る
      </button>
      <section className="mb-[18px] grid gap-3">
        <p className={eyebrowClass}>{goal.status === "completed" ? "貼り終わり" : "目標ステッカーアルバム"}</p>
        <h1 className={h1Class}>{goal.title}</h1>
        <ProgressBar value={goal.completedSteps} max={goal.totalSteps} />
        {goal.finalReward ? <p className="font-bold text-[#6b5b48]">最後のごほうび：{goal.finalReward}</p> : null}
      </section>
      {goal.status === "completed" ? (
        <CompletedGoalPanel goal={goal} />
      ) : (
        <Button type="button" className="mb-4 w-full" onClick={() => setCompleteOpen(true)}>
          1枚貼る
        </Button>
      )}
      <GoalAlbumGrid slots={slots} recentlyFilledSlotId={recentlyFilledSlotId} onInspect={setInspectedSlot} />
      {completeOpen ? (
        <CompleteStepModal
          open={completeOpen}
          stickers={stickers}
          submitting={submitting}
          error={completeError}
          onClose={() => setCompleteOpen(false)}
          onSubmit={handleComplete}
        />
      ) : null}
      <CompletionDetailModal slot={inspectedSlot} onClose={() => setInspectedSlot(null)} />
    </main>
  );
}
