(()=>{'use strict';const css=`
/* FYND ADZ crisp vector background and natural hero-logo proportions. */
.brand-orb img{width:58%;max-width:230px;height:auto!important;max-height:none!important;aspect-ratio:480/370;object-fit:contain;display:block}
.ambient{background:#07040e url('./assets/brand/fyndadz-gradient-background.svg') 50% 50% / cover no-repeat!important;background-size:110% 110%!important;animation:fyndadzBackdropDrift 72s ease-in-out infinite alternate;will-change:background-position}
.ambient .fx-canvas,.ambient i,.ambient .grain{display:none!important}
@keyframes fyndadzBackdropDrift{0%{background-position:47% 51%}100%{background-position:53% 49%}}
@media(max-width:680px){.ambient{background-size:auto 112%!important;background-position:54% 50%;animation-duration:90s}}
@media(prefers-reduced-motion:reduce){.ambient{animation:none!important;background-position:50% 50%!important}}
`;const s=document.createElement('style');s.id='fyndadz-theme';s.textContent=css;document.head.append(s)})();