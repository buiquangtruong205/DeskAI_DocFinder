import faiss
import numpy as np
from typing import List, Dict, Any
import pickle
import os

from app.services.embeddings import DIMENSION

class VectorStore:
    def __init__(self):
        self.index = faiss.IndexFlatL2(DIMENSION)
        self.metadata: Dict[int, Dict[str, Any]] = {}
        self.counter = 0
    
    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]]):
        vectors = np.array(embeddings).astype('float32')
        self.index.add(vectors)
        
        for i, meta in enumerate(metadatas):
            self.metadata[self.counter] = meta
            self.counter += 1
            
    def search(self, query_vector: List[float], k: int = 5):
        vector = np.array([query_vector]).astype('float32')
        distances, indices = self.index.search(vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx in self.metadata:
                results.append({
                    "metadata": self.metadata[idx],
                    "score": float(distances[0][i]),
                    "id": idx
                })
        return results

    def clear(self):
        self.index = faiss.IndexFlatL2(DIMENSION)
        self.metadata = {}
        self.counter = 0

vector_store = VectorStore()
