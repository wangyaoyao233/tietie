import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { GoalAlbumPage } from "../features/goals/GoalAlbumPage";
import { GoalCard } from "../features/goals/GoalCard";
import { GoalForm } from "../features/goals/GoalForm";
import { fetchGoals } from "../features/goals/goalApi";
import type { Goal } from "../features/goals/goalTypes";
import { getAnonymousUserId } from "../features/user/anonymousUser";
import { cn } from "../lib/cn";
import { navigateTo, useRoute } from "./router";

const pageClass = "mx-auto min-h-[100svh] w-[min(100%,720px)] px-[18px] pt-[22px] pb-9 min-[700px]:pt-9";
const eyebrowClass = "text-[0.78rem] font-extrabold tracking-normal text-[#a66235] uppercase";
const h1Class = "text-[2.35rem] leading-[1.06] tracking-normal text-[#241e18]";
const textLinkClass = "inline-flex w-fit border-0 bg-transparent p-0 font-extrabold text-[#b45e39]";
const formErrorClass = "rounded-[14px] bg-[#ffe8df] px-3.5 py-3 text-[#8f2d20]";

/** Landing 首屏根据用户是否已有目标册，引导创建或继续使用。 */
function LandingPage({ userId }: { userId: string }) {
  const [hasGoals, setHasGoals] = useState(false);

  useEffect(() => {
    // 根据是否已有目标册决定首屏按钮去创建流程还是回到列表。
    fetchGoals(userId)
      .then((goals) => setHasGoals(goals.length > 0))
      .catch(() => setHasGoals(false));
  }, [userId]);

  return (
    <main
      className={cn(pageClass, "grid content-center gap-7 min-[700px]:grid-cols-[1fr_0.9fr] min-[700px]:items-center")}
    >
      <section className="grid gap-4">
        <p className={eyebrowClass}>Sticker Goals</p>
        <h1 className={h1Class}>目標をステッカーアルバムに</h1>
        <p className="max-w-lg text-[1.05rem] leading-[1.6] text-[#6e6255]">
          小さな一歩を終えるたびにステッカーを選び、今日の進みを次のマスにしまいます。
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Button type="button" onClick={() => navigateTo(hasGoals ? "/dashboard" : "/goals/new")}>
            {hasGoals ? "マイアルバムへ戻る" : "最初の目標アルバムを作る"}
          </Button>
          {hasGoals ? null : (
            <Button type="button" variant="secondary" onClick={() => navigateTo("/dashboard")}>
              マイアルバム
            </Button>
          )}
        </div>
      </section>
      <section
        className="grid grid-cols-4 gap-2.5 rounded-[18px] border border-[#eadfcd] bg-[#fffaf1] p-3.5 shadow-[0_20px_40px_rgb(81_55_32_/_10%)]"
        aria-label="ステッカーアルバムのプレビュー"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <div
            className={cn(
              "grid aspect-square place-items-center rounded-[15px] border border-dashed border-[#d9c8ac] bg-[#fffdf7] font-bold text-[#b7a48b]",
              index < 4 && "border-solid bg-[#f9d891] text-[#513720]",
              index === 4 && "border-[#ef9f55] bg-[#fff4db]",
            )}
            key={index}
          >
            {index < 4 ? ["✦", "花", "本", "心"][index] : index + 1}
          </div>
        ))}
      </section>
    </main>
  );
}

/** 目标册列表页，展示当前匿名用户自己的所有目标册。 */
function DashboardPage({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    // 页面切走后忽略旧请求结果，避免异步响应覆盖新页面状态。
    fetchGoals(userId)
      .then((loadedGoals) => {
        if (active) {
          setGoals(loadedGoals);
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
  }, [userId]);

  return (
    <main className={pageClass}>
      <header className="mb-[22px] flex items-start justify-between gap-4">
        <div>
          <p className={eyebrowClass}>マイアルバム</p>
          <h1 className={h1Class}>続きを貼る</h1>
        </div>
        <Button type="button" onClick={() => navigateTo("/goals/new")}>
          目標アルバムを作る
        </Button>
      </header>
      {loading ? <p className="py-10 text-center text-[#756758]">目標アルバムを整理中...</p> : null}
      {error ? <p className={formErrorClass}>{error}</p> : null}
      {!loading && !error && goals.length === 0 ? (
        <EmptyState
          title="目標アルバムはまだありません"
          body="小さなステッカーアルバムを作って、一歩進むたびに一枚貼りましょう。"
          action={
            <Button type="button" onClick={() => navigateTo("/goals/new")}>
              目標アルバムを作る
            </Button>
          }
        />
      ) : null}
      <div className="grid gap-3.5">
        {goals.map((goal) => (
          <GoalCard goal={goal} key={goal.id} />
        ))}
      </div>
    </main>
  );
}

/** 新建目标页，承载短表单并创建一本新的贴纸册。 */
function NewGoalPage({ userId }: { userId: string }) {
  return (
    <main className={pageClass}>
      <button className={cn(textLinkClass, "mb-4")} type="button" onClick={() => navigateTo("/dashboard")}>
        マイアルバムへ戻る
      </button>
      <header className="mb-[22px] block">
        <div>
          <p className={eyebrowClass}>目標アルバムを作る</p>
          <h1 className={h1Class}>まず空きマスを用意</h1>
        </div>
      </header>
      <GoalForm userId={userId} />
    </main>
  );
}

/** 应用根组件，负责把当前客户端路由分发到对应页面。 */
export function App() {
  const route = useRoute();
  // 匿名 userId 是本地 MVP 的用户隔离边界，整个应用生命周期内保持稳定。
  const userId = useMemo(() => getAnonymousUserId(), []);

  if (route.name === "dashboard") {
    return <DashboardPage userId={userId} />;
  }
  if (route.name === "new-goal") {
    return <NewGoalPage userId={userId} />;
  }
  if (route.name === "goal") {
    return <GoalAlbumPage key={route.goalId} goalId={route.goalId} userId={userId} />;
  }
  return <LandingPage userId={userId} />;
}
