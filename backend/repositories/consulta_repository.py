import uuid
from backend.models.consulta import Consulta

class ConsultaRepository:
    """Repository Pattern: Oculta a persistência e buscas da tabela de consultas."""
    
    _db = {} # Simulando a persistência de consultas
    _db_disponibilidade = {} # Simulando a persistência de disponibilidade: chave "psicologo_id_data" -> list[str]

    @classmethod
    def salvar(cls, consulta: Consulta) -> Consulta:
        if not consulta.id:
            consulta.id = str(uuid.uuid4())
        cls._db[consulta.id] = consulta
        return consulta

    @classmethod
    def buscar_por_id(cls, consulta_id: str) -> Consulta:
        return cls._db.get(consulta_id)

    @classmethod
    def listar_por_psicologo(cls, psicologo_id: str) -> list[dict]:
        return [c.__dict__ for c in cls._db.values() if c.psicologo_id == psicologo_id]

    @classmethod
    def listar_por_paciente(cls, paciente_id: str) -> list[dict]:
        return [c.__dict__ for c in cls._db.values() if c.paciente_id == paciente_id]

    @classmethod
    def salvar_disponibilidade(cls, psicologo_id: str, data: str, horarios: list[str]):
        chave = f"{psicologo_id}_{data}"
        cls._db_disponibilidade[chave] = horarios

    @classmethod
    def buscar_disponibilidade(cls, psicologo_id: str, data: str) -> list[str]:
        chave = f"{psicologo_id}_{data}"
        return cls._db_disponibilidade.get(chave, [])
