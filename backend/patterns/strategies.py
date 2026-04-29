from abc import ABC, abstractmethod

class PontuacaoStrategy(ABC):
    """Strategy Pattern: Define uma família de algoritmos de pontuação, os encapsula e os torna intercambiáveis."""
    
    @abstractmethod
    def calcular_pontos(self) -> int:
        pass
    
    @abstractmethod
    def get_nome_acao(self) -> str:
        pass

# --- Estratégias Concretas de Gamificação ---

class CompletarPerfilStrategy(PontuacaoStrategy):
    def calcular_pontos(self) -> int:
        return 50
        
    def get_nome_acao(self) -> str:
        return "Completou o perfil público"


class CriarDinamicaStrategy(PontuacaoStrategy):
    def calcular_pontos(self) -> int:
        return 20
        
    def get_nome_acao(self) -> str:
        return "Criou uma nova dinâmica/exercício"


class RegistrarHumorStrategy(PontuacaoStrategy):
    def calcular_pontos(self) -> int:
        # Futuro: Aqui pode haver uma lógica mais robusta, ex: dar + pontos em fds.
        return 5
        
    def get_nome_acao(self) -> str:
        return "Registrou o humor diário"
