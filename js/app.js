/* ===== EN_BOOK · 英语学习书 — front-end engine (vanilla JS, no build) ===== */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var nav = document.getElementById("siteNav");

  // ---- tiny helpers ----
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function setActiveNav(route) {
    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("active", links[i].getAttribute("data-route") === route);
    }
  }
  function showError(msg) {
    app.innerHTML = '<div class="error-box"><strong>内容加载失败 / Failed to load</strong><br>' + esc(msg) +
      '<br><br>如果你是在本地用 <code>file://</code> 直接打开，请改用本地服务器（见 README），或访问 GitHub Pages 部署地址。</div>';
  }

  // ---- data layer (with cache) ----
  var cache = { manifest: null, vocab: {}, grammar: {} };

  function fetchJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " → HTTP " + r.status);
      return r.json();
    });
  }
  function getManifest() {
    if (cache.manifest) return Promise.resolve(cache.manifest);
    return fetchJSON("./content/manifest.json").then(function (m) { cache.manifest = m; return m; });
  }
  function getVocab(band) {
    if (cache.vocab[band]) return Promise.resolve(cache.vocab[band]);
    return fetchJSON("./content/vocab/" + band + ".json").then(function (d) { cache.vocab[band] = d; return d; });
  }
  function getGrammar(band) {
    if (cache.grammar[band]) return Promise.resolve(cache.grammar[band]);
    return fetchJSON("./content/grammar/" + band + ".json").then(function (d) { cache.grammar[band] = d; return d; });
  }
  function findBand(manifest, key) {
    for (var i = 0; i < manifest.bands.length; i++) if (manifest.bands[i].key === key) return manifest.bands[i];
    return null;
  }
  function bandStyle(b) { return 'style="--c1:' + b.color + ';--c2:' + (b.color2 || b.color) + '"'; }

  // ---- router ----
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    return h.split("/").filter(Boolean).map(decodeURIComponent);
  }
  function go(path) { location.hash = path; }
  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", route);

  function route() {
    var parts = parseHash();
    app.scrollTop = 0; window.scrollTo(0, 0);
    if (parts.length === 0) return renderHome();
    switch (parts[0]) {
      case "vocab":
        if (parts.length === 1) return renderPicker("vocab");
        if (parts.length === 2) return renderVocabUnits(parts[1]);
        return renderFlashcards(parts[1], parts[2]);
      case "grammar":
        if (parts.length === 1) return renderPicker("grammar");
        if (parts.length === 2) return renderGrammarTopics(parts[1]);
        return renderGrammarDetail(parts[1], parts[2]);
      case "book":
        return renderBook(parts[1]);
      case "about":
        return renderAbout();
      default:
        return renderHome();
    }
  }

  function loading() { app.innerHTML = '<div class="loading">正在翻开书本…</div>'; }

  // ---- Home / bookshelf ----
  function renderHome() {
    setActiveNav("home");
    loading();
    getManifest().then(function (m) {
      var books = m.bands.map(function (b) {
        return (
          '<a class="book" ' + bandStyle(b) + ' href="#/book/' + b.key + '">' +
            '<div class="cover">' +
              '<span class="level-chip">' + esc(b.level) + '</span>' +
              '<div><h3>' + esc(b.label) + '</h3><div class="en">' + esc(b.labelEn) + '</div></div>' +
            '</div>' +
            '<div class="meta">' +
              '<span><b>' + b.vocabCount + '</b> 词汇</span>' +
              '<span><b>' + b.grammarCount + '</b> 语法</span>' +
              '<span class="desc">' + esc(b.desc) + '</span>' +
            '</div>' +
          '</a>'
        );
      }).join("");
      app.innerHTML =
        '<section class="hero">' +
          '<h1>英语学习书</h1>' +
          '<p class="en">An English Study Book · from Middle School to University</p>' +
          '<p class="tag">中英双语 · 词汇单词卡 + 语法讲解。选一本书，从目录开始阅读与练习。</p>' +
        '</section>' +
        '<div class="section-label">书架 · Bookshelf</div>' +
        '<div class="shelf">' + books + '</div>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- band picker (vocab / grammar entry) ----
  function renderPicker(kind) {
    setActiveNav(kind);
    loading();
    getManifest().then(function (m) {
      var title = kind === "vocab" ? "词汇" : "语法";
      var titleEn = kind === "vocab" ? "Vocabulary" : "Grammar";
      var cards = m.bands.map(function (b) {
        var count = kind === "vocab" ? b.vocabCount + " 个单词" : b.grammarCount + " 个语法点";
        return (
          '<div class="pick-card" ' + bandStyle(b) + ' onclick="location.hash=\'#/' + kind + '/' + b.key + '\'">' +
            '<h3>' + esc(b.label) + '</h3>' +
            '<div class="en">' + esc(b.labelEn) + ' · ' + esc(b.level) + '</div>' +
            '<div class="count">' + count + '</div>' +
          '</div>'
        );
      }).join("");
      app.innerHTML =
        '<h1 class="page-title">' + title + '</h1>' +
        '<p class="page-sub">' + titleEn + ' · 选择学段</p>' +
        '<div class="picker">' + cards + '</div>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- Book TOC ----
  function renderBook(band) {
    setActiveNav("home");
    loading();
    Promise.all([getManifest(), getVocab(band), getGrammar(band)]).then(function (res) {
      var m = res[0], v = res[1], g = res[2];
      var b = findBand(m, band) || { label: band, labelEn: "", level: "" };
      var units = (v.units || []).map(function (u, i) {
        return (
          '<li onclick="location.hash=\'#/vocab/' + band + "/" + u.id + '\'">' +
            '<span class="num">' + (i + 1) + '</span>' +
            '<span class="t-zh">' + esc(u.title) + ' <small style="color:var(--ink-soft);font-weight:400">(' + (u.words ? u.words.length : 0) + ')</small></span>' +
            '<span class="t-en">' + esc(u.titleEn) + '</span>' +
          '</li>'
        );
      }).join("");
      var topics = (g.topics || []).map(function (t, i) {
        return (
          '<li onclick="location.hash=\'#/grammar/' + band + "/" + t.id + '\'">' +
            '<span class="num">' + (i + 1) + '</span>' +
            '<span class="t-zh">' + esc(t.title) + '</span>' +
            '<span class="t-en">' + esc(t.titleEn) + '</span>' +
          '</li>'
        );
      }).join("");
      app.innerHTML =
        '<div class="crumbs"><a href="#/">首页</a><span class="sep">›</span>' + esc(b.label) + '</div>' +
        '<h1 class="page-title">' + esc(b.label) + '</h1>' +
        '<p class="page-sub">' + esc(b.labelEn) + ' · ' + esc(b.level) + '</p>' +
        '<div class="toc-grid">' +
          '<div class="toc-col"><h2>📚 词汇单元</h2><div class="col-en">Vocabulary Units</div><ul class="toc-list">' + (units || '<li>暂无</li>') + '</ul></div>' +
          '<div class="toc-col"><h2>✍️ 语法专题</h2><div class="col-en">Grammar Topics</div><ul class="toc-list">' + (topics || '<li>暂无</li>') + '</ul></div>' +
        '</div>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- vocab: unit list for a band ----
  function renderVocabUnits(band) {
    setActiveNav("vocab");
    loading();
    Promise.all([getManifest(), getVocab(band)]).then(function (res) {
      var m = res[0], v = res[1];
      var b = findBand(m, band) || { label: band, labelEn: "" };
      var items = (v.units || []).map(function (u, i) {
        return (
          '<li onclick="location.hash=\'#/vocab/' + band + "/" + u.id + '\'">' +
            '<span class="num">' + (i + 1) + '</span>' +
            '<span class="t-zh">' + esc(u.title) + ' <small style="color:var(--ink-soft);font-weight:400">(' + (u.words ? u.words.length : 0) + ' 词)</small></span>' +
            '<span class="t-en">' + esc(u.titleEn) + '</span>' +
          '</li>'
        );
      }).join("");
      app.innerHTML =
        '<div class="crumbs"><a href="#/">首页</a><span class="sep">›</span><a href="#/vocab">词汇</a><span class="sep">›</span>' + esc(b.label) + '</div>' +
        '<h1 class="page-title">' + esc(b.label) + ' · 词汇</h1>' +
        '<p class="page-sub">' + esc(b.labelEn) + ' Vocabulary · 选择单元开始背单词</p>' +
        '<ul class="toc-list">' + items + '</ul>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- vocab: flashcards for a unit ----
  function renderFlashcards(band, unitId) {
    setActiveNav("vocab");
    loading();
    Promise.all([getManifest(), getVocab(band)]).then(function (res) {
      var m = res[0], v = res[1];
      var b = findBand(m, band) || { label: band };
      var unit = null;
      for (var i = 0; i < (v.units || []).length; i++) if (v.units[i].id === unitId) unit = v.units[i];
      if (!unit) return showError("找不到该单元: " + unitId);

      var words = unit.words.slice();
      var order = words.map(function (_, i) { return i; });
      var idx = 0, flipped = false, listMode = false;

      app.innerHTML =
        '<div class="crumbs"><a href="#/">首页</a><span class="sep">›</span><a href="#/vocab">词汇</a><span class="sep">›</span>' +
          '<a href="#/vocab/' + band + '">' + esc(b.label) + '</a><span class="sep">›</span>' + esc(unit.title) + '</div>' +
        '<h1 class="page-title">' + esc(unit.title) + '</h1>' +
        '<p class="page-sub">' + esc(unit.titleEn) + ' · ' + words.length + ' words</p>' +
        '<div class="study-bar">' +
          '<div class="progress" id="prog"></div>' +
          '<div class="tools">' +
            '<button class="btn ghost" id="shuffleBtn">🔀 乱序</button>' +
            '<button class="btn ghost" id="modeBtn">📋 列表</button>' +
          '</div>' +
        '</div>' +
        '<div id="studyArea"></div>';

      var area = document.getElementById("studyArea");
      var prog = document.getElementById("prog");

      function renderCardMode() {
        var w = words[order[idx]];
        area.innerHTML =
          '<div class="flashcard-stage">' +
            '<div class="flashcard' + (flipped ? ' flipped' : '') + '" id="card">' +
              '<div class="flash-face flash-front">' +
                '<div class="word">' + esc(w.word) + '</div>' +
                '<div class="phon">' + esc(w.phonetic) + '</div>' +
                '<div class="pos">' + esc(w.pos) + '</div>' +
                '<div class="hint">点击卡片看释义 · click to flip</div>' +
              '</div>' +
              '<div class="flash-face flash-back">' +
                '<div class="meaning">' + esc(w.meaning) + '</div>' +
                '<div class="ex">' + esc(w.example) + '</div>' +
                '<div class="ex-zh">' + esc(w.exampleZh) + '</div>' +
                '<div class="hint">点击返回 · click to flip back</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="study-nav">' +
            '<button class="btn" id="prevBtn">← 上一张</button>' +
            '<button class="btn primary" id="flipBtn">翻转</button>' +
            '<button class="btn" id="nextBtn">下一张 →</button>' +
          '</div>';
        document.getElementById("card").onclick = function () { flipped = !flipped; renderCardMode(); };
        document.getElementById("flipBtn").onclick = function () { flipped = !flipped; renderCardMode(); };
        document.getElementById("prevBtn").onclick = function () { if (idx > 0) { idx--; flipped = false; renderCardMode(); } };
        document.getElementById("nextBtn").onclick = function () { if (idx < words.length - 1) { idx++; flipped = false; renderCardMode(); } };
        document.getElementById("prevBtn").disabled = idx === 0;
        document.getElementById("nextBtn").disabled = idx === words.length - 1;
        prog.textContent = (idx + 1) + " / " + words.length;
      }

      function renderListMode() {
        var rows = order.map(function (oi) {
          var w = words[oi];
          return '<tr><td class="w">' + esc(w.word) + '<div class="p">' + esc(w.phonetic) + '</div></td>' +
            '<td>' + esc(w.pos) + ' ' + esc(w.meaning) + '<div class="ex">' + esc(w.example) + '</div></td></tr>';
        }).join("");
        area.innerHTML = '<table class="word-table"><thead><tr><th>单词 Word</th><th>释义 &amp; 例句</th></tr></thead><tbody>' + rows + '</tbody></table>';
        prog.textContent = words.length + " 个单词";
      }

      function refresh() { listMode ? renderListMode() : renderCardMode(); }

      document.getElementById("shuffleBtn").onclick = function () {
        for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
        idx = 0; flipped = false; refresh();
      };
      document.getElementById("modeBtn").onclick = function () {
        listMode = !listMode;
        document.getElementById("modeBtn").textContent = listMode ? "🃏 卡片" : "📋 列表";
        refresh();
      };

      // keyboard
      document.onkeydown = function (e) {
        if (location.hash.indexOf("/vocab/") === -1) { document.onkeydown = null; return; }
        if (listMode) return;
        if (e.key === "ArrowLeft") document.getElementById("prevBtn") && document.getElementById("prevBtn").click();
        else if (e.key === "ArrowRight") document.getElementById("nextBtn") && document.getElementById("nextBtn").click();
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipped = !flipped; renderCardMode(); }
      };

      refresh();
    }).catch(function (e) { showError(e.message); });
  }

  // ---- grammar: topic list ----
  function renderGrammarTopics(band) {
    setActiveNav("grammar");
    loading();
    Promise.all([getManifest(), getGrammar(band)]).then(function (res) {
      var m = res[0], g = res[1];
      var b = findBand(m, band) || { label: band, labelEn: "" };
      var items = (g.topics || []).map(function (t, i) {
        return (
          '<li onclick="location.hash=\'#/grammar/' + band + "/" + t.id + '\'">' +
            '<span class="num">' + (i + 1) + '</span>' +
            '<span class="t-zh">' + esc(t.title) + '</span>' +
            '<span class="t-en">' + esc(t.titleEn) + '</span>' +
          '</li>'
        );
      }).join("");
      app.innerHTML =
        '<div class="crumbs"><a href="#/">首页</a><span class="sep">›</span><a href="#/grammar">语法</a><span class="sep">›</span>' + esc(b.label) + '</div>' +
        '<h1 class="page-title">' + esc(b.label) + ' · 语法</h1>' +
        '<p class="page-sub">' + esc(b.labelEn) + ' Grammar · 选择语法专题</p>' +
        '<ul class="toc-list">' + items + '</ul>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- grammar: topic detail ----
  function renderGrammarDetail(band, topicId) {
    setActiveNav("grammar");
    loading();
    Promise.all([getManifest(), getGrammar(band)]).then(function (res) {
      var m = res[0], g = res[1];
      var b = findBand(m, band) || { label: band };
      var list = g.topics || [], pos = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === topicId) pos = i;
      if (pos === -1) return showError("找不到该语法专题: " + topicId);
      var t = list[pos];

      var sections = (t.sections || []).map(function (s) {
        return '<div class="g-section"><h3>' + esc(s.heading) + '</h3><div class="body">' + esc(s.body) + '</div></div>';
      }).join("");
      var examples = (t.examples || []).map(function (e) {
        return '<div class="g-example"><div class="en">' + esc(e.en) + '</div><div class="zh">' + esc(e.zh) + '</div>' +
          (e.note ? '<div class="note">💡 ' + esc(e.note) + '</div>' : '') + '</div>';
      }).join("");
      var tips = (t.tips || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("");

      var prev = pos > 0 ? list[pos - 1] : null;
      var next = pos < list.length - 1 ? list[pos + 1] : null;
      var pager =
        '<div class="pager">' +
          (prev ? '<button class="btn" onclick="location.hash=\'#/grammar/' + band + "/" + prev.id + '\'">← ' + esc(prev.title) + '</button>' : '<span></span>') +
          (next ? '<button class="btn primary" onclick="location.hash=\'#/grammar/' + band + "/" + next.id + '\'">' + esc(next.title) + ' →</button>' : '<span></span>') +
        '</div>';

      app.innerHTML =
        '<div class="crumbs"><a href="#/">首页</a><span class="sep">›</span><a href="#/grammar">语法</a><span class="sep">›</span>' +
          '<a href="#/grammar/' + band + '">' + esc(b.label) + '</a><span class="sep">›</span>' + esc(t.title) + '</div>' +
        '<div class="grammar-page">' +
          '<h1 class="page-title">' + esc(t.title) + '</h1>' +
          '<p class="page-sub">' + esc(t.titleEn) + '</p>' +
          (t.summary ? '<div class="summary">' + esc(t.summary) + '</div>' : '') +
          sections +
          (examples ? '<h3 style="font-family:var(--serif-zh);margin-top:30px">例句 Examples</h3><div class="g-examples">' + examples + '</div>' : '') +
          (tips ? '<div class="tips"><h3>✅ 要点提示 Tips</h3><ul>' + tips + '</ul></div>' : '') +
          pager +
        '</div>';
    }).catch(function (e) { showError(e.message); });
  }

  // ---- about ----
  function renderAbout() {
    setActiveNav("about");
    app.innerHTML =
      '<div class="prose">' +
        '<h1 class="page-title">关于本书</h1>' +
        '<p class="page-sub">About EN_BOOK</p>' +
        '<p>「英语学习书」是一本面向 <strong>初中到大学</strong> 学习者的在线英语学习书，像一本数学课本一样按学段分册、按章节编排，中英双语对照。</p>' +
        '<h2>包含内容</h2>' +
        '<ul>' +
          '<li><strong>词汇单词卡</strong>：按主题单元整理高频词，支持卡片翻转、乱序复习、列表速览。</li>' +
          '<li><strong>语法讲解</strong>：每个语法专题含用法说明、结构、例句和易错点提示。</li>' +
        '</ul>' +
        '<h2>学段分册</h2>' +
        '<ul>' +
          '<li>📗 初中英语 · Junior High（基础）</li>' +
          '<li>📘 高中英语 · Senior High（进阶）</li>' +
          '<li>📕 大学英语 · College / CET（拓展）</li>' +
        '</ul>' +
        '<h2>如何添加内容</h2>' +
        '<p>所有内容都是可编辑的 JSON 文件，位于 <code>content/vocab/</code> 与 <code>content/grammar/</code>。按现有格式增删条目即可，无需重新构建。</p>' +
        '<p style="margin-top:24px"><a class="btn primary" href="#/">← 回到书架</a></p>' +
      '</div>';
  }
})();
