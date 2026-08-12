//! AvalonExcelService — deterministic workbook ops (openpyxl/xlsxwriter on agent side).
//! Core exposes tool IDs; COM used only when necessary on Windows (PLACEHOLDER hook).

use avalon_security::{AvalonError, AvalonResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkbookSpec {
    pub path: String,
    pub sheets: Vec<String>,
}

pub struct ExcelService;

impl ExcelService {
    pub fn create_workbook(path: &Path, sheets: &[&str]) -> AvalonResult<WorkbookSpec> {
        // Deterministic stub: create a minimal xlsx-like marker file for offline Core tests.
        // Real openpyxl generation is performed by Python agents via approved tools.
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AvalonError::Internal(e.to_string()))?;
        }
        let content = format!(
            "AVALON_XLSX_PLACEHOLDER\nsheets={}\n",
            sheets.join(",")
        );
        std::fs::write(path, content).map_err(|e| AvalonError::Internal(e.to_string()))?;
        Ok(WorkbookSpec {
            path: path.display().to_string(),
            sheets: sheets.iter().map(|s| (*s).to_string()).collect(),
        })
    }
}
