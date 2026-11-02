import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Reload, MapPin, MapsDirections, Plus, Minus, Compass, CaretRight, CaretDown } from '@openai/apps-sdk-ui/components/Icon'

const CSS = `
  * { box-sizing: border-box; }
  .lv-root {
    min-height: 100%;
    color: var(--text);
    background: var(--bg);
    font-family: var(--font);
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    max-width: 920px;
    margin: 0 auto;
  }
  .lv-head { display: flex; align-items: center; gap: 12px; }
  .lv-title { font-size: 22px; font-weight: 650; letter-spacing: -0.01em; margin: 0; }
  .lv-spacer { flex: 1; }
  .lv-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--muted); background: var(--surface);
  }
  .lv-chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
  .lv-chip.on { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }
  .lv-chip.on .dot { background: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
  button.lv-chip { cursor: pointer; font: inherit; min-height: 40px; }
  button.lv-chip:hover { background: var(--surface-2); }
  button.lv-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  button.lv-chip:disabled { opacity: 0.6; cursor: default; }
  .lv-note { font-size: 13px; color: var(--muted); background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 12px; margin-top: -4px; }
  .lv-interval { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; }
  .lv-interval label { font-size: 13px; font-weight: 600; color: var(--text); }
  .lv-interval select { font: inherit; font-size: 13px; min-height: 40px; padding: 0 34px 0 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--bg); color: var(--text); cursor: pointer;
    appearance: none; -webkit-appearance: none;
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 16px) calc(50% - 2px), calc(100% - 11px) calc(50% - 2px);
    background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; }
  .lv-interval select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .lv-interval select:disabled { opacity: 0.6; cursor: default; }
  .lv-interval .hint { font-size: 12px; color: var(--muted); }
  .lv-interval-label { font-size: 13px; font-weight: 600; color: var(--text); }
  .lv-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-height: 40px; min-width: 40px; padding: 0 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface); color: var(--text);
    font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .lv-btn:hover { background: var(--surface-2); }
  .lv-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .lv-btn:disabled { opacity: 0.5; cursor: default; }
  .lv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
  .lv-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
  .lv-stat .k { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
  .lv-stat .v { font-size: 18px; font-weight: 650; margin-top: 3px; }

  .lv-map-wrap {
    position: relative; width: 100%; background: var(--surface-2);
    border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
    user-select: none; touch-action: none;
  }
  .lv-tile { position: absolute; width: 256px; height: 256px; image-rendering: auto; pointer-events: none; }
  .lv-overlay { position: absolute; left: 0; top: 0; pointer-events: none; }
  .lv-track { fill: none; stroke: #2563eb; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; opacity: 0.85;
    filter: drop-shadow(0 0 2px rgba(255,255,255,0.7)); }
  .lv-fix { fill: #2563eb; stroke: #fff; stroke-width: 1.5; cursor: pointer; pointer-events: auto; }
  .lv-fix:hover { fill: #1d4ed8; }
  .lv-fix.sel { stroke: #111; stroke-width: 2.5; }
  .lv-latest { fill: #ef4444; stroke: #fff; stroke-width: 2.5; cursor: pointer; pointer-events: auto; }
  .lv-latest-ring { fill: none; stroke: #ef4444; stroke-width: 2; opacity: 0.6; }
  @keyframes lv-pulse { 0% { opacity: 0.55; r: 8; } 70% { opacity: 0; r: 22; } 100% { opacity: 0; r: 22; } }
  .lv-pulse { fill: none; stroke: #ef4444; stroke-width: 2; animation: lv-pulse 2.4s ease-out infinite; }
  @media (prefers-reduced-motion: reduce) { .lv-pulse { animation: none; opacity: 0; } }

  .lv-zoom { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 6px; z-index: 2; }
  .lv-zoom button {
    width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 88%, transparent); color: var(--text);
    display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px);
  }
  .lv-zoom button:hover { background: var(--surface); }
  .lv-zoom button:disabled { opacity: 0.45; cursor: default; }
  .lv-attr {
    position: absolute; right: 0; bottom: 0; font-size: 10px; line-height: 1.4;
    color: #333; background: rgba(255,255,255,0.75); padding: 1px 6px; border-top-left-radius: 6px; z-index: 2;
  }
  .lv-attr a { color: #1d4ed8; text-decoration: none; }
  .lv-maploading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 13px; z-index: 1; }

  .lv-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .lv-row {
    display: flex; align-items: center; gap: 4px; padding-right: 8px;
    background: var(--surface); border-top: 1px solid var(--border);
  }
  .lv-row:first-child { border-top: none; }
  .lv-row:hover { background: var(--surface-2); }
  .lv-row.sel { background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .lv-row-main {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 12px 6px 12px 14px;
    background: none; border: none; cursor: pointer; text-align: left; font: inherit; color: var(--text);
  }
  .lv-row-main:focus-visible, .lv-maplink:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 8px; }
  .lv-row .pin { color: var(--accent); flex-shrink: 0; }
  .lv-row .body { flex: 1; min-width: 0; }
  .lv-row .when { font-size: 14px; font-weight: 600; }
  .lv-row .meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .lv-row .coords { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .lv-maplink {
    display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
    font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none;
    min-height: 44px; padding: 0 10px; border-radius: 8px;
  }
  .lv-maplink:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .lv-section { font-size: 13px; font-weight: 650; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .lv-sess { margin-bottom: 14px; }
  button.lv-sess-head { display: flex; align-items: center; gap: 10px; padding: 8px 4px; width: 100%;
    background: none; border: none; cursor: pointer; text-align: left; font: inherit; color: var(--text); border-radius: 8px; }
  button.lv-sess-head:hover { background: var(--surface); }
  button.lv-sess-head:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .lv-sess-head .caret { color: var(--muted); flex-shrink: 0; }
  .lv-swatch { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
  .lv-sess-when { font-size: 14px; font-weight: 650; }
  .lv-sess-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .lv-more { font-size: 12px; color: var(--muted); padding: 10px 14px; background: var(--surface);
    border: 1px solid var(--border); border-top: none; border-radius: 0 0 12px 12px; }
  .lv-empty, .lv-error { text-align: center; padding: 48px 20px; color: var(--muted); }
  .lv-empty .big { color: var(--text); font-size: 17px; font-weight: 600; margin: 12px 0 6px; }
  .lv-empty svg { opacity: 0.5; }
  .lv-error { color: var(--danger, #d05); }
  .lv-skel { height: 300px; border-radius: 14px; background: linear-gradient(90deg, var(--surface), var(--surface-2), var(--surface)); background-size: 200% 100%; animation: lv-shimmer 1.3s infinite; }
  @keyframes lv-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`

const TILE = 256
const MIN_Z = 2
const MAX_Z = 19

const INTERVAL_PRESETS = [
  { ms: 1000, label: '1 second' },
  { ms: 2000, label: '2 seconds' },
  { ms: 3000, label: '3 seconds' },
  { ms: 5000, label: '5 seconds' },
  { ms: 10000, label: '10 seconds' },
  { ms: 30000, label: '30 seconds' },
  { ms: 60000, label: '1 minute' },
  { ms: 120000, label: '2 minutes' },
  { ms: 300000, label: '5 minutes' },
  { ms: 600000, label: '10 minutes' },
  { ms: 1800000, label: '30 minutes' },
  { ms: 3600000, label: '1 hour' },
]

// Distinct per-session colours (red is reserved for the latest-fix marker).
const SESSION_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04', '#db2777', '#0d9488']

// Split a chronological run of fixes into tracking sessions. There are no stored
// on/off markers, so a session boundary is inferred from a time gap much larger
// than the usual spacing between fixes — that gap is when tracking was off.
function sessionize(points) {
  if (!points.length) return []
  const gaps = []
  for (let i = 1; i < points.length; i++) gaps.push(points[i].timestamp - points[i - 1].timestamp)
  const sorted = [...gaps].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  const threshold = Math.max(median * 6, 120000) // 6× typical spacing, min 2 minutes
  const groups = []
  let cur = [points[0]]
  for (let i = 1; i < points.length; i++) {
    if (points[i].timestamp - points[i - 1].timestamp > threshold) { groups.push(cur); cur = [points[i]] }
    else cur.push(points[i])
  }
  groups.push(cur)
  return groups.map((pts, i) => ({
    index: i,
    points: pts,
    startMs: pts[0].timestamp,
    endMs: pts[pts.length - 1].timestamp,
    color: SESSION_COLORS[i % SESSION_COLORS.length],
  }))
}

function relTime(ms) {
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 45) return 'just now'
  if (s < 90) return 'a minute ago'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`
  return new Date(ms).toLocaleDateString()
}

function fmtTime(ms) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtSpan(ms) {
  const mins = Math.round(ms / 60000)
  if (mins < 1) return 'moments'
  if (mins < 60) return `${mins} min`
  const h = mins / 60
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} hr`
  return `${Math.round(h / 24)} days`
}

// Web Mercator normalized coords in [0,1], independent of zoom.
const normX = (lon) => (lon + 180) / 360
const normY = (lat) => {
  const r = (lat * Math.PI) / 180
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2
}

function computeView(pts, W, H, zoomDelta, pan = { x: 0, y: 0 }) {
  if (!pts.length || W < 10) return null
  const nxs = pts.map((p) => normX(p.longitude))
  const nys = pts.map((p) => normY(p.latitude))
  const minNx = Math.min(...nxs), maxNx = Math.max(...nxs)
  const minNy = Math.min(...nys), maxNy = Math.max(...nys)
  const pad = 0.16
  const availW = Math.max(W * (1 - 2 * pad), 32)
  const availH = Math.max(H * (1 - 2 * pad), 32)
  // Smallest span still gives a usable zoom when all fixes are nearly identical.
  const spanNx = Math.max(maxNx - minNx, 1e-7)
  const spanNy = Math.max(maxNy - minNy, 1e-7)
  const zFit = Math.min(
    Math.log2(availW / (spanNx * TILE)),
    Math.log2(availH / (spanNy * TILE)),
  )
  let z = Math.max(MIN_Z, Math.min(MAX_Z, Math.floor(zFit) + zoomDelta))
  const scale = TILE * 2 ** z
  const cx = ((minNx + maxNx) / 2) * scale
  const cy = ((minNy + maxNy) / 2) * scale
  const originX = cx - W / 2 - pan.x
  const originY = cy - H / 2 - pan.y
  const project = (lat, lon) => ({
    x: normX(lon) * scale - originX,
    y: normY(lat) * scale - originY,
  })
  const n = 2 ** z
  const x0 = Math.floor(originX / TILE), x1 = Math.floor((originX + W) / TILE)
  const y0 = Math.floor(originY / TILE), y1 = Math.floor((originY + H) / TILE)
  const tiles = []
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue
      const xx = ((x % n) + n) % n
      tiles.push({ key: `${z}/${xx}/${y}`, z, x: xx, y, left: x * TILE - originX, top: y * TILE - originY })
    }
  }
  return { z, scale, project, tiles, zFit: Math.floor(zFit) }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onloadend = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

function MapView({ sessions, token, selected, onSelect }) {
  const allPts = useMemo(() => sessions.flatMap((s) => s.points), [sessions])
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 720, h: 420 })
  const [zoomDelta, setZoomDelta] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [, forceRepaint] = useState(0)
  const cacheRef = useRef({})        // z/x/y -> resolved data URL (valid across views)
  const inFlightRef = useRef(new Set())
  const mountedRef = useRef(true)
  const dragRef = useRef(null)
  const draggedRef = useRef(false)

  useEffect(() => () => { mountedRef.current = false }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      if (w > 0) setSize({ w, h: Math.max(260, Math.min(Math.round(w * 0.6), 460)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const view = useMemo(
    () => computeView(allPts, size.w, size.h, zoomDelta, pan),
    [allPts, size.w, size.h, zoomDelta, pan],
  )

  // Fetch tiles into a persistent cache keyed by z/x/y. A tile is valid for its
  // coordinates regardless of the current view, so panning/zooming never discards
  // a loaded tile and an in-flight tile is tracked separately — so a view change
  // can never leave a key stuck "loading" (the earlier bug: tiles only appeared
  // after zooming out).
  useEffect(() => {
    if (!view) return
    view.tiles.forEach(async (t) => {
      if (cacheRef.current[t.key] || inFlightRef.current.has(t.key)) return
      inFlightRef.current.add(t.key)
      try {
        const u = `https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(u)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await blobToDataURL(await res.blob())
        cacheRef.current[t.key] = data
        if (mountedRef.current) forceRepaint((n) => n + 1)
      } catch { /* leave blank; a later view retries */ } finally {
        inFlightRef.current.delete(t.key)
      }
    })
  }, [view, token])

  // Zoom one level, keeping the map point under `anchor` (map-relative pixels;
  // defaults to the centre) where it is. World pixels double per level, so the
  // anchor's offset from centre scales by f and the pan absorbs the difference.
  const viewRef = useRef(null)
  viewRef.current = view
  const sizeRef = useRef(size)
  sizeRef.current = size
  const zoomBy = useCallback((delta, anchor) => {
    const v = viewRef.current
    if (!v || v.z + delta > MAX_Z || v.z + delta < MIN_Z) return
    const { w, h } = sizeRef.current
    const sx = anchor ? anchor.x - w / 2 : 0
    const sy = anchor ? anchor.y - h / 2 : 0
    const f = delta > 0 ? 2 : 0.5
    setZoomDelta((d) => d + delta)
    setPan((p) => ({ x: f * p.x + sx * (1 - f), y: f * p.y + sy * (1 - f) }))
  }, [])
  const recenter = () => { setZoomDelta(0); setPan({ x: 0, y: 0 }) }

  const localPoint = (clientX, clientY) => {
    const r = wrapRef.current.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }

  // Wheel / trackpad zoom. Attached natively because React's wheel listener is
  // passive and could not stop the page from scrolling under the map.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    let acc = 0
    let last = 0
    const onWheel = (e) => {
      e.preventDefault()
      acc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY
      const now = Date.now()
      if (Math.abs(acc) < 80 || now - last < 180) return
      last = now
      zoomBy(acc < 0 ? 1 : -1, localPoint(e.clientX, e.clientY))
      acc = 0
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomBy, view !== null])

  // One pointer pans; two pointers pinch-zoom. The pointer is captured only once
  // it actually starts dragging, so a plain tap still reaches the dot under it.
  const pointersRef = useRef(new Map())
  const pinchRef = useRef(null)
  const pinchDist = () => {
    const [a, b] = [...pointersRef.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  const onPointerDown = (e) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 2) {
      dragRef.current = null
      draggedRef.current = true
      pinchRef.current = { base: pinchDist() }
      for (const id of pointersRef.current.keys()) {
        try { e.currentTarget.setPointerCapture?.(id) } catch { /* ignore */ }
      }
      return
    }
    if (pointersRef.current.size > 2) return
    dragRef.current = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }
    draggedRef.current = false
  }
  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pinch = pinchRef.current
    if (pinch && pointersRef.current.size === 2) {
      const ratio = pinchDist() / pinch.base
      if (ratio > 1.6 || ratio < 0.625) {
        const [a, b] = [...pointersRef.current.values()]
        zoomBy(ratio > 1 ? 1 : -1, localPoint((a.x + b.x) / 2, (a.y + b.y) / 2))
        pinch.base = pinchDist()
      }
      return
    }
    const d = dragRef.current
    if (!d) return
    if (!d.moved) {
      if (Math.abs(e.clientX - d.sx) <= 4 && Math.abs(e.clientY - d.sy) <= 4) return
      d.moved = true
      draggedRef.current = true
      try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* ignore */ }
    }
    const dx = e.clientX - d.lx, dy = e.clientY - d.ly
    d.lx = e.clientX; d.ly = e.clientY
    if (dx || dy) setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }
  const endDrag = (e) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    dragRef.current = null
  }
  const selectIfNotDragged = (id) => { if (!draggedRef.current) onSelect(id) }

  if (!view) return null
  const latest = allPts[allPts.length - 1]
  const anyTile = view.tiles.some((t) => cacheRef.current[t.key])

  return (
    <div className="lv-map-wrap" ref={wrapRef}
         style={{ height: size.h, cursor: dragRef.current ? 'grabbing' : 'grab' }}
         onPointerDown={onPointerDown} onPointerMove={onPointerMove}
         onPointerUp={endDrag} onPointerCancel={endDrag} onPointerLeave={endDrag}>
      {!anyTile && <div className="lv-maploading">Loading map…</div>}
      {view.tiles.map((t) => {
        const url = cacheRef.current[t.key]
        return url ? (
          <img key={t.key} className="lv-tile" src={url} alt="" draggable={false}
               style={{ left: t.left, top: t.top }} />
        ) : null
      })}
      <svg className="lv-overlay" width={size.w} height={size.h}>
        {sessions.map((s) => (
          <g key={s.index}>
            {s.points.length > 1 && (
              <path className="lv-track" style={{ stroke: s.color }}
                    d={s.points.map((p, i) => {
                      const { x, y } = view.project(p.latitude, p.longitude)
                      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
                    }).join(' ')} />
            )}
            {s.points.map((p) => {
              if (p.id === latest.id) return null
              const { x, y } = view.project(p.latitude, p.longitude)
              return (
                <circle key={p.id} className={`lv-fix ${selected === p.id ? 'sel' : ''}`}
                        style={{ fill: s.color }} cx={x} cy={y} r={selected === p.id ? 6 : 4}
                        onClick={() => selectIfNotDragged(p.id)} />
              )
            })}
          </g>
        ))}
        {(() => {
          const { x, y } = view.project(latest.latitude, latest.longitude)
          return (
            <g onClick={() => selectIfNotDragged(latest.id)} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
              <circle className="lv-pulse" cx={x} cy={y} r={8} />
              <circle className="lv-latest-ring" cx={x} cy={y} r={11} />
              <circle className="lv-latest" cx={x} cy={y} r={6.5} />
            </g>
          )
        })()}
      </svg>
      <div className="lv-zoom" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoomBy(1)} disabled={view.z >= MAX_Z} aria-label="Zoom in">
          <Plus width={16} height={16} />
        </button>
        <button onClick={() => zoomBy(-1)} disabled={view.z <= MIN_Z} aria-label="Zoom out">
          <Minus width={16} height={16} />
        </button>
        <button onClick={recenter} aria-label="Recenter on all points" title="Fit all points">
          <Compass width={16} height={16} />
        </button>
      </div>
      <div className="lv-attr" onPointerDown={(e) => e.stopPropagation()}>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>
    </div>
  )
}

function osmLink(p) {
  const la = p.latitude.toFixed(6), lo = p.longitude.toFixed(6)
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}`
}

export default function App({ token }) {
  const [positions, setPositions] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [savingInterval, setSavingInterval] = useState(false)
  const [note, setNote] = useState(null)
  // Tracking can only be changed in the Möbius phone app; everywhere else it is
  // shown read-only. null while the host is being asked.
  const [canControl, setCanControl] = useState(null)

  useEffect(() => {
    let live = true
    const control = window.mobius?.location
    if (!control?.get) { setCanControl(false); return undefined }
    control.get().then((res) => { if (live) setCanControl(res?.available === true) })
    return () => { live = false }
  }, [])
  const [sessionOpen, setSessionOpen] = useState({}) // startMs -> explicit open/closed override

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const auth = { headers: { Authorization: `Bearer ${token}` } }
    try {
      const res = await fetch('/api/location/positions?limit=2000', auth)
      if (!res.ok) throw new Error(res.status === 404
        ? 'The location history service is not available yet.'
        : `Could not load positions (${res.status}).`)
      const data = await res.json()
      setPositions(Array.isArray(data.positions) ? data.positions : [])
    } catch (e) {
      setError(e.message || 'Could not load your location history.')
      setPositions([])
    } finally {
      setLoading(false)
    }
    try {
      const tr = await fetch('/api/location/tracking', auth)
      if (tr.ok) setTracking(await tr.json())
    } catch { /* status is optional */ }
  }, [token])

  useEffect(() => { load() }, [load])

  const toggleTracking = useCallback(async () => {
    const control = window.mobius?.location
    if (!control) {
      setNote('Tracking controls need a Möbius update — reload and try again.')
      return
    }
    const turningOn = !(tracking && tracking.enabled)
    setToggling(true)
    setNote(null)
    try {
      const res = await (turningOn ? control.start() : control.stop())
      if (res && res.error) {
        setNote(`Couldn't change tracking: ${res.error}`)
      } else if (res && typeof res.enabled === 'boolean') {
        setTracking((t) => ({ ...(t || {}), enabled: res.enabled }))
        if (turningOn && res.enabled !== true) {
          if (res.available === false) {
            setNote('Tracking runs in the Möbius mobile app. Open Möbius there to turn it on.')
          } else if (res.status === 'denied') {
            setNote('Your device denied location permission. Enable it in your system settings, then try again.')
          } else if (res.status === 'disabled') {
            setNote('Location services are turned off on your device.')
          } else {
            setNote('Tracking could not start on this device.')
          }
        }
      } else {
        setNote('Tracking controls are only available inside Möbius.')
      }
    } finally {
      setToggling(false)
    }
  }, [tracking])

  const applyInterval = useCallback(async (ms) => {
    const control = window.mobius?.location
    setTracking((t) => ({ ...(t || {}), options: { ...(t?.options || {}), interval: ms } }))
    if (!control?.setOptions) {
      setNote('Interval controls need a Möbius update — reload and try again.')
      return
    }
    setSavingInterval(true)
    setNote(null)
    try {
      const res = await control.setOptions({ interval: ms })
      if (res && res.error) {
        setNote(`Couldn't change the interval: ${res.error}`)
      } else if (res && res.options && Number.isFinite(res.options.interval)) {
        setTracking((t) => ({ ...(t || {}), options: res.options }))
      }
    } finally {
      setSavingInterval(false)
    }
  }, [])

  const chrono = useMemo(
    () => (positions
      ? [...positions]
          .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
          .sort((a, b) => a.timestamp - b.timestamp)
      : []),
    [positions],
  )

  const sessions = useMemo(() => sessionize(chrono), [chrono])

  const stats = useMemo(() => {
    if (!chrono.length) return null
    const first = chrono[0], last = chrono[chrono.length - 1]
    return {
      total: chrono.length,
      lastMs: last.timestamp,
      spanMs: last.timestamp - first.timestamp,
    }
  }, [chrono])

  return (
    <div className="lv-root">
      <style>{CSS}</style>
      <div className="lv-head">
        <h1 className="lv-title">Location</h1>
        <div className="lv-spacer" />
        {tracking && !canControl && (
          <span className={`lv-chip ${tracking.enabled ? 'on' : ''}`}>
            <span className="dot" />
            {tracking.enabled ? 'Tracking on' : 'Tracking off'}
          </span>
        )}
        {tracking && canControl && (
          <button className={`lv-chip ${tracking.enabled ? 'on' : ''}`}
                  onClick={toggleTracking} disabled={toggling}
                  aria-pressed={tracking.enabled === true}
                  title={tracking.enabled ? 'Turn tracking off' : 'Turn tracking on'}>
            <span className="dot" />
            {toggling ? 'Working…' : tracking.enabled ? 'Tracking on' : 'Tracking off'}
          </button>
        )}
        <button className="lv-btn" onClick={load} disabled={loading} aria-label="Refresh">
          <Reload width={16} height={16} />
          {loading ? 'Loading' : 'Refresh'}
        </button>
      </div>

      {note && <div className="lv-note">{note}</div>}

      {tracking && (() => {
        const current = Number(tracking.options?.interval) || 10000
        const known = INTERVAL_PRESETS.some((o) => o.ms === current)
        return (
          <div className="lv-interval">
            {canControl ? (
              <>
                <label htmlFor="lv-interval">Record a point every</label>
                <select id="lv-interval" value={current} disabled={savingInterval}
                        onChange={(e) => applyInterval(Number(e.target.value))}>
                  {INTERVAL_PRESETS.map((o) => <option key={o.ms} value={o.ms}>{o.label}</option>)}
                  {!known && <option value={current}>{Math.round(current / 1000)} seconds</option>}
                </select>
              </>
            ) : (
              <>
                <span className="lv-interval-label">
                  Records a point every {INTERVAL_PRESETS.find((o) => o.ms === current)?.label
                    || `${Math.round(current / 1000)} seconds`}
                </span>
                <span className="hint">Change tracking in the Möbius app on your phone.</span>
              </>
            )}
          </div>
        )
      })()}

      {loading && !positions && <div className="lv-skel" />}

      {!loading && error && positions && positions.length === 0 && (
        <div className="lv-error">{error}</div>
      )}

      {!loading && !error && positions && positions.length === 0 && (
        <div className="lv-empty">
          <MapPin width={40} height={40} />
          <div className="big">No location points yet</div>
          <div>Once your device records fixes with tracking on, your track will appear here.</div>
        </div>
      )}

      {stats && (
        <>
          <div className="lv-stats">
            <div className="lv-stat"><div className="k">Last seen</div><div className="v">{relTime(stats.lastMs)}</div></div>
            <div className="lv-stat"><div className="k">Points</div><div className="v">{stats.total.toLocaleString()}</div></div>
            <div className="lv-stat"><div className="k">Sessions</div><div className="v">{sessions.length}</div></div>
            <div className="lv-stat"><div className="k">Time span</div><div className="v">{fmtSpan(stats.spanMs)}</div></div>
          </div>

          <MapView sessions={sessions} token={token} selected={selected} onSelect={setSelected} />

          <div className="lv-section">Sessions</div>
          {[...sessions].reverse().map((s, i) => {
            const fixes = [...s.points].reverse()
            const shown = fixes.slice(0, 12)
            const endLabel = new Date(s.endMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            const key = String(s.startMs)
            const isOpen = key in sessionOpen ? sessionOpen[key] : i === 0 // newest open by default
            return (
              <div key={s.index} className="lv-sess">
                <button className="lv-sess-head" aria-expanded={isOpen}
                        onClick={() => setSessionOpen((o) => ({ ...o, [key]: !isOpen }))}>
                  {isOpen
                    ? <CaretDown className="caret" width={16} height={16} />
                    : <CaretRight className="caret" width={16} height={16} />}
                  <span className="lv-swatch" style={{ background: s.color }} />
                  <div>
                    <div className="lv-sess-when">{fmtTime(s.startMs)} – {endLabel}</div>
                    <div className="lv-sess-sub">
                      {fmtSpan(s.endMs - s.startMs)} · {s.points.length} point{s.points.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
                {isOpen && (<>
                <div className="lv-list">
                  {shown.map((p) => (
                    <div key={p.id} className={`lv-row ${selected === p.id ? 'sel' : ''}`}>
                      <button className="lv-row-main" aria-pressed={selected === p.id}
                              onClick={() => setSelected(p.id)}>
                      <MapPin className="pin" width={18} height={18} style={{ color: s.color }} />
                      <div className="body">
                        <div className="when">{fmtTime(p.timestamp)}</div>
                        <div className="meta">
                          {relTime(p.timestamp)}
                          {Number.isFinite(p.accuracy) ? ` · ±${Math.round(p.accuracy)} m` : ''}
                          {Number.isFinite(p.speed) && p.speed > 0 ? ` · ${(p.speed * 3.6).toFixed(0)} km/h` : ''}
                          {Number.isFinite(p.altitude) ? ` · ${Math.round(p.altitude)} m alt` : ''}
                        </div>
                        <div className="coords">{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</div>
                      </div>
                      </button>
                      <a className="lv-maplink" href={osmLink(p)} target="_blank" rel="noreferrer"
                         aria-label={`Open this point on OpenStreetMap (${fmtTime(p.timestamp)})`}
                         title="Open on OpenStreetMap">
                        <MapsDirections width={14} height={14} /> Map
                      </a>
                    </div>
                  ))}
                </div>
                {fixes.length > shown.length && (
                  <div className="lv-more">+{fixes.length - shown.length} more in this session</div>
                )}
                </>)}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
