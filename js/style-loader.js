(()=>{'use strict';const css=`
/* Keep the original FYND ADZ mark at its native proportions. */
.brand-orb img{width:58%;max-width:230px;height:auto!important;max-height:none!important;aspect-ratio:480/370;object-fit:contain;display:block}
`;const s=document.createElement('style');s.id='fyndadz-theme';s.textContent=css;document.head.append(s)})();