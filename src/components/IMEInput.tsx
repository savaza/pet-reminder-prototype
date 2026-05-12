import { useRef, type InputHTMLAttributes, type ChangeEvent } from 'react'

/**
 * IME 安全 input——替代原生 <input>，解决中文/日文/韩文输入法 composition 期间
 * React 受控组件重渲染打断 IME 组字、导致拼音被当作普通字符提交的经典 bug。
 *
 * 用法：<IMEInput value={...} onChange={...} /> 其它属性全部透传。
 */
export function IMEInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const composing = useRef(false)
  const { onChange, onCompositionStart, onCompositionEnd, onBlur, ...rest } = props

  return (
    <input
      {...rest}
      onChange={(e) => {
        if (composing.current) return // 组字进行中，先不提交
        onChange?.(e)
      }}
      onCompositionStart={(e) => {
        composing.current = true
        onCompositionStart?.(e)
      }}
      onCompositionEnd={(e) => {
        composing.current = false
        onCompositionEnd?.(e)
        // 组字结束，提交最终结果（模拟一次 change）
        onChange?.(e as unknown as ChangeEvent<HTMLInputElement>)
      }}
      onBlur={(e) => {
        // 有些浏览器 blur 时若仍在组字，不会触发 compositionend，手动兜底
        composing.current = false
        onBlur?.(e)
      }}
    />
  )
}
