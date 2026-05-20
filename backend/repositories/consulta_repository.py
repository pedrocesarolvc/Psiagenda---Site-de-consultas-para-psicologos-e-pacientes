import uuid
import json
from backend.models.consulta import Consulta
from backend.database import get_db_connection

class ConsultaRepository:
    """Repository Pattern: Oculta a persistência e buscas da tabela de consultas usando SQLite."""
    
    @classmethod
    def salvar(cls, consulta: Consulta) -> Consulta:
        if not hasattr(consulta, 'id') or not consulta.id:
            consulta.id = str(uuid.uuid4())
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Faz um "upsert" baseado no ID (já que salvar() serve para update de status)
        cursor.execute("SELECT id FROM consultas WHERE id = ?", (consulta.id,))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute('''
                UPDATE consultas SET status = ? WHERE id = ?
            ''', (consulta.get_status(), consulta.id))
        else:
            cursor.execute('''
                INSERT INTO consultas (id, paciente_id, psicologo_id, data_hora, status)
                VALUES (?, ?, ?, ?, ?)
            ''', (consulta.id, consulta.paciente_id, consulta.psicologo_id, consulta.data_hora, consulta.get_status()))
            
        conn.commit()
        conn.close()
        return consulta

    @classmethod
    def buscar_por_id(cls, consulta_id: str) -> Consulta:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM consultas WHERE id = ?", (consulta_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
            
        c = Consulta(row['paciente_id'], row['psicologo_id'], row['data_hora'])
        c.id = row['id']
        c._Consulta__status_atual = c._Consulta__estados[row['status']]  # Restaura o estado pelo State Pattern
        return c

    @classmethod
    def listar_por_psicologo(cls, psicologo_id: str) -> list[dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM consultas WHERE psicologo_id = ?", (psicologo_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def listar_por_paciente(cls, paciente_id: str) -> list[dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM consultas WHERE paciente_id = ?", (paciente_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def salvar_disponibilidade(cls, psicologo_id: str, data: str, horarios: list[str]):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        horarios_json = json.dumps(horarios)
        
        cursor.execute("SELECT psicologo_id FROM disponibilidades WHERE psicologo_id = ? AND data = ?", (psicologo_id, data))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute("UPDATE disponibilidades SET horarios = ? WHERE psicologo_id = ? AND data = ?", (horarios_json, psicologo_id, data))
        else:
            cursor.execute("INSERT INTO disponibilidades (psicologo_id, data, horarios) VALUES (?, ?, ?)", (psicologo_id, data, horarios_json))
            
        conn.commit()
        conn.close()

    @classmethod
    def buscar_disponibilidade(cls, psicologo_id: str, data: str) -> list[str]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT horarios FROM disponibilidades WHERE psicologo_id = ? AND data = ?", (psicologo_id, data))
        row = cursor.fetchone()
        conn.close()
        
        if row and row['horarios']:
            return json.loads(row['horarios'])
        return []
