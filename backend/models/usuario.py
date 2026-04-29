from typing import Optional
from backend.patterns.proxy import SenhaProxy

class Usuario:
    """Data Mapper / Entity: Representa um registro de usuário."""
    def __init__(self, email: str, nome: str, tipo: str):
        self.id: Optional[str] = None
        self.email = email
        self.nome = nome
        self.tipo = tipo
        self.telefone: str = ""
        self.senha_proxy: Optional[SenhaProxy] = None
        
        # Atributos estendidos (vazios por padrão, Builder os preencherá)
        self.cpf: str = ""
        self.crp: str = ""
        self.especialidade: str = ""

    def set_senha(self, senha_plana: str):
        """Usa o padrão Proxy para encapsular a senha do usuário em um hash."""
        self.senha_proxy = SenhaProxy(senha_plana)
