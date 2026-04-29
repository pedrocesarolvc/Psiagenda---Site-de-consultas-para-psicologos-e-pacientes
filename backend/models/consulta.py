from typing import Optional
from backend.patterns.states import ConsultaState, AgendadaState

class Consulta:
    """Modelo / Contexto do padrão State. A Consulta delega a autoridade do seu status para os States."""
    def __init__(self, paciente_id: str, psicologo_id: str, data_hora: str):
        self.id: Optional[str] = None
        self.paciente_id = paciente_id
        self.psicologo_id = psicologo_id
        self.data_hora = data_hora
        # Toda consulta nasce como 'Agendada' por padrão
        self._estado: ConsultaState = AgendadaState()

    def mudar_estado(self, novo_estado: ConsultaState):
        """Invocado pelos Próprios States para rotacionar o status vigente."""
        self._estado = novo_estado

    def get_status(self) -> str:
        return self._estado.nome

    def cancelar(self) -> tuple[bool, str]:
        """Delega a solicitação para a classe de Estado."""
        return self._estado.cancelar(self)

    def concluir(self) -> tuple[bool, str]:
        """Delega a solicitação para a classe de Estado."""
        return self._estado.concluir(self)
