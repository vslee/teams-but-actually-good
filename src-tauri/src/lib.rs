use tauri::{WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", 
        "--enable-features=msSingleSignOnOSForPrimaryAccountIsShared"
    );

    tauri::Builder::default()
        .setup(|app| {
            let js_injection = include_str!("../../dist/injection.js");

            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External("https://teams.microsoft.com".parse().unwrap())
            )
            .title("Teams But (actually) Good")
            .inner_size(1800.0, 800.0) 
            .min_inner_size(800.0, 600.0)
            .center()
            .initialization_script(js_injection) // Inject your compiled code!
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}