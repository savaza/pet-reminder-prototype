import { type InputHTMLAttributes } from 'react'

/**
 * IME 安全 input——替代原生 <input>，解决中文/日文/韩文输入法 composition 期间
 * React 受控组件重渲染打断 IME 组字、拼音被当普通字符提交的经典 bug。
 *
 * 实现：读取原生 InputEvent.isComposing 标志。浏览器在 IME 组字进行中触发的
 * input 事件，此标志为 true；组字最终 commit 时为 false。
 * 相比自维护 composingRef 的方案，不会因为意外 blur / Esc 等导致状态卡死。
 *
 * 用法：<IMEInput value={...} onChange={...} />  其它 props 全部透传。
 */
export function IMEInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { onChange, ...rest } = props
  return (
    <input
      {...rest}
      onChange={(e) => {
        // 组字进行中的 input 事件，native flag isComposing=true，跳过
        // 组字结束后浏览器会再触发一次 input 事件，isComposing=false，走正常提交
        if ((e.nativeEvent as InputEvent).isComposing) return
        onChange?.(e)
      }}
    />
  )
}
