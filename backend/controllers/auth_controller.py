from backend.patterns.builder import PacienteBuilder, PsicologoBuilder
from backend.repositories.usuario_repository import UsuarioRepository
from backend.patterns.chains import ValidadorRegistroFactory

class AuthController:
    """Controller Pattern: Liga a requisição HTTP aos Patterns."""
    
    @staticmethod
    def registrar_paciente(dados: dict):
        # 1. Padrão Chain of Responsibility: Filtra as sujeiras antes do BD
        validador = ValidadorRegistroFactory.montar_corrente_paciente()
        valido, msg_erro = validador.validar(dados)
        if not valido:
            return {"erro": msg_erro}, 400

        # 2. Verificação de Regra de Negócio Pura
        if UsuarioRepository.buscar_por_email(dados["email"]):
            return {"erro": "O e-mail informado já encontra-se em uso."}, 400
            
        # 3. Padrão Builder: Montagem robusta do Perfil
        builder = PacienteBuilder(dados["email"], dados["nome"], dados["senha"])
        if "telefone" in dados: builder.com_telefone(dados["telefone"])
        if "cpf" in dados: builder.com_cpf(dados["cpf"])
        
        # 4. Padrão Repository: Ocultação da persistência
        usuario = UsuarioRepository.salvar(builder.build())
        return {"mensagem": "Paciente criado com sucesso!", "id": usuario.id}, 201

    @staticmethod
    def registrar_psicologo(dados: dict):
        # 1. Padrão Chain of Responsibility
        validador = ValidadorRegistroFactory.montar_corrente_psicologo()
        valido, msg_erro = validador.validar(dados)
        if not valido:
            return {"erro": msg_erro}, 400

        # 2. Verificação
        if UsuarioRepository.buscar_por_email(dados["email"]):
            return {"erro": "O e-mail informado já encontra-se em uso."}, 400
            
        # 3. Padrão Builder
        builder = PsicologoBuilder(dados["email"], dados["nome"], dados["senha"])
        if "telefone" in dados: builder.com_telefone(dados["telefone"])
        if "crp" in dados: builder.com_crp(dados["crp"])
        if "especialidade" in dados: builder.com_especialidade(dados["especialidade"])
        
        # 4. Padrão Repository
        usuario = UsuarioRepository.salvar(builder.build())
        return {"mensagem": "Psicólogo criado com sucesso!", "id": usuario.id}, 201

    @staticmethod
    def login(dados: dict):
        usuario = UsuarioRepository.buscar_por_email(dados["email"])
        
        # Padrão Proxy: Verificação segura da credencial mascarada
        if not usuario or not usuario.senha_proxy.verificar(dados["senha"]):
            return {"erro": "E-mail ou senha inválidos"}, 401
            
        return {
            "mensagem": "Login efetuado", 
            "usuario_id": usuario.id, 
            "tipo": usuario.tipo
        }, 200
