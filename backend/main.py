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
