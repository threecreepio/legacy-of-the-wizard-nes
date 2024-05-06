-- Visualizer for Legacy of the Wizard
-- Should work in FCEUX and Mesen
-- v0.1.0
-- /threecreepio

-- Drop table: https://docs.google.com/spreadsheets/d/1jm-39KrXKhTtQMPnYZc7qCTcA01ppT4-GJjhceCK5TY/edit#gid=1804017040

local fceux = memory ~= nil

local rngentities = {}
local callers = {}
local callers_n = 1
local steps = 0

local enemy_names = {}
enemy_names[2] = "HP"
enemy_names[3] = "Mana"
enemy_names[4] = "Gold"
enemy_names[5] = "Poison"
enemy_names[6] = "Key"
enemy_names[7] = "Poison"
enemy_names[8] = "Cross"
enemy_names[9] = "Scroll"

function eachFrame()
    local rng0 = mem_readbyte(0x39)
    local rng1 = mem_readbyte(0x3A)
    local rng2 = mem_readbyte(0x3B)
    if rng0 == 0x3E and rng1 == 0xBB and rng2 == 0x1A then
        -- we just set up the password manip, so, clear the rng steps.
        write16(0x6010, 0)
    end

    -- count down rng
    for i=0,14 do
        local rngcolor = mem_readbyte(0x6000 + i)
        if rngcolor > 0 then mem_writebyte(0x6000 + i, rngcolor - 1) end
    end
end

function printInfo()
  local inp = input_get()

  -- cover statusbar area
  gui_rect(8, 9, 187, 26, 0x000000)
  
  -- draw map
  local map_x = 7
  local map_y = 10
  local pxsize = 1
  local pysize = 2
  local map_right = map_x + (0x40 * pxsize) + 1
  local map_bottom = map_y + (12 * pysize) + 1
  
  local cam_x = mem_readbyte(0x7C) * 0x10 + mem_readbyte(0x7B)
  gui_rect(map_x - 1, map_y - 1, map_right - map_x, map_bottom - map_y, 0xAAAAAA)

  -- show all foreground tiles on map
  for x=0,0x3F do
      for y=0,11 do
        local blk = AND(0x3F, mem_readbyte(0x500 + x * 12 + y))
        if blk >= 0x30 then
            local xx = map_x + (x * pxsize)
            local yy = map_y + (y * pysize)
            gui_rect(xx, yy, pxsize-1, pysize-1, 0x000000)
        end
      end
  end

  -- active viewport highlight
  local viewport_start_x = ((cam_x / 0x10) * pxsize) - 1
  local viewport_end_x = viewport_start_x + (0x10 * pxsize)
  gui_line(map_x + viewport_start_x, map_y - 1, map_x + viewport_end_x, map_y - 1, 0xFFFFFF)
  gui_line(map_x + viewport_start_x, map_y + (12 * pysize) + 1, map_x + viewport_end_x, map_y + (12 * pysize) + 1, 0xFFFFFF)

  local enemies_active = 0
  for i=0,14 do
    local mem = 0x400 + (i * 0x10)
    local state = mem_readbyte(mem + 1)
    if state ~= 0 then
      local x = (mem_readbyte(mem + 0xD) * 0x10) + mem_readbyte(mem + 0xC)
      local y = mem_readbyte(mem + 0xE)
      local type = mem_readbyte(mem + 1)
      local hp = mem_readbyte(mem + 5)

      local mx = map_x + ((x / 0x10) * pxsize) + (pxsize - 1)
      local my = map_y + ((y / 0x10) * pysize) + (pysize - 1)
      local color = 0x00FF00
      local rngcolor = mem_readbyte(0x6000 + i)
      if rngcolor > 0 then
        color = 0xff00ff
        if rngcolor >= 0x10 then color = 0xFF0000 end
      end
      gui_pixel(mx, my, color)

      local scrx = x - cam_x + 2
      local scry = y + 0x30

      
      -- hover check minimap
      local hovering = inp.xmouse >= mx -1 and inp.xmouse <= mx + 1 and inp.ymouse >= my - 1 and inp.ymouse <= my + 1
      -- hover check game area
      if hovering == false then hovering = inp.xmouse >= scrx and inp.xmouse <= scrx + 0x10 and inp.ymouse >= scry and inp.ymouse <= scry + 0x10 end

      if hovering or inp.xmouse >= map_x and inp.xmouse <= map_right + 0x10 and inp.ymouse >= map_y and inp.ymouse <= map_bottom then
        local clr = 0x00FF00
        if hovering then clr = 0xff00ff end
        str(scrx, scry, string.format("%d", i), clr)
        local enemy_name = enemy_names[type]
        gui_text(
            0, map_bottom + 8 + enemies_active * 8,
            string.format("%1X - %02X %s - %d", i, type, enemy_name or "", hp),
            clr
        )
      end

      hpbar(scrx - 2, scry - 5, hp)

      enemies_active = enemies_active + 1
    end
  end
    
  str(map_right + 0x04, 11, string.format("L%02d", mem_readbyte(0x58)))
  str(map_right + 0x04, 11+8, string.format("M%02d", mem_readbyte(0x59)))
  str(map_right + 0x1A, 11, string.format("G%02d", mem_readbyte(0x5A)))
  str(map_right + 0x1A, 11+8, string.format("K%02d", mem_readbyte(0x5B)))

  local speedremains = mem_readbyte(0x88)
  local speedcount = 0
  if mem_readbyte(0x8B) > 0 then speedcount = 4
  elseif mem_readbyte(0x8A) > 0 then speedcount = 3
  elseif mem_readbyte(0x89) > 0 then speedcount = 2
  elseif mem_readbyte(0x88) > 0 then speedcount = 1
  end
  str(map_right + 0x04, 11+16, string.format("S%02d", speedcount))
  str(map_right + 0x1A, 11+16, string.format("%3d", speedremains))

  str(map_right + 75, 11, string.format("RNG%5d", read16(0x6010)))
  str(map_right + 75, 11+8, string.format("%02X %02X %02X",
    mem_readbyte(0x39),
    mem_readbyte(0x3A),
    mem_readbyte(0x3B)
  ))
  
  if inp.xmouse > map_right + 75 and inp.xmouse < map_right + 75 + 50 and inp.ymouse < 20 then
    for i=1,#callers do
        gui_text(0, 30 + i * 10, string.format("%4X Enemy %d 00-%02d (step %d, frame %d)", callers[i].caller, callers[i].entity, callers[i].ubound, callers[i].steps, callers[i].frame))
    end
  end
end

function hpbar(x, y, value)
    if value == 0 then return end
    local hp = value / 0x2
    for i=0,hp/0x10 do
        local n = hp - (i * 0x10)
        if n > 0x10 then n = 0x10 end
        gui_rect(x, y-i, 0x10, 0, 0xFF0000)
        gui_rect(x, y-i, n, 0, 0x00FF00)
    end
end

function onRNGStep()
    steps = steps + 1
end

function onRNG()
    local sp = emu_getregister_s()
    local call0 = mem_readbyte(OR(0x100, AND(sp+1, 0xFF)))
    local call1 = mem_readbyte(OR(0x100, AND(sp+2, 0xFF)))
    write16(0x6010, (read16(0x6010) + steps) % 0x4000)
    steps = 0

    local c = {}
    c.caller = OR(call1 * 0x100, call0)
    c.ubound = mem_readbyte(0x38)
    c.frame = emu_framecount()
    c.steps = read16(0x6010)
    c.entity = mem_readbyte(0xE3)

    mem_writebyte(0x6000 + c.entity, 0x10)

    local max_stored = 16
    callers[callers_n] = c
    callers_n = callers_n + 1
    if callers_n > max_stored then
        for n=1,max_stored do
            callers[n] = callers[n+1]
        end
        callers_n = max_stored
    end
end


if fceux then
    emu.registerafter(eachFrame)
    gui.register(printInfo)
    memory.registerexec(0xCC8E, 1, onRNG)
    memory.registerexec(0xCC6C, 1, onRNGStep)
else
    -- assume mesen
    emu.addEventCallback(eachFrame, emu.eventType.endFrame)
    emu.addEventCallback(printInfo, emu.eventType.startFrame)
    emu.addMemoryCallback(onRNG, emu.memCallbackType.cpuExec, 0xCC8E)
    emu.addMemoryCallback(onRNGStep, emu.memCallbackType.cpuExec, 0xCC6C)
end

---- under this is an attempt to make mesen and fceux play nice

function write16(addr, value)
    --mem_writebyte(addr+0, value / 0x1000000)
    --mem_writebyte(addr+1, value / 0x10000)
    mem_writebyte(addr+2, value / 0x100)
    mem_writebyte(addr+3, value / 0x1)
end

function read16(addr)
    local v = (
        --(mem_readbyte(addr+0) * 0x1000000) +
        --(mem_readbyte(addr+1) * 0x10000) +
        (mem_readbyte(addr+2) * 0x100) +
        (mem_readbyte(addr+3) * 0x1)
    )
    return v
end

local persist = {}

function pers_readbyte(b)
  return emu.read(0x380 + (b - 0x6000), emu.memType.cpuDebug)
end

function pers_writebyte(b, value)
    emu.write(0x380 + (b - 0x6000), AND(0xFF, value), emu.memType.cpuDebug)
end

function mem_readbyte(b)
    if fceux then
        return memory.readbyte(b)
    else
        if b >= 0x6000 then return pers_readbyte(b) or 0 end
        return emu.read(b, emu.memType.cpuDebug)
    end
end

function mem_writebyte(b, value)
    if fceux then
        memory.writebyte(b, value)
    else
        if b >= 0x6000 then return pers_writebyte(b, value) end
        emu.write(b, math.floor(value), emu.memType.cpuDebug)
    end
end

function emu_framecount()
    if fceux then
        return emu.framecount()
    else
        local st = emu.getState()
        return st.ppu.frameCount
    end
end

function emu_getregister_s()
    if fceux then
        return memory.getregister('s')
    else
        local st = emu.getState()
        return st.cpu.sp
    end
end

function gui_rect(x, y, w, h, clr)
    if fceux then
        gui.rect(x, y, x + w, y + h, fmtclr(clr))
    else
        emu.drawRectangle(x, y, w+1, h+1, clr, true)
    end
end

function gui_line(x, y, x2, y2, clr)
    if fceux then
        gui.line(x, y, x2, y2, fmtclr(clr))
    else
        emu.drawLine(x, y, x2, y2, clr)
    end
end

function gui_pixel(x, y, clr)
    if fceux then
        gui.pixel(x, y, fmtclr(clr))
    else
        emu.drawPixel(x, y, clr)
    end
end

function gui_text(x, y, txt, clr, bgclr)
    if fceux then
        gui.text(x, y, txt, fmtclr(clr), fmtclr(bgfmt))
    else
        emu.drawString(x, y, txt, clr)
    end
end

function fmtclr(value)
    if value == nil then return nil end
    if value >= 0x01000000 then return string.format("#%08X", value) end
    return string.format("#%06X", value)
end

function input_get()
  if fceux then
    return input.get()
  else
    local ms = emu.getMouseState()
    return { ymouse = ms.y, xmouse = ms.x }
  end
end


if AND == nil then
  -- so, mesen doesnt have bit or bit32, since it has & | etc.
  -- problem is that those operators are pretty new in lua so fceux doesn't support them
  -- and i want this script to run in both. so we're doing this in mesen.
  function AND(a, b)
    local aa = math.floor(a)
    while aa > 0x10000 do aa = aa - 0x10000 end
    local bb = math.floor(b)
    while bb > 0x10000 do bb = bb - 0x10000 end
    local n = 0
    local i = 0x8000
    while i > 0.9999 do
      if aa >= i and bb >= i then n = n + i end
      if bb >= i then bb = bb - i end
      if aa >= i then aa = aa - i end
      i = i / 2
    end
    return n
  end
  function OR(a, b)
    local aa = math.floor(a)
    while aa > 0x10000 do aa = aa - 0x10000 end
    local bb = math.floor(b)
    while bb > 0x10000 do bb = bb - 0x10000 end
    local n = 0
    local i = 0x8000
    while i > 0.9999 do
      if aa >= i or bb >= i then n = n + i end
      if bb >= i then bb = bb - i end
      if aa >= i then aa = aa - i end
      i = i / 2
    end
    return n
  end
end

function str(x, y, text, color)
    gui_text(x, y, text, color or 0xFFFFFF, 0x000000)
end
