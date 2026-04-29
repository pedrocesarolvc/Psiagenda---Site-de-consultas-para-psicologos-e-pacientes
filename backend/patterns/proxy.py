import hashlib

class SenhaProxy:
    """Proxy Pattern: Intercepta a atribuição e acesso da senha para criptografia."""
    def __init__(self, raw_password: str):
        self._senha_hash = self._criptografar(raw_password)

    def _criptografar(self, senha: str) -> str:
        # Simulação de hash seguro (ex: sha256). Num projeto final será trocado por Bcrypt/Argon2. Tem que ver!
        return hashlib.sha256(senha.encode('utf-8')).hexdigest()

    def verificar(self, tentativa: str) -> bool:
        """Verifica se a tentativa corresponde ao hash armazenado."""
        return self._senha_hash == self._criptografar(tentativa)

    def get_hash(self) -> str:
        return self._senha_hash
