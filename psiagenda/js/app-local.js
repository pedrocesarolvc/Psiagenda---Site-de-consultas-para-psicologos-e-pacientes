// ============================================
// app-local.js (VERSÃO SIMPLIFICADA - COMPLETA)
// ============================================

const STORAGE_KEY = "psiagenda-local";

// ---------------------------
// SESSÃO
// ---------------------------
function setUsuarioLogado(id) {
  localStorage.setItem("psiagenda-usuario-logado", id);
}

function getUsuarioLogado() {
  const id = localStorage.getItem("psiagenda-usuario-logado");
  if (!id) return null;
  const state = loadState();
  return state.usuarios.find(u => u.id === id) || null;
}

function logout() {
  localStorage.removeItem("psiagenda-usuario-logado");
  localStorage.removeItem("psiagenda-dia-selecionado");
}

function setDiaSelecionado(dataISO) {
  localStorage.setItem("psiagenda-dia-selecionado", dataISO);
}

function getDiaSelecionado() {
  return localStorage.getItem("psiagenda-dia-selecionado") || new Date().toISOString().split('T')[0];
}

// ---------------------------
// CRUD USUÁRIOS
// ---------------------------
function createUsuario(usuario) {
  const state = loadState();
  const id = gerarId();
  const novo = { id, ...usuario };
  state.usuarios.push(novo);
  saveState(state);
  return novo;
}

function findUsuarioByEmail(email) {
  const state = loadState();
  return state.usuarios.find(u => u.email === email) || null;
}

function findUsuarioById(id) {
  const state = loadState();
  return state.usuarios.find(u => u.id === id) || null;
}

function updateUsuario(id, dados) {
  const state = loadState();
  const idx = state.usuarios.findIndex(u => u.id === id);
  if (idx === -1) return null;
  state.usuarios[idx] = { ...state.usuarios[idx], ...dados };
  saveState(state);
  return state.usuarios[idx];
}

// ---------------------------
// CONSULTAS
// ---------------------------
function createConsulta(consulta) {
  const state = loadState();
  const id = gerarId();
  const nova = { id, status: "confirmada", criadaEm: new Date().toISOString(), ...consulta };
  state.consultas.push(nova);
  saveState(state);
  return nova;
}

function getConsultasDoPsicologo(psicologoId) {
  const state = loadState();
  return state.consultas.filter(c => c.psicologoId === psicologoId);
}

function getConsultasDoPsicologoNoDia(psicologoId, dataISO) {
  const state = loadState();
  return state.consultas.filter(c => c.psicologoId === psicologoId && c.data === dataISO);
}

function cancelarConsulta(consultaId) {
  const state = loadState();
  const consulta = state.consultas.find(c => c.id === consultaId);
  if (!consulta) return false;
  
  consulta.status = "cancelada";
  saveState(state);
  
  addNotificacao(consulta.pacienteId, `❌ Sua consulta do dia ${consulta.data} às ${consulta.hora} foi cancelada.`);
  addNotificacao(consulta.psicologoId, `❌ Consulta com paciente cancelada para ${consulta.data} às ${consulta.hora}`);
  
  return true;
}

// ---------------------------
// NOTIFICAÇÕES
// ---------------------------
function addNotificacao(usuarioId, texto) {
  const state = loadState();
  state.notificacoes.unshift({ 
    id: gerarId(), 
    usuarioId, 
    texto, 
    lida: false, 
    data: new Date().toISOString() 
  });
  saveState(state);
}

function getNotificacoesDoUsuario(usuarioId) {
  const state = loadState();
  return state.notificacoes.filter(n => n.usuarioId === usuarioId);
}

function marcarNotificacaoLida(notificacaoId) {
  const state = loadState();
  const notif = state.notificacoes.find(n => n.id === notificacaoId);
  if (notif) notif.lida = true;
  saveState(state);
}

// ---------------------------
// ANOTAÇÕES DOS PACIENTES
// ---------------------------
function getAnotacoesDoPaciente(pacienteId) {
  const state = loadState();
  return state.anotacoes.filter(a => a.pacienteId === pacienteId).sort((a, b) => 
    new Date(b.dataISO) - new Date(a.dataISO)
  );
}

function addAnotacao(pacienteId, texto) {
  const state = loadState();
  state.anotacoes.push({
    id: gerarId(),
    pacienteId,
    texto,
    dataISO: new Date().toISOString()
  });
  saveState(state);
}

// ---------------------------
// GAMIFICAÇÃO
// ---------------------------
function getGamificacao(usuarioId) {
  const state = loadState();
  let g = state.gamificacao.find(g => g.usuarioId === usuarioId);
  if (!g) {
    g = { usuarioId, pontos: 0, nivel: 1, conquistas: [] };
    state.gamificacao.push(g);
    saveState(state);
  }
  return g;
}

function addPontos(usuarioId, pontos) {
  const state = loadState();
  let g = state.gamificacao.find(g => g.usuarioId === usuarioId);
  if (!g) {
    g = { usuarioId, pontos: 0, nivel: 1, conquistas: [] };
    state.gamificacao.push(g);
  }
  g.pontos += pontos;
  
  if (g.pontos >= 200) g.nivel = 3;
  else if (g.pontos >= 100) g.nivel = 2;
  else g.nivel = 1;
  
  saveState(state);
  
  // Verificar conquistas
  if (g.pontos >= 100 && !g.conquistas.includes("100_pontos")) {
    g.conquistas.push("100_pontos");
    addNotificacao(usuarioId, "🏆 Conquista desbloqueada: 100 pontos!");
  }
  if (g.pontos >= 200 && !g.conquistas.includes("200_pontos")) {
    g.conquistas.push("200_pontos");
    addNotificacao(usuarioId, "🏆 Conquista desbloqueada: 200 pontos - Mestre da plataforma!");
  }
}

// ---------------------------
// EXERCÍCIOS/DINÂMICAS
// ---------------------------
const EXERCICIOS_BASE = [
  { id: "respiracao", titulo: "Respiração 4-4", descricao: "Inspire por 4 segundos, segure por 4, expire por 4. Repita por 2-3 minutos." },
  { id: "gratidao", titulo: "Diário de gratidão", descricao: "Anote 3 coisas pelas quais você é grato hoje." },
  { id: "mindfulness", titulo: "Mindfulness", descricao: "Por 3 minutos, foque apenas na sua respiração." }
];

function getExerciciosDoPsicologo(psicologoId) {
  const state = loadState();
  if (!state.exerciciosPsicologo) state.exerciciosPsicologo = [];
  
  let exercicios = state.exerciciosPsicologo.find(e => e.psicologoId === psicologoId);
  if (!exercicios) {
    exercicios = { psicologoId, exercicios: [...EXERCICIOS_BASE] };
    state.exerciciosPsicologo.push(exercicios);
    saveState(state);
  }
  return exercicios.exercicios;
}

function addExercicio(psicologoId, titulo, descricao) {
  const state = loadState();
  if (!state.exerciciosPsicologo) state.exerciciosPsicologo = [];
  
  let psicologoEx = state.exerciciosPsicologo.find(e => e.psicologoId === psicologoId);
  if (!psicologoEx) {
    psicologoEx = { psicologoId, exercicios: [...EXERCICIOS_BASE] };
    state.exerciciosPsicologo.push(psicologoEx);
  }
  
  psicologoEx.exercicios.push({
    id: gerarId(),
    titulo,
    descricao
  });
  
  saveState(state);
}

// ---------------------------
// DADOS DE EXEMPLO
// ---------------------------
function seedDemo() {
  const state = loadState();
  if (state.usuarios.length > 0) return;

  const paciente = createUsuario({
    tipo: "paciente",
    nome: "João Silva",
    email: "paciente@demo.com",
    senha: "123456",
    telefone: "(11) 99999-8888",
    cpf: "123.456.789-00"
  });

  const psicologo = createUsuario({
    tipo: "psicologo",
    nome: "Dra. Ana Oliveira",
    email: "psicologo@demo.com",
    senha: "123456",
    telefone: "(11) 98888-7777",
    crp: "12/345678",
    especialidade: "Terapia Cognitivo-Comportamental",
    localizacao: "São Paulo - SP",
    bio: "Especialista em ansiedade e depressão com 10 anos de experiência.",
    valorConsulta: "R$ 200,00"
  });

  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  createConsulta({
    pacienteId: paciente.id,
    psicologoId: psicologo.id,
    data: hoje,
    hora: "14:00"
  });
  
  createConsulta({
    pacienteId: paciente.id,
    psicologoId: psicologo.id,
    data: amanha,
    hora: "10:00"
  });

  addNotificacao(psicologo.id, "📅 Nova consulta agendada para hoje às 14h");
  addNotificacao(psicologo.id, "💡 Lembrete: Prepare os materiais para as sessões de hoje");
  addNotificacao(psicologo.id, "🎉 Você ganhou 50 pontos por completar seu perfil!");
  
  addPontos(psicologo.id, 50);
}

// ---------------------------
// CONTROLE DE ACESSO
// ---------------------------
function checkPageAccess() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  
  const paginasPublicas = ["index.html", "cadastro-paciente.html", "cadastro-psicologo.html", "selecionar-perfil.html"];
  const paginasPsicologo = [
    "psicologo-agenda-mes.html", "psicologo-agenda-dia.html", "psicologo-agenda-dia-consultas.html",
    "psicologo-agenda-dia-vazio.html", "psicologo-pacientes.html", "psicologo-paciente-detalhe.html",
    "psicologo-perfil.html", "psicologo-gamificacao.html", "psicologo-notificacoes.html"
  ];
  
  const inPagesDir = window.location.pathname.includes('/pages/');
  const basePath = inPagesDir ? "../../index.html" : "index.html";

  if (paginasPublicas.includes(file)) return;
  
  const user = getUsuarioLogado();
  if (!user) {
    window.location.href = basePath;
    return;
  }
  
  if (paginasPsicologo.includes(file) && user.tipo !== "psicologo") {
    alert("Acesso apenas para psicólogos");
    window.location.href = basePath;
  }
}

// ============================================
// SETUPS DE PÁGINAS
// ============================================

// 1. Login
function setupLogin() {
  const form = document.querySelector("#form-login");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();
    const senha = form.querySelector("#senha").value;

    const usuario = findUsuarioByEmail(email);
    if (!usuario || usuario.senha !== senha) {
      alert("E-mail ou senha inválidos");
      return;
    }

    setUsuarioLogado(usuario.id);
    
    if (usuario.tipo === "psicologo") {
      window.location.href = "./pages/psicologo/psicologo-agenda-mes.html";
    } else {
      window.location.href = "./pages/pacientes/paciente-agenda-mes.html";
    }
  });
}

// 2. Cadastro Psicólogo
function setupCadastroPsicologo() {
  const form = document.querySelector("#form-cadastro-psicologo");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const nome = form.querySelector("#nome_completo").value.trim();
    const email = form.querySelector("#email").value.trim();
    const senha = form.querySelector("#senha").value;
    const telefone = form.querySelector("#telefone").value.trim();
    const crp = form.querySelector("#crp").value.trim();
    const especialidade = form.querySelector("#especialidade").value;

    if (!nome || !email || !senha) {
      alert("Preencha nome, e-mail e senha");
      return;
    }

    if (findUsuarioByEmail(email)) {
      alert("E-mail já cadastrado");
      return;
    }

    const usuario = createUsuario({
      tipo: "psicologo",
      nome,
      email,
      senha,
      telefone,
      crp: form.querySelector("#crp")?.value || "",
      especialidade
    });

    setUsuarioLogado(usuario.id);
    alert("Cadastro realizado com sucesso!");
    window.location.href = "psicologo-agenda-mes.html";
  });
}
// 3. Cadastro Paciente
function setupCadastroPaciente() {
  const form = document.querySelector("#form-cadastro-paciente");
  if(!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();

    if (findUsuarioByEmail(email)) {
      alert("E-mail já cadastrado");
      return;
    }

    const usuario = createUsuario({
      tipo: "paciente",
      nome: form.querySelector("#nome_completo").value.trim(),
      email,
      senha: form.querySelector("#senha").value,
      telefone: form.querySelector("#telefone").value.trim(),
      cpf: form.querySelector("#cpf")?.value || ""
    });

    setUsuarioLogado(usuario.id);
    alert("Cadastro realizado com sucesso!");
    window.location.href = "paciente-agenda-mes.html";
  });
}

// 4. Agenda do Psicólogo (Mês)
function setupPsicologoAgendaMes() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;

  const consultas = getConsultasDoPsicologo(user.id);
  const diasComConsulta = new Set(consultas.map(c => parseInt(c.data.split('-')[2])));
  
  // Definir dias com consulta no calendário
  const cells = document.querySelectorAll(".calendar tbody td");
  cells.forEach(cell => {
    const dia = parseInt(cell.textContent.trim());
    if (isNaN(dia)) return;
    
    cell.classList.remove("calendar-day-consulta");
    if (diasComConsulta.has(dia)) {
      cell.classList.add("calendar-day-consulta");
    }
    
    cell.style.cursor = "pointer";
    cell.addEventListener("click", () => {
      const dataISO = `2025-01-${String(dia).padStart(2, "0")}`;
      setDiaSelecionado(dataISO);
      
      const temConsulta = diasComConsulta.has(dia);
      if (temConsulta) {
        window.location.href = "psicologo-agenda-dia-consultas.html";
      } else {
        window.location.href = "psicologo-agenda-dia-vazio.html";
      }
    });
  });
}

// 5. Agenda do Dia (com consultas)
function setupPsicologoAgendaDiaConsultas() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const dataISO = getDiaSelecionado();
  const consultas = getConsultasDoPsicologoNoDia(user.id, dataISO);
  
  // Atualizar cabeçalho
  const data = new Date(dataISO);
  document.querySelector("#titulo-dia-psicologo").textContent = 
    data.toLocaleDateString("pt-BR", { weekday: "long" });
  document.querySelector(".day-number").textContent = data.getDate();
  
  // Listar consultas
  const container = document.querySelector(".time-slots");
  if (!container) return;
  
  if (consultas.length === 0) {
    container.innerHTML = '<p class="helper-text">Nenhuma consulta agendada para este dia</p>';
    return;
  }
  
  container.innerHTML = "";
  
  consultas.forEach(consulta => {
    const paciente = findUsuarioById(consulta.pacienteId);
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.innerHTML = `
      <div>
        <strong>${consulta.hora}</strong> - ${paciente?.nome || "Paciente"}
        <span class="badge badge-confirmada">${consulta.status}</span>
      </div>
      <div>
        <button class="btn btn-sm btn-danger btn-cancelar" data-id="${consulta.id}">Cancelar</button>
        <button class="btn btn-sm btn-secondary btn-anotar" data-id="${paciente?.id}">Anotações</button>
      </div>
    `;
    
    slot.querySelector(".btn-cancelar")?.addEventListener("click", () => {
      if (confirm("Cancelar esta consulta?")) {
        cancelarConsulta(consulta.id);
        setupPsicologoAgendaDiaConsultas();
      }
    });
    
    slot.querySelector(".btn-anotar")?.addEventListener("click", () => {
      localStorage.setItem("psiagenda-paciente-selecionado", paciente.id);
      window.location.href = "psicologo-paciente-detalhe.html";
    });
    
    container.appendChild(slot);
  });
}

// 6. Agenda do Dia (vazia)
function setupPsicologoAgendaDiaVazia() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const dataISO = getDiaSelecionado();
  const data = new Date(dataISO);
  
  document.querySelector("#titulo-dia-psicologo-vazio").textContent = 
    data.toLocaleDateString("pt-BR", { weekday: "long" });
  document.querySelector(".day-number").textContent = data.getDate();
  
  // Botão para definir horários
  const btnDefinir = document.querySelector("#btn-definir-horarios");
  if (btnDefinir) {
    btnDefinir.addEventListener("click", () => {
      const horarios = prompt("Digite os horários disponíveis (separados por vírgula)\nEx: 09:00,10:00,14:00,15:00");
      if (horarios) {
        addNotificacao(user.id, `Horários definidos para ${dataISO}: ${horarios}`);
        alert("Horários salvos! Os pacientes poderão agendar.");
      }
    });
  }
}

// 7. Lista de Pacientes
function setupPsicologoPacientes() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const consultas = getConsultasDoPsicologo(user.id);
  const pacienteIds = [...new Set(consultas.map(c => c.pacienteId))];
  const pacientes = pacienteIds.map(id => findUsuarioById(id)).filter(p => p);
  
  const container = document.querySelector(".lista-pacientes");
  const inputBusca = document.querySelector("#busca-pacientes");
  
  if (!container) return;
  
  function renderizar(filtro = "") {
    const termo = filtro.toLowerCase();
    const filtrados = pacientes.filter(p => 
      !termo || p.nome?.toLowerCase().includes(termo) || p.email?.toLowerCase().includes(termo)
    );
    
    container.innerHTML = "";
    
    if (filtrados.length === 0) {
      container.innerHTML = '<p class="helper-text">Nenhum paciente encontrado</p>';
      return;
    }
    
    filtrados.forEach(paciente => {
      const consultasPaciente = consultas.filter(c => c.pacienteId === paciente.id);
      const ultimaConsulta = consultasPaciente.sort((a,b) => new Date(b.data) - new Date(a.data))[0];
      
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h2 class="card-title">${paciente.nome}</h2>
        <div class="card-tag">📞 ${paciente.telefone || "Sem telefone"}</div>
        <p class="card-meta">✉️ ${paciente.email}</p>
        <p class="card-meta">📅 ${consultasPaciente.length} consulta(s)</p>
        <p class="card-meta">🕒 Última: ${ultimaConsulta ? ultimaConsulta.data : "Nenhuma"}</p>
        <button class="btn btn-primary btn-ver-detalhes" data-id="${paciente.id}">Ver detalhes</button>
      `;
      
      card.querySelector(".btn-ver-detalhes").addEventListener("click", () => {
        localStorage.setItem("psiagenda-paciente-selecionado", paciente.id);
        window.location.href = "psicologo-paciente-detalhe.html";
      });
      
      container.appendChild(card);
    });
  }
  
  renderizar();
  
  if (inputBusca) {
    inputBusca.addEventListener("input", () => renderizar(inputBusca.value));
  }
}

// 8. Detalhe do Paciente
function setupPsicologoPacienteDetalhe() {
  const pacienteId = localStorage.getItem("psiagenda-paciente-selecionado");
  if (!pacienteId) {
    window.location.href = "psicologo-pacientes.html";
    return;
  }
  
  const paciente = findUsuarioById(pacienteId);
  if (!paciente) return;
  
  // Dados básicos
  document.querySelector(".paciente-nome").textContent = paciente.nome || "Paciente";
  document.querySelector(".paciente-telefone").textContent = paciente.telefone || "(não informado)";
  document.querySelector(".paciente-email").textContent = paciente.email || "(não informado)";
  document.querySelector(".paciente-documento").textContent = paciente.cpf || "(não informado)";
  document.querySelector(".paciente-nascimento").textContent = paciente.nascimento || "(não informada)";
  
  // Humor do paciente
  const humorEl = document.querySelector(".paciente-humor-visual");
  if (humorEl) {
    if (paciente.humorEmoji || paciente.humorTexto) {
      humorEl.innerHTML = `
        ${paciente.humorEmoji ? `<span style="font-size: 24px;">${paciente.humorEmoji}</span>` : ""}
        <p>${paciente.humorTexto || ""}</p>
        <small>${paciente.humorDataISO ? new Date(paciente.humorDataISO).toLocaleString("pt-BR") : ""}</small>
      `;
    } else {
      humorEl.textContent = "Paciente ainda não registrou como está se sentindo.";
    }
  }
  
  // Anotações
  const anotacoes = getAnotacoesDoPaciente(pacienteId);
  const containerAnotacoes = document.querySelector(".paciente-anotacoes");
  if (containerAnotacoes) {
    containerAnotacoes.innerHTML = "";
    
    if (anotacoes.length === 0) {
      containerAnotacoes.innerHTML = '<p class="helper-text">Nenhuma anotação registrada</p>';
    } else {
      anotacoes.forEach(anotacao => {
        const div = document.createElement("div");
        div.className = "anotacao-item";
        div.innerHTML = `
          <p>${anotacao.texto}</p>
          <small>${new Date(anotacao.dataISO).toLocaleString("pt-BR")}</small>
        `;
        containerAnotacoes.appendChild(div);
      });
    }
  }
  
  // Botão nova anotação
  const btnNova = document.querySelector(".btn-nova-anotacao");
  if (btnNova) {
    btnNova.addEventListener("click", () => {
      const texto = prompt("Digite a anotação:");
      if (texto && texto.trim()) {
        addAnotacao(pacienteId, texto.trim());
        setupPsicologoPacienteDetalhe(); // Recarregar
      }
    });
  }
}

// 9. Perfil do Psicólogo
function setupPsicologoPerfil() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  // Preencher dados
  document.querySelector(".perfil-nome").textContent = user.nome || "Psicólogo";
  document.querySelector(".perfil-telefone").textContent = user.telefone || "(não informado)";
  document.querySelector(".perfil-crm").textContent = user.crp || "CRP não informado";
  document.querySelector(".perfil-especialidade").textContent = user.especialidade || "Não informada";
  document.querySelector(".perfil-localizacao").textContent = user.localizacao || "Não informada";
  document.querySelector(".perfil-bio").textContent = user.bio || "Descreva sua formação e experiência";
  document.querySelector(".perfil-valor").textContent = user.valorConsulta || "R$ 150,00";
  document.querySelector(".avatar-initial").textContent = (user.nome?.[0] || "P").toUpperCase();
  
  // Edição inline
  const botoesEdit = document.querySelectorAll(".inline-edit");
  botoesEdit.forEach(btn => {
    btn.addEventListener("click", () => {
      const campo = btn.getAttribute("data-campo");
      const span = document.querySelector(`.perfil-${campo === "crm" ? "crm" : campo}`);
      if (!span) return;
      
      const valorAtual = span.textContent;
      const novoValor = prompt(`Editar ${campo}:`, valorAtual);
      if (novoValor && novoValor.trim()) {
        updateUsuario(user.id, { [campo]: novoValor.trim() });
        span.textContent = novoValor.trim();
        addNotificacao(user.id, `Seu perfil foi atualizado! +10 pontos`);
        addPontos(user.id, 10);
      }
    });
  });
}

// 10. Gamificação do Psicólogo
function setupPsicologoGamificacao() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const g = getGamificacao(user.id);
  document.querySelector(".gamificacao-pontos").textContent = g.pontos;
  document.querySelector(".gamificacao-nivel").textContent = g.nivel;
  
  // Exibir conquistas
  const conquistasContainer = document.querySelector(".conquistas-list");
  if (conquistasContainer && g.conquistas) {
    conquistasContainer.innerHTML = "";
    const todasConquistas = [
      { id: "100_pontos", nome: "100 Pontos", descricao: "Alcance 100 pontos" },
      { id: "200_pontos", nome: "200 Pontos", descricao: "Alcance 200 pontos" }
    ];
    
    todasConquistas.forEach(conq => {
      const desbloqueada = g.conquistas.includes(conq.id);
      const div = document.createElement("div");
      div.className = `conquista-item ${desbloqueada ? "desbloqueada" : "bloqueada"}`;
      div.innerHTML = `
        <span>${desbloqueada ? "🏆" : "🔒"}</span>
        <div>
          <strong>${conq.nome}</strong>
          <small>${conq.descricao}</small>
        </div>
      `;
      conquistasContainer.appendChild(div);
    });
  }
  
  // Dinâmicas cadastradas
  const exercicios = getExerciciosDoPsicologo(user.id);
  const container = document.querySelector(".dynamics-list");
  
  if (container) {
    container.innerHTML = "";
    
    exercicios.forEach(ex => {
      const item = document.createElement("article");
      item.className = "dynamic-item";
      item.innerHTML = `
        <h3>${ex.titulo}</h3>
        <p>${ex.descricao}</p>
      `;
      container.appendChild(item);
    });
  }
  
  // Botão adicionar dinâmica
  const btnAdd = document.querySelector("#btn-add-dinamica");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const titulo = prompt("Título da dinâmica:");
      if (!titulo) return;
      const descricao = prompt("Descrição:");
      if (!descricao) return;
      
      addExercicio(user.id, titulo, descricao);
      setupPsicologoGamificacao();
      addPontos(user.id, 20);
      addNotificacao(user.id, `✨ Nova dinâmica "${titulo}" criada! +20 pontos`);
    });
  }
}

// 11. Notificações do Psicólogo
function setupPsicologoNotificacoes() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const notificacoes = getNotificacoesDoUsuario(user.id);
  const container = document.querySelector(".lista-notificacoes");
  
  if (!container) return;
  
  if (notificacoes.length === 0) {
    container.innerHTML = '<p class="helper-text">Nenhuma notificação</p>';
    return;
  }
  
  container.innerHTML = "";
  
  notificacoes.forEach(notif => {
    const div = document.createElement("div");
    div.className = "notification-item";
    
    let classe = "";
    if (notif.texto.includes("📅") || notif.texto.includes("agendada")) classe = "notif-marcada";
    else if (notif.texto.includes("❌") || notif.texto.includes("cancelada")) classe = "notif-desmarcada";
    else if (notif.texto.includes("✨") || notif.texto.includes("🏆")) classe = "notif-aviso";
    
    div.className = `notification-item ${classe}`;
    div.innerHTML = `
      <p>${notif.texto}</p>
      <small>${new Date(notif.data).toLocaleString("pt-BR")}</small>
    `;
    
    container.appendChild(div);
  });
}

// 12. Botão Sair
function setupBotaoSair() {
  const botoes = document.querySelectorAll("#btn-sair");
  botoes.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Deseja sair?")) {
        logout();
        const inPagesDir = window.location.pathname.includes('/pages/');
        window.location.href = inPagesDir ? "../../index.html" : "index.html";
      }
    });
  });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
  checkPageAccess();
  setupBotaoSair();
  
  const pagina = window.location.pathname.split("/").pop() || "index.html";
  
  const setups = {
    "index.html": setupLogin,
    "cadastro-psicologo.html": setupCadastroPsicologo,
    "cadastro-paciente.html": setupCadastroPaciente,
    "psicologo-agenda-mes.html": setupPsicologoAgendaMes,
    "psicologo-agenda-dia-consultas.html": setupPsicologoAgendaDiaConsultas,
    "psicologo-agenda-dia-vazio.html": setupPsicologoAgendaDiaVazia,
    "psicologo-pacientes.html": setupPsicologoPacientes,
    "psicologo-paciente-detalhe.html": setupPsicologoPacienteDetalhe,
    "psicologo-perfil.html": setupPsicologoPerfil,
    "psicologo-gamificacao.html": setupPsicologoGamificacao,
    "psicologo-notificacoes.html": setupPsicologoNotificacoes
  };
  
  if (setups[pagina]) {
    setups[pagina]();
  }
});