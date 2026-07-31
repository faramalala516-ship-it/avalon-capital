//! Data catalog, lineage seams, DuckDB/Parquet extension points.

mod excel;
pub use excel::ExcelService;

use avalon_security::{AvalonError, AvalonResult, ClaimKind};
use chrono::{DateTime, Utc};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatasetRecord {
    pub dataset_id: String,
    pub owner: String,
    pub source: String,
    pub schema: serde_json::Value,
    pub frequency: Option<String>,
    pub created: DateTime<Utc>,
    pub updated: DateTime<Utc>,
    pub hash: String,
    pub provenance: String,
    pub permissions: Vec<String>,
    pub path: String,
    pub claim_kind: ClaimKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineageEdge {
    pub from_id: String,
    pub to_id: String,
    pub stage: String,
    pub at: DateTime<Utc>,
}

pub struct DataCatalog {
    datasets: RwLock<HashMap<String, DatasetRecord>>,
    lineage: RwLock<Vec<LineageEdge>>,
}

impl DataCatalog {
    pub fn new() -> Self {
        Self {
            datasets: RwLock::new(HashMap::new()),
            lineage: RwLock::new(Vec::new()),
        }
    }

    pub fn register(&self, mut ds: DatasetRecord) -> AvalonResult<()> {
        if ds.hash.is_empty() {
            ds.hash = hex::encode(Sha256::digest(ds.path.as_bytes()));
        }
        self.datasets.write().insert(ds.dataset_id.clone(), ds);
        Ok(())
    }

    pub fn get(&self, id: &str) -> AvalonResult<DatasetRecord> {
        self.datasets
            .read()
            .get(id)
            .cloned()
            .ok_or_else(|| AvalonError::DataUnavailable(id.into()))
    }

    pub fn list(&self) -> Vec<DatasetRecord> {
        self.datasets.read().values().cloned().collect()
    }

    pub fn add_lineage(&self, edge: LineageEdge) {
        self.lineage.write().push(edge);
    }

    pub fn lineage_for(&self, dataset_id: &str) -> Vec<LineageEdge> {
        self.lineage
            .read()
            .iter()
            .filter(|e| e.from_id == dataset_id || e.to_id == dataset_id)
            .cloned()
            .collect()
    }
}

impl Default for DataCatalog {
    fn default() -> Self {
        Self::new()
    }
}

/// PLACEHOLDER: DuckDB connection handle for future analytical queries.
pub struct DuckDbSeam {
    pub enabled: bool,
}

impl DuckDbSeam {
    pub fn new() -> Self {
        Self { enabled: false }
    }
}

impl Default for DuckDbSeam {
    fn default() -> Self {
        Self::new()
    }
}
