/* =========================================================
   CPPEM · SIMULADÃO PM, PC E PPPE
   ---------------------------------------------------------
   Base: Super Revisão de Véspera PMPE. O script faz quatro coisas:

     1. INGRESSO    preço e link de compra (a partir do CONFIG)
     2. RELÓGIO     a contagem regressiva até 08/11
     3. PÁGINA      header, progresso, dock, reveal
     4. BRASAS      a camada de brasas da página inteira

   A abertura da hero (meteoro, brasões, faíscas) mora no hero.js.

   ⚠️ Tudo que muda com a venda (preços, links) mora no CONFIG abaixo.
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = {
    pagina: "Simuladão PM, PC e PPPE",

    /* Dia do evento, com fuso. A contagem vai até o começo do dia 08/11:
       o horário ainda não foi divulgado e o relógio não pode inventar um. */
    inicio: "2026-11-08T00:00:00-03:00",

    /* ─── INGRESSOS ─────────────────────────────────────────
       · preco: texto pronto ("R$ 49,90"). Vazio + checkout preenchido =
         "Vendas abertas".
       · parcelas / parcela (opcionais): a PARCELA vira o número grande e o
         à vista desce para a linha de baixo. Copie do checkout — se houver
         juros, a página NUNCA pode dizer "sem juros".
       · precoDe / off (opcionais): o "de R$ X" riscado e o desconto — os
         MESMOS números do checkout, senão a página contradiz a tela de
         pagamento no momento em que a pessoa vai digitar o cartão.
       · checkout: link do produto. Vazio = o botão mostra o aviso
         "vendas abrem em breve" em vez de navegar.
       · produto: o nome que vai no evento de clique do dataLayer.
       Lote único e um só ingresso: só existe o comum. */
    ingressos: {
      comum: {
        produto: "Ingresso — Simuladão PM, PC e PPPE",
        preco: "R$ 30,00", precoDe: "R$ 69,90", off: "-57%",
        checkout: "https://checkout.cppem.com.br/pay/simulado-concursos-pernambuco-pm-pc-pp"
      }
    }
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  function push(dados) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(dados);
  }

  /* =========================================================
     1 · INGRESSOS
     ========================================================= */
  var ING = CONFIG.ingressos;

  /* UTMs e ids de clique da visita seguem para o checkout: sem isso a venda
     chega lá sem origem. */
  var PASSA = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck", "fbclid", "gclid"];
  var params = new URLSearchParams(window.location.search);

  function linkDe(tipo) {
    var dados = ING[tipo];
    if (!dados || !dados.checkout) return "";
    var url = new URL(dados.checkout);
    PASSA.forEach(function (k) {
      var v = params.get(k);
      if (v) url.searchParams.set(k, v);
    });
    return url.toString();
  }

  function semPreco(dados) {
    return dados.preco || (dados.checkout ? "Vendas abertas" : "Em breve");
  }

  /* Com parcela: "12x de" pequeno + a parcela grande, e o à vista na linha
     de baixo. Sem parcela: o preço cheio, grande. */
  function escrevePreco(el, dados) {
    var tipo = el.getAttribute("data-ingresso-preco");
    var avista = $('[data-ingresso-avista="' + tipo + '"]');
    var parcelado = !!(dados.parcela && dados.preco);

    el.textContent = "";
    if (parcelado) {
      var x = document.createElement("small");
      x.textContent = (dados.parcelas || "12x") + " de";
      el.appendChild(x);
      el.appendChild(document.createTextNode(" " + dados.parcela));
    } else {
      el.textContent = semPreco(dados);
    }
    el.classList.toggle("is-vazio", !dados.preco);
    el.classList.toggle("is-parcela", parcelado);

    if (avista) {
      avista.hidden = !parcelado;
      if (parcelado) $("strong", avista).textContent = dados.preco;
    }

    var de = $('[data-ingresso-de="' + tipo + '"]');
    if (de) {
      de.hidden = !(dados.precoDe && dados.preco);
      if (!de.hidden) {
        $("s", de).textContent = dados.precoDe;
        $("em", de).textContent = dados.off || "";
        $("em", de).hidden = !dados.off;
      }
    }
  }

  $$("[data-ingresso-preco]").forEach(function (el) {
    var dados = ING[el.getAttribute("data-ingresso-preco")];
    if (dados) escrevePreco(el, dados);
  });

  /* ─── a faixa de alerta ───
     Troca a mensagem a cada 2,8s. A classe tem-alerta no <html> abre espaço
     para a faixa na hero. Só verdades: venda aberta, data e local. */
  var algumAberto = !!ING.comum.checkout;
  (function alerta() {
    var faixa = $("[data-alerta]");
    var txt = faixa && $("[data-alerta-txt]", faixa);
    if (!faixa || !txt) return;

    var mensagens = algumAberto
      ? ["Vendas abertas!", "08/11 · Sede CPPEM", "PMPE · PCPE · PPPE", "De R$ 69,90 por R$ 30", "Apenas 100 vagas"]
      : [];
    faixa.hidden = !mensagens.length;
    document.documentElement.classList.toggle("tem-alerta", mensagens.length > 0);
    if (!mensagens.length) return;

    var i = 0;
    txt.textContent = mensagens[0];
    if (reduced) return;
    setInterval(function () {
      i = (i + 1) % mensagens.length;
      txt.classList.add("is-trocando");
      setTimeout(function () {
        txt.textContent = mensagens[i];
        txt.classList.remove("is-trocando");
      }, 220);
    }, 2800);
  })();

  if (!algumAberto) {
    $$("[data-urgencia]").forEach(function (el) {
      el.textContent = "Vendas abrem em breve — fique de olho nesta página.";
    });
  }

  /* ─── aviso de venda fechada ─── */
  var aviso = document.getElementById("aviso");
  var avisoTimer = null;

  function mostrarAviso() {
    if (!aviso) return;
    aviso.classList.add("is-on");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { aviso.classList.remove("is-on"); }, 3800);
  }

  /* [data-cta] "Garantir vaga" do header, hero, dock e final: descem até
     #ingressos (o próprio href faz isso), aqui só marcamos. */
  $$("[data-cta]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      push({ event: "clique_cta_ingressos", pagina: CONFIG.pagina });
    });
  });

  /* [data-compra] os botões de cada ingresso: vão direto ao checkout.
     Sem link no CONFIG, mostram o aviso em vez de navegar. */
  $$("[data-compra]").forEach(function (btn) {
    var tipo = btn.getAttribute("data-compra");
    var url = linkDe(tipo);
    btn.href = url || "#ingressos";
    btn.addEventListener("click", function (e) {
      push({
        event: "clique_checkout",
        pagina: CONFIG.pagina,
        produto: ING[tipo] ? ING[tipo].produto : tipo,
        destino: url ? "checkout" : "em_breve"
      });
      if (url) return;
      e.preventDefault();
      mostrarAviso();
    });
  });

  /* =========================================================
     2 · O RELÓGIO — some inteiro quando o dia 08/11 chega
     ========================================================= */
  (function relogio() {
    var alvo = new Date(CONFIG.inicio).getTime();
    var blocos = $$("[data-relogio-bloco], [data-relogio]");
    var timer = null;

    function pinta() {
      var falta = alvo - Date.now();
      if (!(falta > 0)) {
        blocos.forEach(function (el) { el.hidden = true; });
        clearInterval(timer);
        return;
      }
      var s = Math.floor(falta / 1000);
      var partes = {
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60
      };
      Object.keys(partes).forEach(function (k) {
        var v = partes[k] < 10 ? "0" + partes[k] : String(partes[k]);
        $$('[data-cd="' + k + '"]').forEach(function (el) { el.textContent = v; });
      });
    }
    pinta();
    timer = setInterval(pinta, 1000);
  })();

  /* =========================================================
     3 · HEADER, PROGRESSO, DOCK, REVEAL
     ========================================================= */
  var header   = document.getElementById("header");
  var progress = document.getElementById("progress");
  var dock     = document.getElementById("dock");
  var whats    = document.getElementById("whats");
  var ticking  = false;

  function render() {
    var y  = window.scrollY;
    var vh = window.innerHeight;
    if (header) header.classList.toggle("is-stuck", y > 40);

    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }

    /* A dock e o WhatsApp só entram depois da hero. */
    var passouHero = y > vh * 0.85;
    if (dock)  dock.classList.toggle("is-on", passouHero);
    if (whats) whats.classList.toggle("is-on", passouHero);

    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  render();

  /* ─── reveal ao rolar ─── */
  var alvos = $$(".section__head, .pilar, .materia, .info, .plano, .faq__item, .final__inner");
  alvos.forEach(function (el) { el.classList.add("reveal"); });

  if (!("IntersectionObserver" in window)) {
    alvos.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = (i++ * 70) + "ms";
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px" });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     4 · BRASAS — a página inteira sobre um braseiro
     ---------------------------------------------------------
     Um canvas fixo (.brasas). As brasas nascem embaixo e sobem
     balançando, piscando como carvão; a rolagem empurra todas um
     pouco, como se a página passasse por dentro delas.

     window.CPPEM.brasas.rajada(x, y, n, espalha) solta n brasas de
     um ponto da tela: é o que o hero.js chama no impacto do meteoro
     e de cada brasão. Os botões dourados também soltam algumas.
     ========================================================= */
  (function brasas() {
    var tela = document.getElementById("brasas");
    if (!tela || reduced || !tela.getContext) return;
    var ctx = tela.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var lista = [], ultimoT = 0, rolagem = window.scrollY;
    var celular = window.innerWidth < 721;
    var AMBIENTE = celular ? 20 : 42;

    /* o desenho de uma brasa, pronto uma vez só: miolo claro, halo quente */
    function sprite(miolo, meio) {
      var c = document.createElement("canvas");
      c.width = c.height = 32;
      var g = c.getContext("2d");
      var r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      r.addColorStop(0, miolo);
      r.addColorStop(.22, meio);
      r.addColorStop(.5, "rgba(196,90,40,.22)");
      r.addColorStop(1, "rgba(196,90,40,0)");
      g.fillStyle = r; g.fillRect(0, 0, 32, 32);
      return c;
    }
    var SPRITES = [
      sprite("rgba(255,244,214,1)", "rgba(255,170,90,.85)"),   // brasa viva
      sprite("rgba(255,232,190,1)", "rgba(224,120,60,.8)"),    // brasa
      sprite("rgba(240,220,176,1)", "rgba(201,174,122,.75)")   // ouro
    ];

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth; H = window.innerHeight;
      tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function nova(x, y, rajada) {
      return {
        x: x, y: y,
        vx: rajada ? (Math.random() - .5) * 120 : (Math.random() - .5) * 10,
        vy: rajada ? -(70 + Math.random() * 190) : -(16 + Math.random() * 40),
        tam: rajada ? 3 + Math.random() * 5 : 2.2 + Math.random() * 4.2,
        vida: rajada ? 2.4 + Math.random() * 2.6 : 9 + Math.random() * 10,
        idade: 0,
        fase: Math.random() * 6.28,
        balanco: 8 + Math.random() * 22,
        pisca: 2 + Math.random() * 5,
        brilho: rajada ? .95 : .35 + Math.random() * .45,
        fundo: .5 + Math.random() * .8,      // profundidade: quanto a rolagem mexe
        spr: SPRITES[Math.random() < .45 ? 0 : (Math.random() < .6 ? 1 : 2)],
        rajada: !!rajada
      };
    }

    medir();
    for (var i = 0; i < AMBIENTE; i++) {
      var b0 = nova(Math.random() * W, Math.random() * H, false);
      b0.idade = Math.random() * b0.vida * .8;
      lista.push(b0);
    }

    function quadro(t) {
      var dt = Math.max(0, Math.min((t - ultimoT) / 1000 || .016, .05));
      ultimoT = t;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      var vivas = 0;
      lista = lista.filter(function (b) {
        b.idade += dt;
        if (b.idade >= b.vida || b.y < -30) {
          return false;
        }
        if (!b.rajada) vivas++;
        b.vx *= Math.exp(-(b.rajada ? 1.1 : .2) * dt);
        b.vy += (b.rajada ? 40 : 0) * dt;           // a rajada perde força
        if (b.rajada && b.vy > -22) b.vy = -22;      // ...mas segue subindo
        b.x += (b.vx + Math.sin(b.idade * 1.3 + b.fase) * b.balanco) * dt;
        b.y += b.vy * dt;

        var vida = b.idade / b.vida;
        var entra = Math.min(1, b.idade / .6);
        var sai = vida > .7 ? 1 - (vida - .7) / .3 : 1;
        var a = b.brilho * entra * sai * (.72 + .28 * Math.sin(b.idade * b.pisca + b.fase));
        if (a <= 0) return true;
        var s = b.tam * (1 - vida * .45) * 3;
        ctx.globalAlpha = a;
        ctx.drawImage(b.spr, b.x - s / 2, b.y - s / 2, s, s);
        return true;
      });

      /* repõe as brasas do ambiente que morreram, sempre por baixo */
      for (; vivas < AMBIENTE; vivas++) lista.push(nova(Math.random() * W, H + 10 + Math.random() * 40, false));

      ctx.globalAlpha = 1;
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);

    window.addEventListener("resize", function () {
      celular = window.innerWidth < 721;
      AMBIENTE = celular ? 20 : 42;
      medir();
    }, { passive: true });

    /* rolou: a página "passa" pelas brasas */
    window.addEventListener("scroll", function () {
      var dy = window.scrollY - rolagem;
      rolagem = window.scrollY;
      if (Math.abs(dy) > 200) return;              // pulo de âncora: ignora
      lista.forEach(function (b) { b.y -= dy * .18 * b.fundo; });
    }, { passive: true });

    function rajada(x, y, n, espalha) {
      espalha = espalha || 20;
      for (var k = 0; k < n; k++) {
        lista.push(nova(x + (Math.random() - .5) * espalha * 2, y + (Math.random() - .5) * espalha * .6, true));
      }
    }
    window.CPPEM = window.CPPEM || {};
    window.CPPEM.brasas = { rajada: rajada };

    /* os botões dourados soltam algumas brasas quando o mouse chega */
    $$(".btn--gold").forEach(function (btn) {
      var ultima = 0;
      btn.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse" || Date.now() - ultima < 700) return;
        ultima = Date.now();
        var r = btn.getBoundingClientRect();
        rajada(r.left + r.width / 2, r.top + 4, 7, r.width * .4);
      });
    });
  })();

  $$(".pilar").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  var ano = document.getElementById("year");
  if (ano) ano.textContent = new Date().getFullYear();

})();
