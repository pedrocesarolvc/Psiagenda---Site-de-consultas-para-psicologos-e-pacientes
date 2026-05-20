from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.controllers.auth_controller import AuthController

app = FastAPI(title="Psiagenda API", description="Servidor central Python")

# Habilita CORS para permitir que o front-end HTML local se comunique
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DTOs (Data Transfer Objects) ----
class LoginRequest(BaseModel):
    email: str
    senha: str

class PacienteRequest(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str = ""
    cpf: str = ""

class PsicologoRequest(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str = ""
    crp: str = ""
    especialidade: str = ""

# ---- Rotas HTTP ----
@app.post("/api/auth/login")
def login(req: LoginRequest):
    res, status = AuthController.login(req.model_dump())
    if status != 200: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.post("/api/auth/register/paciente")
def registrar_paciente(req: PacienteRequest):
    res, status = AuthController.registrar_paciente(req.model_dump())
    if status != 201: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.post("/api/auth/register/psicologo")
def registrar_psicologo(req: PsicologoRequest):
    res, status = AuthController.registrar_psicologo(req.model_dump())
    if status != 201: raise HTTPException(status_code=status, detail=res["erro"])
    return res

# ---- DTOs e Rotas de Consultas (Agenda) ----
class ConsultaRequest(BaseModel):
    paciente_id: str
    psicologo_id: str
    data_hora: str

class DisponibilidadeRequest(BaseModel):
    psicologo_id: str
    data: str
    horarios: list[str]

@app.post("/api/consultas")
def criar_consulta(req: ConsultaRequest):
    from backend.controllers.consulta_controller import ConsultaController
    res, status = ConsultaController.criar_consulta(req.model_dump())
    if status != 201: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.put("/api/consultas/{consulta_id}/status")
def alterar_status_consulta(consulta_id: str, acao: str):
    """
    acao deve ser passada como string de query: ?acao=cancelar ou ?acao=concluir
    """
    from backend.controllers.consulta_controller import ConsultaController
    res, status = ConsultaController.alterar_status(consulta_id, acao)
    if status != 200: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.post("/api/agenda/disponibilidade")
def definir_disponibilidade(req: DisponibilidadeRequest):
    from backend.controllers.consulta_controller import ConsultaController
    res, status = ConsultaController.definir_disponibilidade(req.model_dump())
    if status != 200: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.get("/api/agenda/disponibilidade")
def obter_disponibilidade(psicologo_id: str, data: str):
    from backend.repositories.consulta_repository import ConsultaRepository
    horarios = ConsultaRepository.buscar_disponibilidade(psicologo_id, data)
    return {"horarios": horarios}

@app.get("/api/psicologos")
def listar_psicologos():
    from backend.repositories.usuario_repository import UsuarioRepository
    return UsuarioRepository.listar_psicologos()

@app.get("/api/psicologos/{psicologo_id}")
def obter_psicologo(psicologo_id: str):
    from backend.repositories.usuario_repository import UsuarioRepository
    psi = UsuarioRepository.buscar_por_id(psicologo_id)
    if not psi or getattr(psi, "tipo", "") != "psicologo":
        raise HTTPException(status_code=404, detail="Psicólogo não encontrado")
    return {
        "id": psi.id,
        "nome": psi.nome,
        "email": psi.email,
        "telefone": getattr(psi, "telefone", ""),
        "crp": getattr(psi, "crp", ""),
        "especialidade": getattr(psi, "especialidade", ""),
        "bio": getattr(psi, "bio", ""),
        "valorConsulta": getattr(psi, "valorConsulta", "")
    }

@app.get("/api/consultas")
def listar_consultas(paciente_id: str = None, psicologo_id: str = None):
    from backend.repositories.consulta_repository import ConsultaRepository
    if paciente_id:
        return ConsultaRepository.listar_por_paciente(paciente_id)
    if psicologo_id:
        return ConsultaRepository.listar_por_psicologo(psicologo_id)
    return []

# ---- Rotas de Gamificação ----

@app.post("/api/gamificacao/{usuario_id}/acao/{tipo_acao}")
def processar_acao_gamificacao(usuario_id: str, tipo_acao: str):
    """tipo_acao suportadas: 'perfil', 'dinamica', 'humor'"""
    from backend.controllers.gamificacao_controller import GamificacaoController
    res, status = GamificacaoController.processar_acao(usuario_id, tipo_acao)
    if status != 200: raise HTTPException(status_code=status, detail=res["erro"])
    return res

@app.get("/api/gamificacao/{usuario_id}")
def obter_gamificacao(usuario_id: str):
    from backend.controllers.gamificacao_controller import GamificacaoController
    res, status = GamificacaoController.obter_status(usuario_id)
    if status != 200: raise HTTPException(status_code=status, detail=res["erro"])
    return res
