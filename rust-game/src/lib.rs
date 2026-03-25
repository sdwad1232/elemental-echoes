use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// ─── Element System ───

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Debug)]
pub enum Element {
    Fire = 0,
    Water = 1,
    Earth = 2,
    Air = 3,
}

impl Element {
    fn strength(self) -> Element {
        match self {
            Element::Fire => Element::Earth,
            Element::Water => Element::Fire,
            Element::Earth => Element::Water,
            Element::Air => Element::Earth,
        }
    }
    fn weakness(self) -> Element {
        match self {
            Element::Fire => Element::Water,
            Element::Water => Element::Earth,
            Element::Earth => Element::Air,
            Element::Air => Element::Fire,
        }
    }
}

// ─── Pure Calculations ───

#[wasm_bindgen]
pub fn calc_damage(attack_power: f32, attacker_element: Element, defender_element: Element) -> f32 {
    let multiplier = if attacker_element.strength() == defender_element {
        2.0
    } else if attacker_element.weakness() == defender_element {
        0.5
    } else {
        1.0
    };
    (attack_power * multiplier).floor()
}

#[wasm_bindgen]
pub fn calc_xp_to_next(level: u32) -> u32 {
    (80.0 * 1.4_f64.powi(level as i32 - 1)).floor() as u32
}

// ─── Vec3 helper ───

#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    fn distance_to(&self, other: &Vec3) -> f32 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }
    fn length(&self) -> f32 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
    fn normalize(&self) -> Vec3 {
        let l = self.length();
        if l < 0.0001 { return Vec3 { x: 0.0, y: 0.0, z: 0.0 }; }
        Vec3 { x: self.x / l, y: self.y / l, z: self.z / l }
    }
}

// ─── Enemy Data ───

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct EnemyState {
    pub id: String,
    pub element: Element,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub health: f32,
    pub max_health: f32,
    pub speed: f32,
    pub damage: f32,
    pub xp_reward: u32,
    pub dead: bool,
    pub death_time: f64,
    pub attack_cooldown: f64,
    pub last_attack_time: f64,
}

// ─── Collectible Data ───

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CollectibleState {
    pub id: String,
    pub ctype: u8, // 0=health, 1=xp, 2=element_shard
    pub element: Element,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub collected: bool,
}

// ─── Game World State (managed in WASM) ───

#[derive(Serialize, Deserialize, Debug)]
pub struct GameWorld {
    // Player
    pub player_x: f32,
    pub player_y: f32,
    pub player_z: f32,
    pub player_health: f32,
    pub player_max_health: f32,
    pub player_attack_power: f32,
    pub player_element: Element,
    pub player_level: u32,
    pub player_xp: u32,
    pub player_xp_to_next: u32,
    pub player_kills: u32,
    pub player_speed: f32,
    // Current realm
    pub current_realm: Element,
    // Enemies
    pub enemies: Vec<EnemyState>,
    // Collectibles
    pub collectibles: Vec<CollectibleState>,
    // Events (read by JS each tick then cleared)
    pub events: Vec<GameEvent>,
    // Realms visited (bitmask: fire=1, water=2, earth=4, air=8)
    pub realms_visited: u8,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum GameEvent {
    DamageFlash,
    LevelUp { level: u32 },
    Notification { msg: String },
    GameOver,
    EnemyKilled { id: String },
    ItemCollected { id: String, ctype: u8 },
}

fn pseudo_random(seed: u32) -> f32 {
    let x = seed.wrapping_mul(1103515245).wrapping_add(12345);
    ((x >> 16) & 0x7FFF) as f32 / 32767.0
}

impl GameWorld {
    fn spawn_enemies(&mut self, realm: Element, count: usize, seed: u32) {
        self.enemies.clear();
        let elements = [Element::Fire, Element::Water, Element::Earth, Element::Air];
        for i in 0..count {
            let s = seed.wrapping_add(i as u32 * 7919);
            let angle = pseudo_random(s) * std::f32::consts::PI * 2.0;
            let dist = 5.0 + pseudo_random(s.wrapping_add(1)) * 12.0;
            let el = elements[(pseudo_random(s.wrapping_add(2)) * 4.0) as usize % 4];
            let hp = 30.0 + (pseudo_random(s.wrapping_add(3)) * 20.0).floor();
            self.enemies.push(EnemyState {
                id: format!("{:?}-enemy-{}", realm, i),
                element: el,
                x: angle.cos() * dist,
                y: 0.6,
                z: angle.sin() * dist,
                health: hp,
                max_health: hp,
                speed: 1.5 + pseudo_random(s.wrapping_add(4)) * 1.5,
                damage: 8.0 + (pseudo_random(s.wrapping_add(5)) * 7.0).floor(),
                xp_reward: 15 + (pseudo_random(s.wrapping_add(6)) * 15.0) as u32,
                dead: false,
                death_time: 0.0,
                attack_cooldown: 1200.0,
                last_attack_time: 0.0,
            });
        }
    }

    fn spawn_collectibles(&mut self, realm: Element, count: usize, seed: u32) {
        self.collectibles.clear();
        for i in 0..count {
            let s = seed.wrapping_add(i as u32 * 6271);
            let angle = pseudo_random(s) * std::f32::consts::PI * 2.0;
            let dist = 3.0 + pseudo_random(s.wrapping_add(1)) * 14.0;
            let ctype = (pseudo_random(s.wrapping_add(2)) * 3.0) as u8 % 3;
            self.collectibles.push(CollectibleState {
                id: format!("{:?}-collect-{}", realm, i),
                ctype,
                element: realm,
                x: angle.cos() * dist,
                y: 0.8 + (i as f32).sin() * 0.3,
                z: angle.sin() * dist,
                collected: false,
            });
        }
    }
}

// ─── WASM API ───

static mut WORLD: Option<GameWorld> = None;

fn world() -> &'static mut GameWorld {
    unsafe { WORLD.as_mut().expect("Game not initialized") }
}

#[wasm_bindgen]
pub fn init_game() {
    let mut w = GameWorld {
        player_x: 0.0,
        player_y: 0.8,
        player_z: 0.0,
        player_health: 100.0,
        player_max_health: 100.0,
        player_attack_power: 20.0,
        player_element: Element::Fire,
        player_level: 1,
        player_xp: 0,
        player_xp_to_next: calc_xp_to_next(1),
        player_kills: 0,
        player_speed: 5.0,
        current_realm: Element::Fire,
        enemies: Vec::new(),
        collectibles: Vec::new(),
        events: Vec::new(),
        realms_visited: 1, // fire
    };
    w.spawn_enemies(Element::Fire, 8, 42);
    w.spawn_collectibles(Element::Fire, 6, 99);
    w.events.push(GameEvent::Notification { msg: "Welcome to the Ember Wastes".to_string() });
    unsafe { WORLD = Some(w); }
}

#[wasm_bindgen]
pub fn switch_element(el: Element) {
    world().player_element = el;
}

#[wasm_bindgen]
pub fn move_player(dx: f32, dz: f32, delta: f32) {
    let w = world();
    let mut dir_x = dx;
    let mut dir_z = dz;
    let len = (dir_x * dir_x + dir_z * dir_z).sqrt();
    if len > 0.0001 {
        dir_x /= len;
        dir_z /= len;
        w.player_x += dir_x * w.player_speed * delta;
        w.player_z += dir_z * w.player_speed * delta;
        w.player_x = w.player_x.clamp(-18.0, 18.0);
        w.player_z = w.player_z.clamp(-18.0, 18.0);
    }
}

#[wasm_bindgen]
pub fn player_attack() {
    let w = world();
    let px = w.player_x;
    let pz = w.player_z;
    let atk = w.player_attack_power;
    let el = w.player_element;

    for enemy in w.enemies.iter_mut() {
        if enemy.dead { continue; }
        let dx = enemy.x - px;
        let dz = enemy.z - pz;
        let dist = (dx * dx + dz * dz).sqrt();
        if dist < 3.0 {
            let dmg = calc_damage(atk, el, enemy.element);
            enemy.health -= dmg;
            if enemy.health <= 0.0 {
                enemy.health = 0.0;
                enemy.dead = true;
                // death_time will be set by JS (Date.now())
            }
        }
    }
}

#[wasm_bindgen]
pub fn tick(now: f64, delta: f32) {
    let w = world();

    // Enemy AI: chase + attack
    let px = w.player_x;
    let pz = w.player_z;

    // Collect kills and xp to process after loop
    let mut killed_ids: Vec<(String, u32)> = Vec::new();
    let mut damage_to_player: f32 = 0.0;

    for enemy in w.enemies.iter_mut() {
        if enemy.dead {
            if enemy.death_time == 0.0 {
                enemy.death_time = now;
                killed_ids.push((enemy.id.clone(), enemy.xp_reward));
            }
            continue;
        }

        let dx = px - enemy.x;
        let dz = pz - enemy.z;
        let dist = (dx * dx + dz * dz).sqrt();

        // Chase
        if dist < 12.0 && dist > 1.5 {
            let nx = dx / dist;
            let nz = dz / dist;
            enemy.x += nx * enemy.speed * delta;
            enemy.z += nz * enemy.speed * delta;
        }

        // Attack
        if dist < 2.0 {
            if now - enemy.last_attack_time > enemy.attack_cooldown {
                damage_to_player += enemy.damage;
                enemy.last_attack_time = now;
            }
        }

        // Bobbing
        enemy.y = 0.6 + (now as f32 * 0.004 + enemy.x).sin() * 0.15;
    }

    // Apply damage
    if damage_to_player > 0.0 {
        w.player_health = (w.player_health - damage_to_player).max(0.0);
        w.events.push(GameEvent::DamageFlash);
        if w.player_health <= 0.0 {
            w.events.push(GameEvent::GameOver);
        }
    }

    // Process kills
    for (id, xp) in killed_ids {
        w.player_kills += 1;
        w.events.push(GameEvent::EnemyKilled { id });
        // Gain XP
        w.player_xp += xp;
        while w.player_xp >= w.player_xp_to_next {
            w.player_xp -= w.player_xp_to_next;
            w.player_level += 1;
            w.player_xp_to_next = calc_xp_to_next(w.player_level);
            w.player_max_health += 15.0;
            w.player_attack_power += 5.0;
            w.events.push(GameEvent::LevelUp { level: w.player_level });
            w.events.push(GameEvent::Notification { msg: format!("Level Up! Level {}", w.player_level) });
        }
    }

    // Collectible pickup
    for c in w.collectibles.iter_mut() {
        if c.collected { continue; }
        let dx = c.x - px;
        let dz = c.z - pz;
        let dist = (dx * dx + dz * dz).sqrt();
        if dist < 1.5 {
            c.collected = true;
            w.events.push(GameEvent::ItemCollected { id: c.id.clone(), ctype: c.ctype });
            match c.ctype {
                0 => { // health
                    w.player_health = (w.player_health + 25.0).min(w.player_max_health);
                }
                1 => { // xp
                    w.player_xp += 20;
                }
                2 => { // element_shard
                    w.player_xp += 30;
                }
                _ => {}
            }
            // Check level up from collectible XP
            while w.player_xp >= w.player_xp_to_next {
                w.player_xp -= w.player_xp_to_next;
                w.player_level += 1;
                w.player_xp_to_next = calc_xp_to_next(w.player_level);
                w.player_max_health += 15.0;
                w.player_attack_power += 5.0;
                w.events.push(GameEvent::LevelUp { level: w.player_level });
                w.events.push(GameEvent::Notification { msg: format!("Level Up! Level {}", w.player_level) });
            }
        }
    }

    // Portal detection
    let portals: [(Element, f32, f32); 4] = [
        (Element::Fire, 15.0, 0.0),
        (Element::Water, -15.0, 0.0),
        (Element::Earth, 0.0, 15.0),
        (Element::Air, 0.0, -15.0),
    ];
    for (realm, portal_x, portal_z) in portals {
        if realm as u8 == w.current_realm as u8 { continue; }
        let dx = portal_x - px;
        let dz = portal_z - pz;
        let dist = (dx * dx + dz * dz).sqrt();
        if dist < 2.5 {
            w.current_realm = realm;
            let realm_bit = 1u8 << (realm as u8);
            w.realms_visited |= realm_bit;
            let count = 8 + w.player_level as usize * 2;
            let seed = now as u32;
            w.spawn_enemies(realm, count, seed);
            w.spawn_collectibles(realm, 6, seed.wrapping_add(500));
            w.player_x = 0.0;
            w.player_z = 0.0;
            let name = match realm {
                Element::Fire => "Ember Wastes",
                Element::Water => "Tidal Depths",
                Element::Earth => "Verdant Wilds",
                Element::Air => "Sky Citadel",
            };
            w.events.push(GameEvent::Notification { msg: format!("Entered {}", name) });
            break;
        }
    }
}

/// Get full state as JsValue (serialized). Called each frame by JS.
#[wasm_bindgen]
pub fn get_state() -> JsValue {
    serde_wasm_bindgen::to_value(world()).unwrap()
}

/// Drain events. Returns array, clears internal buffer.
#[wasm_bindgen]
pub fn drain_events() -> JsValue {
    let w = world();
    let events = std::mem::take(&mut w.events);
    serde_wasm_bindgen::to_value(&events).unwrap()
}

/// Get just the positions we need for rendering (lightweight)
#[wasm_bindgen]
pub fn get_player_pos() -> Vec<f32> {
    let w = world();
    vec![w.player_x, w.player_y, w.player_z]
}

#[wasm_bindgen]
pub fn get_player_rotation(dx: f32, dz: f32) -> f32 {
    dx.atan2(dz)
}

#[wasm_bindgen]
pub fn enter_realm(realm: Element) {
    let w = world();
    w.current_realm = realm;
    let realm_bit = 1u8 << (realm as u8);
    w.realms_visited |= realm_bit;
    let count = 8 + w.player_level as usize * 2;
    w.spawn_enemies(realm, count, 12345);
    w.spawn_collectibles(realm, 6, 67890);
    w.player_x = 0.0;
    w.player_z = 0.0;
}

#[wasm_bindgen]
pub fn get_realm() -> Element {
    world().current_realm
}
