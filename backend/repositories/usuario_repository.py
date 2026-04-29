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
