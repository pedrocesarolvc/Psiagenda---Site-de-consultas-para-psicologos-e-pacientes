from abc import ABC, abstractmethod
import re

class ValidadorHandler(ABC):
    """Chain of Responsibility: Classe base para os elos de validação."""
    def __init__(self):
        self._proximo: 'ValidadorHandler' = None

    def set_proximo(self, proximo: 'ValidadorHandler') -> 'ValidadorHandler':
        self._proximo = proximo
        # Retorna o próximo elo para permitir encadeamento elegante na Factory
        return proximo

    @abstractmethod
    def validar(self, dados: dict) -> tuple[bool, str]:
        if self._proximo:
            return self._proximo.validar(dados)
        return True, ""

# --- Elos Concretos da Corrente ---

class ValidarCamposObrigatorios(ValidadorHandler):
    def validar(self, dados: dict) -> tuple[bool, str]:
        campos_obrigatorios = ["nome", "email", "senha"]
        for campo in campos_obrigatorios:
            if not dados.get(campo):
                return False, f"Campo obrigatório ausente ou vazio: {campo}"
        return super().validar(dados)

class ValidarFormatoEmail(ValidadorHandler):
    def validar(self, dados: dict) -> tuple[bool, str]:
        email = dados.get("email", "")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return False, "Formato de e-mail inválido."
        return super().validar(dados)

class ValidarForcaSenha(ValidadorHandler):
    def validar(self, dados: dict) -> tuple[bool, str]:
        senha = dados.get("senha", "")
        if len(senha) < 6:
            return False, "Sua senha deve ter no mínimo 6 caracteres por motivos de segurança."
        return super().validar(dados)

class ValidarPaciente(ValidadorHandler):
    def validar(self, dados: dict) -> tuple[bool, str]:
        # Se for preenchido, precisa ser válido
        if "cpf" in dados and dados["cpf"]:
            cpf = dados["cpf"].replace(".", "").replace("-", "")
            if len(cpf) != 11 or not cpf.isdigit():
                return False, "O formato do CPF está inválido."
        return super().validar(dados)

class ValidarPsicologo(ValidadorHandler):
    def validar(self, dados: dict) -> tuple[bool, str]:
        # CRP é importante ter tamanho mínimo
        if "crp" in dados and dados["crp"]:
            crp = dados["crp"]
            if len(crp) < 4:
                return False, "O formato do CRP informado é inválido."
        return super().validar(dados)

# --- Montadora da Corrente ---

class ValidadorRegistroFactory:
    """Design Pattern Extra: Factory para gerar as correntes corretas sem espalhar lógica."""
    
    @staticmethod
    def montar_corrente_paciente() -> ValidadorHandler:
        base = ValidarCamposObrigatorios()
        (base.set_proximo(ValidarFormatoEmail())
             .set_proximo(ValidarForcaSenha())
             .set_proximo(ValidarPaciente()))
        return base

    @staticmethod
    def montar_corrente_psicologo() -> ValidadorHandler:
        base = ValidarCamposObrigatorios()
        (base.set_proximo(ValidarFormatoEmail())
             .set_proximo(ValidarForcaSenha())
             .set_proximo(ValidarPsicologo()))
        return base
