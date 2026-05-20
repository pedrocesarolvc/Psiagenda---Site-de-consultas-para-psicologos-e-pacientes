import uuid
from backend.models.usuario import Usuario

class UsuarioRepository:
    """Repository Pattern: Oculta a persistência de dados. No momento usa Memória Volátil, mas poderá trocar para SQLAlchemy/Postgres sem quebrar os Controllers."""
    
    _db = {} # Simulando a persistência

    @classmethod
    def salvar(cls, usuario: Usuario) -> Usuario:
        usuario.id = str(uuid.uuid4())
        cls._db[usuario.id] = usuario
        return usuario

    @classmethod
    def buscar_por_email(cls, email: str) -> Usuario:
        for u in cls._db.values():
            if u.email == email:
                return u
        return None

    @classmethod
    def buscar_por_id(cls, usuario_id: str) -> Usuario:
        return cls._db.get(usuario_id)

    @classmethod
    def listar_psicologos(cls) -> list[dict]:
        psicologos = []
        for u in cls._db.values():
            if u.tipo == "psicologo":
                psicologos.append({
                    "id": u.id,
                    "nome": u.nome,
                    "email": u.email,
                    "telefone": getattr(u, "telefone", ""),
                    "crp": getattr(u, "crp", ""),
                    "especialidade": getattr(u, "especialidade", ""),
                    "bio": getattr(u, "bio", ""),
                    "valorConsulta": getattr(u, "valorConsulta", "")
                })
        return psicologos
