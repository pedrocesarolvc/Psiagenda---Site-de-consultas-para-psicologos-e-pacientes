import uuid
from backend.models.usuario import Usuario
from backend.database import get_db_connection

class UsuarioRepository:
    """Repository Pattern: Oculta a persistência de dados. Agora usando SQLite como banco principal."""
    
    @classmethod
    def salvar(cls, usuario: Usuario) -> Usuario:
        if not hasattr(usuario, 'id') or not usuario.id:
            usuario.id = str(uuid.uuid4())
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Salvar na tabela principal
            cursor.execute('''
                INSERT INTO usuarios (id, email, senha, nome, telefone, tipo)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (usuario.id, usuario.email, usuario.senha_proxy.get_senha_mascarada(), usuario.nome, getattr(usuario, "telefone", ""), usuario.tipo))
            
            # Salvar nas tabelas específicas
            if usuario.tipo == "paciente":
                cursor.execute('''
                    INSERT INTO pacientes (usuario_id, cpf, data_nascimento)
                    VALUES (?, ?, ?)
                ''', (usuario.id, getattr(usuario, "cpf", ""), getattr(usuario, "data_nascimento", None)))
            elif usuario.tipo == "psicologo":
                cursor.execute('''
                    INSERT INTO psicologos (usuario_id, crp, especialidade, valorConsulta, bio)
                    VALUES (?, ?, ?, ?, ?)
                ''', (usuario.id, getattr(usuario, "crp", ""), getattr(usuario, "especialidade", ""), getattr(usuario, "valorConsulta", ""), getattr(usuario, "bio", "")))
            
            conn.commit()
        finally:
            conn.close()
            
        return usuario

    @classmethod
    def buscar_por_email(cls, email: str) -> Usuario:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
            
        return cls._montar_usuario_do_banco(row)

    @classmethod
    def buscar_por_id(cls, usuario_id: str) -> Usuario:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
            
        return cls._montar_usuario_do_banco(row)

    @classmethod
    def listar_psicologos(cls) -> list[dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.id, u.nome, u.email, u.telefone, p.crp, p.especialidade, p.bio, p.valorConsulta
            FROM usuarios u
            JOIN psicologos p ON u.id = p.usuario_id
            WHERE u.tipo = 'psicologo'
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
        
    @classmethod
    def _montar_usuario_do_banco(cls, row) -> Usuario:
        u = Usuario(row['email'], row['nome'], row['senha'], row['tipo'])
        u.id = row['id']
        u.telefone = row['telefone']
        
        # Puxar dados específicos
        conn = get_db_connection()
        cursor = conn.cursor()
        if u.tipo == "psicologo":
            cursor.execute("SELECT * FROM psicologos WHERE usuario_id = ?", (u.id,))
            psi_row = cursor.fetchone()
            if psi_row:
                u.crp = psi_row['crp']
                u.especialidade = psi_row['especialidade']
                u.bio = psi_row['bio']
                u.valorConsulta = psi_row['valorConsulta']
        elif u.tipo == "paciente":
            cursor.execute("SELECT * FROM pacientes WHERE usuario_id = ?", (u.id,))
            pac_row = cursor.fetchone()
            if pac_row:
                u.cpf = pac_row['cpf']
                u.data_nascimento = pac_row['data_nascimento']
        conn.close()
        
        return u
