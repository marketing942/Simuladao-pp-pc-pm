# CPPEM / Impacto

Arte criada com a ferramenta integrada de geração de imagens, usando `public/emblema-leao.webp` como referência. Entrega otimizada: `public/cppem-crater.webp` (1672 × 940, WebP). A animação é executada no navegador; não é um arquivo de vídeo. As logos oficiais continuam sendo os arquivos originais do projeto.

## Prompt final

Create a revised landscape cinematic website background. Image 1 exact silhouette source. Image 2 is lighting/texture reference ONLY and has WRONG depth. Critical change: invert the relief. The GOLD regions of image 1 must become deep BLACK RECESSED HOLES carved DOWN INTO a single flat dark basalt wall. The transparent regions remain original level wall. The result is an INSET STAMP, deep laser-cut / meteor punched negative lion logo cavity, NOT a sculpture, NOT a raised stone lion, NOT the recessed face inside raised mane. All mane pieces themselves are empty deep cutouts with visible rough inner walls and nearly black floors. Subdued edge illumination from above, deep inner occlusion shadows, very thin warm glowing fissures around cutout. Keep exact outline of image 1, centered, height 80% of frame, logo width about 48% of landscape frame, front view with very slight angle to show cavity depth. Surroundings cracked charcoal basalt, dust wisps, a few fragments. No moon, no sky, no text, no badges. Nearly black image edges. Premium realistic 3D VFX matte painting. Visually this must read as an empty lion-shaped crater left AFTER a meteor went through the wall. Strong concave relief, no raised logo geometry.

## Sequência (tempos em `hero.css`, no topo)

- 0,25–1,00 s: o meteoro (logo do CPPEM) atravessa a tela.
- 1,00 s: impacto — estilhaços, brasas subindo para a página, a tela cede e a cratera aparece.
- 1,15–1,30 s: texto e botões da hero entram (a venda não espera a abertura).
- 1,00–4,60 s: a cratera esfria e assenta em 30% de opacidade, parada.
- 1,85 s: PCPE à esquerda, em diagonal, com balanço.
- 2,25 s: PPPE à direita, pesado, pouco rebote.
- 2,75 s: PMPE ao centro, na vertical, o maior impacto.
- 3,30 s: carimbo "Apenas 100 vagas".
- Depois: brasões flutuando com reflexos espaçados e parallax do mouse (só os brasões; o fundo fica parado). Brasas sobem pela página inteira.

## Arquivos

- `hero.css` — toda a cena de entrada (tempos, meteoro, cratera, brasões, carimbo, celular, movimento reduzido).
- `hero.js` — espera as imagens (no máximo 1,5 s), faíscas em canvas, botão "Pular", parallax.
- `script.js` — a página; a seção 4 é a camada de brasas (`window.CPPEM.brasas.rajada`).
- `public/cppem-crater.webp` (desktop) e `public/cppem-crater-900.webp` (celular).

Se a arte da cratera falhar, entra a cratera desenhada em CSS (`.cratera-reserva`).
Este arquivo não é publicado (`.vercelignore`).
