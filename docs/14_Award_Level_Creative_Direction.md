# 14. Award-Level Creative Direction — Cinematic 3D & Motion Specification

This document lays out the creative direction, motion design, and technical stack for elevating the **Inji Interoperability Playground** frontend into an award-tier (Awwwards/Godly/Dribbble) experience with a real 3D/motion stack while preserving 100% of underlying protocol testing capabilities.

---

## 0. What "Award-Site Tier" Actually Means

Looking at what wins Site of the Day on Awwwards/Godly and what tops Dribbble showcases:
- **Smooth, physics-correct scroll** (Lenis) so nothing feels like default browser scroll — everything glides with inertia.
- **One signature 3D/WebGL moment**, not 3D everywhere — a single object rendered in React Three Fiber that the whole page seems to orbit around.
- **Scroll-driven choreography** (GSAP + ScrollTrigger) — elements enter, pin, and transform in direct response to scroll position, not on a timer.
- **Micro-interaction density on the few elements that matter** — magnetic buttons, cursor-aware hover states, custom cursor — applied to 3–5 elements total, not the whole UI.
- **Grain/noise + subtle chromatic/glass treatments** for texture instead of flat color.
- **A real loader/intro sequence** — a 1–2s branded loading beat before content settles.

---

## 1. Creative Tech Stack

| Library | Role | Location |
|---|---|---|
| **Tailwind CSS** | Utility layer for structure and spacing | App-wide |
| **Lenis (`lenis`)** | Smooth inertial scrolling | Root app wrapper |
| **GSAP + ScrollTrigger** | Scroll-choreographed reveals, act transitions, text-split reveals | Hero, transitions, verdict |
| **React Three Fiber + drei** (`@react-three/fiber`, `@react-three/drei`, `three`) | The signature 3D object: floating glass/metal credential slab | Hero & Verdict canvas |
| **Framer Motion (`framer-motion`)** | Component-level enter/exit and layout transitions | Inspector, modals, step rails |
| **Custom Cursor & Magnetic Buttons** | Micro-interactions | Primary CTAs & Global cursor |

---

## 2. The Signature 3D Moment

Render the credential itself as a real 3D object in React Three Fiber:
- **Geometry**: A rounded rectangular slab with beveled edges, dark frosted material, floating with slow idle Y-axis rotation.
- **Issuance State**: The slab starts translucent; a stamp/seal geometry animates onto its surface when `credential_issued` fires with an emissive pulse.
- **Transit State**: The slab tilts along a path toward the verifier plane, visualizing literal handoff.
- **Verdict State**: Emissive color shift to verified (green), rejected (red), or expired (amber), accompanied by bold serif verdict typography.
- **Performance Guardrail**: Capped DPR (`[1, 1.5]`), low polycount, pauses when scrolled out of view.

---

## 3. Scroll & Motion Choreography

- **Lenis**: Integrated at app root (`<ReactLenis root>`) with moderate duration/easing.
- **Opening Credits**: Staggered character/word reveal on hero headline ("A credential no one has to trust in advance.") with the 3D card fading up.
- **Act Transitions**: Scroll-pinned acts (Issuance → Transit → Verdict) with simultaneous manual "Advance" button control for demo predictability.
- **Verdict Reveal**: Seal stroke draw-in, serif verdict word scale-in with overshoot (`power3.out`), camera push-in.
- **Reduced Motion**: Full fallback for `prefers-reduced-motion: reduce`.

---

## 4. Texture & Finish

- Full-bleed grain/noise overlay (`mix-blend-mode: overlay`, low opacity) across shell.
- Frosted glass (`backdrop-filter: blur`) reserved for inspector drawer and opening hero card.
- Magnetic button effect on "Begin the exchange" and "View full report".
- Custom cursor (dot + trailing ring expanding on hover).

---

## 5. Phased Build Sequence

1. **Stack Setup**: Install `lenis`, `gsap`, `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`.
2. **Signature 3D Object (`CredentialCard3D.tsx`)**: Build the 3D slab in React Three Fiber with dynamic state colors and idle animation.
3. **Hero & Intro Sequence**: Editorial typography, grain overlay, magnetic buttons, custom cursor.
4. **Cinematic Acts**: Structure the test flow into 3 clear Acts (Act I: Issuance, Act II: Transit/Presentation, Act III: Verification Verdict).
5. **Verdict Reveal**: Dramatic verdict showcase with 3D emissive response.
6. **Performance & Reduced-Motion Audit**.
