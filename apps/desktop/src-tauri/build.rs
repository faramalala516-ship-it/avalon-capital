use std::fs;
use std::path::{Path, PathBuf};

fn copy_dir(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let name = path.file_name().unwrap();
        if name == ".git" || name == "__pycache__" || name == ".pytest_cache" {
            continue;
        }
        let target = dst.join(name);
        if path.is_dir() {
            copy_dir(&path, &target)?;
        } else if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "pyc" {
                    continue;
                }
            }
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(&path, &target)?;
        }
    }
    Ok(())
}

fn main() {
    let manifest = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let repo_agents = manifest.join("../../../agents");
    let out = manifest.join("resources/agents");
    let _ = fs::remove_dir_all(&out);
    fs::create_dir_all(out.join("codex-drop")).expect("resources dir");

    // Bundle Macro-X Codex package + hello template for MSI/NSIS installs
    copy_dir(
        &repo_agents.join("codex-drop/macro-x"),
        &out.join("codex-drop/macro-x"),
    )
    .expect("copy macro-x");
    copy_dir(
        &repo_agents.join("templates/hello-avalon"),
        &out.join("templates/hello-avalon"),
    )
    .expect("copy hello-avalon");

    // Ensure hello has vendored SDK too
    let hello_vendor = out.join("templates/hello-avalon/vendor");
    let _ = fs::remove_dir_all(&hello_vendor);
    copy_dir(
        &repo_agents.join("codex-drop/macro-x/vendor"),
        &hello_vendor,
    )
    .expect("vendor sdk into hello");

    println!("cargo:rerun-if-changed=../../../agents/codex-drop/macro-x");
    println!("cargo:rerun-if-changed=../../../agents/templates/hello-avalon");
    println!("cargo:rerun-if-changed=../../../packages/python-sdk/avalon_agent_sdk");

    tauri_build::build()
}
