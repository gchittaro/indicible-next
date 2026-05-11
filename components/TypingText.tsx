'use client'

import { useEffect, useState } from 'react'

interface Props {
  text: string
  speed?: number
  onDone?: () => void
}

export default function TypingText({ text, speed = 25, onDone }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed, onDone])

  return (
    <>
      {displayed}
      {!done && <span className="cursor" />}
    </>
  )
}
