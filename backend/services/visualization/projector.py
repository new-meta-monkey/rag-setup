"""
Vector Projector Service
Projects high-dimensional embeddings to 2D/3D for visualization
"""
from typing import List, Dict, Any
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

class VectorProjector:
    """Service for projecting vectors to lower dimensions"""
    
    @staticmethod
    def project(embeddings: List[List[float]], method: str = "pca", n_components: int = 3) -> List[Dict[str, float]]:
        """
        Project embeddings to lower dimensions
        
        Args:
            embeddings: List of high-dimensional vectors
            method: 'pca' or 'tsne'
            n_components: Target dimensions (2 or 3)
            
        Returns:
            List of dicts with x, y, (z) coordinates
        """
        if not embeddings:
            return []
            
        # Convert to numpy array
        X = np.array(embeddings)
        
        # Handle edge case: fewer samples than components
        n_samples = X.shape[0]
        if n_samples < n_components:
            # Fallback: just return first n components or pad
            return [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(n_samples)]
            
        # Apply projection
        if method.lower() == "pca":
            projector = PCA(n_components=n_components)
            result = projector.fit_transform(X)
        elif method.lower() == "tsne":
            # Perplexity must be less than n_samples
            perplexity = min(30, n_samples - 1) if n_samples > 1 else 1
            projector = TSNE(n_components=n_components, perplexity=perplexity, random_state=42)
            result = projector.fit_transform(X)
        else:
            raise ValueError(f"Unknown projection method: {method}")
            
        # Format output
        points = []
        for row in result:
            point = {
                "x": float(row[0]),
                "y": float(row[1])
            }
            if n_components == 3:
                point["z"] = float(row[2])
            points.append(point)
            
        return points
