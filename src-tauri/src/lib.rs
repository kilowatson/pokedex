use reqwest;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use type_chart::TypeData;
mod type_chart;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize)]
struct MoveData {
    name: String,
    level_learnt_at: i32,
    move_learned_method: String,
    category: String,
    r#type: String,
    power: Option<i32>,
    accuracy: Option<i32>,
    pp: i32,
}

#[derive(Debug, Deserialize)]
struct MoveAdditionalData {
    name: String,
    r#move: String,
    category: String,
    r#type: String,
    power: Option<i32>,
    accuracy: Option<i32>,
    pp: i32,
}

#[tauri::command]
async fn get_pokemon_data<'a>(
    state: tauri::State<'a, AppData>,
    name: &str,
) -> Result<(Vec<MoveData>, Vec<String>, Vec<type_chart::TypeEfficacy>), String> {
    let url = format!("https://pokeapi.co/api/v2/pokemon/{}", name);
    let response = reqwest::get(url).await;

    let response = match response {
        Ok(data) => data,
        Err(e) => return Err(e.to_string()),
    };

    let data_text = match response.text().await {
        Ok(data) => data,
        Err(e) => return Err(e.to_string()),
    };

    let json_data: serde_json::Value = serde_json::from_str(&data_text).unwrap();

    let moves_json = match json_data["moves"].as_array() {
        Some(moves) => moves,
        None => return Err("Could not find moves".to_string()),
    };

    let mut pokemon_move_list: Vec<MoveData> = Vec::new();

    let move_json = &state.moves;
    for poke_move in moves_json.iter() {
        let mut name = poke_move["move"]["name"].as_str().unwrap().to_string(); //TODO:Don't add if None

        // let move_correct_names = state.moves;
        // let move_json: Vec<MoveAdditionalData> = serde_json::from_str(&move_correct_names).unwrap();

        let json_index = match move_json.iter().position(|a| a.r#move == name) {
            Some(i) => i,
            None => continue,
        };

        name = move_json[json_index].name.clone();
        let move_type = move_json[json_index].r#type.clone();
        let move_pp = move_json[json_index].pp;
        let move_accuracy = move_json[json_index].accuracy;
        let move_category = move_json[json_index].category.clone();
        let move_power = move_json[json_index].power;

        let version_group_details = poke_move["version_group_details"].as_array().unwrap(); //TODO:Don't add if None
        let mut is_black_white = false;
        let mut level_learnt_at: i32 = 0;
        let mut move_learned_method = "";
        for version_group_data in version_group_details.iter() {
            let version_group_name = version_group_data["version_group"]["name"]
                .as_str()
                .unwrap();
            if version_group_name == "black-2-white-2" {
                move_learned_method = version_group_data["move_learn_method"]["name"]
                    .as_str()
                    .unwrap();
                level_learnt_at = version_group_data["level_learned_at"]
                    .as_i64()
                    .unwrap()
                    .to_string()
                    .parse()
                    .unwrap();
                is_black_white = true;
                break;
            }
        }
        if is_black_white {
            pokemon_move_list.push(MoveData {
                name,
                level_learnt_at,
                move_learned_method: move_learned_method.to_string(),
                accuracy: move_accuracy,
                power: move_power,
                pp: move_pp,
                category: move_category,
                r#type: move_type,
            });
        }
        //
    }
    pokemon_move_list.sort_by(|a, b| a.level_learnt_at.cmp(&b.level_learnt_at));
    let types = parse_type(&json_data);
    let type_chart = type_chart::get_type_effectiveness(&state.type_chart, types.clone());
    Ok((pokemon_move_list, types, type_chart))
}

fn parse_type(json_data: &serde_json::Value) -> Vec<String> {
    //
    let mut pokemon_type: Vec<String> = Vec::new();
    let past_types = json_data["past_types"].as_array().unwrap();
    if past_types.is_empty() {
        let types = json_data["types"].as_array().unwrap();
        for poke_type in types {
            let type_name = poke_type["type"]["name"].as_str().unwrap().to_string();
            pokemon_type.push(type_name);
        }
    } else {
        let generation = past_types[0]["generation"]["name"].as_str().unwrap();

        if generation == "generation-i"
            || generation == "generation-ii"
            || generation == "generation-iii"
            || generation == "generation-iv"
            || generation == "generation-v"
        {
            let types = past_types[0]["types"].as_array().unwrap();
            for poke_type in types {
                let type_name = poke_type["type"]["name"].as_str().unwrap().to_string();
                pokemon_type.push(type_name);
            }
        } else {
            let types = json_data["types"].as_array().unwrap();
            for poke_type in types {
                let type_name = poke_type["type"]["name"].as_str().unwrap().to_string();
                pokemon_type.push(type_name);
            }
        }
    }
    pokemon_type
}
struct AppData {
    type_chart:  Vec<TypeData>,
    moves: Vec<MoveAdditionalData>
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let type_chart = type_chart::create_type_chart();
            let moves = include_str!("../resources/move.json");
            let move_json: Vec<MoveAdditionalData> = serde_json::from_str(&moves).unwrap();
            app.manage(AppData {
                type_chart,
                moves: move_json
            });
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_pokemon_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
