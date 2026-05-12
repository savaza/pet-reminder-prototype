/**
 * Web Notification API 封装
 * - 首次使用时请求授权
 * - 静默降级（不支持/被拒时不抛异常）
 */

let cachedPermission: NotificationPermission | 'unsupported' = 'default'

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function currentPermission(): NotificationPermission | 'unsupported' {
  if (!notificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationSupported()) { cachedPermission = 'unsupported'; return false }
  if (Notification.permission === 'granted') { cachedPermission = 'granted'; return true }
  if (Notification.permission === 'denied')  { cachedPermission = 'denied';  return false }
  try {
    const result = await Notification.requestPermission()
    cachedPermission = result
    return result === 'granted'
  } catch { return false }
}

export function showSystemNotification(opts: { title: string; body: string; icon?: string; tag?: string }) {
  if (!notificationSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon,
      tag: opts.tag,
      silent: false,
    })
  } catch (e) { console.warn('Notification failed', e) }
}

export function getCachedPermission() { return cachedPermission }
