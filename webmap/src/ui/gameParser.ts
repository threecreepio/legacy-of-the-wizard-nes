type Room = {
    id: number;
    gridX: number;
    gridY: number;
    data: number[];
    palette: number[];
    enemies: number[];
    
    metatileTable: number;
    enemygfx: number;
    blockSwapFrom: number;
    blockSwapTo: number;
    blockBreakTo: number;
    chrbank: number;
    areaDataBank: number;
    chestActive: number;
    chestXTile: number;
    chestYPx: number;
    chestItemType: number;

    princessDoorXArea: number;
    princessDoorYArea: number;
    princessDoorXTile: number;
    princessDoorYPx: number;

    shopItem1Type: number;
    shopItem1Cost: number;
    shopItem2Type: number;
    shopItem2Cost: number;
}

export type GameInformation = {
    grid: number[][];
    metatileTables: number[][];
    rooms: Room[];
    chr: Uint8Array;
}

export const legendHeight = 12 * 0x10;
export const roomDrawWidth = 0x400 + 3;
export const roomDrawHeight = (12 * 0x10) + 3;
export const roomsWidth = 4;
export const roomsHeight = 0x12;

const commonPalette = [
    0x0F, 0x0F, 0x30, 0x30,
    0x0F, 0x0F, 0x10, 0x10,
];

const NESPalette = [
    [98, 98, 98],
    [0, 31, 178],
    [36, 4, 200],
    [82, 0, 178],
    [115, 0, 118],
    [128, 0, 36],
    [115, 11, 0],
    [82, 40, 0],
    [36, 68, 0],
    [0, 87, 0],
    [0, 92, 0],
    [0, 83, 36],
    [0, 60, 118],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [171, 171, 171],
    [13, 87, 255],
    [75, 48, 255],
    [138, 19, 255],
    [188, 8, 214],
    [210, 18, 105],
    [199, 46, 0],
    [157, 84, 0],
    [96, 123, 0],
    [32, 152, 0],
    [0, 163, 0],
    [0, 153, 66],
    [0, 125, 180],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [255, 255, 255],
    [83, 174, 255],
    [144, 133, 255],
    [211, 101, 255],
    [255, 87, 255],
    [255, 93, 207],
    [255, 119, 87],
    [250, 158, 0],
    [189, 199, 0],
    [122, 231, 0],
    [67, 246, 17],
    [38, 239, 126],
    [44, 213, 246],
    [78, 78, 78],
    [0, 0, 0],
    [0, 0, 0],
    [255, 255, 255],
    [182, 225, 255],
    [206, 209, 255],
    [233, 195, 255],
    [255, 188, 255],
    [255, 189, 244],
    [255, 198, 195],
    [255, 213, 154],
    [233, 230, 129],
    [206, 244, 129],
    [182, 251, 154],
    [169, 250, 195],
    [169, 240, 244],
    [184, 184, 184],
    [0, 0, 0],
    [0, 0, 0],
];


export async function loadRom(nesrom: Uint8Array) : Promise<GameInformation> {
    const ines = nesrom.slice(0, 0x10);
    const rom = nesrom.slice(0x10);

    // get proper CHR offset for US or JP
    const CHR = rom.slice(ines[4] * 0x4000);

    let metatileTables = [];
    for (let i=0; i<0x30; ++i) {
        const offset = (i * 0x100) + 0x12000;
        metatileTables.push(
            rom.slice(offset, offset + 0x100 * 4)
        );
    }


    // collect the tiles for a single room
    function createRoomData(i: number, x: number, y: number) {
        const screen = rom.slice(0x400 * i, 0x400 * (i + 1))
        return {
            id: i,
            id2: (x * 0x10) | y,
            gridX: x,
            gridY: y,
            
            data: screen.slice(0, 4 * 16 * 12), // each room starts with a full list of tiles, 4 screens wide, 16 tiles wide per screen, 12 tiles high
            metatileTable: screen[0x300],
            enemygfx: screen[0x301],
            blockSwapFrom: screen[0x302],
            blockSwapTo: screen[0x303],
            blockBreakTo: screen[0x304],
            chrbank: screen[0x305],
            areaDataBank: screen[0x306],
            chestActive: screen[0x307],
            chestXTile: screen[0x308],
            chestYPx: screen[0x309],
            chestItemType: screen[0x30A],
            areaMusic: screen[0x30B],
            
            princessDoorXArea: screen[0x30C],
            princessDoorYArea: screen[0x30D],
            princessDoorXTile: screen[0x30E],
            princessDoorYPx: screen[0x30F],
            
            shopItem1Type: screen[0x310],
            shopItem1Cost: screen[0x311],
            shopItem2Type: screen[0x312],
            shopItem2Cost: screen[0x313],
            unk14: screen[0x314],
            unk15: screen[0x315],
            unk16: screen[0x316],
            unk17: screen[0x317],
            unk18: screen[0x318],
            unk19: screen[0x319],
            unk1A: screen[0x31A],
            unk1B: screen[0x31B],
            unk1C: screen[0x31C],
            unk1D: screen[0x31D],
            unk1E: screen[0x31E],
            unk1F: screen[0x31F],
            enemies: screen.slice(0x320, 0x3E0),
            palette: screen.slice(0x3E0, 0x400), // room ends with a full palette table
        }
    }

    // read all the possible rooms
    const rooms = [];
    const grid = [];
    for (let y=0; y<roomsHeight; ++y) {
        grid[y] = [];
        for (let x=0; x<roomsWidth; ++x) {
            const i = x + (y * roomsWidth)
            grid[y][x] = rooms.length;
            rooms.push(createRoomData(i, x, y));
        }
    }

    return {
        grid,
        rooms,
        metatileTables,
        chr: CHR
    }
}



function draw4FromChr(gameData: GameInformation, ctx: CanvasRenderingContext2D, palette: number[], palnum: number, idx: number, x: number, y: number, settings?: any) {
    drawFromChr(gameData, ctx, palette, palnum, idx + 0, x + 0, y + 0, settings ?? { fill: true });
    drawFromChr(gameData, ctx, palette, palnum, idx + 1, x + 0, y + 8, settings ?? { fill: true });
    drawFromChr(gameData, ctx, palette, palnum, idx + 2, x + 8, y + 0, settings ?? { fill: true });
    drawFromChr(gameData, ctx, palette, palnum, idx + 3, x + 8, y + 8, settings ?? { fill: true });
}

export function drawFromChr(gameData: GameInformation, ctx, palette: number[], paletteOffset: number, spr, cvs_x, cvs_y, settings?: any) {
    const dataStart = spr * 0x10;
    for (let y = 0; y < 8; ++y) {
        const byte0 = gameData.chr[dataStart + y];
        const byte1 = gameData.chr[dataStart + y + 8];
        for (let x = 0; x < 8; ++x) {
            if (settings?.dither && ((x + y) % 2) == 0) continue;
            const bit = (byte0 >> x) & 0b01 | ((byte1 >> x) & 0b1) << 1;
            if (!bit && !settings?.fill) continue; // transparent
            const clr = NESPalette[palette[bit + (paletteOffset * 4)] & 0x3F];
            
            ctx.fillStyle = `rgba(${(clr || [0,0,0,0]).join(',')},${settings?.a ?? '1'})`;

            let atX, atY;
            if (!settings?.flipX) atX = cvs_x + (8 - x);
            else atX = cvs_x + x + 1;
            if (settings?.flipY) atY = cvs_y + (7 - y);
            else atY = cvs_y + y;
            ctx.fillRect(atX, atY, 1, 1);
        }
    }
}

const hexes = [
    0x590,
    0x591,
    0x592,
    0x593,
    0x594,
    0x595,
    0x596,
    0x597,
    0x598,
    0x599,
    0x5A1,
    0x5A2,
    0x5A3,
    0x5A4,
    0x5A5,
    0x5A6,
    0x5A7,
];
function drawHexNybble(gameData: GameInformation, ctx: CanvasRenderingContext2D, palette: number[], palnum: number, number: number, cvs_x: number, cvs_y: number, settings?: any) {
    drawFromChr(gameData, ctx, palette, palnum, hexes[number & 0xF], cvs_x, cvs_y, settings ??  { fill: true });
}

function drawText(gameData: GameInformation, ctx: CanvasRenderingContext2D, palette: number[], palnum: number, text: string, cvs_x: number, cvs_y: number, settings?: any) {
    for (let i=0; i<text.length; ++i) {
        let ch = text[i]
        let chr = text.charCodeAt(i);
        let sel = chr;
        if (chr <= '9'.charCodeAt(0) && chr >= '0'.charCodeAt(0))
            sel = 0x860 + (chr - '0'.charCodeAt(0));
        if (chr <= 'O'.charCodeAt(0) && chr >= 'A'.charCodeAt(0))
            sel = 0x881 + (chr - 'A'.charCodeAt(0));
        if (chr <= 'Z'.charCodeAt(0) && chr >= 'P'.charCodeAt(0))
            sel = 0x8A0 + (chr - 'P'.charCodeAt(0));
        if (chr <= 'o'.charCodeAt(0) && chr >= 'a'.charCodeAt(0))
            sel = 0x8C1 + (chr - 'a'.charCodeAt(0));
        if (chr <= 'z'.charCodeAt(0) && chr >= 'p'.charCodeAt(0))
            sel = 0x8E0 + (chr - 'p'.charCodeAt(0));
        if (ch === ' ') sel = 0x840;
        if (ch === '!') sel = 0x841;
        if (ch === '"') sel = 0x842;
        if (ch === '#') sel = 0x843;
        if (ch === '$') sel = 0x844;
        if (ch === '%') sel = 0x845;
        if (ch === '&') sel = 0x846;
        if (ch === "'") sel = 0x847;
        if (ch === '<') sel = 0x848;
        if (ch === '>') sel = 0x849;
        if (ch === '*') sel = 0x84A;
        if (ch === '+') sel = 0x84B;
        if (ch === ',') sel = 0x84C;
        if (ch === '-') sel = 0x84D;
        if (ch === '.') sel = 0x84E;
        if (ch === '/') sel = 0x84F;
        drawFromChr(gameData, ctx, palette, palnum, sel, cvs_x + (i * 8), cvs_y, settings ?? { fill: true });
    }
}

function drawBox(gameData: GameInformation, ctx: CanvasRenderingContext2D, palette: number[], palnum: number, cvs_x: number, cvs_y: number, width: number, height: number, settings?: any) {
    for (let x=0; x<width; ++x) {
        for (let y=0; y<height; ++y) {
            let spr = 0x111;
            if (x === 0 && y === 0) spr = 0x16B;
            else if (x === 0 && y === height-1) spr = 0x17B;
            else if (x === width-1 && y === 0) spr = 0x16C;
            else if (x === width-1 && y === height-1) spr = 0x17C;
            else if (x === 0) spr = 0x103;
            else if (x === width-1) spr = 0x113;
            else if (y === 0) spr = 0x16A;
            else if (y === height-1) spr = 0x17A;
            drawFromChr(gameData, ctx, palette, palnum, spr, cvs_x + (x * 8), cvs_y + (y * 8));
        }
    }
}

function drawVDecNumber(gameData: GameInformation, ctx: CanvasRenderingContext2D, palette: number[], palnum: number, number: number, cvs_x: number, cvs_y: number, settings?: any) {
    let x = [10000, 1000, 100, 10, 1];
    let ofs = 0;
    for (let i=0; i<x.length; ++i) {
        if (x[i] > number) continue;
        let value = ((number / x[i]) % 10) | 0;
        drawFromChr(gameData, ctx, palette, palnum, hexes[value], cvs_x + (ofs), cvs_y, settings ?? { fill: true });
        ofs += 8;
    }
}

function drawMetatile(gameData: GameInformation, ctx: CanvasRenderingContext2D, room: Room, tiled: number, cvs_x: number, cvs_y: number, settings?: any) {
    const tile = tiled & 0b00111111;
    const tilepal = (tiled >> 6) & 0b11;
    const metatileTable = gameData.metatileTables[room.metatileTable];
    for (let tx=0; tx<2; ++tx) {
        for (let ty=0; ty<2; ++ty) {
            let tt = metatileTable[(tile * 4) + (tx * 2) + ty] + (0x40 * room.chrbank);
            drawFromChr(gameData, ctx, room.palette, tilepal, tt, cvs_x + (tx * 8), 0 + cvs_y + (ty * 8), settings);
        }
    }
}

function redrawLegend(gameData: GameInformation, ctx: CanvasRenderingContext2D) {
    const room = gameData.rooms[67];
    const tileData = room.data.slice(12 * 25);
    for (let dx=0; dx<0x30*5+16; ++dx) {
        let x = dx;
        if (x > 0x26) x = 0x26;
        let xofs = ((dx / 0x40) | 0) * 3;
        for (let y=0; y<12; ++y) {
            drawMetatile(gameData, ctx, room, tileData[x * 12 + y], xofs + (dx * 0x10), y * 0x10, { a: 0.5 });
        }
    }

    drawBox(gameData, ctx, commonPalette, 0, 0x008, 0x10, 0x30, 0x0E);
    drawText(gameData, ctx, room.palette, 1, "Legacy of the Wizard Map", 0x010, 0x18, {});
    drawText(gameData, ctx, room.palette, 1, "This map shows every shop, chest, inn and", 0x010, 0x28, {});
    drawText(gameData, ctx, room.palette, 1, "all enemies in the game.", 0x010, 0x30, {});
    drawText(gameData, ctx, room.palette, 1, "Enemies are shown with", 0x010, 0x40, {});
    drawText(gameData, ctx, room.palette, 1, "their HP and damage.", 0x010, 0x48, {});
    drawText(gameData, ctx, room.palette, 1, "Breakable tiles are dimmed out a bit.", 0x010, 0x58, {});
    drawText(gameData, ctx, room.palette, 1, "GL!", 0x010, 0x70, {});
    drawText(gameData, ctx, room.palette, 1, "/Threecreepio", 0x110, 0x70, {});

    // description of enemies
    draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, 0x900, 0xD8, 0x40, { fill: false });
    drawVDecNumber(gameData, ctx, commonPalette, 1, 20, 0xD8+8, 0x40, { alpha: 0.5, fill: true });
    drawText(gameData, ctx, commonPalette, 0, "<Hitpoints", 0xD8 + 0x18, 0x40, {});
    drawVDecNumber(gameData, ctx, commonPalette, 1, 1, 0xD8+8, 0x40+8, { alpha: 0.5, fill: true });
    drawText(gameData, ctx, commonPalette, 0, "<Damage", 0xD8 + 0x18, 0x40+8, {});

    // shops!
    {
        const dialogx = 0x400 + 3;
        const dialogy = 0x10;

        drawBox(gameData, ctx,  commonPalette, 0,                    dialogx+0x0, dialogy+0x00, 0x10, 0x13);
        drawText(gameData, ctx, commonPalette, 0, "Shops",          dialogx+0x8, dialogy+0x08);
        
        drawText(gameData, ctx, commonPalette, 0, "These are the",  dialogx+0x8, dialogy+0x18);
        drawText(gameData, ctx, commonPalette, 0, "X/Y locations",  dialogx+0x8, dialogy+0x20);
        drawText(gameData, ctx, commonPalette, 0, "and items for",  dialogx+0x8, dialogy+0x28);
        drawText(gameData, ctx, commonPalette, 0, "each shop.",     dialogx+0x8, dialogy+0x30);

        drawText(gameData, ctx, commonPalette, 0, "The X/Y of a",   dialogx+0x8, dialogy+0x40);
        drawText(gameData, ctx, commonPalette, 0, "room is shown",  dialogx+0x8, dialogy+0x48);
        drawText(gameData, ctx, commonPalette, 0, "in the topleft", dialogx+0x8, dialogy+0x50);
        drawText(gameData, ctx, commonPalette, 0, "corner of the",  dialogx+0x8, dialogy+0x58);
        drawText(gameData, ctx, commonPalette, 0, "map below!",     dialogx+0x8, dialogy+0x60);

        let found = 0;
        for (let r=0; r<gameData.rooms.length; ++r) {
            const room = gameData.rooms[r];
            if (room.shopItem1Cost === 0 || room.shopItem1Cost > 150) continue;
            if (room.gridY >= 0x10) continue;
            if (room.id === 33) continue;

            const startx = dialogx + (0x11 * 8);
            const starty = 0x10;

            const pxx = startx + ((found / 4) | 0) * 0x50;
            const pxy = starty + ((found % 4) | 0) * 0x28;

            drawBox(gameData, ctx, commonPalette, 0, pxx, pxy, 0x09, 0x4);
            
            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridX, pxx + 0x10, pxy + 0x08);
            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridY, pxx + 0x10, pxy + 0x10);

            drawText(gameData, ctx, commonPalette, 0, "X", pxx + 0x08, pxy + 0x08);
            drawText(gameData, ctx, commonPalette, 0, "Y", pxx + 0x08, pxy + 0x10);

            const gfx1 = 0xF80 + ((8 + room.shopItem1Type) * 4);
            draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, gfx1, pxx + 0x20 - 4, pxy + 0x05);
            drawVDecNumber(gameData, ctx, commonPalette, 0, room.shopItem1Cost, pxx + 0x20 - 4, pxy + 0x12);

            const gfx2 = 0xF80 + ((8 + room.shopItem2Type) * 4);
            draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, gfx2, pxx + 0x30, pxy + 0x05);
            drawVDecNumber(gameData, ctx, commonPalette, 0, room.shopItem2Cost, pxx + 0x30, pxy + 0x12);

            found += 1;
        }
    }

    {
        const baseX = 0x800 + 6;
        const baseY = 0x10;

        drawBox(gameData, ctx,  commonPalette, 0, baseX, baseY, 0x10, 0x13);
        drawText(gameData, ctx, commonPalette, 0, "Chests", baseX + 0x08, baseY + 0x08);
        
        drawText(gameData, ctx, commonPalette, 0, "X/Y locations", baseX + 0x08, baseY + 0x18);
        drawText(gameData, ctx, commonPalette, 0, "of each item", baseX + 0x08, baseY + 0x20);
        drawText(gameData, ctx, commonPalette, 0, "in a chest.", baseX + 0x08, baseY + 0x28);

        drawText(gameData, ctx, commonPalette, 0, "The X/Y of a", baseX + 0x08, baseY + 0x40);
        drawText(gameData, ctx, commonPalette, 0, "room is shown", baseX + 0x08, baseY + 0x48);
        drawText(gameData, ctx, commonPalette, 0, "in the topleft", baseX + 0x08, baseY + 0x50);
        drawText(gameData, ctx, commonPalette, 0, "corner of the", baseX + 0x08, baseY + 0x58);
        drawText(gameData, ctx, commonPalette, 0, "map below!", baseX + 0x08, baseY + 0x60);

        
        let found = 0;
        for (let r=0; r<gameData.rooms.length; ++r) {
            const room = gameData.rooms[r];
            if (room.gridY >= 0x10) continue;
            if (!room.chestActive) continue;

            const startx = baseX + (0x11 * 0x08);
            const starty = 0x10;

            const pxx = startx + ((found / 4) | 0) * 0x38;
            const pxy = starty + ((found % 4) | 0) * 0x28;

            drawBox(gameData, ctx, commonPalette, 0, pxx, pxy, 0x06, 0x4);

            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridX, pxx + 0x10, pxy + 0x08);
            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridY, pxx + 0x10, pxy + 0x10);

            drawText(gameData, ctx, commonPalette, 0, "X", pxx + 0x08, pxy + 0x08);
            drawText(gameData, ctx, commonPalette, 0, "Y", pxx + 0x08, pxy + 0x10);

            
            const gfx = 0xF80 + (room.chestItemType * 4);
            draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, gfx, pxx + 0x1A, pxy + 0x08);


            found += 1;
        }
    }


    {
        const baseX = 0xC00 + 9;
        const baseY = 0x10;

        drawBox(gameData, ctx,  commonPalette, 0, baseX, baseY, 0x10, 0x13);
        drawText(gameData, ctx, commonPalette, 0, "Inns", baseX + 0x08, baseY + 0x08);
        
        drawText(gameData, ctx, commonPalette, 0, "X/Y locations", baseX + 0x08, baseY + 0x18);
        drawText(gameData, ctx, commonPalette, 0, "of each inn", baseX + 0x08, baseY + 0x20);
        drawText(gameData, ctx, commonPalette, 0, "in the game.", baseX + 0x08, baseY + 0x28);

        drawText(gameData, ctx, commonPalette, 0, "The X/Y of a", baseX + 0x08, baseY + 0x40);
        drawText(gameData, ctx, commonPalette, 0, "room is shown", baseX + 0x08, baseY + 0x48);
        drawText(gameData, ctx, commonPalette, 0, "in the topleft", baseX + 0x08, baseY + 0x50);
        drawText(gameData, ctx, commonPalette, 0, "corner of the", baseX + 0x08, baseY + 0x58);
        drawText(gameData, ctx, commonPalette, 0, "map below!", baseX + 0x08, baseY + 0x60);

        
        let found = 0;
        for (let r=0; r<gameData.rooms.length; ++r) {
            const room = gameData.rooms[r];
            if (room.gridY >= 0x10) continue;
            const innLocation = room.data.findIndex(d => (d & 0x3F) === 4);
            if (innLocation === -1) continue;

            const startx = baseX + (0x11 * 0x08);
            const starty = 0x10;

            const pxx = startx + ((found / 4) | 0) * 0x28;
            const pxy = starty + ((found % 4) | 0) * 0x28;

            drawBox(gameData, ctx, commonPalette, 0, pxx, pxy, 0x4, 0x4);

            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridX, pxx + 0x10, pxy + 0x08);
            drawHexNybble(gameData, ctx, commonPalette, 0, room.gridY, pxx + 0x10, pxy + 0x10);

            drawText(gameData, ctx, commonPalette, 0, "X", pxx + 0x08, pxy + 0x08);
            drawText(gameData, ctx, commonPalette, 0, "Y", pxx + 0x08, pxy + 0x10);

            found += 1;
        }
    }
}


export async function redrawFullMap(gameData: GameInformation, canvas: HTMLCanvasElement) {
    canvas.height = roomDrawHeight * (roomsHeight - 2) + legendHeight;
    canvas.width = (roomDrawWidth * roomsWidth);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let pending : Array<() => void> = [];
    for (let i=0; i<gameData.rooms.length; ++i) {
        pending.push(() => {
            drawRoom(gameData, ctx, i);
        });
    }
    function drawNextRoom() {
        if (!pending.length) return;
        pending.shift()();
        window.requestAnimationFrame(drawNextRoom);
    }
    redrawLegend(gameData, ctx);
    drawNextRoom();
}

export function drawRoom(gameData: GameInformation, ctx: CanvasRenderingContext2D, index: number) {
    const room = gameData.rooms[index];
    ctx.fillStyle = `rgb(${[0,0,0].join(',')})`;
    ctx.strokeStyle = 'rgb(255, 255, 255)';

    const room_x = (room.gridX * roomDrawWidth);
    const room_y = (room.gridY * roomDrawHeight) + legendHeight;

    // loop through each tile..
    for (let y = 0; y < 12; ++y) {
        for (let x = 0; x < 0x40; ++x) {
            // get the metatile index at this position
            const tiled = room.data[x * 12 + y];
            const tile = tiled & 0b00111111;
            const pxx = room_x + (x * 0x10);
            const pxy = room_y + (y * 0x10);

            let drawSettings: any = tile < 0x30 ? { a: 0.125 } : { a: 1 };
            if (tile === 0x3E) drawSettings = { dither: 1 }; // breakable block
            if (tile === 0x0) drawSettings = { a: 0.5 }; // ladders
            if (tile === 0x1) drawSettings = { a: 1 }; // door
            if (tile === 0x2) drawSettings = { a: 1 }; // unlockable door
            if (tile === 0x3) drawSettings = { a: 1 }; // princess door
            if (tile === 0x4) drawSettings = { a: 1 }; // door sign
            if (tile === 0x5) drawSettings = { a: 1 }; // door sign
            

            drawMetatile(gameData, ctx, room, tiled, pxx, pxy, drawSettings);

            // if this tile changes when you touch it, we should show that.
            if (room.blockSwapFrom === tile) {
                drawMetatile(gameData, ctx, room, room.blockSwapTo, pxx, pxy, {
                    a: 0.5,
                    fill: true
                });
            }

            // draw warp targets on princess doors
            if (tile === 0x3) {
                drawHexNybble(gameData, ctx, commonPalette, 1, room.princessDoorXArea, pxx + 8, pxy);
                drawHexNybble(gameData, ctx, commonPalette, 1, room.princessDoorYArea, pxx + 8, pxy + 8);
                drawText(gameData, ctx, commonPalette, 0, "X", pxx, pxy, { fill: true, a: 0.4 });
                drawText(gameData, ctx, commonPalette, 0, "Y", pxx, pxy + 8, { fill: true, a: 0.4 });
                console.log('warp from', room.gridX, room.gridY, 'to', room.princessDoorXArea, room.princessDoorYArea, '(', room.princessDoorXTile, 'x', room.princessDoorYPx, ')');
            }

        }
    }

    // room number
    if (room.gridY < 0x10) {
        drawHexNybble(gameData, ctx, commonPalette, 0, room.gridX, room_x + 8, room_y);
        drawHexNybble(gameData, ctx, commonPalette, 0, room.gridY, room_x + 8, room_y + 8);
        drawText(gameData, ctx, commonPalette, 0, "X", room_x, room_y);
        drawText(gameData, ctx, commonPalette, 0, "Y", room_x, room_y + 8);
    }

    // items
    if (room.chestActive) {
        const xpx = room_x + room.chestXTile * 0x10;
        const ypx = room_y + room.chestYPx;
        const gfx = 0xF80 + (room.chestItemType * 4);
        draw4FromChr(gameData, ctx, room.palette, 5, 0xFE8, xpx, ypx, { a: 0.25 });
        draw4FromChr(gameData, ctx, room.palette, 5, gfx, xpx, ypx, {});
    }

    if (room.shopItem1Cost && room.shopItem1Cost < 100) { // if item 1 has a price
        let shopSignIdx = room.data.findIndex(d => (d & 0x3F) == 4);
        
        // handle shops that you need to break a block and then touch to swap
        if (shopSignIdx === -1 && (room.blockSwapTo & 0x3F) == 4 && (room.blockBreakTo & 0x3F) == (room.blockSwapFrom & 0x3F)) {
            shopSignIdx = room.data.findIndex(d => (d & 0b00111111) == 0x3e);
        }

        // handle shops that you need to touch to swap
        if (shopSignIdx === -1 && (room.blockSwapTo & 0x3F) == 4) {
            shopSignIdx = room.data.findIndex(d => (d & 0x3F) == room.blockSwapFrom);
        }

        if (shopSignIdx === -1) {
            console.log("failed to find shop in room", index, "!");
        }


        let shopSignX = (shopSignIdx / 12) | 0;
        let shopSignY = (shopSignIdx % 12) | 0;
        if (shopSignX > -1 && shopSignY > -1) {
            const shop_x = room_x + (shopSignX * 0x10) - 8;
            const shop_y = room_y + (shopSignY * 0x10);
            {
                const gfx = 0xF80 + ((8 + room.shopItem1Type) * 4);
                draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, gfx, shop_x, shop_y);
                drawVDecNumber(gameData, ctx, commonPalette, 1, room.shopItem1Cost, shop_x, shop_y + 12);
            }
            
            {
                const gfx = 0xF80 + ((8 + room.shopItem2Type) * 4);
                draw4FromChr(gameData, ctx, gameData.rooms[0].palette, 5, gfx, shop_x + 0x10, shop_y);
                drawVDecNumber(gameData, ctx, commonPalette, 1, room.shopItem2Cost, shop_x + 0x10, shop_y + 12);
            }
        }
    }

    // enemies
    let latebloomers = 0;
    for (let i=0; i<12; ++i) {
        // .byte $51, $03, $11, $40, $0D, $01, $5D, $02, $02, $01, $00, $00, $00, $00, $00, $00
        const data = room.enemies.slice(i * 0x10, (i + 1) * 0x10);
        if (!data[0]) continue;
        const metatileTable = (room.enemygfx * 0x40);

        let pxx = data[2] * 0x10;
        let pxy = data[3];

        if (pxx === pxy && pxx === 0) {
            latebloomers += 1;
            pxy = 0x10 * latebloomers;
        }


        draw4FromChr(gameData, ctx, room.palette, (data[1] & 0b11) + 4, (metatileTable+data[0]-0x41), pxx+room_x, pxy+room_y, {
            a: 1.5
        });

        drawVDecNumber(gameData, ctx, commonPalette, 1, data[4], pxx+room_x+0x8, pxy+room_y, { alpha: 0.5, fill: true });
        drawVDecNumber(gameData, ctx, commonPalette, 1, data[5], pxx+room_x+0x8, pxy+room_y+8, { alpha: 0.5, fill: true });
    }


}
