import torch
import torch.nn.functional as F
import numpy as np
from torch_geometric.nn import GATConv


class SGAT(torch.nn.Module):
    """Exact architecture from the paper — 3-layer Graph Attention Network."""

    def __init__(self, input_dim: int = 1024, classes: int = 5):
        super().__init__()
        self.gat1 = GATConv(input_dim, 128, heads=4, dropout=0.2)
        self.gat2 = GATConv(128 * 4, 64, heads=4, dropout=0.2)
        self.gat3 = GATConv(64 * 4, classes, heads=1, concat=False)
        self.dropout = torch.nn.Dropout(0.2)

    def forward(self, x, edge):
        x = self.gat1(x, edge)
        x = F.elu(x)
        x = self.dropout(x)
        x = self.gat2(x, edge)
        x = F.elu(x)
        x = self.dropout(x)
        x = self.gat3(x, edge)
        return x


def build_graph(bboxes, k: int = 5) -> torch.Tensor:
    """Build k-NN spatial graph from bounding boxes — exact from notebook."""
    bboxes = np.array(bboxes) / 1000.0
    num_nodes = len(bboxes)
    if num_nodes < 2:
        return torch.empty((2, 0), dtype=torch.long)
    centers = np.array([
        [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]
        for b in bboxes
    ])
    edges = []
    for i in range(num_nodes):
        dist = np.linalg.norm(centers - centers[i], axis=1)
        neighbors = np.argsort(dist)[1: k + 1]
        for j in neighbors:
            if j < num_nodes:
                edges.append([i, j])
    if not edges:
        return torch.empty((2, 0), dtype=torch.long)
    return torch.tensor(edges, dtype=torch.long).t().contiguous()