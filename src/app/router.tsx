import { useEffect, useState } from "react";

export type Route =
  | { name: "landing" }
  | { name: "dashboard" }
  | { name: "new-goal" }
  | { name: "goal"; goalId: string };

/** 将浏览器路径解析成应用内部路由对象。 */
const parsePath = (pathname: string): Route => {
  if (pathname === "/dashboard") {
    return { name: "dashboard" };
  }
  if (pathname === "/goals/new") {
    return { name: "new-goal" };
  }

  const goalMatch = pathname.match(/^\/goals\/([^/]+)$/);
  if (goalMatch?.[1]) {
    return { name: "goal", goalId: decodeURIComponent(goalMatch[1]) };
  }

  return { name: "landing" };
};

/** 切换客户端路由，不触发整页刷新。 */
export const navigateTo = (path: string) => {
  window.history.pushState({}, "", path);
  // 主动派发 popstate，让自定义路由 hook 和浏览器前进后退走同一套更新逻辑。
  window.dispatchEvent(new PopStateEvent("popstate"));
};

/** 订阅当前浏览器路径，并返回解析后的应用路由。 */
export const useRoute = () => {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return route;
};
