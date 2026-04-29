from backend.models.gamificacao import Gamificacao

class GamificacaoRepository:
    """Repository Pattern: Oculta o BD da Gamificação."""
    
    _db = {} 

    @classmethod
    def buscar(cls, usuario_id: str) -> Gamificacao:
        # Padrão Lazy Initialization: Cria e salva zerado se não existir no BD ainda.
        if usuario_id not in cls._db:
            nova_gamificacao = Gamificacao(usuario_id)
            cls.salvar(nova_gamificacao)
        return cls._db[usuario_id]

    @classmethod
    def salvar(cls, gamificacao: Gamificacao):
        cls._db[gamificacao.usuario_id] = gamificacao
