from abc import ABC, abstractmethod

class ConsultaState(ABC):
    """State Pattern: Interface que padroniza como uma consulta lida com ações."""
    
    @property
    @abstractmethod
    def nome(self) -> str:
        pass

    @abstractmethod
    def cancelar(self, consulta: 'Consulta') -> tuple[bool, str]:
        pass

    @abstractmethod
    def concluir(self, consulta: 'Consulta') -> tuple[bool, str]:
        pass


class ConcluidaState(ConsultaState):
    """Estado Final: Impede manipulações."""
    @property
    def nome(self) -> str:
        return "Concluída"

    def cancelar(self, consulta: 'Consulta') -> tuple[bool, str]:
        return False, "Ação bloqueada. Uma consulta que já ocorreu não pode ser cancelada."

    def concluir(self, consulta: 'Consulta') -> tuple[bool, str]:
        return False, "A consulta já consta como concluída no histórico."


class CanceladaState(ConsultaState):
    """Estado Final: Impede manipulações."""
    @property
    def nome(self) -> str:
        return "Cancelada"

    def cancelar(self, consulta: 'Consulta') -> tuple[bool, str]:
        return False, "A consulta já se encontra cancelada."

    def concluir(self, consulta: 'Consulta') -> tuple[bool, str]:
        return False, "Ação bloqueada. Não é possível concluir uma consulta cancelada previamente."


class AgendadaState(ConsultaState):
    """Estado Inicial: Permite transições para Concluída ou Cancelada."""
    @property
    def nome(self) -> str:
        return "Agendada"

    def cancelar(self, consulta: 'Consulta') -> tuple[bool, str]:
        consulta.mudar_estado(CanceladaState())
        return True, "Consulta cancelada com êxito."

    def concluir(self, consulta: 'Consulta') -> tuple[bool, str]:
        consulta.mudar_estado(ConcluidaState())
        return True, "Ocorreu tudo bem! A consulta foi fechada com sucesso."
