use tauri::{WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    unsafe {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--enable-features=msSingleSignOnOSForPrimaryAccountIsShared",
        );
    }

    tauri::Builder::default()
        .setup(|app| {
            let js_injection = include_str!("../../dist/injection.js");
            let _user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.3800.70";

            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External("https://teams.microsoft.com/v2/?clientType=chrome".parse().unwrap()),
            )
            .title("Teams But (actually) Good")
            .inner_size(1800.0, 800.0)
            .min_inner_size(800.0, 600.0)
            .center()
            .initialization_script(js_injection)
            .user_agent(_user_agent)
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
