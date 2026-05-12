import { useEffect, useMemo } from 'react'
import { useAppStore } from './store'
import { Hero } from './components/Hero'
import { TodoList } from './components/TodoList'
import { Reminder } from './components/Reminder'
import { Gallery } from './components/Gallery'
import { Studio } from './components/Studio'
import { ConfirmModal } from './components/ConfirmModal'
import { AddTodoModal, SettingsDrawer } from './components/Modals'
import { greetByHour } from './lib/constants'
import { startScheduler } from './lib/scheduler'
import { ensureNotificationPermission, currentPermission } from './lib/notifications'

export default function App() {
  const {
    todos, openModal, toggleDrawer, toggleSheet, triggerDemoReminder,
    fireTodo, setNotifPermission,
  } = useAppStore()

  const greet = useMemo(() => greetByHour(new Date().getHours()), [])
  const remaining = todos.filter((t) => t.enabled && !t.done).length
  const doneCount = todos.filter((t) => t.done).length

  // 启动时：请求通知权限 + 开启 30 秒扫描调度器
  useEffect(() => {
    setNotifPermission(currentPermission())
    ensureNotificationPermission().then(() => setNotifPermission(currentPermission()))
    const handle = startScheduler(
      () => useAppStore.getState().todos,
      (todo) => fireTodo(todo),
    )
    return () => handle.stop()
  }, [fireTodo, setNotifPermission])

  return (
    <>
      <div className="app-shell">
        {/* Top Nav */}
        <div className="topnav">
          <div className="greet">
            <div className="avatar">韩</div>
            <div className="greet-text">
              <span>{greet}</span>
              <b>韩瑞，有 {remaining} 件事要完成 ✨</b>
            </div>
          </div>
          <div className="nav-btns">
            <button className="nav-btn" onClick={triggerDemoReminder}>▶ 演示提醒</button>
            <button className="nav-btn">🎐 日常</button>
            <button className="nav-btn" onClick={() => toggleDrawer(true)}>⚙</button>
          </div>
        </div>

        {/* Hero */}
        <Hero />

        {/* Stats */}
        <div className="stats">
          <div className="stat coral"><div className="v">{todos.length}</div><div className="l">今日待办</div></div>
          <div className="stat emerald"><div className="v">{doneCount}</div><div className="l">已完成</div></div>
          <div className="stat violet"><div className="v">14</div><div className="l">连续打卡天</div></div>
          <div className="stat amber"><div className="v">30</div><div className="l">立绘池</div></div>
        </div>

        {/* Today */}
        <TodoList />
      </div>

      {/* Bottom Dock */}
      <div className="dock">
        <button className="dock-btn primary" onClick={() => openModal('add-todo')}>+ 新建待办</button>
        <button className="dock-btn">⚡ 情绪规则</button>
        <button className="dock-btn" onClick={() => toggleSheet(true)}>🎭 立绘池</button>
      </div>

      {/* 悬浮组件 */}
      <Reminder />
      <Gallery />
      <Studio />
      <ConfirmModal />
      <AddTodoModal />
      <SettingsDrawer />
    </>
  )
}
