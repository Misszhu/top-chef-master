/**
 * 推迟执行页面跳转，避免与 Toast、Loading 或同页 redirect 同一时刻触发时，
 * 微信子包页帧尚未就绪导致的运行时异常（如 __subPageFrameEndTime__ 空引用）。
 * @param navigateFn 调用 Taro.navigateTo / redirectTo 等的无参回调
 * @param delayMs 延迟毫秒数；不传时默认 320（约覆盖 Toast 展示一帧）
 * @return void
 */
export function scheduleNavigateAfterUiSettled(navigateFn: () => void, delayMs?: number): void {
  var ms = delayMs !== undefined && delayMs !== null ? delayMs : 320
  setTimeout(navigateFn, ms)
}
