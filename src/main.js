const { invoke } = window.__TAURI__.core;


async function loadJsonFile() {
  try {
    const response = await fetch("assets/pokemon.json");
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error("Failed to fetch JSON file:", error);
  }
}


let suggestionsData = [];

window.addEventListener("DOMContentLoaded", () => {

  loadJsonFile().then(data=>{

  suggestionsData = data;
     document.addEventListener('keydown', function (event) {
      if (event.ctrlKey && event.key === 'k') {
        document.getElementById('search-bar').focus();
      }
    });


  })
});



function showSuggestions(query) {
      const suggestionsBox = document.getElementById("suggestions-box");

      clearSuggestionsBox();
      if (query.trim() === "") {
        return;       }

      // Filter suggestions based on the query
      const filteredSuggestions = suggestionsData.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );


      // Create suggestion elements
      filteredSuggestions.forEach((item, index) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";

        const img = document.createElement("img");
        img.src = "assets/sprites/"+item.officialArtwork;
        img.alt = item.speciesName;

        const text = document.createElement("span");
        text.textContent = item.name;

        suggestionItem.appendChild(img);
        suggestionItem.appendChild(text);
        suggestionItem.dataset.name = item.speciesName;

        // Add click event to populate input with selected suggestion
        suggestionItem.addEventListener("click", () => {
          document.querySelector(".search-input").value = item.name;
          
          const suggestionItems = document.querySelectorAll(".suggestion-item");
          suggestionItems[currentIndex].classList.toggle("highlighted");
          currentIndex = -1;
          clearSuggestionsBox();
          getPokemonData(item.speciesName);

      //Make query request for move table and use types to create a weakness table
        //Make move table
        });
suggestionItem.addEventListener("mouseover", () => {
      
    const suggestionItems = document.querySelectorAll(".suggestion-item");
      if(currentIndex != -1){

      suggestionItems[currentIndex].classList.toggle("highlighted");
      }
      currentIndex = index;
      suggestionItems[currentIndex].classList.toggle("highlighted");


        });
        suggestionsBox.appendChild(suggestionItem);
      });
  if(suggestionsBox.hasChildNodes()){

          suggestionsBox.style.display = "block";
  }



    }

  function updateHighlight(suggestionItems) {
    // Remove previous highlight
    suggestionItems.forEach((item, index) => {
      item.classList.toggle("highlighted", index === currentIndex);
    });

    // Scroll the highlighted item into view
    if (currentIndex >= 0) {
      suggestionItems[currentIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }

    let currentIndex = -1; // Track the currently highlighted suggestion
   // Add keyboard navigation
  document.querySelector(".search-input").addEventListener("keydown", (event) => {
    const suggestionItems = document.querySelectorAll(".suggestion-item");
    if (event.key === "ArrowDown") {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % suggestionItems.length; // Move down
      updateHighlight(suggestionItems);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      currentIndex = (currentIndex - 1 + suggestionItems.length) % suggestionItems.length; // Move up
      updateHighlight(suggestionItems);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (currentIndex >= 0) {
        suggestionItems[currentIndex].click(); // Select the highlighted item
      }
    }
  });

function clearSuggestionsBoxOnBlur(){
      const suggestionsBox = document.getElementById("suggestions-box");
      if(suggestionsBox.matches(':hover')){
    return;
  }
       suggestionsBox.style.display = "none";
          suggestionsBox.innerHTML = ""; 
}
function clearSuggestionsBox(){
      const suggestionsBox = document.getElementById("suggestions-box");
          suggestionsBox.innerHTML = ""; 
          suggestionsBox.style.display = "none";
}
async function getPokemonData(name){

  let data = await invoke("get_pokemon_data", { name: name});
let pokemonMoveData = data[0]
let chart = data[2]
 let type_chart = create_type_chart(chart)
  const type_chart_holder = document.getElementById("type-chart-holder");
  type_chart_holder.innerHTML = "";
  type_chart_holder.append(type_chart);


  let table = create_move_table(pokemonMoveData)
  let tableElement = document.getElementsByTagName("table");

  let d = document.getElementById("table-holder");
  if (tableElement.length > 0){
    tableElement[0].remove();
    d.append(table);
  }
  else{
    d.append(table);
  }

}

function create_type_chart(type_data){
 const type_chart = document.createElement("div");
  const weakness = document.createElement("div");
  const immunity = document.createElement("div");
  const resistance = document.createElement("div");
  const normal = document.createElement("div");

  weakness.className="type-container";
  immunity.className="type-container";
  resistance.className="type-container";
  normal.className="type-container";

  for(let i = 0; i < type_data.length; i++){
    let part = create_type_chart_part(type_data[i].offensive_type_name, type_data[i].effectiveness);

    switch(type_data[i].effectiveness){
      case 4:
        weakness.append(part);
      break;
      case 2:
        weakness.append(part);
      break;
        case 0.5:
        resistance.append(part);
      break;
        case 0.25:
        resistance.append(part);
      break;
        case 0:
        immunity.append(part);
      break;
        default:
      normal.append(part);
    }
  }

  const weakness_section = document.createElement("div");
  const immunity_section = document.createElement("div");
  const resistance_section = document.createElement("div");
  const normal_section = document.createElement("div");

  weakness_section.className = "type-chart-section";
  immunity_section.className = "type-chart-section";
  resistance_section.className = "type-chart-section";
  normal_section.className = "type-chart-section";


  const weakness_heading = document.createElement("div");
  const immunity_heading = document.createElement("div");
  const resistance_heading = document.createElement("div");
  const normal_heading = document.createElement("div");

  weakness_heading.className = "section-heading";
  immunity_heading.className = "section-heading";
  resistance_heading.className = "section-heading";
  normal_heading.className = "section-heading";

  weakness_heading.innerHTML = "Weakness";
  immunity_heading.innerHTML = "Immunity";
  resistance_heading.innerHTML = "Resistances";
  normal_heading.innerHTML = "Normal Damage";

  weakness_section.append(weakness_heading, weakness);
  immunity_section.append(immunity_heading, immunity);
  resistance_section.append(resistance_heading, resistance);
  normal_section.append(normal_heading, normal);

  type_chart.append(weakness_section, immunity_section, resistance_section, normal_section);

  return type_chart;
}

function create_type_chart_part(type, effectiveness){
  const part = document.createElement("div");
  part.style.width = "125px";
  part.style.height= "20px";
  part.style.border = "1px";
  part.style.textAlign = "center";
  part.className = type.toLowerCase() + " part-container";
  part.style.borderRadius = "40px";
  
  const typeName = document.createElement("div");
  typeName.className = "type-name";
  typeName.innerHTML = type;
  part.append(typeName);

  const effectiveness_number = document.createElement("div");
  effectiveness_number.className = "number";
  let effectiveness_html = effectiveness + "×";

  if (effectiveness == 0.5){
    effectiveness_html = "½×"
    
  }
  else if(effectiveness == 0.25){
        effectiveness_html = "¼×"
    
  }
  effectiveness_number.innerHTML= effectiveness_html;
  part.append(effectiveness_number);

  return part;
}

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
function create_move_table(moves){
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.style.border = "1px solid #ddd";

  // Create table header row
  const headerRow = document.createElement("tr");

  // Define headings
  const headings = ["Level Learnt", "Name", "Type", "Cat.", "Pwr.", "Acc.", "PP"];
  headings.forEach((heading) => {
    const th = document.createElement("th");
    th.textContent = heading;
    th.style.border = "1px solid #ddd";
    th.style.padding = "8px";
    th.style.backgroundColor = "#f4f4f4";
    th.style.textAlign = "left";
    th.style.color = "black";
    headerRow.appendChild(th);
  });

  // Append header row to table
  table.appendChild(headerRow);

  // Populate table rows with data
  moves.forEach((move) => {
    if(move.move_learned_method != "level-up"){
      return;
    }
    const row = document.createElement("tr");

    // Create cells for each field
    const nameCell = document.createElement("td");
    nameCell.textContent = move.name;
    const levelCell = document.createElement("td");
    levelCell.textContent = move.level_learnt_at;
    // Append cells to the row
    const typeCell = document.createElement("td");
    typeCell.textContent = capitalizeFirstLetter(move.type);
    typeCell.className = move.type.toLowerCase()
    typeCell.style.textAlign = "center";

    const catCell = document.createElement("td");
    catCell.textContent = capitalizeFirstLetter(move.category);

    const pwrCell = document.createElement("td");
    pwrCell.textContent = move.power == null ? "—" : move.power;

    const ppCell= document.createElement("td");
    ppCell.textContent = move.pp;

    const accCell = document.createElement("td");
    accCell.textContent = move.accuracy == null ? "—%" : move.accuracy + "%";

    row.appendChild(levelCell);
    row.appendChild(nameCell);
    row.appendChild(typeCell);
    row.appendChild(catCell);
    row.appendChild(pwrCell);
    row.appendChild(accCell);
    row.appendChild(ppCell);

    // Append row to the table
    table.appendChild(row);
  });

  // Return the table element
  return table;
}



