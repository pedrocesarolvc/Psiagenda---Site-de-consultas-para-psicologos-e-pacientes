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
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector("#email").value.trim();
    const senha = form.querySelector("#senha").value;
    try {
      const resposta = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        alert(dados.erro);
        return;
      }
      setUsuarioLogado({ id: dados.usuario_id, tipo: dados.tipo });
      if (dados.tipo === "psicologo") {
        window.location.href = "./pages/psicologo/psicologo-agenda-mes.html";
      } else {
        window.location.href = "./pages/pacientes/paciente-agenda-mes.html";
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  });
}

// 2. Cadastro Psicólogo
function setupCadastroPsicologo() {
  const form = document.querySelector("#form-cadastro-psicologo");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nome: form.querySelector("#nome_completo").value.trim(),
      email: form.querySelector("#email").value.trim(),
      senha: form.querySelector("#senha").value,
      telefone: form.querySelector("#telefone").value.trim(),
      crp: form.querySelector("#crp").value.trim(),
      especialidade: form.querySelector("#especialidade").value
    };
    try {
      const resposta = await fetch("http://localhost:8000/api/auth/register/psicologo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        alert(dados.erro);
        return;
      }
      setUsuarioLogado({ id: dados.id, tipo: "psicologo" });
      alert("Cadastro realizado com sucesso!");
      window.location.href = "psicologo-agenda-mes.html";
      
    } catch(erro) {
      alert("Erro ao enviar cadastro.");
    }
  });
}
// 3. Cadastro Paciente
function setupCadastroPaciente() {
  const form = document.querySelector("#form-cadastro-paciente");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const payload = {
      nome: form.querySelector("#nome_completo").value.trim(),
      email: form.querySelector("#email").value.trim(),
      senha: form.querySelector("#senha").value,
      telefone: form.querySelector("#telefone").value.trim(),
      cpf: form.querySelector("#cpf")?.value || ""
    };
    try {
      const resposta = await fetch("http://localhost:8000/api/auth/register/paciente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        alert(dados.erro);
        return;
      }
      setUsuarioLogado({ id: dados.id, tipo: "paciente" });
      alert("Cadastro realizado com sucesso!");
      window.location.href = "paciente-agenda-mes.html";
    } catch(erro) {
      alert("Erro ao enviar cadastro.");
    }
  });
}
// 4. Agenda do Psicólogo (Mês)
async function setupPsicologoAgendaMes() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  try {
    // Busca todas as consultas vinculadas a este psicólogo
    const resposta = await fetch(`http://localhost:8000/api/consultas?psicologo_id=${user.id}`);
    const consultas = await resposta.json();
    
    const diasComConsulta = new Set(consultas.map(c => parseInt(c.data_hora.split('-')[2].substring(0, 2))));
    
    const cells = document.querySelectorAll(".calendar tbody td");
    cells.forEach(cell => {
      const dia = parseInt(cell.textContent.trim());
      if (isNaN(dia)) return;
      
      cell.classList.remove("calendar-day-consulta");
      if (diasComConsulta.has(dia)) cell.classList.add("calendar-day-consulta");
      
      cell.style.cursor = "pointer";
      cell.addEventListener("click", () => {
        // ... (Mantém a lógica de setar dataISO e redirecionar)
        const dataISO = `2025-01-${String(dia).padStart(2, "0")}`;
        setDiaSelecionado(dataISO);
        window.location.href = diasComConsulta.has(dia) ? "psicologo-agenda-dia-consultas.html" : "psicologo-agenda-dia-vazio.html";
      });
    });
  } catch(e) {
    console.error("Erro ao carregar o calendário:", e);
  }
}

// 5. Agenda do Dia (com consultas)
async function setupPsicologoAgendaDiaConsultas() {
  const user = getUsuarioLogado();
  if (!user || user.tipo !== "psicologo") return;
  
  const dataISO = getDiaSelecionado();
  const container = document.querySelector(".time-slots");
  if (!container) return;
  try {
    const resposta = await fetch(`http://localhost:8000/api/consultas/dia?psicologo_id=${user.id}&data=${dataISO}`);
    const consultas = await resposta.json();
    
    // ... (Mantém atualização de título e número do dia)
    container.innerHTML = "";
    if (consultas.length === 0) {
      container.innerHTML = '<p class="helper-text">Nenhuma consulta agendada para este dia</p>';
      return;
    }
    
    consultas.forEach(consulta => {
      const slot = document.createElement("div");
      slot.className = "time-slot";
      slot.innerHTML = `
        <div>
          <strong>${consulta.hora}</strong> - ${consulta.paciente_nome}
          <span class="badge badge-${consulta.status.toLowerCase()}">${consulta.status}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-danger btn-cancelar" data-id="${consulta.id}">Cancelar</button>
          <button class="btn btn-sm btn-secondary btn-anotar" data-id="${consulta.paciente_id}">Anotações</button>
        </div>
      `;
      
      // Comunicação vitalícia com o Padrão State do Back-end
      slot.querySelector(".btn-cancelar")?.addEventListener("click", async () => {
        if (confirm("Deseja realmente cancelar esta consulta?")) {
          const resCancel = await fetch(`http://localhost:8000/api/consultas/${consulta.id}/status?acao=cancelar`, { method: "PUT" });
          const dados = await resCancel.json();
          if(!resCancel.ok) alert(dados.erro); // O State avisa se já estiver cancelada!
          else setupPsicologoAgendaDiaConsultas(); // Recarrega a tela
        }
      });
      // ... (Lógica do btn-anotar para redirecionar)
      container.appendChild(slot);
    });
  } catch (e) {
    console.error(e);
  }
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
