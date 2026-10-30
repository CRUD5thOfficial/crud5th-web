import { KotoportAvatar, type AvatarColor } from "./kotoport-avatar";
import "./kotoport-use-case-scene.css";

export type UseCaseSceneKind = "security" | "facilities" | "booking" | "commerce" | "repair";

function SecurityWorkplace() {
  return <>
    <path className="kp-case-scene-soft" d="M139 70h89v104h-89z" />
    <path className="kp-case-scene-main" d="m130 70 10-18h88l10 18z" />
    <rect className="kp-case-scene-paper" x="151" y="82" width="63" height="37" rx="4" />
    <path d="M181 82v37m-30-18h63" />
    <path className="kp-case-scene-main" d="M166 134h31v40h-31z" />
    <circle className="kp-case-scene-ink" cx="190" cy="155" r="1.5" stroke="none" />
    <g className="kp-case-scene-roster">
      <rect className="kp-case-scene-paper" x="256" y="31" width="64" height="73" rx="7" />
      <path className="kp-case-scene-main" d="M256 39a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8h-64z" />
      <path d="M266 39h23m-21 20h13m10 0h18m-41 15h13m10 0h18m-41 15h13m10 0h18" />
      <circle className="kp-case-scene-main" cx="271" cy="59" r="3" />
      <circle className="kp-case-scene-main" cx="271" cy="74" r="3" />
      <path className="kp-case-scene-roster-check" d="m292 89 4 4 9-10" />
    </g>
    <path className="kp-case-scene-soft" d="M232 136h11v38h-11z" />
    <g className="kp-case-scene-gate">
      <rect className="kp-case-scene-paper" x="232" y="126" width="94" height="10" rx="4" />
      <path className="kp-case-scene-gate-stripes" d="m249 127-6 8m26-8-6 8m26-8-6 8m26-8-6 8" />
    </g>
    <g className="kp-case-scene-guard">
      <path className="kp-case-scene-main" d="M282 145c-8 0-13 5-13 13v15h27v-15c0-8-5-13-14-13Z" />
      <path className="kp-case-scene-paper" d="M278 147h8v13h-8z" />
      <circle className="kp-case-scene-paper" cx="282" cy="135" r="10" />
      <path className="kp-case-scene-main" d="M271 132h22l-4-7h-15z" />
      <path d="M276 172v8m13-8v8" />
    </g>
  </>;
}

function FacilitiesWorkplace() {
  return <>
    <rect className="kp-case-scene-soft" x="142" y="35" width="119" height="138" rx="7" />
    <path className="kp-case-scene-main" d="M154 24h94v13h-94z" />
    {[0, 1, 2].map(row => [0, 1, 2].map(column => <rect key={`${row}-${column}`} className="kp-case-scene-paper" x={155 + column * 32} y={51 + row * 33} width="20" height="22" rx="3" />))}
    <path className="kp-case-scene-main" d="M185 147h34v26h-34z" />
    <path d="M202 148v25" />
    <g className="kp-case-scene-cleaning-cart">
      <path d="M246 116h-13v49h76m-63-22h57" />
      <path className="kp-case-scene-main" d="M248 121h46v42h-46z" />
      <path className="kp-case-scene-paper" d="M254 127h34v14h-34z" />
      <path className="kp-case-scene-soft" d="M276 108h16l-2 13h-13z" />
      <path d="M280 107v-9h9v9" />
      <circle className="kp-case-scene-ink" cx="247" cy="173" r="6" />
      <circle className="kp-case-scene-ink" cx="296" cy="173" r="6" />
      <g className="kp-case-scene-mop">
        <path d="m304 77-10 73" />
        <path className="kp-case-scene-paper" d="m286 149 15 2 6 17-29-4z" />
        <path d="m288 154-3 9m9-8-2 9m8-8-1 9" />
      </g>
    </g>
    <path className="kp-case-scene-clean-shine" d="m223 77 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
    <path className="kp-case-scene-clean-shine-small" d="m318 107 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
  </>;
}

function BookingWorkplace() {
  return <>
    <path className="kp-case-scene-soft" d="M143 55h116v98H143z" />
    <g className="kp-case-scene-calendar">
      <rect className="kp-case-scene-paper" x="144" y="44" width="113" height="104" rx="9" />
      <path className="kp-case-scene-main" d="M153 44h95a9 9 0 0 1 9 9v20H144V53a9 9 0 0 1 9-9Z" />
      <path d="M169 37v15m63-15v15m-87 21h111" />
      {[0, 1].map(row => [0, 1, 2, 3].map(column => <rect key={`${row}-${column}`} className="kp-case-scene-calendar-day" x={157 + column * 24} y={85 + row * 27} width="13" height="13" rx="3" />))}
      <rect className="kp-case-scene-main" x="200" y="108" width="20" height="20" rx="5" />
      <path className="kp-case-scene-booking-check" d="m204 118 4 4 8-10" />
    </g>
    <g className="kp-case-scene-seating">
      <path className="kp-case-scene-paper" d="M280 100h28a6 6 0 0 1 6 6v35h-40v-35a6 6 0 0 1 6-6Z" />
      <path className="kp-case-scene-main" d="M270 138h48v10h-48z" />
      <path d="M277 149v25m35-25v25" />
    </g>
    <path className="kp-case-scene-main" d="M129 150h136v26H129z" />
    <rect className="kp-case-scene-paper" x="121" y="143" width="151" height="10" rx="4" />
    <path d="M149 158h28" />
    <g className="kp-case-scene-desk-bell">
      <path className="kp-case-scene-paper" d="M235 142h-28a14 14 0 0 1 28 0Z" />
      <path d="M221 128v-5m-4 0h8m-21 19h34" />
    </g>
  </>;
}

function CommerceWorkplace() {
  return <>
    <path className="kp-case-scene-soft" d="M154 61h130v102H154z" />
    <path className="kp-case-scene-main" d="m146 61 13-22h119l14 22z" />
    <path className="kp-case-scene-paper" d="M168 78h53v85h-53z" />
    <path d="M176 85h37m-37 10h37m-37 10h37m-37 10h37" />
    <rect className="kp-case-scene-paper" x="237" y="79" width="32" height="27" rx="3" />
    <g className="kp-case-scene-parcels">
      <path className="kp-case-scene-main" d="M123 137h39v36h-39z" />
      <path className="kp-case-scene-paper" d="M137 137h10v14l-5-3-5 3z" />
      <path className="kp-case-scene-paper" d="M137 115h31v22h-31z" />
      <path d="M152 116v9m-21 38h11" />
    </g>
    <g className="kp-case-scene-van">
      <path className="kp-case-scene-main" d="M183 119h83v48h-83z" />
      <path className="kp-case-scene-paper" d="M266 130h29l21 23v14h-50z" />
      <path className="kp-case-scene-soft" d="M274 136h17l13 15h-30z" />
      <path d="M275 157h5m-86-10h44m-32-10h31" />
      <rect className="kp-case-scene-paper" x="181" y="164" width="138" height="9" rx="3" />
      <circle className="kp-case-scene-ink" cx="205" cy="172" r="10" />
      <circle className="kp-case-scene-paper" cx="205" cy="172" r="4" />
      <circle className="kp-case-scene-ink" cx="296" cy="172" r="10" />
      <circle className="kp-case-scene-paper" cx="296" cy="172" r="4" />
    </g>
    <path className="kp-case-scene-road" d="M175 188h22m18 0h33m18 0h19" />
  </>;
}

function RepairWorkplace() {
  return <>
    <rect className="kp-case-scene-soft" x="162" y="43" width="100" height="128" rx="10" />
    <path className="kp-case-scene-paper" d="M163 53a9 9 0 0 1 9-9h80a9 9 0 0 1 9 9v24h-98z" />
    <path d="M175 60h24m-24 7h16" />
    <circle className="kp-case-scene-main" cx="242" cy="61" r="7" />
    <circle className="kp-case-scene-paper" cx="212" cy="118" r="32" />
    <circle className="kp-case-scene-main" cx="212" cy="118" r="22" />
    <path d="M198 120c5-7 9 7 15 0s10 5 14-2m-45 45h12m36 0h12" />
    <g className="kp-case-scene-repair-tool">
      <path className="kp-case-scene-paper" d="M285 58a15 15 0 0 0-19 18l-26 26a7 7 0 0 0 10 10l26-26a15 15 0 0 0 18-19l-10 10-9-9z" />
      <circle cx="246" cy="106" r="1.5" />
    </g>
    <g className="kp-case-scene-toolbox">
      <path d="M267 143v-9a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v9" />
      <path className="kp-case-scene-main" d="M248 143h72v33h-72z" />
      <path className="kp-case-scene-paper" d="M246 143h76v13h-76z" />
      <path className="kp-case-scene-soft" d="M279 151h11v11h-11z" />
    </g>
    <g className="kp-case-scene-screwdriver">
      <path d="m148 136-14 32" />
      <path className="kp-case-scene-main" d="m146 128 9 4-8 20-9-4z" />
      <path d="m134 168-3 7" />
    </g>
  </>;
}

const scenes = {
  security: SecurityWorkplace,
  facilities: FacilitiesWorkplace,
  booking: BookingWorkplace,
  commerce: CommerceWorkplace,
  repair: RepairWorkplace,
};

const colors: Record<UseCaseSceneKind, AvatarColor> = {
  security: "blue",
  facilities: "green",
  booking: "yellow",
  commerce: "coral",
  repair: "blue",
};

/** Decorative workplaces accompany the real request and handoff copy in each card. */
export function KotoportUseCaseScene({ kind }: { kind: UseCaseSceneKind }) {
  const Workplace = scenes[kind];
  return <div className={`kp-case-scene kp-case-scene-${kind} kp-motion-zone`} data-use-case-scene={kind} aria-hidden="true">
    <svg className="kp-case-scene-workplace" viewBox="0 0 340 200" fill="none" focusable="false">
      <path className="kp-case-scene-backdrop" d="M37 75C53 28 117 13 181 21s127 13 143 65c15 50-13 94-64 96H77C33 181 19 126 37 75Z" stroke="none" />
      <ellipse className="kp-case-scene-ground" cx="176" cy="181" rx="151" ry="10" stroke="none" />
      <g className="kp-case-scene-drawing"><Workplace /></g>
    </svg>
    <div className="kp-case-scene-assistant"><KotoportAvatar color={colors[kind]} mode="listening" /></div>
    <span className="kp-case-scene-call">
      <svg viewBox="0 0 54 38" fill="none" focusable="false">
        <path d="M13 9c-4 3-2 10 4 16s13 8 16 4l3-4-7-5-3 3c-3-1-6-4-7-7l3-3-5-7Z" />
        <path className="kp-case-scene-call-signal" d="M32 9a9 9 0 0 1 9 9m-8-4a4 4 0 0 1 4 4" />
      </svg>
    </span>
  </div>;
}
