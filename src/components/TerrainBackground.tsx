"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function TerrainBackground({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains("dark"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`pointer-events-none overflow-hidden ${className ?? ""}`} aria-hidden="true">
      <Image
        src={isDark ? "/images/terrain-dark.png" : "/images/terrain-light.png"}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-bottom"
      />
    </div>
  )
}
