import uuid
from backend.models.consulta import Consulta

class ConsultaRepository:
    """Repository Pattern: Oculta a persistência e buscas da tabela de consultas."""
    
    _db = {} # Simulando a persistência

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
    def listar_por_psicologo(cls, psicologo_id: str) -> list[Consulta]:
        return [c for c in cls._db.values() if c.psicologo_id == psicologo_id]
