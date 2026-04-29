from backend.patterns.strategies import PontuacaoStrategy

class Gamificacao:
    """Modelo de Gamificação associado a um Perfil. É o Contexto do padrão Strategy."""
    
    def __init__(self, usuario_id: str):
        self.usuario_id = usuario_id
        self.pontos = 0
        self.nivel = 1
        self.conquistas = []
        self.historico = []

    def adicionar_pontos(self, estrategia: PontuacaoStrategy):
        """Usa a abstração do Strategy para resolver o cálculo dos pontos."""
        pontos_ganhos = estrategia.calcular_pontos()
        
        self.pontos += pontos_ganhos
        self.historico.append(f"{estrategia.get_nome_acao()}: +{pontos_ganhos} pts")
        
        self._atualizar_nivel_e_conquistas()

    def _atualizar_nivel_e_conquistas(self):
        """Lógica interna de RPG/Level-up."""
        if self.pontos >= 200:
            self.nivel = 3
            if "Mestre_200" not in self.conquistas:
                self.conquistas.append("Mestre_200")
        elif self.pontos >= 100:
            self.nivel = 2
            if "Intermediario_100" not in self.conquistas:
                self.conquistas.append("Intermediario_100")
