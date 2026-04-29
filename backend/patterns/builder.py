from backend.models.usuario import Usuario

class UsuarioBuilder:
    """Builder Pattern: Base para a construção complexa de usuários de forma validada."""
    def __init__(self, tipo: str, email: str, nome: str, senha_plana: str):
        self._usuario = Usuario(email=email, nome=nome, tipo=tipo)
        self._usuario.set_senha(senha_plana)

    def com_telefone(self, telefone: str):
        self._usuario.telefone = telefone
        return self

    def build(self) -> Usuario:
        return self._usuario

class PacienteBuilder(UsuarioBuilder):
    """Builder Específico: Foca apenas no necessário para o Perfil Paciente."""
    def __init__(self, email: str, nome: str, senha: str):
        super().__init__("paciente", email, nome, senha)

    def com_cpf(self, cpf: str):
        self._usuario.cpf = cpf
        return self

class PsicologoBuilder(UsuarioBuilder):
    """Builder Específico: Foca apenas no necessário para o Perfil Psicólogo."""
    def __init__(self, email: str, nome: str, senha: str):
        super().__init__("psicologo", email, nome, senha)

    def com_crp(self, crp: str):
        self._usuario.crp = crp
        return self

    def com_especialidade(self, especialidade: str):
        self._usuario.especialidade = especialidade
        return self
