/* tslint:disable */
/* eslint-disable */

export enum Element {
    Fire = 0,
    Water = 1,
    Earth = 2,
    Air = 3,
}

export function calc_damage(attack_power: number, attacker_element: Element, defender_element: Element): number;

export function calc_xp_to_next(level: number): number;

/**
 * Drain events. Returns array, clears internal buffer.
 */
export function drain_events(): any;

export function enter_realm(realm: Element): void;

/**
 * Get just the positions we need for rendering (lightweight)
 */
export function get_player_pos(): Float32Array;

export function get_player_rotation(dx: number, dz: number): number;

export function get_realm(): Element;

/**
 * Get full state as JsValue (serialized). Called each frame by JS.
 */
export function get_state(): any;

export function init_game(): void;

export function move_player(dx: number, dz: number, delta: number): void;

export function player_attack(): void;

export function switch_element(el: Element): void;

export function tick(now: number, delta: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly calc_damage: (a: number, b: number, c: number) => number;
    readonly calc_xp_to_next: (a: number) => number;
    readonly drain_events: () => any;
    readonly enter_realm: (a: number) => void;
    readonly get_player_pos: () => [number, number];
    readonly get_realm: () => number;
    readonly get_state: () => any;
    readonly init_game: () => void;
    readonly move_player: (a: number, b: number, c: number) => void;
    readonly player_attack: () => void;
    readonly switch_element: (a: number) => void;
    readonly tick: (a: number, b: number) => void;
    readonly get_player_rotation: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
