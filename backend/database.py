import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'psiagenda.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Habilitar Foreign Keys no SQLite
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Tabela Principal de Usuários
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      telefone VARCHAR(20),
      tipo VARCHAR(20) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Tabela de Pacientes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pacientes (
      usuario_id VARCHAR(36) PRIMARY KEY,
      cpf CHAR(11),
      data_nascimento DATE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 3. Tabela de Psicólogos
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS psicologos (
      usuario_id VARCHAR(36) PRIMARY KEY,
      crp VARCHAR(20) UNIQUE,
      especialidade VARCHAR(100),
      valorConsulta VARCHAR(50),
      bio TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 4. Tabela de Consultas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS consultas (
      id VARCHAR(36) PRIMARY KEY,
      paciente_id VARCHAR(36) NOT NULL,
      psicologo_id VARCHAR(36) NOT NULL,
      data_hora VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 5. Tabela de Disponibilidades (Agenda)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS disponibilidades (
      psicologo_id VARCHAR(36),
      data VARCHAR(20),
      horarios TEXT,
      PRIMARY KEY (psicologo_id, data),
      FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 6. Tabela de Gamificação
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS gamificacao (
      usuario_id VARCHAR(36) PRIMARY KEY,
      pontos INTEGER DEFAULT 0,
      nivel VARCHAR(50) DEFAULT 'Iniciante',
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 7. Tabela de Anotações
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS anotacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id VARCHAR(36) NOT NULL,
      texto TEXT NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    # 8. Tabela de Dinâmicas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS dinamicas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      psicologo_id VARCHAR(36) NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()

# Inicializa o banco automaticamente ao importar
init_db()
