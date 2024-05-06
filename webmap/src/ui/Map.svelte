<script lang="ts">
import {
        loadRom,
        redrawFullMap,
        type GameInformation,
        roomDrawHeight,
        roomDrawWidth,
        legendHeight,
    } from "./gameParser";
    let romInput: HTMLInputElement;
    let canvas: HTMLCanvasElement;
    let gameData: GameInformation;
    let scrollArea: HTMLDivElement;
    let loaded = false;

    async function loadROM(e: Event) {
        const fileData = romInput.files.item(0);
        const data = await fileData.arrayBuffer();
        const bin = new Uint8Array(data);
        gameData = await loadRom(bin);
        loaded = true;
    }

    function redrawCanvas(el: HTMLCanvasElement) {
        redrawFullMap(gameData, el);
    }

    let roomInfo: any;
    function handleGameClick(e: MouseEvent) {
        if (!gameData) return;
        const roomX = (e.offsetX / roomDrawWidth) | 0;
        const roomY = ((e.offsetY - legendHeight) / roomDrawHeight) | 0;
        const roomNumber = gameData.grid[roomY]?.[roomX] || 0;
        const tileX = ((e.offsetX % roomDrawWidth) / 0x10) | 0;
        const tileY = (((e.offsetY - legendHeight) % roomDrawHeight) / 0x10) | 0;

        roomInfo = {
            roomNumber,
            roomX,
            roomY,
            tileX,
            tileY,
            room: gameData.rooms[roomNumber],
            tile: gameData.rooms[roomNumber].data[tileX * 12 + tileY],
        };

        //gotoRoom(roomNumber);
    }
</script>

<div>
    {#if !loaded}
        <label class="input input-bordered flex items-center gap-2">
            ROM
            <input
                bind:this={romInput}
                type="file"
                class="grow"
                on:change={loadROM}
            />
        </label>
    {:else}
        <div class="maparea">
            <div bind:this={scrollArea} class="scrollarea">
                <canvas
                    height={0}
                    width={0}
                    bind:this={canvas}
                    use:redrawCanvas
                    on:click={handleGameClick}
                ></canvas>
            </div>

            <div class="roominfo">
                {#if roomInfo}
                    {@const room = roomInfo.room}
                    <div class="card bg-neutral text-neutral-content">
                        <div class="card-body items-center text-center">
                            <h2 class="card-title">
                                Room #{room.id}
                            </h2>
                            <pre style="text-align: left;">
                                {JSON.stringify({ ...room, data: undefined, palette: undefined, enemies: undefined }, null, 4)}
                            </pre>
                            {#if roomInfo.tile}
                            <div>
                                <strong
                                    >Tile {roomInfo.tileX.toString(
                                        16,
                                    )}x{roomInfo.tileY.toString(16)}:</strong
                                >
                                {roomInfo.tile.toString(16)} ({(
                                    roomInfo.tile & 0b00111111
                                ).toString(16)})
                            </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .maparea {
        display: grid;
        grid-template-columns: 1fr 256px;
        max-width: 100%;
        max-height: 100vh;
        gap: 32px;
        position: relative;
    }
    .scrollarea {
        min-width: 1024px;
        min-height: 512px;
        max-height: 100vh;
        overflow: scroll;
    }
    .roominfo {
        max-height: 100vh;
        overflow-y: scroll;
    }
    canvas {
        zoom: 1;
    }
</style>
