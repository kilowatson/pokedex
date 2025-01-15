
use csv;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TypeData {
    defensive_type_name: String,
    type_efficacy: Vec<TypeEfficacy>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TypeEfficacy {
    offensive_type_name: String,
    effectiveness: f32,
}
fn init_type_chart() {}

pub fn get_type_effectiveness(type_chart: &Vec<TypeData>, type_list: Vec<String>) ->Vec<TypeEfficacy>{
    let mut index = type_chart
        .iter()
        .position(|type_data| type_data.defensive_type_name.to_lowercase() == type_list[0].to_lowercase())
        .unwrap();
    let pokemon_type_data = &type_chart[index].type_efficacy;

    if type_list.len() == 1 {
        return pokemon_type_data.to_vec()
    }

    index = type_chart
        .iter()
        .position(|type_data| type_data.defensive_type_name.to_lowercase() == type_list[1].to_lowercase())
        .unwrap();
    let pokemon_type_data = type_chart[index]
        .type_efficacy
        .iter()
        .zip(pokemon_type_data.iter())
        .map(|(x, y)| TypeEfficacy{
            offensive_type_name: x.offensive_type_name.clone(),
            effectiveness: x.effectiveness * y.effectiveness,
        } )
        .collect();
    pokemon_type_data
}

pub fn create_type_chart() -> Vec<TypeData> {
    let csv_data = include_str!("../resources/type_chart(gen II-V).csv");

    let mut rdr = csv::Reader::from_reader(csv_data.as_bytes());
    let headers = rdr.headers().unwrap().clone();

    let mut type_names: Vec<String> = headers.iter().map(|s| s.to_string()).collect();
    type_names.remove(0);

    let records: Vec<csv::StringRecord> = rdr.records().collect::<Result<_, _>>().unwrap();
    let mut type_chart: Vec<TypeData> = Vec::new();

    for denfensive_type_name in type_names {
        let column_index = headers
            .iter()
            .position(|h| h == denfensive_type_name)
            .unwrap();
        let type_efficacy = get_type_efficacy(&records, column_index);

        let type_data = TypeData {
            defensive_type_name: denfensive_type_name,
            type_efficacy,
        };
        type_chart.push(type_data);
    }
    type_chart
}

fn get_type_efficacy(records: &Vec<csv::StringRecord>, column_index: usize) -> Vec<TypeEfficacy> {
    let mut type_efficacy: Vec<TypeEfficacy> = Vec::new();
    for result in records {
        let offensive_type_name = result[0].to_string();

        let data = TypeEfficacy {
            offensive_type_name,
            effectiveness: result[column_index].to_string().parse().unwrap(),
        };
        type_efficacy.push(data);
    }

    type_efficacy
}
