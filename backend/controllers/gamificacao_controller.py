from backend.repositories.gamificacao_repository import GamificacaoRepository
from backend.patterns.strategies import (
    CompletarPerfilStrategy, 
    CriarDinamicaStrategy, 
    RegistrarHumorStrategy
)

class GamificacaoController:
    """Controller Pattern: Traduz os pedidos HTTP para os Strategies adequados."""
    
    # Mapeador (Dicionário) evita dezenas de 'If/Else' para rotear a estratégia.
    _mapa_estrategias = {
        "perfil": CompletarPerfilStrategy(),
        "dinamica": CriarDinamicaStrategy(),
        "humor": RegistrarHumorStrategy()
    }

    @classmethod
    def processar_acao(cls, usuario_id: str, tipo_acao: str):
        estrategia = cls._mapa_estrategias.get(tipo_acao)
        if not estrategia:
            return {"erro": "Tipo de ação de gamificação inválida ou desconhecida."}, 400
            
        g = GamificacaoRepository.buscar(usuario_id)
        g.adicionar_pontos(estrategia)
        
        GamificacaoRepository.salvar(g)
        
        return {
            "mensagem": "Pontos e bônus aplicados com sucesso!", 
            "novo_saldo": g.pontos, 
            "novo_nivel": g.nivel,
            "conquistas_desbloqueadas": g.conquistas
        }, 200

    @classmethod
    def obter_status(cls, usuario_id: str):
        g = GamificacaoRepository.buscar(usuario_id)
        return {
            "pontos": g.pontos,
            "nivel": g.nivel,
            "conquistas": g.conquistas,
            "historico": g.historico
        }, 200
