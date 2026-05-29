const WHATSAPP_NUMERO = '351932064105';
const STORAGE_KEY = 'solylluvia_decisoes_v1';

const elContainer = document.getElementById('campanhas-container');
const elProgressoNum = document.getElementById('progresso-num');
const elProgressoTotal = document.getElementById('progresso-total');
const elProgressoFill = document.getElementById('progresso-fill');
const elBtnConcluir = document.getElementById('btn-concluir');
const elFooterAviso = document.getElementById('footer-aviso');
const elScreenDecisao = document.getElementById('screen-decisao');
const elScreenRevisao = document.getElementById('screen-revisao');
const elBtnVoltar = document.getElementById('btn-voltar');
const elBtnEnviar = document.getElementById('btn-enviar');
const elListasRevisao = document.getElementById('listas-revisao');
const elResumoManterNum = document.getElementById('resumo-manter-num');
const elResumoNegativarNum = document.getElementById('resumo-negativar-num');

let dados = {};
let decisoes = {};
let totalTermos = 0;

function termoKey(campanha, termo) {
  return campanha + '||' + termo;
}

function carregarDecisoes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) decisoes = JSON.parse(raw);
  } catch (e) {
    decisoes = {};
  }
}

function salvarDecisoes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisoes));
  } catch (e) {}
}

function fmtEuro(n) {
  return '€' + n.toFixed(2).replace('.', ',');
}

function renderCard(campanha, termo) {
  const key = termoKey(campanha, termo.termo);
  const decisao = decisoes[key];

  const card = document.createElement('div');
  card.className = 'termo-card';
  if (decisao === 'manter') card.classList.add('decidido-manter');
  if (decisao === 'negativar') card.classList.add('decidido-negativar');

  card.innerHTML = `
    <div class="termo-texto">${escapeHtml(termo.termo)}</div>
    <div class="termo-metricas">
      <div class="metrica">
        <span class="metrica-label">Impr.</span>
        <span class="metrica-valor">${termo.imp}</span>
      </div>
      <div class="metrica">
        <span class="metrica-label">Clics</span>
        <span class="metrica-valor">${termo.cli}</span>
      </div>
      <div class="metrica">
        <span class="metrica-label">CTR</span>
        <span class="metrica-valor">${termo.ctr}%</span>
      </div>
      <div class="metrica">
        <span class="metrica-label">Coste</span>
        <span class="metrica-valor">${fmtEuro(termo.custo)}</span>
      </div>
    </div>
    <div class="termo-acoes">
      <button class="btn-acao btn-manter ${decisao === 'manter' ? 'ativo' : ''}" data-acao="manter">Mantener</button>
      <button class="btn-acao btn-negativar ${decisao === 'negativar' ? 'ativo' : ''}" data-acao="negativar">Negativar</button>
    </div>
  `;

  card.querySelectorAll('.btn-acao').forEach(btn => {
    btn.addEventListener('click', () => {
      const acao = btn.dataset.acao;
      decisoes[key] = acao;
      salvarDecisoes();
      atualizarCard(card, acao);
      atualizarProgresso();
    });
  });

  return card;
}

function atualizarCard(card, acao) {
  card.classList.remove('decidido-manter', 'decidido-negativar');
  card.classList.add('decidido-' + acao);
  card.querySelectorAll('.btn-acao').forEach(b => b.classList.remove('ativo'));
  const btn = card.querySelector('.btn-acao[data-acao="' + acao + '"]');
  if (btn) btn.classList.add('ativo');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTudo() {
  elContainer.innerHTML = '';
  totalTermos = 0;

  for (const campanha in dados) {
    const termos = dados[campanha];
    totalTermos += termos.length;

    const sec = document.createElement('section');
    sec.className = 'campanha';
    sec.innerHTML = `
      <div class="campanha-titulo">
        <span>${escapeHtml(campanha)}</span>
        <span class="campanha-count">${termos.length} términos</span>
      </div>
    `;

    termos.forEach(t => {
      sec.appendChild(renderCard(campanha, t));
    });

    elContainer.appendChild(sec);
  }

  elProgressoTotal.textContent = totalTermos;
  atualizarProgresso();
}

function atualizarProgresso() {
  let revisados = 0;
  for (const campanha in dados) {
    for (const t of dados[campanha]) {
      if (decisoes[termoKey(campanha, t.termo)]) revisados++;
    }
  }

  elProgressoNum.textContent = revisados;
  const pct = totalTermos > 0 ? (revisados / totalTermos) * 100 : 0;
  elProgressoFill.style.width = pct + '%';

  const completo = revisados === totalTermos && totalTermos > 0;
  elBtnConcluir.disabled = !completo;
  elFooterAviso.textContent = completo
    ? '¡Listo! Puedes concluir la revisión.'
    : `Faltan ${totalTermos - revisados} término(s) por revisar`;
}

function agruparDecisoes() {
  const manter = {};
  const negativar = {};

  for (const campanha in dados) {
    for (const t of dados[campanha]) {
      const d = decisoes[termoKey(campanha, t.termo)];
      if (d === 'manter') {
        if (!manter[campanha]) manter[campanha] = [];
        manter[campanha].push(t.termo);
      } else if (d === 'negativar') {
        if (!negativar[campanha]) negativar[campanha] = [];
        negativar[campanha].push(t.termo);
      }
    }
  }

  return { manter, negativar };
}

function renderRevisao() {
  const { manter, negativar } = agruparDecisoes();

  const totalManter = Object.values(manter).reduce((a, b) => a + b.length, 0);
  const totalNegativar = Object.values(negativar).reduce((a, b) => a + b.length, 0);

  elResumoManterNum.textContent = totalManter;
  elResumoNegativarNum.textContent = totalNegativar;

  elListasRevisao.innerHTML = '';

  const blocoManter = document.createElement('div');
  blocoManter.className = 'lista-revisao';
  blocoManter.innerHTML = '<h3 class="h-manter">✓ Términos a mantener</h3>';
  if (totalManter === 0) {
    blocoManter.innerHTML += '<div class="lista-vazia">Ningún término marcado para mantener.</div>';
  } else {
    for (const camp in manter) {
      const subt = document.createElement('div');
      subt.className = 'lista-revisao-campanha';
      subt.textContent = camp;
      blocoManter.appendChild(subt);
      const ul = document.createElement('ul');
      manter[camp].forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      blocoManter.appendChild(ul);
    }
  }
  elListasRevisao.appendChild(blocoManter);

  const blocoNegativar = document.createElement('div');
  blocoNegativar.className = 'lista-revisao';
  blocoNegativar.innerHTML = '<h3 class="h-negativar">✗ Términos a negativar</h3>';
  if (totalNegativar === 0) {
    blocoNegativar.innerHTML += '<div class="lista-vazia">Ningún término marcado para negativar.</div>';
  } else {
    for (const camp in negativar) {
      const subt = document.createElement('div');
      subt.className = 'lista-revisao-campanha';
      subt.textContent = camp;
      blocoNegativar.appendChild(subt);
      const ul = document.createElement('ul');
      negativar[camp].forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.appendChild(li);
      });
      blocoNegativar.appendChild(ul);
    }
  }
  elListasRevisao.appendChild(blocoNegativar);
}

function gerarMensagemWhatsApp() {
  const { manter, negativar } = agruparDecisoes();
  const linhas = [];
  linhas.push('Hola Zivug, aquí va mi revisión de términos de búsqueda de SolyLluvia (25-29 mayo 2026):');
  linhas.push('');

  for (const camp in dados) {
    linhas.push('*' + camp + '*');
    const m = manter[camp] || [];
    const n = negativar[camp] || [];

    linhas.push('');
    linhas.push('Mantener (' + m.length + '):');
    if (m.length === 0) linhas.push('(ninguno)');
    else m.forEach(t => linhas.push('  • ' + t));

    linhas.push('');
    linhas.push('Negativar (' + n.length + '):');
    if (n.length === 0) linhas.push('(ninguno)');
    else n.forEach(t => linhas.push('  • ' + t));

    linhas.push('');
    linhas.push('---');
    linhas.push('');
  }

  return linhas.join('\n');
}

function trocarTela(qual) {
  elScreenDecisao.classList.remove('active');
  elScreenRevisao.classList.remove('active');
  if (qual === 'revisao') {
    elScreenRevisao.classList.add('active');
    renderRevisao();
  } else {
    elScreenDecisao.classList.add('active');
  }
  window.scrollTo(0, 0);
}

elBtnConcluir.addEventListener('click', () => trocarTela('revisao'));
elBtnVoltar.addEventListener('click', () => trocarTela('decisao'));

elBtnEnviar.addEventListener('click', () => {
  const msg = gerarMensagemWhatsApp();
  const url = 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
});

fetch('data.json')
  .then(r => r.json())
  .then(d => {
    dados = d;
    carregarDecisoes();
    renderTudo();
  })
  .catch(err => {
    elContainer.innerHTML = '<p style="color: var(--red); padding: 20px;">Error al cargar los datos: ' + err.message + '</p>';
  });
