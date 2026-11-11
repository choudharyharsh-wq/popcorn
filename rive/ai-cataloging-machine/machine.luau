--!strict
-- AI Cataloguing Tool: drag-to-process machine. Self-driving; only optional input is the `reset` trigger.

type Card = {
    homeX: number, homeY: number,
    x: number, y: number,
    scale: number, alpha: number,
    alive: boolean,       -- input still available
    shown: boolean,       -- output visible
    phase: number,        -- pulse phase offset
    image: Image?,
    returning: number,    -- snap-back progress timer (0 = none)
    fromX: number, fromY: number,
}

type Machine = {
    inputs: { Card },
    outputs: { Card },
    outImgs: { Image? },
    tagImgs: { Image? },
    handImg: Image?,
    slotImg: Image?,
    slotDash: Path,
    demoT: number,
    demoK: number,
    demoA: number,
    demoPress: number,
    demoIdx: number,
    failSlot: number,
    curFail: boolean,
    sampler: ImageSampler?,
    icon: Image?,
    iconRect: Path,
    bgRect: Path,
    bgDots: Path,
    borderPath: Path,
    t: number,
    mode: string,         -- idle | feeding | processing | ejecting | hold | resetting
    timer: number,
    active: number,       -- index of the input being processed
    drag: number,         -- index being dragged, 0 = none
    offX: number, offY: number,
    doneCount: number,
    flash: number,
    ghostIdx: { number },
    ghostA: { number },
    ghostOn: boolean,
    ringAngle: number,
    resetReq: boolean,
    rrect: Path, circle: Path,
    trigger: PropertyTrigger?,
}

local CX, CY = 600, 350
local FW, FH = 128, 160
local ICON = 220
local TAU = math.pi * 2

local function rrectPath(w: number, h: number, r: number): Path
    local p = Path.new()
    local x0, y0, x1, y1 = -w / 2, -h / 2, w / 2, h / 2
    local k = r * 0.5523
    p:moveTo(Vector.xy(x0 + r, y0))
    p:lineTo(Vector.xy(x1 - r, y0))
    p:cubicTo(Vector.xy(x1 - r + k, y0), Vector.xy(x1, y0 + r - k), Vector.xy(x1, y0 + r))
    p:lineTo(Vector.xy(x1, y1 - r))
    p:cubicTo(Vector.xy(x1, y1 - r + k), Vector.xy(x1 - r + k, y1), Vector.xy(x1 - r, y1))
    p:lineTo(Vector.xy(x0 + r, y1))
    p:cubicTo(Vector.xy(x0 + r - k, y1), Vector.xy(x0, y1 - r + k), Vector.xy(x0, y1 - r))
    p:lineTo(Vector.xy(x0, y0 + r))
    p:cubicTo(Vector.xy(x0, y0 + r - k), Vector.xy(x0 + r - k, y0), Vector.xy(x0 + r, y0))
    p:close()
    return p
end

local function unitCircle(): Path
    local p = Path.new()
    local k = 0.5523
    p:moveTo(Vector.xy(1, 0))
    p:cubicTo(Vector.xy(1, k), Vector.xy(k, 1), Vector.xy(0, 1))
    p:cubicTo(Vector.xy(-k, 1), Vector.xy(-1, k), Vector.xy(-1, 0))
    p:cubicTo(Vector.xy(-1, -k), Vector.xy(-k, -1), Vector.xy(0, -1))
    p:cubicTo(Vector.xy(k, -1), Vector.xy(1, -k), Vector.xy(1, 0))
    p:close()
    return p
end

local function newCard(x: number, y: number, ph: number, alive: boolean): Card
    return {
        homeX = x, homeY = y, x = x, y = y, scale = 1, alpha = if alive then 1 else 0,
        alive = alive, shown = false, phase = ph, image = nil,
        returning = 0, fromX = x, fromY = y,
    }
end

local function pulse(self: Machine, ph: number, period: number): number
    -- 0..1 smooth
    return 0.5 - 0.5 * math.cos((self.t / period + ph) * TAU)
end

local function easeOut(t: number): number return 1 - (1 - t) * (1 - t) * (1 - t) end
local function easeIn(t: number): number return t * t * t end
local function clamp01(v: number): number return math.max(0, math.min(1, v)) end

local function easeInOut(t: number): number
    return if t < 0.5 then 2 * t * t else 1 - 2 * (1 - t) * (1 - t)
end

-- dotted line (round-capped zero-length dashes), marching toward (x1, y1)
local function dotLine(x0: number, y0: number, x1: number, y1: number, gap: number, offset: number): Path
    local p = Path.new()
    local dx, dy = x1 - x0, y1 - y0
    local len = math.sqrt(dx * dx + dy * dy)
    local ux, uy = dx / len, dy / len
    local d = offset % gap
    while d < len do
        p:moveTo(Vector.xy(x0 + ux * d, y0 + uy * d))
        p:lineTo(Vector.xy(x0 + ux * d + 0.01, y0 + uy * d + 0.01))
        d += gap
    end
    return p
end

local function dashedOutline(base: Path, dash: number, gap: number): Path
    local out = Path.new()
    local m = base:measure()
    local len = m.length
    local d = 0.0
    while d < len do
        m:extract(d, math.min(d + dash, len), out)
        d += dash + gap
    end
    return out
end

local function resetScene(self: Machine)
    for _, c in self.inputs do
        c.alive = true; c.x = c.homeX; c.y = c.homeY; c.scale = 1; c.returning = 0
    end
    self.drag = 0
    self.active = 0
    self.doneCount = 0
    self.flash = 0
    self.failSlot = math.random(1, 3)
    self.demoT = -0.6
    self.ghostOn = true
    for i = 1, 3 do self.ghostIdx[i] = 0; self.ghostA[i] = 0 end
end

local function init(self: Machine, context: Context): boolean
    local names = { 'input-1', 'input-2', 'input-3' }
    local onames = { 'output-1', 'output-2', 'output-3' }
    for i = 1, 3 do
        self.inputs[i].image = context:image(names[i])
        self.outImgs[i] = context:image(onames[i])
    end
    self.icon = context:image('machine-icon')
    local tn = { 'tag-edited', 'tag-pass', 'tag-fail', 'tag-reedited' }
    for i = 1, 4 do self.tagImgs[i] = context:image(tn[i]) end
    self.handImg = context:image('hand')
    self.slotImg = context:image('slot-placeholder')
    self.failSlot = math.random(1, 3)
    self.sampler = ImageSampler('clamp', 'clamp', 'bilinear')
    local vm = context:viewModel()
    if vm then
        local trig = vm:getTrigger('reset')
        if trig then
            trig:addListener(self, function(s: Machine) s.resetReq = true end)
        end
    end
    return true
end

local function hitCard(c: Card, p: Vector): boolean
    return math.abs(p.x - c.x) < FW / 2 * c.scale and math.abs(p.y - c.y) < FH / 2 * c.scale
end

local function pointerDown(self: Machine, event: PointerEvent)
    if self.drag ~= 0 then return end
    local p = event.position
    for i = 3, 1, -1 do
        local c = self.inputs[i]
        if c.alive and c.alpha > 0.9 and c.returning == 0 and hitCard(c, p) then
            self.drag = i
            self.offX = c.x - p.x
            self.offY = c.y - p.y
            event:hit()
            return
        end
    end
end

local function pointerMove(self: Machine, event: PointerEvent)
    if self.drag == 0 then return end
    local c = self.inputs[self.drag]
    c.x = event.position.x + self.offX
    c.y = event.position.y + self.offY
    event:hit()
end

local function release(self: Machine, event: PointerEvent?)
    if self.drag == 0 then return end
    local i = self.drag
    local c = self.inputs[i]
    self.drag = 0
    local dist = Vector.distance(Vector.xy(c.x, c.y), Vector.xy(CX, CY))
    if dist < 150 and self.mode == 'idle' then
        self.mode = 'feeding'
        self.timer = 0
        self.curFail = (self.doneCount + 1) == self.failSlot
        self.active = i
        c.fromX = c.x; c.fromY = c.y
    else
        c.returning = 0.0001 -- snap back
        c.fromX = c.x; c.fromY = c.y
    end
    if event then event:hit() end
end

local function pointerUp(self: Machine, event: PointerEvent) release(self, event) end
local function pointerExit(self: Machine, event: PointerEvent) release(self, event) end

local function advance(self: Machine, dt: number): boolean
    dt = math.min(dt, 0.05)
    self.t += dt
    self.timer += dt
    self.ringAngle += dt * TAU * 0.9
    if self.flash > 0 then self.flash = math.max(0, self.flash - dt / 0.3) end

    if self.resetReq then
        self.resetReq = false
        self.mode = 'resetting'; self.timer = 0
        self.drag = 0
        self.ghostOn = false
    end

    -- snap-back animation
    for _, c in self.inputs do
        if c.returning > 0 then
            c.returning += dt
            local k = easeOut(clamp01(c.returning / 0.3))
            c.x = c.fromX + (c.homeX - c.fromX) * k
            c.y = c.fromY + (c.homeY - c.fromY) * k
            if c.returning >= 0.3 then c.returning = 0; c.x = c.homeX; c.y = c.homeY end
        end
    end

    for i = 1, 3 do
        if self.ghostOn then self.ghostA[i] = math.min(1, self.ghostA[i] + dt / 0.5)
        else self.ghostA[i] = math.max(0, self.ghostA[i] - dt / 0.5) end
    end

    -- guiding-hand demo: while idle and untouched, a hand drags the first free input 30% toward the tool
    local target = 0
    for i = 1, 3 do
        if self.inputs[i].alive and self.inputs[i].alpha > 0.9 then target = i; break end
    end
    if self.mode == 'idle' and self.drag == 0 and target > 0 and self.inputs[target].returning == 0 then
        if self.demoIdx ~= target and self.demoT > 0 then self.demoT = -0.4 end
        self.demoT += dt
        self.demoIdx = target
    else
        self.demoT = -0.6
    end
    local tt = if self.demoT >= 0 then self.demoT % 4.0 else -1
    local dk, a, press = 0.0, 0.0, 0.0
    if tt >= 0 then
        if tt < 0.4 then
            a = tt / 0.4
        elseif tt < 0.7 then
            a = 1; press = (tt - 0.4) / 0.3
        elseif tt < 2.0 then
            a = 1; press = 1; dk = 0.3 * easeInOut((tt - 0.7) / 1.3)
        elseif tt < 2.5 then
            a = 1; press = 1; dk = 0.3
        elseif tt < 3.2 then
            a = 1; press = 1; dk = 0.3 * (1 - easeInOut((tt - 2.5) / 0.7))
        elseif tt < 3.6 then
            a = 1 - (tt - 3.2) / 0.4; press = 0
        end
    end
    self.demoK = dk; self.demoA = a; self.demoPress = press

    local mode = self.mode
    if mode == 'feeding' then
        local c = self.inputs[self.active]
        local k = clamp01(self.timer / 0.35)
        local e = easeIn(k)
        c.x = c.fromX + (CX - c.fromX) * e
        c.y = c.fromY + (CY - c.fromY) * e
        c.scale = 1.05 * (1 - e)
        if k >= 1 then
            c.alive = false; c.alpha = 0; c.scale = 1
            self.mode = 'processing'; self.timer = 0
        end
    elseif mode == 'processing' then
        if self.timer >= 3.0 then
            self.mode = 'ejecting'; self.timer = 0
            self.flash = 1
        end
    elseif mode == 'ejecting' then
        if self.timer >= 0.5 then
            local o = self.outputs[self.doneCount + 1]
            o.image = self.outImgs[self.active]
            o.shown = true; o.alpha = 1; o.x = o.homeX; o.y = o.homeY; o.scale = 1
            self.doneCount += 1
            self.ghostIdx[self.doneCount] = self.active
            self.ghostA[self.doneCount] = 0
            self.ghostOn = true
            if self.doneCount >= 3 then
                self.mode = 'hold'; self.timer = 0
            else
                self.mode = 'idle'; self.timer = 0
            end
        end
    elseif mode == 'hold' then
        if self.timer >= 2.5 then self.mode = 'resetting'; self.timer = 0; self.ghostOn = false end
    elseif mode == 'resetting' then
        local k = clamp01(self.timer / 0.5)
        for _, o in self.outputs do if o.shown then o.alpha = 1 - k end end
        for _, c in self.inputs do
            if k < 1 and not c.alive then c.alpha = 0 end
        end
        if self.timer >= 0.5 then
            for _, o in self.outputs do o.shown = false; o.alpha = 0 end
            resetScene(self)
            for _, c in self.inputs do c.alpha = 0 end
            self.mode = 'fadein'; self.timer = 0
        end
    elseif mode == 'fadein' then
        local k = clamp01(self.timer / 0.5)
        for _, c in self.inputs do c.alpha = k end
        if k >= 1 then self.mode = 'idle'; self.timer = 0 end
    end
    return true
end

local PAL_EDGE = Color.rgba(255, 154, 92, 71)
local PAL_GLASS = Color.rgba(24, 15, 10, 184)
local PAL_GREEN = Color.rgb(74, 208, 122)

local function drawCard(self: Machine, r: Renderer, c: Card, x: number, y: number, s: number, alpha: number, glow: number, lift: boolean)
    if alpha <= 0.001 or s <= 0.001 then return end
    r:save()
    r:transform(Mat2D.withScaleAndTranslation(s, s, x, y))
    r:modulateOpacity(alpha)
    -- shadow
    local sh = Paint.with({ style = 'fill', color = Color.rgba(0, 0, 0, if lift then 150 else 80), feather = if lift then 18 else 10 })
    r:save()
    r:transform(Mat2D.withTranslation(0, if lift then 14 else 6))
    r:drawPath(self.rrect, sh)
    r:restore()
    -- glow
    local g = Paint.with({ style = 'fill', color = Color.rgba(255, 184, 119, math.floor(255 * 0.45 * glow)), feather = 22 })
    r:drawPath(self.rrect, g)
    -- backing
    r:drawPath(self.rrect, Paint.with({ style = 'fill', color = PAL_GLASS }))
    -- image
    local img = c.image
    if img and img.width > 0 and self.sampler then
        r:save()
        r:clipPath(self.rrect)
        local k = math.max(FW / img.width, FH / img.height)
        r:transform(Mat2D.withScaleAndTranslation(k, k, 0, 0))
        r:transform(Mat2D.withTranslation(-img.width / 2, -img.height / 2))
        r:drawImage(img, self.sampler, 'srcOver', 1)
        r:restore()
    end
    r:drawPath(self.rrect, Paint.with({ style = 'stroke', thickness = 1, color = PAL_EDGE }))
    r:restore()
end

local function drawThumb(self: Machine, r: Renderer, img: Image?, x: number, y: number, radius: number, alpha: number)
    if not img or img.width <= 0 or not self.sampler then return end
    r:save()
    r:transform(Mat2D.withScaleAndTranslation(radius, radius, x, y))
    r:modulateOpacity(alpha)
    r:clipPath(self.circle)
    r:transform(Mat2D.withScale(1 / radius))
    local k = (radius * 2) / math.min(img.width, img.height)
    r:transform(Mat2D.withScale(k))
    r:transform(Mat2D.withTranslation(-img.width / 2, -img.height / 2))
    r:drawImage(img, self.sampler, 'srcOver', 1)
    r:restore()
end

local function easeOutBack(k: number): number
    local c1 = 1.70158
    local c3 = c1 + 1
    return 1 + c3 * (k - 1) ^ 3 + c1 * (k - 1) ^ 2
end

-- a tag thrown out of the machine: pops out with overshoot, holds, then drifts up and fades
local function drawTag(self: Machine, r: Renderer, idx: number, t: number, t0: number, tf: number, te: number, x: number, y: number, rot: number)
    local img = self.tagImgs[idx]
    if not img or img.width <= 0 or not self.sampler then return end
    if t < t0 or t >= te then return end
    local k = clamp01((t - t0) / 0.45)
    local e = easeOutBack(k)
    local pe = easeOut(k)
    local px = CX + (x - CX) * pe
    local py = CY + (y - CY) * pe
    local alpha = 1.0
    if t > tf then
        local f = clamp01((t - tf) / (te - tf))
        alpha = 1 - f
        py -= 22 * f
    end
    local a = rot + (1 - pe) * 0.9
    r:save()
    r:modulateOpacity(alpha)
    r:transform(Mat2D.withTranslation(px, py))
    r:transform(Mat2D.withRotation(a))
    r:transform(Mat2D.withScale(0.5 * e))
    r:transform(Mat2D.withTranslation(-img.width / 2, -img.height / 2))
    r:drawImage(img, self.sampler, 'srcOver', 1)
    r:restore()
end

local function dotGrid(): Path
    local p = Path.new()
    local step = 24
    for gx = step / 2, 1200, step do
        for gy = step / 2, 700, step do
            p:moveTo(Vector.xy(gx, gy))
            p:lineTo(Vector.xy(gx + 0.01, gy + 0.01))
        end
    end
    return p
end

local function draw(self: Machine, r: Renderer)
    -- n8n-style canvas: dark surface with a dot grid
    r:save()
    r:transform(Mat2D.withTranslation(600, 350))
    r:drawPath(self.bgRect, Paint.with({ style = 'fill', color = Color.rgb(24, 20, 17) }))
    r:restore()
    r:drawPath(self.bgDots, Paint.with({ style = 'stroke', thickness = 2.2, cap = 'round', color = Color.rgba(247, 232, 196, 38) }))
    local mode = self.mode
    local busy = mode == 'feeding' or mode == 'processing' or mode == 'ejecting'
    local dragging = self.drag ~= 0

    -- machine glow level
    local glow = 0.3 + 0.3 * pulse(self, 0, 3)
    if busy then glow = 0.12 elseif dragging then glow = 0.8 end
    local breathe = 1 + 0.03 * pulse(self, 0, 3)

    -- dotted guide lines: each free input -> the tool
    do
        local lineA = if busy then 0.25 else 0.6
        for i, c in self.inputs do
            if c.alive and c.alpha > 0.01 and i ~= self.drag then
                local ddx, ddy = CX - c.homeX, CY - c.homeY
                local dl = math.sqrt(ddx * ddx + ddy * ddy)
                local ux, uy = ddx / dl, ddy / dl
                local edge = (ICON / 2 + 6) / math.max(math.abs(ux), math.abs(uy))
                local tx, ty = CX - ux * (edge + 14), CY - uy * (edge + 14)
                local col = Color.rgba(255, 184, 119, math.floor(255 * lineA * c.alpha))
                local p = dotLine(c.homeX, c.homeY, tx, ty, 16, self.t * 14)
                r:drawPath(p, Paint.with({ style = 'stroke', thickness = 4, cap = 'round', color = col }))
            end
        end
    end

    -- empty output slots: "picture coming" placeholders
    for i, o in self.outputs do
        local sa = if o.shown then 1 - o.alpha else 1
        if sa > 0.01 then
            local p = pulse(self, o.phase, 2.5)
            r:save()
            r:transform(Mat2D.withTranslation(o.homeX, o.homeY))
            r:modulateOpacity(sa)
            r:drawPath(self.rrect, Paint.with({ style = 'fill', color = Color.rgba(24, 15, 10, 120) }))
            local img = self.slotImg
            if img and img.width > 0 and self.sampler then
                r:save()
                r:clipPath(self.rrect)
                r:modulateOpacity(0.25 + 0.1 * p)
                local k = math.max(FW / img.width, FH / img.height)
                r:transform(Mat2D.withScale(k))
                r:transform(Mat2D.withTranslation(-img.width / 2, -img.height / 2))
                r:drawImage(img, self.sampler, 'srcOver', 1)
                r:restore()
                -- shimmer sweep
                r:save()
                r:clipPath(self.rrect)
                local sx = (((self.t * 0.35) + i * 0.3) % 1.4) * 320 - 200
                r:transform(Mat2D.withTranslation(sx, 0))
                r:transform(Mat2D.withRotation(0.35))
                r:drawPath(rrectPath(36, 360, 0), Paint.with({ style = 'fill', color = Color.rgba(247, 232, 196, 40), feather = 14 }))
                r:restore()
            end
            r:drawPath(self.slotDash, Paint.with({ style = 'stroke', thickness = 1.5, cap = 'round', color = Color.rgba(181, 154, 130, math.floor(150 + 60 * p)) }))
            r:restore()
        end
    end

    -- outputs
    for i, o in self.outputs do
        if o.shown then
            local p = pulse(self, o.phase, 2.5 + i * 0.25)
            drawCard(self, r, o, o.x, o.y, 1 + 0.03 * p, o.alpha, 0.3 + 0.3 * p, false)
        end
    end

    -- faint 'before' ghost left of the machine
    for i = 1, 3 do
        local gi = self.ghostIdx[i]
        if gi > 0 and self.ghostA[i] > 0.01 then
            drawCard(self, r, self.inputs[gi], 425, CY + (i - 2) * 125, 0.55, self.ghostA[i] * 0.4, 0, false)
        end
    end

    -- machine
    r:save()
    r:transform(Mat2D.withScaleAndTranslation(breathe, breathe, CX, CY))
    r:drawPath(self.iconRect, Paint.with({ style = 'fill', color = Color.rgba(255, 184, 119, math.floor(255 * 0.5 * glow)), feather = 22 }))
    local icon = self.icon
    if icon and icon.width > 0 and self.sampler then
        local k = ICON / icon.width
        r:save()
        r:transform(Mat2D.withScale(k))
        r:transform(Mat2D.withTranslation(-icon.width / 2, -icon.height / 2))
        r:drawImage(icon, self.sampler, 'srcOver', 1)
        r:restore()
    end
    r:restore()

    -- done flash
    if self.flash > 0 then
        r:save()
        r:transform(Mat2D.withScaleAndTranslation(150, 150, CX, CY))
        r:drawPath(self.circle, Paint.with({ style = 'fill', color = Color.rgba(74, 208, 122, math.floor(255 * 0.6 * self.flash)), feather = 0.3 }))
        r:restore()
    end

    -- green arc
    if mode == 'processing' or mode == 'ejecting' then
        local a = 1.0
        if mode == 'ejecting' then a = 1 - clamp01(self.timer / 0.2) end
        if a > 0 then
            r:save()
            r:modulateOpacity(a)
            r:transform(Mat2D.withTranslation(CX, CY))
            local m = self.borderPath:measure()
            local len = m.length
            local startD = ((self.ringAngle / TAU) % 1) * len
            local endD = startD + len * 0.75
            local seg = Path.new()
            if endD <= len then
                m:extract(startD, endD, seg)
            else
                m:extract(startD, len, seg)
                m:extract(0, endD - len, seg, false)
            end
            r:drawPath(seg, Paint.with({ style = 'stroke', thickness = 4, cap = 'round', color = PAL_GREEN }))
            r:restore()
        end
    end

    -- thrown tags: Edited -> Quality Check (pass) | Edited -> QC fail -> Re-Edited
    if mode == 'processing' or mode == 'ejecting' then
        local t = if mode == 'processing' then self.timer else 3.0 + self.timer
        if self.curFail then
            drawTag(self, r, 1, t, 0.15, 0.9, 1.3, CX + 150, CY - 165, -0.10)
            drawTag(self, r, 3, t, 0.9, 1.7, 2.1, CX + 155, CY + 165, 0.09)
            drawTag(self, r, 4, t, 1.8, 2.6, 3.2, CX + 145, CY - 165, -0.07)
        else
            drawTag(self, r, 1, t, 0.2, 1.3, 1.8, CX + 150, CY - 165, -0.10)
            drawTag(self, r, 2, t, 1.4, 2.5, 3.2, CX + 155, CY + 165, 0.09)
        end
    end

    -- orbiting thumbnail
    local active = self.inputs[math.max(1, self.active)]
    if mode == 'processing' then
        local ang = (self.timer / 3.0) * TAU * 2.5
        local tx = CX + math.cos(ang) * ICON / 3
        local ty = CY + math.sin(ang) * ICON / 3
        local inK = clamp01(self.timer / 0.2)
        drawThumb(self, r, active.image, tx, ty, 30 * inK, 1)
    end

    -- inputs (non-dragged first)
    for i, c in self.inputs do
        if (c.alive or mode == 'feeding' and self.active == i) and i ~= self.drag then
            local p = pulse(self, c.phase, 2.5 + i * 0.25)
            local s = c.scale * (1 + 0.03 * p)
            if mode == 'feeding' and self.active == i then s = c.scale end
            local dx, dy, lift = c.x, c.y, false
            if i == self.demoIdx and self.demoK > 0.001 then
                dx = c.x + (CX - c.x) * self.demoK
                dy = c.y + (CY - c.y) * self.demoK
                s = 1.05; lift = true
            end
            if not lift then drawCard(self, r, c, dx, dy, s, c.alpha, 0.3 + 0.3 * p, false) end
        end
    end
    if self.demoIdx > 0 and self.demoK > 0.001 and self.inputs[self.demoIdx].alive and self.drag ~= self.demoIdx then
        local c = self.inputs[self.demoIdx]
        drawCard(self, r, c, c.x + (CX - c.x) * self.demoK, c.y + (CY - c.y) * self.demoK, 1.05, c.alpha, 0.9, true)
    end

    -- guiding hand
    if self.demoA > 0.01 and self.demoIdx > 0 and self.handImg and self.sampler and self.handImg.width > 0 then
        local c = self.inputs[self.demoIdx]
        local hx = c.x + (CX - c.x) * self.demoK + 22
        local hy = c.y + (CY - c.y) * self.demoK + 12
        local hs = 0.5 * (1 - 0.1 * self.demoPress)
        local img = self.handImg
        r:save()
        r:modulateOpacity(self.demoA)
        r:transform(Mat2D.withTranslation(hx, hy))
        r:transform(Mat2D.withScale(hs))
        r:transform(Mat2D.withTranslation(-27, -2))
        r:drawImage(img, self.sampler, 'srcOver', 1)
        r:restore()
    end
    if self.drag ~= 0 then
        local c = self.inputs[self.drag]
        drawCard(self, r, c, c.x, c.y, 1.05, 1, 0.9, true)
    end

    -- ejecting card flying to slot
    if mode == 'ejecting' then
        local o = self.outputs[self.doneCount + 1]
        o.image = self.outImgs[self.active]
        local k = clamp01(self.timer / 0.5)
        local e = easeOut(k)
        local x = CX + (o.homeX - CX) * e
        local y = CY + (o.homeY - CY) * e
        local grow = clamp01(self.timer / 0.2)
        local s = 0.28 + (1.1 - 0.28) * easeOut(grow)
        if k > 0.7 then s = 1.1 - 0.1 * clamp01((k - 0.7) / 0.3) end
        drawCard(self, r, o, x, y, s, 1, 0.3, false)
    end
end

return function(context: Context): Node<Machine>
    return {
        inputs = {
            newCard(160, 150, 0.0, true),
            newCard(250, 350, 0.33, true),
            newCard(130, 550, 0.66, true),
        },
        outputs = {
            newCard(1000, 130, 0.15, false),
            newCard(1000, 350, 0.5, false),
            newCard(1000, 570, 0.85, false),
        },
        outImgs = { nil, nil, nil }, tagImgs = { nil, nil, nil, nil }, handImg = nil, slotImg = nil, slotDash = dashedOutline(rrectPath(FW, FH, 12), 9, 7), demoT = -0.6, demoK = 0, demoA = 0, demoPress = 0, demoIdx = 0, failSlot = 1, curFail = false,
        sampler = nil, icon = nil, bgRect = rrectPath(1200, 700, 0), bgDots = dotGrid(), iconRect = rrectPath(ICON - 10, ICON - 10, 46), borderPath = rrectPath(ICON + 18, ICON + 18, 58), t = 0, mode = 'idle', timer = 0, active = 0, drag = 0,
        offX = 0, offY = 0, doneCount = 0, flash = 0, ghostIdx = { 0, 0, 0 }, ghostA = { 0, 0, 0 }, ghostOn = true, ringAngle = 0, resetReq = false,
        rrect = rrectPath(FW, FH, 12), circle = unitCircle(), trigger = nil,
        init = init, advance = advance, draw = draw,
        pointerDown = pointerDown, pointerMove = pointerMove,
        pointerUp = pointerUp, pointerExit = pointerExit,
    }
end
