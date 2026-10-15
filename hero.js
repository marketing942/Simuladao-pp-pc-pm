/* =========================================================
   CPPEM · SIMULADÃO — A ABERTURA DA HERO
   ---------------------------------------------------------
   A cena é toda CSS (hero.css). Este arquivo faz quatro coisas:

     1. CARGA      segura a cena (.intro-pending) até o leão, os
                   brasões e a cratera estarem decodificados — no
                   máximo 1,5s. O texto da hero não espera.
     2. FAÍSCAS    um <canvas> por cima do palco: estilhaços no
                   impacto do meteoro, faíscas raspando no chão em
                   cada brasão, e brasas que sobem da cratera para a
                   página (a camada de brasas do script.js).
     3. PULAR      o botão leva a cena direto ao quadro final.
     4. PARALLAX   os brasões acompanham o mouse (o fundo não).

   Tudo sincronizado pelo animationend de cada queda — nunca por
   tempo calculado aqui.
   ========================================================= */
(function () {
  "use strict";

  var root   = document.documentElement;
  var hero   = document.getElementById("topo");
  var palco  = document.getElementById("palco");
  var canvas = document.getElementById("impactoFx");
  var pular  = document.getElementById("pular");
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  function soltar() { root.classList.remove("intro-pending"); }
  if (!hero || !palco || !canvas) { soltar(); return; }

  var ctx = canvas.getContext("2d");
  var celular = window.innerWidth < 721;
  var rodando = false, terminou = false, fimTimer = 0;

  /* =========================================================
     2 · FAÍSCAS
     ========================================================= */
  var particulas = [], raf = 0, antes = 0, larg = 0, alt = 0;
  var QUENTES = ["#FFE2B0", "#FFB765", "#F08A3C", "#D9622A"];
  var PEDRAS  = ["#5E5850", "#3E3B38", "#8A7458"];

  function medir() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    larg = r.width; alt = r.height;
    canvas.width = Math.round(larg * dpr);
    canvas.height = Math.round(alt * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function limpar() {
    cancelAnimationFrame(raf); raf = 0; particulas.length = 0;
    if (ctx) ctx.clearRect(0, 0, larg, alt);
  }

  function pintar(agora) {
    /* o carimbo do quadro pode vir ANTES do performance.now() da rajada:
       sem o piso em zero, o tempo anda para trás e a faísca acelera */
    var dt = Math.max(0, Math.min((agora - antes) / 1000 || .016, .035));
    antes = agora;
    ctx.clearRect(0, 0, larg, alt);
    particulas = particulas.filter(function (p) {
      p.idade += dt;
      if (p.idade >= p.vida) return false;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += p.g * dt; p.vx *= Math.exp(-p.atrito * dt);
      var a = Math.pow(1 - p.idade / p.vida, 1.4);
      if (p.quente) {
        /* a faísca é um risco na direção do movimento, somando luz */
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.cor; ctx.lineWidth = p.tam; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke();
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = a;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.idade * p.giro);
        ctx.fillStyle = p.cor; ctx.beginPath();
        ctx.moveTo(-p.tam, -p.tam * .4); ctx.lineTo(p.tam * .3, -p.tam);
        ctx.lineTo(p.tam, p.tam * .5); ctx.lineTo(-p.tam * .6, p.tam);
        ctx.fill(); ctx.restore();
      }
      return true;
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    raf = particulas.length ? requestAnimationFrame(pintar) : 0;
  }
  function animar() {
    if (!raf) { antes = performance.now(); raf = requestAnimationFrame(pintar); }
  }

  /* o centro de um elemento, nas coordenadas do canvas */
  function ponto(el, fy) {
    var c = canvas.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - c.left, y: r.top + r.height * fy - c.top,
             cx: r.left + r.width / 2, cy: r.top + r.height * fy, w: r.width };
  }

  /* o estouro: faíscas para todo lado + estilhaços de pedra */
  function estouro(x, y, forca) {
    var escala = Math.min(larg / 1100, 1) * .6 + .4;
    var n = Math.round((celular ? 60 : 110) * forca);
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var vel = (120 + Math.random() * 520) * escala * forca;
      var quente = i % 4 !== 0;
      particulas.push({
        x: x, y: y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 110 * escala,
        g: quente ? 380 : 620, atrito: quente ? 1.4 : .8,
        tam: quente ? .7 + Math.random() * 1.6 : 2 + Math.random() * 5 * escala,
        idade: 0, vida: .6 + Math.random() * 1.3, giro: (Math.random() - .5) * 12,
        quente: quente,
        cor: quente ? QUENTES[i % QUENTES.length] : PEDRAS[i % PEDRAS.length]
      });
    }
    animar();
  }

  /* faíscas raspando no chão: saem baixas, para os dois lados */
  function raspa(x, y, forca, largura) {
    var n = Math.round((celular ? 26 : 46) * forca);
    for (var i = 0; i < n; i++) {
      var lado = i % 2 ? 1 : -1;
      var vel = (180 + Math.random() * 420) * forca;
      particulas.push({
        x: x + lado * largura * .3 * Math.random(), y: y,
        vx: lado * vel, vy: -(40 + Math.random() * 160),
        g: 520, atrito: 2.2, tam: .8 + Math.random() * 1.4,
        idade: 0, vida: .45 + Math.random() * .7, giro: 0, quente: true,
        cor: QUENTES[i % QUENTES.length]
      });
    }
    animar();
  }

  /* brasas que sobem para a página (a camada fixa do script.js) */
  function brasasSobem(cx, cy, n, espalha) {
    var B = window.CPPEM && window.CPPEM.brasas;
    if (B) B.rajada(cx, cy, n, espalha);
  }

  /* a cratera ainda solta faísca pelas fissuras por um tempinho */
  function fissuras(alvo) {
    var vezes = 0;
    var t = setInterval(function () {
      if (!rodando || ++vezes > 14) { clearInterval(t); return; }
      var p = ponto(alvo, .5);
      var ang = Math.random() * Math.PI * 2, raio = p.w * (.28 + Math.random() * .2);
      var x = p.x + Math.cos(ang) * raio, y = p.y + Math.sin(ang) * raio * 1.1;
      for (var i = 0; i < 6; i++) {
        particulas.push({
          x: x, y: y, vx: (Math.random() - .5) * 160, vy: -(60 + Math.random() * 200),
          g: 300, atrito: 1.2, tam: .6 + Math.random(), idade: 0,
          vida: .4 + Math.random() * .6, giro: 0, quente: true,
          cor: QUENTES[i % QUENTES.length]
        });
      }
      animar();
    }, 130);
  }

  var meteoro = document.getElementById("meteoro");
  var marco = palco.querySelector(".marco");
  var edital = document.getElementById("editalCarimbo");

  hero.addEventListener("animationend", function (e) {
    if (!rodando || movimentoReduzido.matches) return;
    var nome = e.animationName, p;

    if (nome === "meteoro-voa" && e.target === meteoro) {
      p = ponto(marco, .5);
      estouro(p.x, p.y, 1.7);
      brasasSobem(p.cx, p.cy, celular ? 22 : 40, p.w * .5);
      fissuras(marco);
    }
    if (/^(pc|pp|pm)-chega$/.test(nome)) {
      var forca = nome === "pm-chega" ? 1.3 : nome === "pp-chega" ? .95 : .8;
      p = ponto(e.target, .7);
      estouro(p.x, p.y, forca * .8);
      p = ponto(e.target, 1);
      raspa(p.x, p.y, forca, p.w);
      brasasSobem(p.cx, p.cy, celular ? 6 : 12, p.w * .5);
    }
    if (nome === "edital-bate" && e.target === edital) {
      p = ponto(edital, .5);
      estouro(p.x, p.y, .3);
    }
  });

  /* =========================================================
     3 · COMEÇAR, TERMINAR, PULAR
     ========================================================= */
  function concluir() {
    rodando = false; terminou = true; clearTimeout(fimTimer);
    if (pular) pular.hidden = true;
  }
  function comecar() {
    if (terminou || movimentoReduzido.matches) { soltar(); concluir(); return; }
    medir(); rodando = true;
    if (pular) pular.hidden = false;
    soltar();
    /* o fim é o carimbo: --b3 + .55s + .5s ≈ 3,8s */
    fimTimer = setTimeout(concluir, 3900);
  }
  /* leva TODAS as animações da hero ao quadro final; as infinitas (a
     flutuação, os reflexos) seguem rodando a partir do começo do ciclo */
  function aoFinal() {
    soltar();
    hero.getAnimations({ subtree: true }).forEach(function (a) {
      var t = a.effect.getTiming();
      if (t.iterations === Infinity) a.currentTime = Math.max(0, t.delay) + 1;
      else { try { a.finish(); } catch (_) { /* animação sem fim definido */ } }
    });
    limpar(); concluir();
  }

  if (pular) pular.addEventListener("click", aoFinal);
  window.addEventListener("resize", function () { celular = window.innerWidth < 721; medir(); }, { passive: true });
  document.addEventListener("visibilitychange", function () { if (document.hidden && rodando) aoFinal(); });
  movimentoReduzido.addEventListener("change", function () { if (movimentoReduzido.matches) aoFinal(); });

  /* rolou para longe no meio da abertura: ela termina sozinha; fora da
     tela, a hero para de gastar quadro (.is-out-of-view no hero.css) */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting && rodando) aoFinal();
        hero.classList.toggle("is-out-of-view", !en.isIntersecting);
      });
    }).observe(hero);
  }

  /* =========================================================
     1 · CARGA — a cratera tem reserva em CSS se a arte falhar
     ========================================================= */
  var arte = hero.querySelector(".cratera__art");
  function reserva() { hero.classList.add("cratera-reserva"); }
  if (arte) {
    arte.addEventListener("error", reserva);
    if (arte.complete && !arte.naturalWidth) reserva();
  }

  var imagens = Array.prototype.slice.call(palco.querySelectorAll("img"));
  var prontas = Promise.all(imagens.map(function (img) {
    return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  }));
  Promise.race([prontas, new Promise(function (ok) { setTimeout(ok, 1500); })]).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(comecar); });
  });

  /* =========================================================
     4 · PARALLAX — só os brasões, só com mouse de verdade
     ========================================================= */
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var alvoX = 0, alvoY = 0, pendente = false;
  hero.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    alvoX = ((e.clientX - r.left) / r.width - .5) * 2;
    alvoY = ((e.clientY - r.top) / r.height - .5) * 2;
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(function () {
      pendente = false;
      palco.style.setProperty("--px", alvoX.toFixed(3));
      palco.style.setProperty("--py", alvoY.toFixed(3));
    });
  });
  hero.addEventListener("mouseleave", function () {
    palco.style.setProperty("--px", 0);
    palco.style.setProperty("--py", 0);
  });
})();
