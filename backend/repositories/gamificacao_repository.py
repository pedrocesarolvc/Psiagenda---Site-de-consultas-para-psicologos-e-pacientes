from backend.models.gamificacao import Gamificacao
from backend.database import get_db_connection

class GamificacaoRepository:
    """Repository Pattern: Oculta o BD da Gamificação usando SQLite."""
    
    @classmethod
    def buscar(cls, usuario_id: str) -> Gamificacao:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gamificacao WHERE usuario_id = ?", (usuario_id,))
        row = cursor.fetchone()
        conn.close()
        
        # Padrão Lazy Initialization: Cria e salva zerado se não existir no BD ainda.
        if not row:
            nova_gamificacao = Gamificacao(usuario_id)
            cls.salvar(nova_gamificacao)
            return nova_gamificacao
            
        g = Gamificacao(usuario_id)
        g.pontos = row['pontos']
        g.nivel = row['nivel']
        g._atualizar_nivel_e_conquistas() # Regenera as conquistas baseadas no saldo de pontos
        return g

    @classmethod
    def salvar(cls, gamificacao: Gamificacao):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT usuario_id FROM gamificacao WHERE usuario_id = ?", (gamificacao.usuario_id,))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute("UPDATE gamificacao SET pontos = ?, nivel = ? WHERE usuario_id = ?", (gamificacao.pontos, gamificacao.nivel, gamificacao.usuario_id))
        else:
            cursor.execute("INSERT INTO gamificacao (usuario_id, pontos, nivel) VALUES (?, ?, ?)", (gamificacao.usuario_id, gamificacao.pontos, gamificacao.nivel))
            
        conn.commit()
        conn.close()
