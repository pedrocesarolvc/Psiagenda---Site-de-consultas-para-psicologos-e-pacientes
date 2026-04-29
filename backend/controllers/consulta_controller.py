from backend.models.consulta import Consulta
from backend.repositories.consulta_repository import ConsultaRepository

class ConsultaController:
    """Controller Pattern: Centraliza a criação (RF09) e atualização (RF15, RF29) da Agenda."""
    
    @staticmethod
    def criar_consulta(dados: dict):
        # Validação simples
        if not dados.get("paciente_id") or not dados.get("psicologo_id") or not dados.get("data_hora"):
            return {"erro": "Identificadores das partes e o horário são obrigatórios."}, 400

        consulta = Consulta(dados["paciente_id"], dados["psicologo_id"], dados["data_hora"])
        
        # O Repository insere no DB
        ConsultaRepository.salvar(consulta)
        return {"mensagem": "Consulta agendada!", "consulta_id": consulta.id, "status": consulta.get_status()}, 201

    @staticmethod
    def alterar_status(consulta_id: str, acao: str):
        consulta = ConsultaRepository.buscar_por_id(consulta_id)
        if not consulta:
            return {"erro": "Registro de consulta não encontrado."}, 404

        sucesso, msg_retorno = False, ""
        
        # Padrão State blindando o sistema. O Controlador não precisa saber SE PODE cancelar.
        # Ele só manda cancelar, e o estado atual diz 'Sim/Não' através da booleana 'sucesso'.
        if acao == "cancelar":
            sucesso, msg_retorno = consulta.cancelar()
        elif acao == "concluir":
            sucesso, msg_retorno = consulta.concluir()
        else:
            return {"erro": "Ação solicitada não reconhecida pela API."}, 400

        if not sucesso:
            # O próprio State enviou a mensagem de erro detalhada!
            return {"erro": msg_retorno}, 400

        ConsultaRepository.salvar(consulta)
        return {"mensagem": msg_retorno, "novo_status": consulta.get_status()}, 200
