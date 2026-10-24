export const widgetStyles = `
:host {
  display: block;
  color-scheme: dark;
  --gold: var(--dvert-accent, #f5cf66);
  --font-display: ui-serif, Georgia, serif;
  --font-body: system-ui, sans-serif;
  --devert-width: 100%;
}
.dvert-widget { width: 100%; max-width: var(--dvert-max-width, 480px); color: var(--dvert-text, #f6efdd); background: var(--dvert-background, #17140f); border: 1px solid var(--dvert-accent, #a78242); border-radius: 12px; font: 15px/1.5 system-ui, sans-serif; overflow: hidden; box-sizing: border-box; }
.dvert-widget *, .dvert-widget *::before, .dvert-widget *::after { box-sizing: border-box; }
.dvert-identity, .dvert-session { margin: 0; padding: 8px 14px; font-size: .75rem; overflow-wrap: anywhere; }
.dvert-identity { font-weight: 700; color: var(--dvert-accent, #f5cf66); }
.dvert-session { border-bottom: 1px solid #554522; }
button#devert-tab { position: static; width: 100%; height: auto; min-height: 60px; display: flex; flex-direction: row; justify-content: center; gap: 12px; border: 0; border-radius: 0; padding: 8px; transform: none; color: var(--dvert-text, #f6efdd); }
#devert-tab > span:last-child { font-size: 1rem; }
#devert-tab .devert-tab-art { height: 50px; }
#devert-panel, #devert-panel.is-open { position: static; inset: auto; bottom: auto; width: 100%; max-height: none; padding: 14px; border: 0; box-shadow: none; transform: none; transition: none; background: var(--dvert-background, #17140f); color: var(--dvert-text, #f6efdd); }
#devert-panel:not(.is-open) { display: none; }
#devert-panel.is-open { display: flex; visibility: visible; pointer-events: auto; }
#devert-close { display: none; }
#devert-panel input, #devert-panel select { max-width: 100%; min-height: 40px; }
#devert-panel button, #devert-instructions button { min-height: 44px; }
#devert-panel #devert-info { width: 44px; height: 44px; min-height: 44px; font-size: 18px; }
#devert-panel input[type=checkbox] { width: auto; min-height: auto; margin-right: 6px; }
#devert-panel .dvert-upload-consent { display: block; font-size: .8rem; line-height: 1.5; padding: 8px 0; }
#devert-panel label { display: block; }
#devert-panel table { width: 100%; border-collapse: collapse; }
#devert-panel td, #devert-panel th { padding: 5px; text-align: left; overflow-wrap: anywhere; }
#devert-panel ol, #devert-panel ul { padding-left: 22px; }
#devert-panel a, #devert-instructions a { color: var(--dvert-accent, #f5cf66); }
#devert-instructions { max-width: min(640px, 90vw); max-height: 85vh; overflow: auto; color: var(--dvert-text, #f6efdd); background: var(--dvert-background, #17140f); border: 1px solid var(--dvert-accent, #a78242); padding: 20px; border-radius: 12px; font: 15px/1.5 system-ui, sans-serif; }
#devert-instructions::backdrop { background: #000b; }
:focus-visible { outline: 3px solid var(--dvert-accent, #f5cf66); outline-offset: 3px; }
[hidden] { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
@media (max-width: 420px) {
  .devert-workflow { grid-template-columns: 1fr; }
  .devert-price-display { gap: 6px; }
}
`;
