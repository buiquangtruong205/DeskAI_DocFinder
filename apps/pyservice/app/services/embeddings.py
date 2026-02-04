from sentence_transformers import SentenceTransformer
from typing import List

# Using a lightweight, high-performance model suitable for CPU
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

print(f"Loading embedding model: {MODEL_NAME}...")
_model = SentenceTransformer(MODEL_NAME)
print("Embedding model loaded.")

class EmbeddingService:
    def embed_text(self, text: str) -> List[float]:
        # normalize_embeddings=True makes DotProduct equivalent to CosineSimilarity
        vec = _model.encode(text, normalize_embeddings=True)
        return vec.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        vecs = _model.encode(texts, normalize_embeddings=True)
        return vecs.tolist()

embedding_service = EmbeddingService()
